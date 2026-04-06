# SocialSphere - Full Stack Social Media Platform

**Live Demo:** https://socialsphere-fdzq.onrender.com  
**GitHub:** https://github.com/mdmodassir1/socialsphere

---

## 📌 About

SocialSphere is a complete full-stack social media platform built with MERN Stack. It includes features like posts, stories, reels, real-time chat, audio/video calls, notifications, and analytics dashboard.

---

## 🚀 Features

| Category | Features |
|----------|----------|
| **Authentication** | JWT login/register, protected routes |
| **Posts** | Create, edit, delete posts with images |
| **Stories** | 24-hour disappearing stories with views |
| **Reels** | Short videos (15-60 sec) with trending section |
| **Chat** | Real-time messaging, voice/video notes |
| **Calls** | Audio/Video calls using WebRTC |
| **Notifications** | Real-time push notifications |
| **Analytics** | Profile views, post insights, engagement stats |
| **Search** | Advanced search with filters |
| **Profile** | Edit profile, cover photo, avatar |
| **Follow System** | Follow/unfollow users |
| **Responsive** | Works on mobile, tablet, desktop |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, Tailwind CSS, Socket.io-client, PeerJS |
| **Backend** | Node.js, Express.js, Socket.io, JWT |
| **Database** | MongoDB, Mongoose |
| **Storage** | Cloudinary (images/videos) |
| **Deployment** | Render (backend), Vercel (frontend) |

---

## 📁 Project Structure
socialsphere/
├── backend/
│ ├── src/
│ │ ├── models/ # User, Post, Chat, Story, Reel
│ │ ├── controllers/ # Business logic
│ │ ├── routes/ # API endpoints
│ │ ├── middleware/ # Auth, upload
│ │ └── server.js
│ └── package.json
├── frontend/
│ ├── src/
│ │ ├── components/ # Reusable components
│ │ ├── pages/ # Home, Profile, Login, Reels
│ │ ├── context/ # Auth, Chat, Notification
│ │ ├── services/ # API calls
│ │ └── App.jsx
│ └── package.json
└── README.md


---

## 🔧 Installation

### Prerequisites
- Node.js (v16+)
- MongoDB Atlas account
- Cloudinary account

### Steps

```bash
# Clone repository
git clone https://github.com/mdmodassir1/socialsphere.git
cd socialsphere

# Backend setup
cd backend
npm install
cp .env.example .env  # Add your credentials
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev

## Environment Variables
Backend (.env)
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/socialsphere
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

Frontend (.env)
VITE_API_URL=http://localhost:5000/api

## 👨‍💻 Author
 ## Md Modassir

GitHub:mdmodassir1

LinkedIn: Md Modassir

Email: mdmodassir259@gmail.com

⭐ Show Your Support
If you found this project helpful, please give it a ⭐ on GitHub!
Made with ❤️ by Md Modassir
