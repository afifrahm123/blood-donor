const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');

const router = express.Router();

// Get patient dashboard data
router.get('/dashboard', auth, authorize('patient'), async (req, res) => {
  try {
    const bloodRequests = await BloodRequest.find({ patient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const totalRequests = await BloodRequest.countDocuments({ patient: req.user._id });
    const pendingRequests = await BloodRequest.countDocuments({ 
      patient: req.user._id, 
      status: 'pending' 
    });

    res.json({
      bloodRequests,
      totalRequests,
      pendingRequests,
      user: req.user
    });
  } catch (error) {
    console.error('Patient dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create blood request
router.post('/blood-request', auth, authorize('patient'), [
  body('bloodType').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('units').isInt({ min: 1 }),
  body('urgency').isIn(['low', 'medium', 'high', 'critical']),
  body('reason').notEmpty(),
  body('hospital.name').notEmpty(),
  body('hospital.address').notEmpty(),
  body('hospital.contact').notEmpty(),
  body('requiredBy').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bloodType, units, urgency, reason, hospital, requiredBy } = req.body;

    // Check if required date is in the future
    if (new Date(requiredBy) <= new Date()) {
      return res.status(400).json({ message: 'Required date must be in the future' });
    }

    const bloodRequest = new BloodRequest({
      patient: req.user._id,
      bloodType,
      units,
      urgency,
      reason,
      hospital,
      requiredBy,
      status: 'pending'
    });

    await bloodRequest.save();

    res.status(201).json({
      message: 'Blood request submitted successfully',
      bloodRequest
    });
  } catch (error) {
    console.error('Create blood request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient's blood request history
router.get('/blood-requests', auth, authorize('patient'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    let query = { patient: req.user._id };
    if (status) {
      query.status = status;
    }

    const bloodRequests = await BloodRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BloodRequest.countDocuments(query);

    res.json({
      bloodRequests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get blood requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific blood request
router.get('/blood-requests/:id', auth, authorize('patient'), async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findOne({
      _id: req.params.id,
      patient: req.user._id
    });

    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    res.json({ bloodRequest });
  } catch (error) {
    console.error('Get blood request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update blood request
router.put('/blood-requests/:id', auth, authorize('patient'), [
  body('bloodType').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('units').optional().isInt({ min: 1 }),
  body('urgency').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('reason').optional().notEmpty(),
  body('hospital.name').optional().notEmpty(),
  body('hospital.address').optional().notEmpty(),
  body('hospital.contact').optional().notEmpty(),
  body('requiredBy').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const bloodRequest = await BloodRequest.findOne({
      _id: req.params.id,
      patient: req.user._id,
      status: 'pending'
    });

    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found or cannot be updated' });
    }

    const updates = req.body;
    if (updates.requiredBy && new Date(updates.requiredBy) <= new Date()) {
      return res.status(400).json({ message: 'Required date must be in the future' });
    }

    Object.assign(bloodRequest, updates);
    await bloodRequest.save();

    res.json({
      message: 'Blood request updated successfully',
      bloodRequest
    });
  } catch (error) {
    console.error('Update blood request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel blood request
router.put('/blood-requests/:id/cancel', auth, authorize('patient'), async (req, res) => {
  try {
    const bloodRequest = await BloodRequest.findOne({
      _id: req.params.id,
      patient: req.user._id,
      status: 'pending'
    });

    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found or cannot be cancelled' });
    }

    bloodRequest.status = 'cancelled';
    await bloodRequest.save();

    res.json({
      message: 'Blood request cancelled successfully',
      bloodRequest
    });
  } catch (error) {
    console.error('Cancel blood request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update patient profile
router.put('/profile', auth, authorize('patient'), [
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

// Get blood inventory for patients
router.get('/blood-inventory', auth, authorize('patient'), async (req, res) => {
  try {
    // Get all blood types
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    
    // Get total donors by blood type
    const donorsByBloodType = await User.aggregate([
      { $match: { role: 'donor' } },
      { $group: { _id: '$bloodType', count: { $sum: 1 } } }
    ]);

    // Create blood inventory data for patients
    const bloodInventoryData = bloodTypes.map(bloodType => {
      const donorCount = parseInt(donorsByBloodType.find(item => item._id === bloodType)?.count || 0);

      return {
        bloodType,
        bloodUnits: donorCount * 500, // Blood amount = Total donors * 500ml per donor
        totalDonors: donorCount
      };
    });

    res.json({
      success: true,
      bloodInventory: bloodInventoryData
    });
  } catch (error) {
    console.error('Get patient blood inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
