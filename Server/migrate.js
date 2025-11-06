const mongoose = require('mongoose');
const User = require('./models/userModel');
const Admin = require('./models/adminModel');

async function migrate() {
  try {
    await mongoose.connect('mongodb://localhost:27017/taskmanagement'); // Adjust connection string if needed
    const users = await User.find({});
    for (const user of users) {
      if (user.email && !user.userid) {
        user.userid = user.email;
        await user.save();
      }
    }
    const admins = await Admin.find({});
    for (const admin of admins) {
      if (admin.email && !admin.userid) {
        admin.userid = admin.email;
        await admin.save();
      }
    }
    console.log('Migration completed');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}
migrate();
