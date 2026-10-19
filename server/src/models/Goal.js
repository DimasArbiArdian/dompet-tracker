const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Nama target tabungan wajib diisi'],
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target nominal wajib diisi'],
      min: [1, 'Target nominal harus lebih dari 0'],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    targetDate: {
      type: Date,
      required: [true, 'Tenggat waktu target wajib ditentukan'],
    },
    color: {
      type: String,
      default: '#359FA0', // Palette Teal
    },
    icon: {
      type: String,
      default: 'target',
    },
    category: {
      type: String,
      enum: ['EMERGENCY', 'HOLIDAY', 'GADGET', 'VEHICLE', 'HOUSE', 'EDUCATION', 'OTHER'],
      default: 'OTHER',
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      maxLength: 300,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

goalSchema.index({ userId: 1, isCompleted: 1 });

module.exports = mongoose.model('Goal', goalSchema);
