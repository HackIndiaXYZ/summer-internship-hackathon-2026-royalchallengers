const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { register, login } = require('./controllers/authController');
const { setupProfile, getProfile } = require('./controllers/personaController');
const { createScan, getScanHistory, getScanById } = require('./controllers/scanController');
const { getDashboardSummary } = require('./controllers/dashboardController');
const { extractImageText } = require('./controllers/visionController');
const multer = require('multer');

// Configure multer for memory storage (direct to API buffer)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit for modern smartphone photos
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
app.post('/api/extract-image', upload.single('image'), extractImageText);

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
app.listen(PORT, () => {
  console.log(`Medo Veda Backend running on port ${PORT}`);
});

module.exports = app;
