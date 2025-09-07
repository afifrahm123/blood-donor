const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const Donation = require('../models/Donation');

const router = express.Router();

// Get donor dashboard data
router.get('/dashboard', auth, authorize('donor'), async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const totalDonations = await Donation.countDocuments({ donor: req.user._id });
    const lastDonation = await Donation.findOne({ donor: req.user._id })
      .sort({ donationDate: -1 });

    res.json({
      donations,
      totalDonations,
      lastDonation,
      user: req.user
    });
  } catch (error) {
    console.error('Donor dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get blood inventory summary for donors
router.get('/blood-inventory', auth, authorize('donor'), async (req, res) => {
  try {
    // Standard blood types
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    // Donors by blood type (availability proxy)
    const donorsByBloodType = await User.aggregate([
      { $match: { role: 'donor' } },
      { $group: { _id: '$bloodType', count: { $sum: 1 } } }
    ]);

    // Pending and approved requests grouped by blood type
    const pendingApprovedRequests = await BloodRequest.aggregate([
      { $match: { status: { $in: ['pending', 'approved'] } } },
      { $group: { _id: '$bloodType', totalUnits: { $sum: '$units' }, totalRequests: { $sum: 1 } } }
    ]);

    // Build normalized inventory
    const inventory = bloodTypes.map(bloodType => {
      const donorGroup = donorsByBloodType.find(item => item._id === bloodType);
      const requestGroup = pendingApprovedRequests.find(item => item._id === bloodType);
      const totalDonors = parseInt(donorGroup?.count || 0);
      return {
        bloodType,
        availableUnits: totalDonors * 500,
        totalDonations: totalDonors, // proxy count
        requestedUnits: parseInt(requestGroup?.totalUnits || 0),
        openRequests: parseInt(requestGroup?.totalRequests || 0)
      };
    });

    res.json({ success: true, inventory });
  } catch (error) {
    console.error('Get donor blood inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get blood requests for donors
router.get('/blood-requests', auth, authorize('donor'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, bloodType, search, myRequests } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by blood type
    if (bloodType) {
      query.bloodType = bloodType;
    }

    // Filter for donor's own requests
    if (myRequests === 'true') {
      query.patient = req.user._id;
    }

    let bloodRequests;
    
    // Search by patient name or reason
    if (search) {
      // If showing my requests, search only in reason field
      if (myRequests === 'true') {
        query.reason = { $regex: search, $options: 'i' };
        bloodRequests = await BloodRequest.find(query)
          .populate('patient', 'firstName lastName email phone')
          .sort({ createdAt: -1 })
          .limit(limit * 1)
          .skip((page - 1) * limit);
      } else {
        // First find patients matching the search criteria
        const matchingPatients = await User.find({
          role: 'patient',
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }).select('_id');
        
        const patientIds = matchingPatients.map(patient => patient._id);
        
        // Add patient filter to query
        query.patient = { $in: patientIds };
        
        // Also search in reason field
        const reasonQuery = { reason: { $regex: search, $options: 'i' } };
        
        bloodRequests = await BloodRequest.find({
          $or: [
            query,
            reasonQuery
          ]
        })
        .populate('patient', 'firstName lastName email phone')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      }
    } else {
      bloodRequests = await BloodRequest.find(query)
        .populate({ path: 'patient', select: 'firstName lastName email phone totalDonationCount totalRequestsCount' })
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    }

    // Check if current donor has shown interest in each request
    const donorId = req.user._id;
    const requestsWithInterest = bloodRequests.map(request => {
      const requestObj = request.toObject();
      requestObj.isInterested = request.interestedDonors && request.interestedDonors.includes(donorId);
      return requestObj;
    });

    const total = await BloodRequest.countDocuments(query);

    res.json({
      bloodRequests: requestsWithInterest,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get blood requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit blood request (for donors)
router.post('/blood-request', auth, authorize('donor'), [
  body('bloodType').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('units').isInt({ min: 1 }),
  body('reason').notEmpty().trim(),
  body('requiredBy').isISO8601(),
  body('hospital.name').notEmpty().trim(),
  body('hospital.address').notEmpty().trim(),
  body('hospital.contact').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bloodType, units, reason, requiredBy, hospital } = req.body;

    // Check if required date is in the future
    if (new Date(requiredBy) <= new Date()) {
      return res.status(400).json({ message: 'Required date must be in the future' });
    }

    // Create blood request with donor as patient
    const bloodRequest = new BloodRequest({
      patient: req.user._id, // Donor becomes the patient for this request
      bloodType,
      units,
      reason,
      requiredBy,
      hospital,
      urgency: 'medium', // Default urgency
      status: 'pending'
    });

    await bloodRequest.save();

    res.status(201).json({
      message: 'Blood request submitted successfully',
      bloodRequest
    });
  } catch (error) {
    console.error('Submit blood request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Express interest in a blood request
router.put('/blood-requests/:id/interest', auth, authorize('donor'), [
  body('isInterested').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isInterested } = req.body;
    const donorId = req.user._id;
    const requestId = req.params.id;

    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    if (bloodRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Can only express interest in pending requests' });
    }

    // Initialize interestedDonors array if it doesn't exist
    if (!bloodRequest.interestedDonors) {
      bloodRequest.interestedDonors = [];
    }

    if (isInterested) {
      // Add donor to interested list if not already there
      if (!bloodRequest.interestedDonors.includes(donorId)) {
        bloodRequest.interestedDonors.push(donorId);
      }
    } else {
      // Remove donor from interested list
      bloodRequest.interestedDonors = bloodRequest.interestedDonors.filter(
        id => id.toString() !== donorId.toString()
      );
    }

    await bloodRequest.save();

    res.json({
      message: isInterested ? 'Interest expressed successfully' : 'Interest removed successfully',
      bloodRequest
    });
  } catch (error) {
    console.error('Update interest error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get donor's interested requests
router.get('/interested-requests', auth, authorize('donor'), async (req, res) => {
  try {
    const donorId = req.user._id;
    
    const interestedRequests = await BloodRequest.find({
      interestedDonors: donorId
    })
    .populate('patient', 'firstName lastName email phone')
    .sort({ createdAt: -1 });

    res.json({
      interestedRequests
    });
  } catch (error) {
    console.error('Get interested requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Schedule a donation
router.post('/schedule-donation', auth, authorize('donor'), [
  body('donationDate').isISO8601(),
  body('units').isInt({ min: 1, max: 2 }),
  body('donationCenter.name').notEmpty(),
  body('donationCenter.address').notEmpty(),
  body('donationCenter.contact').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { donationDate, units, donationCenter, notes } = req.body;

    // Check if donation date is in the future
    if (new Date(donationDate) <= new Date()) {
      return res.status(400).json({ message: 'Donation date must be in the future' });
    }

    // Check if donor has donated recently (minimum 56 days between donations)
    if (req.user.lastDonation) {
      const daysSinceLastDonation = Math.floor(
        (new Date() - new Date(req.user.lastDonation)) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastDonation < 56) {
        return res.status(400).json({ 
          message: `You must wait at least 56 days between donations. You can donate again in ${56 - daysSinceLastDonation} days.` 
        });
      }
    }

    const donation = new Donation({
      donor: req.user._id,
      bloodType: req.user.bloodType,
      units,
      donationDate,
      donationCenter,
      notes,
      status: 'scheduled'
    });

    await donation.save();

    res.status(201).json({
      message: 'Donation scheduled successfully',
      donation
    });
  } catch (error) {
    console.error('Schedule donation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get donor's donation history
router.get('/donations', auth, authorize('donor'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    let query = { donor: req.user._id };
    if (status) {
      query.status = status;
    }

    const donations = await Donation.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Donation.countDocuments(query);

    res.json({
      donations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel scheduled donation
router.put('/donations/:id/cancel', auth, authorize('donor'), async (req, res) => {
  try {
    const donation = await Donation.findOne({
      _id: req.params.id,
      donor: req.user._id,
      status: 'scheduled'
    });

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found or cannot be cancelled' });
    }

    donation.status = 'cancelled';
    await donation.save();

    res.json({
      message: 'Donation cancelled successfully',
      donation
    });
  } catch (error) {
    console.error('Cancel donation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update donor profile
router.put('/profile', auth, authorize('donor'), [
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
