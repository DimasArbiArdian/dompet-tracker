const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Kategori anggaran wajib dipilih'],
    },
    amountLimit: {
      type: Number,
      required: [true, 'Batas anggaran wajib diisi'],
      min: [1, 'Batas anggaran harus lebih dari 0'],
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    alertThreshold: {
      type: Number,
      default: 80,
      min: 10,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee one budget per category per month per user
budgetSchema.index({ userId: 1, categoryId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
