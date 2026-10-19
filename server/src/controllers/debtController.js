const mongoose = require('mongoose');
const Debt = require('../models/Debt');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

// Helper to adjust wallet balance
const adjustWalletBalance = async (walletId, delta) => {
  return await Wallet.findByIdAndUpdate(
    walletId,
    { $inc: { balance: delta } },
    { new: true }
  );
};

// @desc    Get all debts and receivables with analytics
// @route   GET /api/v1/debts
// @access  Private
const getDebts = async (req, res, next) => {
  try {
    const { type, status, search } = req.query;
    const query = { userId: req.user._id };

    if (type && ['DEBT', 'RECEIVABLE'].includes(type.toUpperCase())) {
      query.type = type.toUpperCase();
    }

    if (status) {
      query.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      query.$or = [
        { personName: { $regex: search.trim(), $options: 'i' } },
        { notes: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const debts = await Debt.find(query)
      .populate('walletId', 'name type color')
      .populate('payments.walletId', 'name type color')
      .sort({ status: 1, dueDate: 1 });

    const now = new Date();

    const enriched = debts.map((d) => {
      const remainingAmount = Math.max(0, d.totalAmount - d.paidAmount);
      const percentage =
        d.totalAmount > 0
          ? Math.min(100, Math.round((d.paidAmount / d.totalAmount) * 100))
          : 0;

      const dueDateTime = new Date(d.dueDate).getTime();
      const diffTime = dueDateTime - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isOverdue = daysRemaining < 0 && d.paidAmount < d.totalAmount;

      let currentStatus = d.status;
      if (d.paidAmount >= d.totalAmount) {
        currentStatus = 'SETTLED';
      } else if (isOverdue) {
        currentStatus = 'OVERDUE';
      } else if (d.paidAmount > 0) {
        currentStatus = 'PARTIAL';
      } else {
        currentStatus = 'UNPAID';
      }

      return {
        _id: d._id,
        type: d.type,
        personName: d.personName,
        totalAmount: d.totalAmount,
        paidAmount: d.paidAmount,
        remainingAmount,
        percentage,
        dueDate: d.dueDate,
        walletId: d.walletId,
        status: currentStatus,
        notes: d.notes,
        daysRemaining,
        isOverdue,
        payments: d.payments,
        createdAt: d.createdAt,
      };
    });

    // Summary calculations across all user's active debts & receivables
    const allUserDebts = await Debt.find({ userId: req.user._id });
    let totalDebt = 0;       // What I owe
    let totalReceivable = 0; // What others owe me

    allUserDebts.forEach((item) => {
      const remaining = Math.max(0, item.totalAmount - item.paidAmount);
      if (item.type === 'DEBT') {
        totalDebt += remaining;
      } else if (item.type === 'RECEIVABLE') {
        totalReceivable += remaining;
      }
    });

    const netLoanPosition = totalReceivable - totalDebt;

    res.json({
      success: true,
      count: enriched.length,
      totalDebt,
      totalReceivable,
      netLoanPosition,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new debt or receivable
// @route   POST /api/v1/debts
// @access  Private
const createDebt = async (req, res, next) => {
  try {
    const { type, personName, totalAmount, dueDate, walletId, disburseFunds, notes } =
      req.body;

    if (!type || !personName || !totalAmount || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Jenis, nama pihak bersangkutan, nominal, dan jatuh tempo wajib diisi',
      });
    }

    const numericTotal = Number(totalAmount);
    if (numericTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Nominal harus lebih dari 0',
      });
    }

    // Optional direct disbursement to/from wallet
    if (disburseFunds && walletId) {
      const wallet = await Wallet.findOne({
        _id: walletId,
        userId: req.user._id,
      });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: 'Dompet yang dipilih tidak ditemukan',
        });
      }

      if (type === 'DEBT') {
        // We received borrowed money -> Wallet increases
        await adjustWalletBalance(walletId, numericTotal);

        const incCat = await Category.findOne({
          userId: req.user._id,
          $or: [{ name: /lainnya/i }, { type: 'INCOME' }],
        });

        await Transaction.create({
          userId: req.user._id,
          walletId,
          categoryId: incCat ? incCat._id : null,
          type: 'INCOME',
          amount: numericTotal,
          date: new Date(),
          note: `Pencairan Pinjaman (Hutang): ${personName.trim()}`,
        });
      } else if (type === 'RECEIVABLE') {
        // We gave money out to borrower -> Wallet decreases
        await adjustWalletBalance(walletId, -numericTotal);

        const expCat = await Category.findOne({
          userId: req.user._id,
          $or: [{ name: /lainnya/i }, { type: 'EXPENSE' }],
        });

        await Transaction.create({
          userId: req.user._id,
          walletId,
          categoryId: expCat ? expCat._id : null,
          type: 'EXPENSE',
          amount: numericTotal,
          date: new Date(),
          note: `Pemberian Pinjaman (Piutang): ${personName.trim()}`,
        });
      }
    }

    const debt = await Debt.create({
      userId: req.user._id,
      type: type.toUpperCase(),
      personName: personName.trim(),
      totalAmount: numericTotal,
      paidAmount: 0,
      dueDate: new Date(dueDate),
      walletId: walletId || null,
      notes: notes || '',
      status: 'UNPAID',
    });

    res.status(201).json({
      success: true,
      message: `${type === 'DEBT' ? 'Hutang' : 'Piutang'} berhasil dicatat`,
      data: debt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update debt/receivable details
// @route   PUT /api/v1/debts/:id
// @access  Private
const updateDebt = async (req, res, next) => {
  try {
    const debt = await Debt.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!debt) {
      return res.status(404).json({
        success: false,
        message: 'Catatan hutang/piutang tidak ditemukan',
      });
    }

    const { personName, totalAmount, dueDate, notes, status } = req.body;

    if (personName !== undefined) debt.personName = personName.trim();
    if (totalAmount !== undefined) debt.totalAmount = Number(totalAmount);
    if (dueDate !== undefined) debt.dueDate = new Date(dueDate);
    if (notes !== undefined) debt.notes = notes;
    if (status !== undefined) debt.status = status;

    if (debt.paidAmount >= debt.totalAmount) {
      debt.status = 'SETTLED';
    }

    await debt.save();

    res.json({
      success: true,
      message: 'Catatan hutang/piutang berhasil diperbarui',
      data: debt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record an installment payment for debt or receivable
// @route   POST /api/v1/debts/:id/pay
// @access  Private
const recordPayment = async (req, res, next) => {
  try {
    const { amount, walletId, note } = req.body;

    if (!amount || Number(amount) <= 0 || !walletId) {
      return res.status(400).json({
        success: false,
        message: 'Nominal pembayaran dan dompet wajib diisi',
      });
    }

    const debt = await Debt.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!debt) {
      return res.status(404).json({
        success: false,
        message: 'Catatan hutang/piutang tidak ditemukan',
      });
    }

    const wallet = await Wallet.findOne({
      _id: walletId,
      userId: req.user._id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Dompet tidak ditemukan',
      });
    }

    const numericAmount = Number(amount);
    const remainingToPay = Math.max(0, debt.totalAmount - debt.paidAmount);

    if (numericAmount > remainingToPay) {
      return res.status(400).json({
        success: false,
        message: `Nominal pembayaran melebihi sisa yang harus dilunasi (Rp ${remainingToPay.toLocaleString('id-ID')})`,
      });
    }

    if (debt.type === 'DEBT') {
      // 1. I am paying my debt -> Wallet decreases (EXPENSE)
      if (numericAmount > wallet.balance) {
        return res.status(400).json({
          success: false,
          message: `Saldo dompet ${wallet.name} tidak mencukupi untuk pembayaran`,
        });
      }

      await adjustWalletBalance(walletId, -numericAmount);

      const expCat = await Category.findOne({
        userId: req.user._id,
        $or: [{ name: /tagihan/i }, { name: /lainnya/i }, { type: 'EXPENSE' }],
      });

      await Transaction.create({
        userId: req.user._id,
        walletId,
        categoryId: expCat ? expCat._id : null,
        type: 'EXPENSE',
        amount: numericAmount,
        date: new Date(),
        note: note || `Bayar Cicilan Hutang: ${debt.personName}`,
      });
    } else if (debt.type === 'RECEIVABLE') {
      // 2. Someone is paying back to me -> Wallet increases (INCOME)
      await adjustWalletBalance(walletId, numericAmount);

      const incCat = await Category.findOne({
        userId: req.user._id,
        $or: [{ name: /pemasukan/i }, { name: /lainnya/i }, { type: 'INCOME' }],
      });

      await Transaction.create({
        userId: req.user._id,
        walletId,
        categoryId: incCat ? incCat._id : null,
        type: 'INCOME',
        amount: numericAmount,
        date: new Date(),
        note: note || `Terima Pelunasan Piutang: ${debt.personName}`,
      });
    }

    // Update debt object
    debt.paidAmount += numericAmount;
    if (debt.paidAmount >= debt.totalAmount) {
      debt.status = 'SETTLED';
    } else {
      debt.status = 'PARTIAL';
    }

    debt.payments.push({
      amount: numericAmount,
      walletId,
      date: new Date(),
      note: note || '',
    });

    await debt.save();

    res.json({
      success: true,
      message: `Pembayaran sebesar Rp ${numericAmount.toLocaleString('id-ID')} berhasil dicatat`,
      data: debt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete debt or receivable
// @route   DELETE /api/v1/debts/:id
// @access  Private
const deleteDebt = async (req, res, next) => {
  try {
    const debt = await Debt.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!debt) {
      return res.status(404).json({
        success: false,
        message: 'Catatan tidak ditemukan',
      });
    }

    await debt.deleteOne();

    res.json({
      success: true,
      message: 'Catatan berhasil dihapus',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDebts,
  createDebt,
  updateDebt,
  recordPayment,
  deleteDebt,
};
