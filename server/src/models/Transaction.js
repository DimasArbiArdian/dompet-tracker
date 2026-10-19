const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Dompet sumber wajib dipilih'],
    },
    toWalletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      default: null, // Khusus untuk type === 'TRANSFER'
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: function () {
        return (
          this.type !== 'TRANSFER' &&
          !this.note?.includes('Tabungan')
        );
      },
    },
    type: {
      type: String,
      enum: ['INCOME', 'EXPENSE', 'TRANSFER'],
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Nominal transaksi wajib diisi'],
      min: [1, 'Nominal harus lebih dari 0'],
    },
    date: {
      type: Date,
      required: [true, 'Tanggal transaksi wajib diisi'],
      default: Date.now,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      maxLength: [250, 'Catatan maksimal 250 karakter'],
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Auto-extract hashtags from note before saving if any exist
transactionSchema.pre('save', function (next) {
  if (this.note) {
    const matches = this.note.match(/#([\p{L}\p{N}_-]+)/gu);
    if (matches && matches.length > 0) {
      const extracted = matches.map((t) => t.substring(1).trim()).filter(Boolean);
      // Merge unique tags
      const currentTags = this.tags || [];
      this.tags = Array.from(new Set([...currentTags, ...extracted]));
    }
  }
  next();
});

// Compound index for fast queries in dashboard & list
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, walletId: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1, date: -1 });
transactionSchema.index({ userId: 1, tags: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
