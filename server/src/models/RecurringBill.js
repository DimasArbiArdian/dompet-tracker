const mongoose = require('mongoose');

const recurringBillSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Nama tagihan rutin wajib diisi'],
      trim: true,
      maxLength: [100, 'Nama maksimal 100 karakter'],
    },
    amount: {
      type: Number,
      required: [true, 'Nominal tagihan wajib diisi'],
      min: [1, 'Nominal harus lebih dari 0'],
    },
    type: {
      type: String,
      enum: ['EXPENSE', 'INCOME'],
      default: 'EXPENSE',
    },
    frequency: {
      type: String,
      enum: ['WEEKLY', 'MONTHLY', 'YEARLY'],
      default: 'MONTHLY',
    },
    dueDay: {
      type: Number,
      required: [true, 'Tanggal jatuh tempo per siklus wajib diisi'],
      min: 1,
      max: 31,
      default: 1,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'Dompet pembayaran default wajib dipilih'],
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Kategori transaksi wajib dipilih'],
    },
    color: {
      type: String,
      default: '#359FA0',
    },
    notes: {
      type: String,
      trim: true,
      maxLength: [250, 'Catatan maksimal 250 karakter'],
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastExecutedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

recurringBillSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('RecurringBill', recurringBillSchema);
