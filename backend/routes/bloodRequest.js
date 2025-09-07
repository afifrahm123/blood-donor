const express = require('express');
const BloodRequest = require('../models/BloodRequest');

const router = express.Router();

// Get public blood requests (for matching donors)
router.get('/public', async (req, res) => {
  try {
    const { bloodType, urgency, limit = 10 } = req.query;
    
    let query = { status: 'approved' };
    if (bloodType) query.bloodType = bloodType;
    if (urgency) query.urgency = urgency;

    const bloodRequests = await BloodRequest.find(query)
      .populate('patient', 'firstName lastName bloodType')
      .sort({ urgency: -1, requiredBy: 1 })
      .limit(parseInt(limit));

    res.json({ bloodRequests });
  } catch (error) {
    console.error('Get public blood requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get blood request statistics
router.get('/stats', async (req, res) => {
  try {
    const totalRequests = await BloodRequest.countDocuments();
    const pendingRequests = await BloodRequest.countDocuments({ status: 'pending' });
    const approvedRequests = await BloodRequest.countDocuments({ status: 'approved' });
    const fulfilledRequests = await BloodRequest.countDocuments({ status: 'fulfilled' });

    const urgencyStats = await BloodRequest.aggregate([
      { $group: { _id: '$urgency', count: { $sum: 1 } } }
    ]);

    const bloodTypeStats = await BloodRequest.aggregate([
      { $group: { _id: '$bloodType', count: { $sum: 1 } } }
    ]);

    res.json({
      totalRequests,
      pendingRequests,
      approvedRequests,
      fulfilledRequests,
      urgencyStats,
      bloodTypeStats
    });
  } catch (error) {
    console.error('Get blood request stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
