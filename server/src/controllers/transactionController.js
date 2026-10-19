const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const Category = require('../models/Category');

// Helper to apply balance delta to wallet
const adjustWalletBalance = async (walletId, delta, session = null) => {
  const options = session ? { session } : {};
  return await Wallet.findByIdAndUpdate(
    walletId,
    { $inc: { balance: delta } },
    { new: true, ...options }
  );
};

// @desc    Get transactions with filters, search and pagination
// @route   GET /api/v1/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      walletId,
      categoryId,
      type,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { userId: req.user._id };

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Wallet filter (either source or target for transfer)
    if (walletId) {
      query.$or = [{ walletId: walletId }, { toWalletId: walletId }];
    }

    // Category filter
    if (categoryId) {
      query.categoryId = categoryId;
    }

    // Type filter
    if (type && ['INCOME', 'EXPENSE', 'TRANSFER'].includes(type.toUpperCase())) {
      query.type = type.toUpperCase();
    }

    // Search in note
    if (search && search.trim()) {
      query.note = { $regex: search.trim(), $options: 'i' };
    }

    // Tag filter
    if (req.query.tag && req.query.tag.trim()) {
      const cleanTag = req.query.tag.trim().replace(/^#/, '');
      query.tags = cleanTag;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await Transaction.countDocuments(query);

    const transactions = await Transaction.find(query)
      .populate('walletId', 'name type color icon')
      .populate('toWalletId', 'name type color icon')
      .populate('categoryId', 'name type color icon')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction by ID
// @route   GET /api/v1/transactions/:id
// @access  Private
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })
      .populate('walletId', 'name type color icon')
      .populate('toWalletId', 'name type color icon')
      .populate('categoryId', 'name type color icon');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan',
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new transaction with atomic balance update
// @route   POST /api/v1/transactions
// @access  Private
const createTransaction = async (req, res, next) => {
  const { walletId, toWalletId, categoryId, type, amount, date, note, tags } = req.body;

  if (!walletId || !type || amount === undefined || amount === null) {
    return res.status(400).json({
      success: false,
      message: 'Dompet, jenis transaksi, dan nominal wajib diisi',
    });
  }

  const numericAmount = Number(amount);
  if (numericAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Nominal transaksi harus lebih dari 0',
    });
  }

  if (type === 'TRANSFER') {
    if (!toWalletId) {
      return res.status(400).json({
        success: false,
        message: 'Dompet tujuan wajib dipilih untuk transfer antar-dompet',
      });
    }
    if (walletId.toString() === toWalletId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Dompet tujuan tidak boleh sama dengan dompet sumber',
      });
    }
  } else {
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Kategori wajib dipilih untuk pemasukan dan pengeluaran',
      });
    }
  }

  // Try execution with session if supported, otherwise direct
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (e) {
    session = null; // Standalone or transactions unsupported
  }

  try {
    const sourceWallet = await Wallet.findOne({
      _id: walletId,
      userId: req.user._id,
    }).session(session);

    if (!sourceWallet) {
      if (session) await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Dompet sumber tidak ditemukan',
      });
    }

    let destWallet = null;
    if (type === 'TRANSFER') {
      destWallet = await Wallet.findOne({
        _id: toWalletId,
        userId: req.user._id,
      }).session(session);

      if (!destWallet) {
        if (session) await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: 'Dompet tujuan tidak ditemukan',
        });
      }
    }

    const txData = {
      userId: req.user._id,
      walletId,
      toWalletId: type === 'TRANSFER' ? toWalletId : null,
      categoryId: type === 'TRANSFER' ? null : categoryId,
      type,
      amount: numericAmount,
      date: date ? new Date(date) : new Date(),
      note: note || '',
      tags: Array.isArray(tags) ? tags : [],
    };

    let createdTransaction;
    if (session) {
      const [tx] = await Transaction.create([txData], { session });
      createdTransaction = tx;

      if (type === 'INCOME') {
        await adjustWalletBalance(walletId, numericAmount, session);
      } else if (type === 'EXPENSE') {
        await adjustWalletBalance(walletId, -numericAmount, session);
      } else if (type === 'TRANSFER') {
        await adjustWalletBalance(walletId, -numericAmount, session);
        await adjustWalletBalance(toWalletId, numericAmount, session);
      }

      await session.commitTransaction();
    } else {
      createdTransaction = await Transaction.create(txData);

      if (type === 'INCOME') {
        await adjustWalletBalance(walletId, numericAmount);
      } else if (type === 'EXPENSE') {
        await adjustWalletBalance(walletId, -numericAmount);
      } else if (type === 'TRANSFER') {
        await adjustWalletBalance(walletId, -numericAmount);
        await adjustWalletBalance(toWalletId, numericAmount);
      }
    }

    const populatedTx = await Transaction.findById(createdTransaction._id)
      .populate('walletId', 'name type color icon')
      .populate('toWalletId', 'name type color icon')
      .populate('categoryId', 'name type color icon');

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil disimpan',
      data: populatedTx,
    });
  } catch (error) {
    if (session) await session.abortTransaction();
    next(error);
  } finally {
    if (session) session.endSession();
  }
};

// @desc    Update a transaction & adjust balances
// @route   PUT /api/v1/transactions/:id
// @access  Private
const updateTransaction = async (req, res, next) => {
  const { id } = req.params;
  const { walletId, toWalletId, categoryId, type, amount, date, note } = req.body;

  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (e) {
    session = null;
  }

  try {
    const existingTx = await Transaction.findOne({
      _id: id,
      userId: req.user._id,
    }).session(session);

    if (!existingTx) {
      if (session) await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan',
      });
    }

    // 1. Revert previous transaction effect on wallet balances
    if (existingTx.type === 'INCOME') {
      await adjustWalletBalance(existingTx.walletId, -existingTx.amount, session);
    } else if (existingTx.type === 'EXPENSE') {
      await adjustWalletBalance(existingTx.walletId, existingTx.amount, session);
    } else if (existingTx.type === 'TRANSFER') {
      await adjustWalletBalance(existingTx.walletId, existingTx.amount, session);
      await adjustWalletBalance(existingTx.toWalletId, -existingTx.amount, session);
    }

    // 2. Prepare new data
    const newType = type || existingTx.type;
    const newAmount = amount !== undefined ? Number(amount) : existingTx.amount;
    const newWalletId = walletId || existingTx.walletId;
    const newToWalletId = newType === 'TRANSFER' ? (toWalletId || existingTx.toWalletId) : null;
    const newCategoryId = newType === 'TRANSFER' ? null : (categoryId || existingTx.categoryId);

    // Apply updates to tx document
    existingTx.walletId = newWalletId;
    existingTx.toWalletId = newToWalletId;
    existingTx.categoryId = newCategoryId;
    existingTx.type = newType;
    existingTx.amount = newAmount;
    if (date) existingTx.date = new Date(date);
    if (note !== undefined) existingTx.note = note;
    if (req.body.tags !== undefined) {
      existingTx.tags = Array.isArray(req.body.tags) ? req.body.tags : [];
    }

    await existingTx.save(session ? { session } : {});

    // 3. Apply new transaction effect on wallet balances
    if (newType === 'INCOME') {
      await adjustWalletBalance(newWalletId, newAmount, session);
    } else if (newType === 'EXPENSE') {
      await adjustWalletBalance(newWalletId, -newAmount, session);
    } else if (newType === 'TRANSFER') {
      await adjustWalletBalance(newWalletId, -newAmount, session);
      await adjustWalletBalance(newToWalletId, newAmount, session);
    }

    if (session) await session.commitTransaction();

    const updatedTx = await Transaction.findById(existingTx._id)
      .populate('walletId', 'name type color icon')
      .populate('toWalletId', 'name type color icon')
      .populate('categoryId', 'name type color icon');

    res.json({
      success: true,
      message: 'Transaksi berhasil diperbarui',
      data: updatedTx,
    });
  } catch (error) {
    if (session) await session.abortTransaction();
    next(error);
  } finally {
    if (session) session.endSession();
  }
};

// @desc    Delete transaction & revert wallet balances
// @route   DELETE /api/v1/transactions/:id
// @access  Private
const deleteTransaction = async (req, res, next) => {
  const { id } = req.params;

  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (e) {
    session = null;
  }

  try {
    const tx = await Transaction.findOne({
      _id: id,
      userId: req.user._id,
    }).session(session);

    if (!tx) {
      if (session) await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan',
      });
    }

    // Revert wallet balances
    if (tx.type === 'INCOME') {
      await adjustWalletBalance(tx.walletId, -tx.amount, session);
    } else if (tx.type === 'EXPENSE') {
      await adjustWalletBalance(tx.walletId, tx.amount, session);
    } else if (tx.type === 'TRANSFER') {
      await adjustWalletBalance(tx.walletId, tx.amount, session);
      await adjustWalletBalance(tx.toWalletId, -tx.amount, session);
    }

    await tx.deleteOne(session ? { session } : {});

    if (session) await session.commitTransaction();

    res.json({
      success: true,
      message: 'Transaksi berhasil dihapus dan saldo dompet dikembalikan',
    });
  } catch (error) {
    if (session) await session.abortTransaction();
    next(error);
  } finally {
    if (session) session.endSession();
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
