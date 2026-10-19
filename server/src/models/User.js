const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama wajib diisi'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email wajib diisi'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Format email tidak valid'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password wajib diisi'],
    },
    currency: {
      type: String,
      default: 'IDR',
    },
    monthlyCycleStartDay: {
      type: Number,
      default: 1,
      min: 1,
      max: 31,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
