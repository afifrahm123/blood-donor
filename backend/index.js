const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const donorRoutes = require('./routes/donor');
const patientRoutes = require('./routes/patient');
const adminRoutes = require('./routes/admin');
const bloodRequestRoutes = require('./routes/bloodRequest');
const donationRoutes = require('./routes/donation');

dotenv.config();

// Debug: Check if environment variables are loaded
console.log('Environment variables loaded:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('PORT:', process.env.PORT || 'Default (5000)');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection - Simple approach for Vercel
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/blood-donation';
    
    // Simple connection without complex options
    await mongoose.connect(mongoUri);
    
    console.log('Connected to MongoDB');
    return true;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    return false;
  }
};

// Initialize connection
connectDB();

// Simple middleware - just check if mongoose is connected
app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next();
  } else {
    // Try to reconnect
    connectDB().then(() => next()).catch(err => {
      res.status(503).json({ 
        success: false, 
        message: 'Database unavailable',
        error: err.message 
      });
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donor', donorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blood-request', bloodRequestRoutes);
app.use('/api/donation', donationRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'Blood Donation System API is running...' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
