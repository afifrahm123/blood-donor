const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const BloodRequest = require('../models/BloodRequest');
const Donation = require('../models/Donation');

const router = express.Router();

// Get admin dashboard data
router.get('/dashboard', auth, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const totalPatients = await User.countDocuments({ role: 'patient' });
    
    const pendingRequests = await BloodRequest.countDocuments({ status: 'pending' });
    const approvedRequests = await BloodRequest.countDocuments({ status: 'approved' });
    const rejectedRequests = await BloodRequest.countDocuments({ status: 'rejected' });
    
    const totalDonations = await Donation.countDocuments();
    const completedDonations = await Donation.countDocuments({ status: 'completed' });
    const scheduledDonations = await Donation.countDocuments({ status: 'scheduled' });

    // Blood type statistics
    const bloodTypeStats = await BloodRequest.aggregate([
      { $group: { _id: '$bloodType', count: { $sum: 1 } } }
    ]);

    res.json({
      totalUsers,
      totalDonors,
      totalPatients,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalDonations,
      completedDonations,
      scheduledDonations,
      bloodTypeStats
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test route to check virtuals population
router.get('/test-user-virtuals/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate({
        path: 'totalDonationCount',
        select: '_id', // Only need count, but populate needs a field
        virtuals: true
      })
      .populate({
        path: 'totalRequestsCount',
        select: '_id', // Only need count, but populate needs a field
        virtuals: true
      })
      .exec();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('--- Test User Virtuals Result ---');
    console.log('User:', user.toObject({ virtuals: true })); // Explicitly include virtuals
    console.log('Total Donations (virtual):', user.totalDonationCount);
    console.log('Total Requests (virtual):', user.totalRequestsCount);

    res.json({
      message: 'User virtuals test successful',
      user: user.toObject({ virtuals: true })
    });
  } catch (error) {
    console.error('Test user virtuals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending requests count for badge
router.get('/pending-requests-count', auth, authorize('admin'), async (req, res) => {
  try {
    const count = await BloodRequest.countDocuments({ status: 'pending' });
    
    res.json({
      count,
      success: true
    });
  } catch (error) {
    console.error('Get pending requests count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users with pagination
router.get('/users', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    
    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific user
router.get('/users/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user status
router.put('/users/:id/status', auth, authorize('admin'), [
  body('isActive').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all blood requests
router.get('/blood-requests', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, urgency, search, bloodType } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (urgency) query.urgency = urgency;
    if (bloodType) query.bloodType = bloodType;

    // If search is provided, we need to search in the populated patient fields
    let bloodRequests;
    if (search) {
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
      query.patient = { $in: patientIds };
    }

    bloodRequests = await BloodRequest.find(query)
      .populate({ path: 'patient', select: 'firstName lastName email phone bloodType role totalDonationCount totalRequestsCount', virtuals: true })
      .populate('interestedDonors', 'firstName lastName email phone bloodType')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Log patient data for each blood request to debug badge issue
    bloodRequests.forEach(request => {
      console.log('Patient in blood request (with virtuals):', request.patient);
    });

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

// Update blood request status
router.put('/blood-requests/:id/status', auth, authorize('admin'), [
  body('status').isIn(['pending', 'approved', 'rejected', 'cancelled']),
  body('adminNotes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, adminNotes } = req.body;
    const bloodRequest = await BloodRequest.findByIdAndUpdate(
      req.params.id,
      { status, adminNotes },
      { new: true }
    ).populate('patient', 'firstName lastName email phone bloodType role')
     .populate('interestedDonors', 'firstName lastName email phone bloodType');

    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    res.json({
      message: 'Blood request status updated successfully',
      bloodRequest
    });
  } catch (error) {
    console.error('Update blood request status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all donations
router.get('/donations', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const donations = await Donation.find(query)
      .populate('donor', 'firstName lastName email phone bloodType')
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

// Update donation status
router.put('/donations/:id/status', auth, authorize('admin'), [
  body('status').isIn(['scheduled', 'completed', 'cancelled']),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, notes } = req.body;
    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true }
    ).populate('donor', 'firstName lastName email phone bloodType');

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Update donor's last donation date if completed
    if (status === 'completed') {
      await User.findByIdAndUpdate(donation.donor._id, {
        lastDonation: donation.donationDate
      });
    }

    res.json({
      message: 'Donation status updated successfully',
      donation
    });
  } catch (error) {
    console.error('Update donation status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get blood inventory summary
router.get('/blood-inventory', auth, authorize('admin'), async (req, res) => {
  try {
    const bloodInventory = await Donation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$bloodType', totalUnits: { $sum: '$units' } } }
    ]);

    const bloodRequests = await BloodRequest.aggregate([
      { $match: { status: { $in: ['pending', 'approved'] } } },
      { $group: { _id: '$bloodType', totalUnits: { $sum: '$units' } } }
    ]);

    res.json({
      bloodInventory,
      bloodRequests
    });
  } catch (error) {
    console.error('Get blood inventory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comprehensive blood inventory dashboard data
router.get('/dashboard/blood-inventory', auth, authorize('admin'), async (req, res) => {
  try {
    // Get all blood types
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    
    // Debug: Check all donors in database
    const allDonors = await User.find({ role: 'donor' }).select('bloodType');
    console.log('All donors in database:', allDonors);
    
    // Get total donors by blood type
    const donorsByBloodType = await User.aggregate([
      { $match: { role: 'donor' } },
      { $group: { _id: '$bloodType', count: { $sum: 1 } } }
    ]);

    // Debug: Log the donors aggregation result
    console.log('Donors by blood type:', donorsByBloodType);

    // Get total requests by blood type
    const requestsByBloodType = await BloodRequest.aggregate([
      { $group: { _id: '$bloodType', count: { $sum: 1 } } }
    ]);

    // Get approved requests by blood type
    const approvedRequestsByBloodType = await BloodRequest.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$bloodType', count: { $sum: 1 } } }
    ]);

    // Create comprehensive blood inventory data
    const bloodInventoryData = bloodTypes.map(bloodType => {
      const donorCount = parseInt(donorsByBloodType.find(item => item._id === bloodType)?.count || 0);
      const totalRequests = parseInt(requestsByBloodType.find(item => item._id === bloodType)?.count || 0);
      const approvedRequests = parseInt(approvedRequestsByBloodType.find(item => item._id === bloodType)?.count || 0);

      // Debug: Log each blood type calculation
      console.log(`Blood type ${bloodType}: donorCount = ${donorCount}, bloodUnits = ${donorCount * 500}`);

      return {
        bloodType,
        bloodUnits: donorCount * 500, // Blood amount = Total donors * 500ml per donor
        totalDonors: donorCount,
        totalRequests: totalRequests,
        approvedRequests: approvedRequests
      };
    });

    res.json({
      success: true,
      bloodInventory: bloodInventoryData
    });
  } catch (error) {
    console.error('Get blood inventory dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get donor management data with detailed donor information
router.get('/donor-management', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, bloodType, search } = req.query;
    
    let query = { role: 'donor' };
    if (bloodType) query.bloodType = bloodType;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const donors = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Get donation statistics for each donor
    const donorsWithStats = await Promise.all(
      donors.map(async (donor) => {
        const totalDonations = await Donation.countDocuments({ donor: donor._id });
        const completedDonations = await Donation.countDocuments({ 
          donor: donor._id, 
          status: 'completed' 
        });
        const lastDonation = await Donation.findOne({ 
          donor: donor._id, 
          status: 'completed' 
        }).sort({ donationDate: -1 });

        return {
          ...donor.toObject(),
          totalDonations,
          completedDonations,
          lastDonationDate: lastDonation?.donationDate || null
        };
      })
    );

    res.json({
      success: true,
      donors: donorsWithStats,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get donor management error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get blood management summary data
router.get('/blood-management', auth, authorize('admin'), async (req, res) => {
  try {
    // Get all blood types
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    
    // Get donors by blood type with detailed info
    const donorsByBloodType = await User.aggregate([
      { $match: { role: 'donor' } },
      { $group: { 
        _id: '$bloodType', 
        count: { $sum: 1 },
        donors: { $push: { 
          _id: '$_id',
          firstName: '$firstName',
          lastName: '$lastName',
          email: '$email',
          phone: '$phone',
          address: '$address',
          lastDonation: '$lastDonation',
          createdAt: '$createdAt'
        }}
      }}
    ]);

    // Get donation statistics by blood type
    const donationStats = await Donation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { 
        _id: '$bloodType', 
        totalUnits: { $sum: 1 },
        totalDonations: { $sum: 1 }
      }}
    ]);

    // Create comprehensive blood management data
    const bloodManagementData = bloodTypes.map(bloodType => {
      const donorGroup = donorsByBloodType.find(item => item._id === bloodType);
      const donationGroup = donationStats.find(item => item._id === bloodType);
      
      return {
        bloodType,
        totalDonors: donorGroup?.count || 0,
        donors: donorGroup?.donors || [],
        totalDonations: donationGroup?.totalDonations || 0,
        totalUnits: donationGroup?.totalUnits || 0,
        availableBlood: (donorGroup?.count || 0) * 500 // 500ml per donor
      };
    });

    res.json({
      success: true,
      bloodManagement: bloodManagementData
    });
  } catch (error) {
    console.error('Get blood management error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get patient management data with detailed patient information
router.get('/patient-management', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, bloodType, search } = req.query;
    
    let query = { role: 'patient' };
    if (bloodType) query.bloodType = bloodType;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const patients = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Get blood request statistics for each patient
    const patientsWithStats = await Promise.all(
      patients.map(async (patient) => {
        const totalRequests = await BloodRequest.countDocuments({ patient: patient._id });
        const pendingRequests = await BloodRequest.countDocuments({ 
          patient: patient._id, 
          status: 'pending' 
        });
        const approvedRequests = await BloodRequest.countDocuments({ 
          patient: patient._id, 
          status: 'approved' 
        });
        const fulfilledRequests = await BloodRequest.countDocuments({ 
          patient: patient._id, 
          status: 'fulfilled' 
        });
        const lastRequest = await BloodRequest.findOne({ 
          patient: patient._id 
        }).sort({ createdAt: -1 });

        // Calculate age from dateOfBirth
        const age = patient.dateOfBirth ? 
          Math.floor((new Date() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
          null;

        return {
          ...patient.toObject(),
          age,
          totalRequests,
          pendingRequests,
          approvedRequests,
          fulfilledRequests,
          lastRequestDate: lastRequest?.createdAt || null
        };
      })
    );

    res.json({
      success: true,
      patients: patientsWithStats,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get patient management error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
