const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Nama dompet wajib diisi'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['BANK', 'EWALLET', 'CASH', 'INVESTMENT'],
      default: 'CASH',
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    color: {
      type: String,
      default: '#359FA0', // Default Deep Teal
    },
    icon: {
      type: String,
      default: 'wallet',
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

walletSchema.index({ userId: 1, isArchived: 1 });

module.exports = mongoose.model('Wallet', walletSchema);
