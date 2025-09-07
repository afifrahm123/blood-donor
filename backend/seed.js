const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@blooddonation.com',
      password: 'admin123',
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+1234567890',
      bloodType: 'O+',
      dateOfBirth: new Date('1990-01-01'),
      role: 'admin',
      address: '123 Admin Street, Admin City, AS 12345'
    });

    await adminUser.save();
    console.log('Admin user created successfully');

    // Create sample donor
    const sampleDonor = new User({
      username: 'donor1',
      email: 'donor1@example.com',
      password: 'donor123',
      firstName: 'John',
      lastName: 'Donor',
      phone: '+1234567891',
      bloodType: 'A+',
      dateOfBirth: new Date('1985-05-15'),
      role: 'donor',
      address: '456 Donor Avenue, Donor City, DC 54321'
    });

    await sampleDonor.save();
    console.log('Sample donor created successfully');

    // Create sample patient
    const samplePatient = new User({
      username: 'patient1',
      email: 'patient1@example.com',
      password: 'patient123',
      firstName: 'Jane',
      lastName: 'Patient',
      phone: '+1234567892',
      bloodType: 'B+',
      dateOfBirth: new Date('1992-08-20'),
      role: 'patient',
      address: '789 Patient Road, Patient City, PC 98765'
    });

    await samplePatient.save();
    console.log('Sample patient created successfully');

    console.log('Database seeded successfully!');
    console.log('\nDefault login credentials:');
    console.log('Admin - Username: admin, Password: admin123');
    console.log('Donor - Username: donor1, Password: donor123');
    console.log('Patient - Username: patient1, Password: patient123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
