const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

// @desc    Get all budgets with current actual spent & progress percentage
// @route   GET /api/v1/budgets
// @access  Private
const getBudgets = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // Get budgets for this month
    const budgets = await Budget.find({
      userId: req.user._id,
      month,
      year,
    }).populate('categoryId', 'name type color icon');

    // Aggregate actual spent for this month per category
    const spendingAgg = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user._id),
          date: { $gte: startDate, $lte: endDate },
          type: 'EXPENSE',
          categoryId: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$categoryId',
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    const spendingMap = {};
    spendingAgg.forEach((s) => {
      spendingMap[s._id.toString()] = s.totalSpent;
    });

    const enrichedBudgets = budgets.map((b) => {
      const catId = b.categoryId?._id ? b.categoryId._id.toString() : b.categoryId?.toString();
      const spent = spendingMap[catId] || 0;
      const remaining = Math.max(0, b.amountLimit - spent);
      const percentage = b.amountLimit > 0 ? Math.round((spent / b.amountLimit) * 100) : 0;

      let status = 'SAFE'; // < 75%
      let statusColor = '#8AD6D1'; // Soft Mint
      if (percentage >= 90) {
        status = 'DANGER'; // >= 90%
        statusColor = '#FF8C52'; // Coral
      } else if (percentage >= 75) {
        status = 'WARNING'; // 75% - 89%
        statusColor = '#359FA0'; // Deep Teal
      }

      return {
        _id: b._id,
        categoryId: b.categoryId,
        amountLimit: b.amountLimit,
        spent,
        remaining,
        percentage,
        month: b.month,
        year: b.year,
        alertThreshold: b.alertThreshold || 80,
        status,
        statusColor,
      };
    });

    const totalBudgetLimit = enrichedBudgets.reduce((sum, b) => sum + b.amountLimit, 0);
    const totalBudgetSpent = enrichedBudgets.reduce((sum, b) => sum + b.spent, 0);

    res.json({
      success: true,
      month,
      year,
      totalLimit: totalBudgetLimit,
      totalSpent: totalBudgetSpent,
      data: enrichedBudgets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update budget limit for a category in a month
// @route   POST /api/v1/budgets
// @access  Private
const upsertBudget = async (req, res, next) => {
  try {
    const { categoryId, amountLimit, month, year, alertThreshold } = req.body;

    if (!categoryId || !amountLimit || !month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Kategori, batas nominal, bulan, dan tahun wajib diisi',
      });
    }

    const numericLimit = Number(amountLimit);
    if (numericLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Batas anggaran harus lebih dari 0',
      });
    }

    const budget = await Budget.findOneAndUpdate(
      {
        userId: req.user._id,
        categoryId,
        month: Number(month),
        year: Number(year),
      },
      {
        userId: req.user._id,
        categoryId,
        amountLimit: numericLimit,
        month: Number(month),
        year: Number(year),
        alertThreshold: alertThreshold ? Number(alertThreshold) : 80,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    ).populate('categoryId', 'name type color icon');

    res.status(200).json({
      success: true,
      message: 'Anggaran berhasil disimpan',
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a budget
// @route   DELETE /api/v1/budgets/:id
// @access  Private
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Anggaran tidak ditemukan',
      });
    }

    await budget.deleteOne();

    res.json({
      success: true,
      message: 'Anggaran berhasil dihapus',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBudgets,
  upsertBudget,
  deleteBudget,
};
