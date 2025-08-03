const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: 'image',
      folder: 'locallens/reports',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto:good' },
        { format: 'auto' }
      ],
      ...options
    };

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// @route   POST /api/upload/image
// @desc    Upload single image
// @access  Private
router.post('/image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No image file provided',
        error: 'NO_FILE'
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      public_id: `report_${Date.now()}_${req.user._id}`
    });

    res.json({
      message: 'Image uploaded successfully',
      image: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      }
    });

  } catch (error) {
    console.error('Image upload error:', error);
    
    if (error.message === 'Only image files are allowed') {
      return res.status(400).json({
        message: 'Only image files are allowed',
        error: 'INVALID_FILE_TYPE'
      });
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File size too large. Maximum size is 10MB',
        error: 'FILE_TOO_LARGE'
      });
    }

    res.status(500).json({
      message: 'Failed to upload image',
      error: 'UPLOAD_ERROR'
    });
  }
});

// @route   POST /api/upload/images
// @desc    Upload multiple images
// @access  Private
router.post('/images', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: 'No image files provided',
        error: 'NO_FILES'
      });
    }

    // Upload all images to Cloudinary
    const uploadPromises = req.files.map((file, index) => 
      uploadToCloudinary(file.buffer, {
        public_id: `report_${Date.now()}_${req.user._id}_${index}`
      })
    );

    const results = await Promise.all(uploadPromises);

    const images = results.map(result => ({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes
    }));

    res.json({
      message: `${images.length} images uploaded successfully`,
      images
    });

  } catch (error) {
    console.error('Multiple images upload error:', error);
    
    if (error.message === 'Only image files are allowed') {
      return res.status(400).json({
        message: 'Only image files are allowed',
        error: 'INVALID_FILE_TYPE'
      });
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'One or more files are too large. Maximum size is 10MB per file',
        error: 'FILE_TOO_LARGE'
      });
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files. Maximum 5 files allowed',
        error: 'TOO_MANY_FILES'
      });
    }

    res.status(500).json({
      message: 'Failed to upload images',
      error: 'UPLOAD_ERROR'
    });
  }
});

// @route   POST /api/upload/base64
// @desc    Upload image from base64 string
// @access  Private
router.post('/base64', authenticateToken, async (req, res) => {
  try {
    const { image, caption } = req.body;

    if (!image) {
      return res.status(400).json({
        message: 'No base64 image data provided',
        error: 'NO_IMAGE_DATA'
      });
    }

    // Validate base64 format
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({
        message: 'Invalid base64 image format',
        error: 'INVALID_BASE64_FORMAT'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(image, {
      folder: 'locallens/reports',
      public_id: `report_${Date.now()}_${req.user._id}`,
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto:good' },
        { format: 'auto' }
      ]
    });

    res.json({
      message: 'Base64 image uploaded successfully',
      image: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        caption: caption || ''
      }
    });

  } catch (error) {
    console.error('Base64 upload error:', error);
    
    if (error.message && error.message.includes('Invalid image')) {
      return res.status(400).json({
        message: 'Invalid image data',
        error: 'INVALID_IMAGE_DATA'
      });
    }

    res.status(500).json({
      message: 'Failed to upload base64 image',
      error: 'BASE64_UPLOAD_ERROR'
    });
  }
});

// @route   DELETE /api/upload/:publicId
// @desc    Delete image from Cloudinary
// @access  Private
router.delete('/:publicId', authenticateToken, async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({
        message: 'Public ID is required',
        error: 'MISSING_PUBLIC_ID'
      });
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.json({
        message: 'Image deleted successfully',
        publicId
      });
    } else {
      res.status(404).json({
        message: 'Image not found or already deleted',
        error: 'IMAGE_NOT_FOUND'
      });
    }

  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json({
      message: 'Failed to delete image',
      error: 'DELETE_ERROR'
    });
  }
});

// @route   GET /api/upload/signed-url
// @desc    Get signed URL for direct upload to Cloudinary
// @access  Private
router.get('/signed-url', authenticateToken, (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `report_${timestamp}_${req.user._id}`;

    const params = {
      timestamp,
      public_id: publicId,
      folder: 'locallens/reports',
      transformation: 'w_1200,h_800,c_limit,q_auto:good,f_auto'
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      message: 'Signed URL generated successfully',
      uploadData: {
        url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
        params: {
          ...params,
          signature,
          api_key: process.env.CLOUDINARY_API_KEY
        }
      }
    });

  } catch (error) {
    console.error('Signed URL generation error:', error);
    res.status(500).json({
      message: 'Failed to generate signed URL',
      error: 'SIGNED_URL_ERROR'
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File size too large. Maximum size is 10MB',
        error: 'FILE_TOO_LARGE'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files. Maximum 5 files allowed',
        error: 'TOO_MANY_FILES'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Unexpected file field',
        error: 'UNEXPECTED_FILE'
      });
    }
  }

  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      message: 'Only image files are allowed',
      error: 'INVALID_FILE_TYPE'
    });
  }

  next(error);
});

module.exports = router;