const express = require('express');
const Donation = require('../models/Donation');

const router = express.Router();

// Get public donation statistics
router.get('/stats', async (req, res) => {
  try {
    const totalDonations = await Donation.countDocuments();
    const completedDonations = await Donation.countDocuments({ status: 'completed' });
    const scheduledDonations = await Donation.countDocuments({ status: 'scheduled' });
    const cancelledDonations = await Donation.countDocuments({ status: 'cancelled' });

    const bloodTypeStats = await Donation.aggregate([
      { $group: { _id: '$bloodType', totalUnits: { $sum: '$units' } } }
    ]);

    const monthlyStats = await Donation.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$donationDate' },
            month: { $month: '$donationDate' }
          },
          totalUnits: { $sum: '$units' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      totalDonations,
      completedDonations,
      scheduledDonations,
      cancelledDonations,
      bloodTypeStats,
      monthlyStats
    });
  } catch (error) {
    console.error('Get donation stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent donations (public)
router.get('/recent', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const recentDonations = await Donation.find({ status: 'completed' })
      .populate('donor', 'firstName lastName bloodType')
      .sort({ donationDate: -1 })
      .limit(parseInt(limit));

    res.json({ recentDonations });
  } catch (error) {
    console.error('Get recent donations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
