const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images, videos, and audio
const fileFilter = (req, file, cb) => {
  const allowedVideoTypes = /mp4|mov|avi|mkv|webm|mpeg|mpg|3gp|flv|wmv/;
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedAudioTypes = /mp3|wav|ogg|webm|m4a/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;
  
  // Check for videos
  if (allowedVideoTypes.test(extname) || mimetype.startsWith('video/')) {
    return cb(null, true);
  }
  
  // Check for images
  if (allowedImageTypes.test(extname) || allowedImageTypes.test(mimetype)) {
    return cb(null, true);
  }
  
  // Check for audio
  if (allowedAudioTypes.test(extname) || mimetype.startsWith('audio/')) {
    return cb(null, true);
  }
  
  cb(new Error('Only images, videos, and audio files are allowed'));
};

// Upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: fileFilter
});

module.exports = upload;