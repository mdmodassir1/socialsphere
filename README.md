# SocialSphere - Full Stack Social Media Platform

<div align="center">

![SocialSphere Banner](https://img.shields.io/badge/SocialSphere-Social%20Media%20Platform-4ecdc4?style=for-the-badge&logo=react)

[![GitHub stars](https://img.shields.io/github/stars/yourusername/socialsphere?style=social)](https://github.com/yourusername/socialsphere)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/socialsphere?style=social)](https://github.com/yourusername/socialsphere)
[![GitHub issues](https://img.shields.io/github/issues/yourusername/socialsphere)](https://github.com/yourusername/socialsphere)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**A Complete Full-Stack Social Media Platform Like Instagram/TikTok**

[Live Demo](https://socialsphere.vercel.app) · [Report Bug](https://github.com/yourusername/socialsphere/issues) · [Request Feature](https://github.com/yourusername/socialsphere/issues)

</div>

---

## 📋 Table of Contents

- [🌟 Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [🔧 Installation](#-installation)
- [🌐 API Endpoints](#-api-endpoints)
- [🏗️ Architecture](#️-architecture)
- [📈 Performance Optimization](#-performance-optimization)
- [🔐 Security Features](#-security-features)
- [📱 Responsive Design](#-responsive-design)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👨‍💻 Author](#-author)

---

## 🌟 Features

### Core Features
| Feature | Description |
|---------|-------------|
| **🔐 Authentication** | JWT-based auth with refresh token rotation |
| **📝 Posts** | Create, edit, delete posts with images |
| **❤️ Likes & Comments** | Like/unlike posts, add/delete comments |
| **👥 Follow System** | Follow/unfollow users, see followers/following |
| **📸 Stories** | 24-hour disappearing stories with views |
| **🎬 Reels** | Short video upload (15-60 sec) like TikTok |
| **💬 Real-time Chat** | 1-on-1 messaging with typing indicator |
| **🎤 Voice Notes** | Hold-to-record voice messages |
| **📹 Video Notes** | Short video messages |
| **📞 Audio/Video Calls** | Peer-to-peer WebRTC calls |
| **🔔 Notifications** | Real-time push notifications |
| **📊 Analytics Dashboard** | Profile views, post insights, engagement stats |
| **🔍 Advanced Search** | Search users, posts, messages with filters |
| **🎭 Message Reactions** | Like, love, laugh, wow, sad, angry reactions |
| **💬 Message Reply** | Reply to specific messages |
| **📎 Share Posts** | Share posts to feed, chat, or story |

### User Features
| Feature | Description |
|---------|-------------|
| **👤 Edit Profile** | Change name, bio, avatar, cover photo |
| **🏠 Home Feed** | See posts from followed users |
| **📥 Inbox** | View all chats with unread counts |
| **🎨 Responsive UI** | Works on mobile, tablet, desktop |
| **🌙 Dark Theme** | Modern dark theme UI |
| **📱 Mobile Navigation** | Bottom navigation bar on mobile |

### Advanced Features
| Feature | Description |
|---------|-------------|
| **📈 Analytics** | Profile views, engagement metrics |
| **🎯 Search Filters** | Date range, sorting options |
| **📊 Weekly Charts** | Visual performance graphs |
| **📱 Push Notifications** | Browser notifications |
| **🔔 Notification Settings** | Customize notification types |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **React Router** | Navigation |
| **Axios** | API calls |
| **Socket.io-client** | Real-time chat |
| **PeerJS** | WebRTC calls |
| **Tailwind CSS** | Styling |
| **Font Awesome** | Icons |
| **React Icons** | Additional icons |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime |
| **Express.js** | Web Framework |
| **MongoDB** | Database |
| **Mongoose** | ODM |
| **Socket.io** | WebSocket server |
| **JWT** | Authentication |
| **Bcryptjs** | Password hashing |
| **Cloudinary** | Media storage |
| **Multer** | File upload |

### DevOps & Tools
| Technology | Purpose |
|------------|---------|
| **Git** | Version Control |
| **GitHub** | Code hosting |
| **MongoDB Atlas** | Cloud database |
| **Cloudinary** | Media CDN |
| **Render** | Backend deployment |
| **Vercel** | Frontend deployment |

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/socialsphere.git

# Install backend dependencies
cd socialsphere/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Set up environment variables (see below)
# Run backend
cd ../backend
npm run dev

# Run frontend (in another terminal)
cd ../frontend
npm run dev


📁 Project Structure

socialsphere/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   │   ├── db.js         # MongoDB connection
│   │   │   └── cloudinary.js # Cloudinary config
│   │   ├── models/           # Database models
│   │   │   ├── User.js
│   │   │   ├── Post.js
│   │   │   ├── Chat.js
│   │   │   ├── Story.js
│   │   │   ├── Reel.js
│   │   │   └── Notification.js
│   │   ├── controllers/      # Business logic
│   │   │   ├── authController.js
│   │   │   ├── postController.js
│   │   │   ├── chatController.js
│   │   │   ├── storyController.js
│   │   │   ├── reelController.js
│   │   │   └── notificationController.js
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Custom middleware
│   │   │   ├── authMiddleware.js
│   │   │   └── upload.js
│   │   └── server.js         # Entry point
│   ├── .env                  # Environment variables
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── PostCard.jsx
│   │   │   ├── ChatModal.jsx
│   │   │   ├── StoryModal.jsx
│   │   │   ├── ReelPlayer.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   └── AnalyticsDashboard.jsx
│   │   ├── pages/            # Page components
│   │   │   ├── Home.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Reels.jsx
│   │   ├── context/          # React Context
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ChatContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   ├── services/         # API services
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── index.js
│   ├── .env                  # Environment variables
│   └── package.json
│
└── README.md


Environment Variables
Backend (.env)
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/socialsphere
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Firebase (for push notifications)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

Frontend (.env)
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key

Real-time Architecture

┌─────────────────────────────────────────────────────────┐
│                      Client Browser                      │
├─────────────────────────────────────────────────────────┤
│  React App ──► Socket.io Client ──► WebSocket Connection│
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                      Socket.io Server                    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Chat Room  │  │ Call Room   │  │ Notification│     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                       MongoDB                           │
├─────────────────────────────────────────────────────────┤
│  Users │ Posts │ Chats │ Stories │ Reels │ Notifications│
└─────────────────────────────────────────────────────────┘


👨‍💻 Author
 
 Md Modassir

GitHub: https://github.com/mdmodassir1

LinkedIn: https://www.linkedin.com/in/md-modassir-9316702bb/

Portfolio: https://mdmodassir.netlify.app/

Email: mdmodassir259@gmail.com