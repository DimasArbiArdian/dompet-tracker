const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const Debt = require('../models/Debt');
const Goal = require('../models/Goal');
const Budget = require('../models/Budget');

// Helper to get month start and end dates
const getMonthDateRange = (month, year) => {
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
  return { startDate, endDate };
};

// @desc    Get summary KPI metrics (Net Worth, Income, Expense, Net Cashflow)
// @route   GET /api/v1/analytics/summary
// @access  Private
const getSummary = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const { startDate, endDate } = getMonthDateRange(month, year);

    // Calculate previous month date range for trends
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }
    const prevRange = getMonthDateRange(prevMonth, prevYear);

    // Current month aggregation
    const currentMonthData = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user._id),
          date: { $gte: startDate, $lte: endDate },
          type: { $in: ['INCOME', 'EXPENSE'] },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Previous month aggregation for comparison
    const prevMonthData = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user._id),
          date: { $gte: prevRange.startDate, $lte: prevRange.endDate },
          type: { $in: ['INCOME', 'EXPENSE'] },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    currentMonthData.forEach((item) => {
      if (item._id === 'INCOME') totalIncome = item.total;
      if (item._id === 'EXPENSE') totalExpense = item.total;
    });

    let prevIncome = 0;
    let prevExpense = 0;
    prevMonthData.forEach((item) => {
      if (item._id === 'INCOME') prevIncome = item.total;
      if (item._id === 'EXPENSE') prevExpense = item.total;
    });

    // Net worth calculation from active wallets
    const wallets = await Wallet.find({
      userId: req.user._id,
      isArchived: false,
    });
    const netWorth = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

    const netCashflow = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

    // Percent changes
    const incomeChange =
      prevIncome > 0 ? Math.round(((totalIncome - prevIncome) / prevIncome) * 100) : 0;
    const expenseChange =
      prevExpense > 0 ? Math.round(((totalExpense - prevExpense) / prevExpense) * 100) : 0;

    res.json({
      success: true,
      data: {
        month,
        year,
        netWorth,
        totalIncome,
        totalExpense,
        netCashflow,
        savingsRate,
        incomeChange,
        expenseChange,
        walletsCount: wallets.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expense breakdown by category for Donut Chart
// @route   GET /api/v1/analytics/by-category
// @access  Private
const getByCategory = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const type = req.query.type || 'EXPENSE';

    const { startDate, endDate } = getMonthDateRange(month, year);

    const breakdown = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user._id),
          date: { $gte: startDate, $lte: endDate },
          type: type.toUpperCase(),
          categoryId: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$categoryId',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $unwind: '$category',
      },
      {
        $project: {
          _id: 1,
          name: '$category.name',
          color: '$category.color',
          icon: '$category.icon',
          totalAmount: 1,
          transactionCount: 1,
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);

    const totalExpenseSum = breakdown.reduce((sum, item) => sum + item.totalAmount, 0);

    const enriched = breakdown.map((item) => ({
      ...item,
      percentage:
        totalExpenseSum > 0 ? Math.round((item.totalAmount / totalExpenseSum) * 100) : 0,
    }));

    res.json({
      success: true,
      data: {
        month,
        year,
        total: totalExpenseSum,
        categories: enriched,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get cashflow trend over days of month or months of year
// @route   GET /api/v1/analytics/cashflow-trend
// @access  Private
const getCashflowTrend = async (req, res, next) => {
  try {
    const now = new Date();
    const period = req.query.period || 'daily'; // 'daily' (current month) or 'monthly' (full year)
    const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    if (period === 'monthly') {
      // 12 months trend for the year
      const yearStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

      const monthlyAgg = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(req.user._id),
            date: { $gte: yearStart, $lte: yearEnd },
            type: { $in: ['INCOME', 'EXPENSE'] },
          },
        },
        {
          $group: {
            _id: {
              month: { $month: '$date' },
              type: '$type',
            },
            total: { $sum: '$amount' },
          },
        },
      ]);

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
      ];

      const trendData = monthNames.map((name, index) => {
        const m = index + 1;
        const inc =
          monthlyAgg.find((d) => d._id.month === m && d._id.type === 'INCOME')?.total || 0;
        const exp =
          monthlyAgg.find((d) => d._id.month === m && d._id.type === 'EXPENSE')?.total || 0;

        return {
          label: name,
          month: m,
          income: inc,
          expense: exp,
          net: inc - exp,
        };
      });

      return res.json({
        success: true,
        period: 'monthly',
        year,
        data: trendData,
      });
    }

    // Default: Daily trend for the selected month
    const { startDate, endDate } = getMonthDateRange(month, year);
    const daysInMonth = new Date(year, month, 0).getDate();

    const dailyAgg = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user._id),
          date: { $gte: startDate, $lte: endDate },
          type: { $in: ['INCOME', 'EXPENSE'] },
        },
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
    ]);

    const dailyData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const inc =
        dailyAgg.find((d) => d._id.day === day && d._id.type === 'INCOME')?.total || 0;
      const exp =
        dailyAgg.find((d) => d._id.day === day && d._id.type === 'EXPENSE')?.total || 0;

      dailyData.push({
        label: `${day}`,
        day,
        income: inc,
        expense: exp,
        net: inc - exp,
      });
    }

    res.json({
      success: true,
      period: 'daily',
      month,
      year,
      data: dailyData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tags aggregation and summary
// @route   GET /api/v1/analytics/tags
// @access  Private
const getTagsSummary = async (req, res, next) => {
  try {
    const tagsAgg = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user._id),
          tags: { $exists: true, $not: { $size: 0 } },
        },
      },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          totalExpense: {
            $sum: { $cond: [{ $eq: ['$type', 'EXPENSE'] }, '$amount', 0] },
          },
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'INCOME'] }, '$amount', 0] },
          },
        },
      },
      { $sort: { count: -1, totalExpense: -1 } },
    ]);

    const formatted = tagsAgg.map((t) => ({
      tag: t._id,
      count: t.count,
      totalExpense: t.totalExpense,
      totalIncome: t.totalIncome,
      net: t.totalIncome - t.totalExpense,
    }));

    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Financial Health Score & Burn Rate Forecast
// @route   GET /api/v1/analytics/health
// @access  Private
const getFinancialHealthScore = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    // 1. Current Month Cashflow
    const { startDate, endDate } = getMonthDateRange(currentMonth, currentYear);
    const currentMonthAgg = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate },
          type: { $in: ['INCOME', 'EXPENSE'] },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    const monthlyIncome = currentMonthAgg.find((d) => d._id === 'INCOME')?.total || 0;
    const monthlyExpense = currentMonthAgg.find((d) => d._id === 'EXPENSE')?.total || 0;

    // 2. Liquid Net Worth
    const wallets = await Wallet.find({ userId });
    const liquidNetWorth = wallets.reduce((acc, w) => acc + (w.balance || 0), 0);

    // 3. Debts
    const debts = await Debt.find({ userId });
    let totalDebtObligation = 0;
    debts.forEach((d) => {
      if (d.type === 'DEBT') {
        totalDebtObligation += Math.max(0, d.totalAmount - d.paidAmount);
      }
    });

    // 4. Savings Ratio (Weight: 25%)
    let savingsScore = 50;
    let savingsRatio = 0;
    if (monthlyIncome > 0) {
      const netSavings = Math.max(0, monthlyIncome - monthlyExpense);
      savingsRatio = Math.round((netSavings / monthlyIncome) * 100);
      if (savingsRatio >= 25) savingsScore = 100;
      else if (savingsRatio >= 20) savingsScore = 90;
      else if (savingsRatio >= 10) savingsScore = 70;
      else if (savingsRatio > 0) savingsScore = 50;
      else savingsScore = 20;
    } else if (monthlyExpense === 0) {
      savingsScore = 80;
    } else {
      savingsScore = 30;
    }

    // 5. Debt Service Ratio (Weight: 25%)
    let debtScore = 100;
    let debtRatio = 0;
    if (totalDebtObligation === 0) {
      debtScore = 100;
      debtRatio = 0;
    } else if (monthlyIncome > 0) {
      debtRatio = Math.round((totalDebtObligation / (monthlyIncome * 6)) * 100);
      if (totalDebtObligation <= monthlyIncome * 0.3) debtScore = 90;
      else if (totalDebtObligation <= monthlyIncome) debtScore = 75;
      else if (totalDebtObligation <= monthlyIncome * 3) debtScore = 50;
      else debtScore = 30;
    } else {
      debtScore = 40;
    }

    // 6. Emergency Fund Coverage (Weight: 25%)
    const benchmarkMonthlyBurn = monthlyExpense > 0 ? monthlyExpense : (monthlyIncome > 0 ? monthlyIncome * 0.7 : 3000000);
    const emergencyFundMonths = Number((liquidNetWorth / benchmarkMonthlyBurn).toFixed(1));
    let emergencyScore = 40;
    if (emergencyFundMonths >= 6) emergencyScore = 100;
    else if (emergencyFundMonths >= 3) emergencyScore = 85;
    else if (emergencyFundMonths >= 1) emergencyScore = 65;
    else if (emergencyFundMonths >= 0.5) emergencyScore = 45;
    else emergencyScore = 20;

    // 7. Cashflow Discipline (Weight: 25%)
    let disciplineScore = 80;
    if (monthlyExpense > monthlyIncome && monthlyIncome > 0) {
      disciplineScore = 35;
    } else if (monthlyIncome > 0) {
      disciplineScore = 90;
    }

    // Overall Score (0 - 100)
    const totalScore = Math.round(
      savingsScore * 0.25 +
      debtScore * 0.25 +
      emergencyScore * 0.25 +
      disciplineScore * 0.25
    );

    let grade = 'B';
    let label = 'Kondisi Finansial Stabil';
    let color = '#359FA0';

    if (totalScore >= 85) {
      grade = 'A+';
      label = 'Finansial Sangat Sehat & Tangguh';
      color = '#10B981';
    } else if (totalScore >= 70) {
      grade = 'B';
      label = 'Kondisi Finansial Stabil';
      color = '#359FA0';
    } else if (totalScore >= 50) {
      grade = 'C';
      label = 'Perlu Perhatian & Efisiensi';
      color = '#FF8C52';
    } else {
      grade = 'D';
      label = 'Rentan Finansial (Waspada)';
      color = '#EF4444';
    }

    // Recommendations
    const recommendations = [];
    if (emergencyFundMonths < 3) {
      recommendations.push({
        type: 'WARNING',
        title: 'Tingkatkan Dana Darurat',
        desc: `Dana darurat Anda saat ini menutupi ${emergencyFundMonths} bulan. Standar perencana keuangan merekomendasikan minimal 3-6 bulan biaya hidup.`,
      });
    }
    if (savingsRatio < 20 && monthlyIncome > 0) {
      recommendations.push({
        type: 'INFO',
        title: 'Optimalkan Rasio Tabungan (Target 20%)',
        desc: `Rasio tabungan Anda saat ini ${savingsRatio}%. Sisihkan minimal 20% penghasilan di awal bulan ke pos Target Tabungan.`,
      });
    }
    if (totalDebtObligation > 0) {
      recommendations.push({
        type: 'NOTICE',
        title: 'Prioritaskan Pelunasan Hutang',
        desc: `Terdapat kewajiban hutang aktif Rp ${totalDebtObligation.toLocaleString('id-ID')}. Pantau jatuh tempo di modul Hutang & Piutang.`,
      });
    }
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'SUCCESS',
        title: 'Pertahankan Performa Finansial Prima',
        desc: 'Arus kas dan struktur simpanan Anda berada di zona sangat sehat. Pertahankan disiplin pencatatan harian!',
      });
    }

    // End-of-Month Forecast (Burn Rate)
    const daysPassed = Math.max(1, currentDay);
    const daysRemaining = Math.max(0, daysInMonth - currentDay);
    const dailyBurnRate = Math.round(monthlyExpense / daysPassed);
    const projectedMonthEndExpense = Math.round(monthlyExpense + (dailyBurnRate * daysRemaining));
    const projectedRemainingBalance = Math.round(monthlyIncome - projectedMonthEndExpense);

    res.json({
      success: true,
      totalScore,
      grade,
      label,
      color,
      metrics: {
        savingsScore,
        savingsRatio,
        debtScore,
        debtRatio,
        totalDebtObligation,
        emergencyScore,
        emergencyFundMonths,
        liquidNetWorth,
        disciplineScore,
      },
      forecast: {
        currentDay,
        daysInMonth,
        daysRemaining,
        dailyBurnRate,
        monthlyIncome,
        currentMonthExpense: monthlyExpense,
        projectedMonthEndExpense,
        projectedRemainingBalance,
        isProjectedDeficit: projectedRemainingBalance < 0,
      },
      recommendations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Executive Monthly Financial Report Data for Printing / PDF
// @route   GET /api/v1/analytics/report
// @access  Private
const getExecutiveReport = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const { startDate, endDate } = getMonthDateRange(month, year);

    // 1. Wallets
    const wallets = await Wallet.find({ userId });
    const totalNetWorth = wallets.reduce((acc, w) => acc + (w.balance || 0), 0);

    // 2. Transactions in Period
    const transactions = await Transaction.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    })
      .populate('walletId', 'name type')
      .populate('categoryId', 'name type color')
      .sort({ date: -1 });

    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach((tx) => {
      if (tx.type === 'INCOME') totalIncome += tx.amount;
      if (tx.type === 'EXPENSE') totalExpense += tx.amount;
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    // 3. Category Breakdown in Period
    const categoryAgg = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startDate, $lte: endDate },
          type: 'EXPENSE',
          categoryId: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$categoryId',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
    ]);

    const categoriesBreakdown = categoryAgg.map((item) => ({
      _id: item._id,
      name: item.category.name,
      color: item.category.color,
      totalAmount: item.totalAmount,
      count: item.count,
      percentage: totalExpense > 0 ? Math.round((item.totalAmount / totalExpense) * 100) : 0,
    }));

    // 4. Goals summary
    const goals = await Goal.find({ userId });

    // 5. Debts summary
    const debts = await Debt.find({ userId });

    res.json({
      success: true,
      period: {
        month,
        year,
        startDate,
        endDate,
      },
      user: {
        name: req.user.name,
        email: req.user.email,
      },
      kpi: {
        totalNetWorth,
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
      },
      wallets,
      categories: categoriesBreakdown,
      goals,
      debts,
      recentTransactions: transactions.slice(0, 15),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getByCategory,
  getCashflowTrend,
  getTagsSummary,
  getFinancialHealthScore,
  getExecutiveReport,
};
