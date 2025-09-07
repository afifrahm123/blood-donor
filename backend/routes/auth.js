const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d'
  });
};

// Register User
router.post('/register', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').trim().escape(),
  body('lastName').trim().escape(),
  body('phone').trim(),
  body('bloodType').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('dateOfBirth').isISO8601(),
  body('role').isIn(['donor', 'patient'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, firstName, lastName, phone, bloodType, dateOfBirth, role, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or username' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      bloodType,
      dateOfBirth,
      role,
      address
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        bloodType: user.bloodType
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login User
router.post('/login', [
  body('username').trim(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Login validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    console.log('Attempting login for:', username);

    // Find user by username or email
    const user = await User.findOne({ 
      $or: [{ username }, { email: username }] 
    });

    if (!user) {
      console.log('User not found for:', username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('User found:', { id: user._id, username: user.username, email: user.email, role: user.role });

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for user:', username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Password verified for user:', username);

    // Check if user is active
    if (!user.isActive) {
      console.log('User account deactivated:', username);
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Generate token
    const token = generateToken(user._id);
    console.log('Token generated for user:', username, 'Role:', user.role);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        bloodType: user.bloodType
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unified User Login (for both donors and patients)
router.post('/user-login', [
  body('emailOrUsername').notEmpty().trim(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    console.log('User login request:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Login validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { emailOrUsername, password } = req.body;

    // Find user by email or username
    console.log('Searching for user with:', emailOrUsername);
    
    // First, let's see all users in the database
    const allUsers = await User.find({});
    console.log('All users in database:', allUsers.map(u => ({ email: u.email, username: u.username, role: u.role })));
    
    const user = await User.findOne({ 
      $or: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ]
    });

    if (!user) {
      console.log('User not found');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    console.log('User found:', { id: user._id, email: user.email, username: user.username, role: user.role });
    
    // Check which query matched
    if (user.email === emailOrUsername) {
      console.log('User found by EMAIL match');
    } else if (user.username === emailOrUsername) {
      console.log('User found by USERNAME match');
    }

    // Check if user is a donor or patient (not admin)
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Please use admin login for administrator accounts' });
    }

    // Check password
    console.log('Checking password...');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    console.log('Password verified successfully');

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Generate token
    const token = generateToken(user._id);
    console.log('Generated token and sending response');

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        bloodType: user.bloodType
      }
    });
  } catch (error) {
    console.error('User login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Donor Registration
router.post('/donor-register', [
  body('firstName').trim().escape(),
  body('lastName').trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('phone').trim(),
  body('bloodType').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('address').trim()
], async (req, res) => {
  try {
    console.log('Donor registration request:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, phone, bloodType, address } = req.body;

    // Generate username from email
    const username = email.split('@')[0];
    console.log('Generated username for donor:', username);

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('Donor already exists:', existingUser.email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new donor user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      bloodType,
      address,
      role: 'donor',
      isActive: true,
      dateOfBirth: new Date() // Set a default date for now
    });

    console.log('Creating donor user:', { username, email, role: 'donor' });
    await user.save();
    console.log('Donor user saved successfully');

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Donor registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        bloodType: user.bloodType
      }
    });
  } catch (error) {
    console.error('Donor registration error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Patient Registration
router.post('/patient-register', [
  body('firstName').trim().escape(),
  body('lastName').trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('phone').trim(),
  body('address').trim()
], async (req, res) => {
  try {
    console.log('Patient registration request:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, phone, address } = req.body;

    // Generate username from email
    const username = email.split('@')[0];
    console.log('Generated username for patient:', username);

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('Patient already exists:', existingUser.email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new patient user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      address,
      role: 'patient',
      isActive: true,
      dateOfBirth: new Date() // Set a default date for now
    });

    console.log('Creating patient user:', { username, email, role: 'patient' });
    await user.save();
    console.log('Patient user saved successfully');

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Patient registration error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Donor Registration
router.post('/donor-register', [
  body('firstName').trim().escape(),
  body('lastName').trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('phone').trim(),
  body('bloodType').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('address').trim()
], async (req, res) => {
  try {
    console.log('Donor registration request:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, phone, bloodType, address } = req.body;

    // Generate username from email
    const username = email.split('@')[0];
    console.log('Generated username for donor:', username);

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('Donor already exists:', existingUser.email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new donor user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      bloodType,
      address,
      role: 'donor',
      isActive: true,
      dateOfBirth: new Date() // Set a default date for now
    });

    console.log('Creating donor user:', { username, email, role: 'donor' });
    await user.save();
    console.log('Donor user saved successfully');

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Donor registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        bloodType: user.bloodType
      }
    });
  } catch (error) {
    console.error('Donor registration error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Patient Registration
router.post('/patient-register', [
  body('firstName').trim().escape(),
  body('lastName').trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('phone').trim(),
  body('address').trim()
], async (req, res) => {
  try {
    console.log('Patient registration request:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, phone, address } = req.body;

    // Generate username from email
    const username = email.split('@')[0];
    console.log('Generated username for patient:', username);

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('Patient already exists:', existingUser.email);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new patient user
    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      address,
      role: 'patient',
      isActive: true,
      dateOfBirth: new Date() // Set a default date for now
    });

    console.log('Creating patient user:', { username, email, role: 'patient' });
    await user.save();
    console.log('Patient user saved successfully');

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Patient registration error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Current User
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        bloodType: req.user.bloodType,
        phone: req.user.phone,
        address: req.user.address,
        lastDonation: req.user.lastDonation
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update User Profile
router.put('/profile', auth, [
  body('firstName').optional().trim().escape(),
  body('lastName').optional().trim().escape(),
  body('phone').optional().trim(),
  body('address').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
