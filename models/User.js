const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        try {
            const hash = await bcrypt.hash(this.password, 12);
            this.password = hash;
        } catch (err) {
            return next(err);
        }
    }
    next();
});

// Method to compare password
userSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
