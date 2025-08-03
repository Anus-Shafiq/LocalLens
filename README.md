# LocalLens - Hyperlocal Issue Reporting Platform

LocalLens is a full-stack MERN application that empowers citizens to report local problems and enables area administrators to track and resolve them efficiently.

## 🌟 Features

### For Citizens (Users)
- **User Authentication**: Secure JWT-based signup and login
- **Issue Reporting**: Submit detailed reports with:
  - Title and description
  - Category selection (road, water, electricity, cleanliness, etc.)
  - Location (Google Maps integration or manual address)
  - Image uploads via Cloudinary
- **Report Tracking**: Monitor status changes (Pending → In Progress → Resolved)
- **Community Feed**: View and interact with community reports
- **Personal Dashboard**: Track your submitted reports and statistics
- **Upvoting System**: Support important community issues

### For Administrators
- **Admin Dashboard**: Comprehensive overview with analytics
- **Report Management**: 
  - Change report status
  - Add comments and updates
  - Assign reports to team members
  - Delete spam or inappropriate content
- **Analytics & Insights**:
  - Daily/weekly report trends
  - Category breakdown
  - Resolution time tracking
  - Top complaint areas
- **User Management**: View and manage user accounts

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI framework
- **Vite** - Build tool and dev server
- **Material-UI (MUI)** - Component library
- **TailwindCSS** - Utility-first CSS framework
- **React Hook Form + Yup** - Form validation
- **Framer Motion** - Animations and transitions
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **Leaflet** - Maps integration
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Cloudinary** - Image storage and processing
- **Multer** - File upload handling
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
locallens/
├── backend/                 # Node.js/Express backend
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── .env.example        # Environment variables template
│   ├── server.js           # Entry point
│   └── package.json        # Backend dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── main.jsx        # Entry point
│   ├── public/             # Static assets
│   ├── .env.example        # Frontend environment template
│   └── package.json        # Frontend dependencies
├── package.json            # Root package.json for scripts
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/locallens.git
   cd locallens
   ```

2. **Install dependencies**
   ```bash
   npm run install-deps
   ```
   This will install dependencies for both frontend and backend.

3. **Environment Setup**

   **Backend (.env)**
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `backend/.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/locallens
   JWT_SECRET=your_super_secret_jwt_key
   PORT=5000
   NODE_ENV=development
   
   # Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Optional: Google Maps API
   GOOGLE_MAPS_API_KEY=your_google_maps_key
   ```

   **Frontend (.env)**
   ```bash
   cd frontend
   cp .env.example .env
   ```
   
   Edit `frontend/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   ```

4. **Start the application**
   ```bash
   # From the root directory
   npm run dev
   ```
   
   This will start both the backend server (port 5000) and frontend dev server (port 3000).

   **Or start them separately:**
   ```bash
   # Backend
   npm run server
   
   # Frontend (in another terminal)
   npm run client
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Reports
- `GET /api/reports` - Get all public reports (with filtering)
- `POST /api/reports` - Create new report (authenticated)
- `GET /api/reports/my-reports` - Get user's reports (authenticated)
- `GET /api/reports/:id` - Get single report
- `PUT /api/reports/:id` - Update report (owner/admin)
- `DELETE /api/reports/:id` - Delete report (owner/admin)
- `POST /api/reports/:id/upvote` - Toggle upvote (authenticated)

### Admin
- `GET /api/admin/reports` - Get all reports (admin)
- `PUT /api/admin/reports/:id/status` - Update report status (admin)
- `PUT /api/admin/reports/:id/assign` - Assign report (admin)
- `POST /api/admin/reports/:id/comment` - Add admin comment (admin)
- `GET /api/admin/dashboard` - Get dashboard analytics (admin)
- `GET /api/admin/users` - Get users list (admin)

### File Upload
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images
- `POST /api/upload/base64` - Upload base64 image
- `DELETE /api/upload/:publicId` - Delete image

## 🎨 UI Components & Design

### Design System
- **Colors**: Primary (Blue), Secondary (Gray), Success (Green), Warning (Yellow), Error (Red)
- **Typography**: Inter (body), Poppins (headings)
- **Spacing**: Consistent 8px grid system
- **Shadows**: Soft, medium, and strong elevation levels
- **Border Radius**: Consistent rounded corners (8px, 12px, 16px)

### Key Components
- **Authentication Forms**: Login/Register with validation
- **Report Cards**: Display report information with status badges
- **Status Badges**: Color-coded status indicators
- **Loading States**: Spinners and skeleton screens
- **Error Boundaries**: Graceful error handling
- **Responsive Layout**: Mobile-first design approach

## 🔐 Authentication & Security

- **JWT Tokens**: Secure authentication with access and refresh tokens
- **Password Hashing**: bcryptjs for secure password storage
- **Input Validation**: Server-side validation with express-validator
- **Rate Limiting**: Prevent abuse with request rate limiting
- **CORS**: Configured for secure cross-origin requests
- **Helmet**: Security headers for Express.js
- **Role-based Access**: User and Admin role separation

## 📱 Responsive Design

The application is fully responsive and works seamlessly across:
- **Desktop**: Full-featured experience with sidebar navigation
- **Tablet**: Optimized layout with collapsible navigation
- **Mobile**: Touch-friendly interface with bottom navigation

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Railway/Render)
1. Connect your GitHub repository
2. Set environment variables
3. Configure build and start commands:
   - Build: `cd backend && npm install`
   - Start: `cd backend && npm start`

### Database (MongoDB Atlas)
1. Create a MongoDB Atlas cluster
2. Update `MONGODB_URI` in your environment variables
3. Configure network access and database users

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test

# Run all tests
npm test
```

## 📈 Performance Optimizations

- **Code Splitting**: Lazy loading of route components
- **Image Optimization**: Cloudinary transformations
- **Caching**: React Query for efficient data fetching
- **Bundle Optimization**: Vite for fast builds and HMR
- **Database Indexing**: Optimized MongoDB queries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Material-UI team for the excellent component library
- Cloudinary for image management services
- MongoDB team for the robust database solution
- React and Node.js communities for the amazing ecosystem

## 📞 Support

For support, email support@locallens.app or create an issue in the GitHub repository.

---

**Made with ❤️ for better communities**