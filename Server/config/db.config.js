const mongoose = require('mongoose');

const database = () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskmanagement';
    mongoose.connect(uri)
        .then(() => {
            console.log('Successfully connected to the database');
        })
        .catch(err => {
            console.error('Database connection error:', err);
        });
};

module.exports = { database };
