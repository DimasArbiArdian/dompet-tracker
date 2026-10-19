const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

// @desc    Get all wallets for logged in user
// @route   GET /api/v1/wallets
// @access  Private
const getWallets = async (req, res, next) => {
  try {
    const { includeArchived } = req.query;
    const filter = { userId: req.user._id };

    if (includeArchived !== 'true') {
      filter.isArchived = false;
    }

    const wallets = await Wallet.find(filter).sort({ createdAt: 1 });

    const totalBalance = wallets
      .filter((w) => !w.isArchived)
      .reduce((sum, w) => sum + (w.balance || 0), 0);

    res.json({
      success: true,
      count: wallets.length,
      totalBalance,
      data: wallets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new wallet
// @route   POST /api/v1/wallets
// @access  Private
const createWallet = async (req, res, next) => {
  try {
    const { name, type, balance, color, icon } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nama dompet wajib diisi',
      });
    }

    const wallet = await Wallet.create({
      userId: req.user._id,
      name,
      type: type || 'CASH',
      balance: Number(balance) || 0,
      color: color || '#359FA0',
      icon: icon || 'wallet',
    });

    res.status(201).json({
      success: true,
      message: 'Dompet berhasil dibuat',
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update wallet details
// @route   PUT /api/v1/wallets/:id
// @access  Private
const updateWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Dompet tidak ditemukan',
      });
    }

    const { name, type, color, icon, balance, isArchived } = req.body;

    if (name !== undefined) wallet.name = name;
    if (type !== undefined) wallet.type = type;
    if (color !== undefined) wallet.color = color;
    if (icon !== undefined) wallet.icon = icon;
    if (balance !== undefined) wallet.balance = Number(balance);
    if (isArchived !== undefined) wallet.isArchived = Boolean(isArchived);

    await wallet.save();

    res.json({
      success: true,
      message: 'Dompet berhasil diperbarui',
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete or Archive wallet
// @route   DELETE /api/v1/wallets/:id
// @access  Private
const deleteWallet = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Dompet tidak ditemukan',
      });
    }

    // Check if wallet has transactions
    const transactionCount = await Transaction.countDocuments({
      userId: req.user._id,
      $or: [{ walletId: wallet._id }, { toWalletId: wallet._id }],
    });

    if (transactionCount > 0) {
      // Archive instead of hard delete to preserve history
      wallet.isArchived = true;
      await wallet.save();
      return res.json({
        success: true,
        message: 'Dompet memiliki transaksi terkait sehingga telah diarsipkan',
        isArchived: true,
      });
    }

    await wallet.deleteOne();
    res.json({
      success: true,
      message: 'Dompet berhasil dihapus',
      isArchived: false,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWallets,
  createWallet,
  updateWallet,
  deleteWallet,
};
