const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

const debtSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['DEBT', 'RECEIVABLE'], // DEBT = Hutang saya, RECEIVABLE = Piutang (orang lain berhutang ke saya)
      required: true,
    },
    personName: {
      type: String,
      required: [true, 'Nama pihak/orang bersangkutan wajib diisi'],
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total nominal wajib diisi'],
      min: [1, 'Nominal harus lebih dari 0'],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: [true, 'Tanggal jatuh tempo wajib ditentukan'],
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      default: null, // Dompet saat inisialisasi dana (opsional)
    },
    status: {
      type: String,
      enum: ['UNPAID', 'PARTIAL', 'SETTLED', 'OVERDUE'],
      default: 'UNPAID',
    },
    notes: {
      type: String,
      trim: true,
      maxLength: 300,
      default: '',
    },
    payments: [paymentHistorySchema],
  },
  {
    timestamps: true,
  }
);

debtSchema.index({ userId: 1, type: 1, status: 1 });
debtSchema.index({ userId: 1, dueDate: 1 });

module.exports = mongoose.model('Debt', debtSchema);
