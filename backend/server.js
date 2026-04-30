// ============================================
// INTERNMATCH — EXPRESS SERVER
// Main Entry Point
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..')));

// Redirect root to frontend index
app.get('/', (req, res) => {
  res.redirect('/frontend/pages/index.html');
});

// Redirect /index.html to frontend index just in case
app.get('/index.html', (req, res) => {
  res.redirect('/frontend/pages/index.html');
});

// API Routes
const authRoutes = require('./routes/authRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const skillRoutes = require('./routes/skillRoutes');

app.use('/api', authRoutes);
app.use('/api', skillRoutes);
app.use('/api/internships', internshipRoutes);
app.use('/api/applications', applicationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'InternMatch API is running! 🚀' });
});

// Start server
// Render needs app.listen to be called, Vercel serverless doesn't.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 InternMatch Server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend at http://localhost:${PORT}/frontend/pages/index.html\n`);
  });
}

// Export for Vercel
module.exports = app;

