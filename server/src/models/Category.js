const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null, // null jika kategori default sistem
    },
    name: {
      type: String,
      required: [true, 'Nama kategori wajib diisi'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['INCOME', 'EXPENSE'],
      required: true,
    },
    icon: {
      type: String,
      required: true,
      default: 'tag',
    },
    color: {
      type: String,
      required: true,
      default: '#359FA0',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Category', categorySchema);
