const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const { register, login } = require('./controllers/authController');
const { setupProfile, getProfile } = require('./controllers/personaController');
const { createScan, getScanHistory, getScanById, getScanStatus, getScanResult } = require('./controllers/scanController');
const { getDashboardSummary } = require('./controllers/dashboardController');
const { extractImageText, analyzeImage } = require('./controllers/visionController');
const multer = require('multer');

// Configure multer for disk storage (Cloudinary requirement for file path)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);
app.post('/api/profile/setup', setupProfile);
app.get('/api/profile/:userId', getProfile);
app.get('/api/dashboard/summary/:userId', getDashboardSummary);
app.post('/api/scans', createScan);
app.get('/api/scans/:userId', getScanHistory);
app.get('/api/scans/id/:id', getScanById);
app.get('/api/scan/status/:scanId', getScanStatus);
app.get('/api/scan/result/:scanId', getScanResult);
app.post('/api/extract-image', upload.single('image'), extractImageText);
app.post('/api/analyze', upload.single('image'), analyzeImage);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`[CLINICAL SHIELD] Medo Veda Backend active on port ${PORT}`);
  console.log(`[CLINICAL SHIELD] Route Registered: POST /api/analyze`);
});

// ENFORCE CLINICAL TIMEOUT (300s) - Prevents 504 Gateway/Socket timeouts during 9-agent sequence
server.timeout = 300000; 
server.keepAliveTimeout = 300000;
server.headersTimeout = 305000; // Slightly more than keepAlive to allow safe cleanup

module.exports = app;
