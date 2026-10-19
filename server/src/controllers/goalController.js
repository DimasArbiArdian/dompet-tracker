const mongoose = require('mongoose');
const Goal = require('../models/Goal');
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

// @desc    Get all savings goals with analytics
// @route   GET /api/v1/goals
// @access  Private
const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).sort({
      isCompleted: 1,
      targetDate: 1,
    });

    const now = new Date();

    const enriched = goals.map((g) => {
      const remainingAmount = Math.max(0, g.targetAmount - g.currentAmount);
      const percentage =
        g.targetAmount > 0
          ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
          : 0;

      // Calculate days remaining
      const targetTime = new Date(g.targetDate).getTime();
      const diffTime = targetTime - now.getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));

      // Calculate recommended saving per month
      const recommendedMonthly =
        remainingAmount > 0 && monthsRemaining > 0
          ? Math.ceil(remainingAmount / monthsRemaining)
          : 0;

      return {
        _id: g._id,
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        remainingAmount,
        percentage,
        targetDate: g.targetDate,
        color: g.color,
        icon: g.icon,
        category: g.category,
        isCompleted: g.isCompleted || percentage >= 100,
        notes: g.notes,
        daysRemaining,
        monthsRemaining,
        recommendedMonthly,
        createdAt: g.createdAt,
      };
    });

    const totalTarget = enriched.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCollected = enriched.reduce((sum, g) => sum + g.currentAmount, 0);
    const overallProgress =
      totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

    res.json({
      success: true,
      count: enriched.length,
      totalTarget,
      totalCollected,
      overallProgress,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new savings goal
// @route   POST /api/v1/goals
// @access  Private
const createGoal = async (req, res, next) => {
  try {
    const { name, targetAmount, targetDate, color, icon, category, notes, initialDeposit, walletId } =
      req.body;

    if (!name || !targetAmount || !targetDate) {
      return res.status(400).json({
        success: false,
        message: 'Nama target, nominal target, dan tenggat waktu wajib diisi',
      });
    }

    const numericTarget = Number(targetAmount);
    if (numericTarget <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Nominal target harus lebih dari 0',
      });
    }

    let initialAmount = 0;
    // Optional initial deposit from a wallet
    if (initialDeposit && Number(initialDeposit) > 0) {
      if (!walletId) {
        return res.status(400).json({
          success: false,
          message: 'Pilih dompet sumber untuk setoran awal',
        });
      }

      const sourceWallet = await Wallet.findOne({
        _id: walletId,
        userId: req.user._id,
      });

      if (!sourceWallet) {
        return res.status(404).json({
          success: false,
          message: 'Dompet sumber tidak ditemukan',
        });
      }

      const depositNum = Number(initialDeposit);
      initialAmount = depositNum;

      // Adjust wallet balance
      await adjustWalletBalance(walletId, -depositNum);

      // Create record in transaction history
      await Transaction.create({
        userId: req.user._id,
        walletId,
        type: 'EXPENSE',
        amount: depositNum,
        date: new Date(),
        note: `Alokasi Tabungan Awal: ${name.trim()}`,
      });
    }

    const goal = await Goal.create({
      userId: req.user._id,
      name: name.trim(),
      targetAmount: numericTarget,
      currentAmount: initialAmount,
      targetDate: new Date(targetDate),
      color: color || '#359FA0',
      icon: icon || 'target',
      category: category || 'OTHER',
      notes: notes || '',
      isCompleted: initialAmount >= numericTarget,
    });

    res.status(201).json({
      success: true,
      message: 'Target tabungan berhasil dibuat',
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update savings goal
// @route   PUT /api/v1/goals/:id
// @access  Private
const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Target tabungan tidak ditemukan',
      });
    }

    const { name, targetAmount, targetDate, color, icon, category, notes, isCompleted } =
      req.body;

    if (name !== undefined) goal.name = name.trim();
    if (targetAmount !== undefined) goal.targetAmount = Number(targetAmount);
    if (targetDate !== undefined) goal.targetDate = new Date(targetDate);
    if (color !== undefined) goal.color = color;
    if (icon !== undefined) goal.icon = icon;
    if (category !== undefined) goal.category = category;
    if (notes !== undefined) goal.notes = notes;
    if (isCompleted !== undefined) goal.isCompleted = Boolean(isCompleted);

    // Auto mark completed if current >= target
    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true;
    }

    await goal.save();

    res.json({
      success: true,
      message: 'Target tabungan berhasil diperbarui',
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deposit / Nabung ke target tabungan
// @route   POST /api/v1/goals/:id/deposit
// @access  Private
const depositToGoal = async (req, res, next) => {
  try {
    const { amount, walletId, note } = req.body;

    if (!amount || Number(amount) <= 0 || !walletId) {
      return res.status(400).json({
        success: false,
        message: 'Nominal setoran dan dompet sumber wajib diisi',
      });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Target tabungan tidak ditemukan',
      });
    }

    const wallet = await Wallet.findOne({
      _id: walletId,
      userId: req.user._id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Dompet sumber tidak ditemukan',
      });
    }

    const numericAmount = Number(amount);

    // 1. Deduct from source wallet
    await adjustWalletBalance(walletId, -numericAmount);

    // 2. Add to goal
    goal.currentAmount += numericAmount;
    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true;
    }
    await goal.save();

    // 3. Create transaction record for audit trail
    const expCat = await Category.findOne({
      userId: req.user._id,
      $or: [{ name: /investasi/i }, { name: /lainnya/i }, { type: 'EXPENSE' }],
    });

    await Transaction.create({
      userId: req.user._id,
      walletId,
      categoryId: expCat ? expCat._id : null,
      type: 'EXPENSE',
      amount: numericAmount,
      date: new Date(),
      note: note || `Setor Tabungan: ${goal.name}`,
    });

    res.json({
      success: true,
      message: `Berhasil menabung Rp ${numericAmount.toLocaleString('id-ID')} ke target "${goal.name}"`,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Withdraw / Tarik dana dari target tabungan kembali ke dompet
// @route   POST /api/v1/goals/:id/withdraw
// @access  Private
const withdrawFromGoal = async (req, res, next) => {
  try {
    const { amount, walletId, note } = req.body;

    if (!amount || Number(amount) <= 0 || !walletId) {
      return res.status(400).json({
        success: false,
        message: 'Nominal penarikan dan dompet tujuan wajib diisi',
      });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Target tabungan tidak ditemukan',
      });
    }

    const numericAmount = Number(amount);
    if (numericAmount > goal.currentAmount) {
      return res.status(400).json({
        success: false,
        message: 'Nominal penarikan melebihi saldo tabungan saat ini',
      });
    }

    const wallet = await Wallet.findOne({
      _id: walletId,
      userId: req.user._id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Dompet tujuan tidak ditemukan',
      });
    }

    // 1. Return to wallet
    await adjustWalletBalance(walletId, numericAmount);

    // 2. Deduct from goal
    goal.currentAmount -= numericAmount;
    if (goal.currentAmount < goal.targetAmount) {
      goal.isCompleted = false;
    }
    await goal.save();

    // 3. Create transaction record
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
      note: note || `Tarik Dana Tabungan: ${goal.name}`,
    });

    res.json({
      success: true,
      message: `Berhasil menarik Rp ${numericAmount.toLocaleString('id-ID')} ke dompet "${wallet.name}"`,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete savings goal
// @route   DELETE /api/v1/goals/:id
// @access  Private
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Target tabungan tidak ditemukan',
      });
    }

    // If there is still funds collected in the goal, inform user
    if (goal.currentAmount > 0) {
      return res.status(400).json({
        success: false,
        message:
          'Target tabungan masih memiliki saldo terkumpul. Tarik dana terlebih dahulu ke dompet sebelum menghapus.',
      });
    }

    await goal.deleteOne();

    res.json({
      success: true,
      message: 'Target tabungan berhasil dihapus',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  depositToGoal,
  withdrawFromGoal,
  deleteGoal,
};
