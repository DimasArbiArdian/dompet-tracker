const RecurringBill = require('../models/RecurringBill');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

// Helper to determine whether two dates are in the same month & year
const isSameMonth = (d1, d2) => {
  if (!d1 || !d2) return false;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
};

// @desc    Get all recurring bills with status and summary
// @route   GET /api/v1/recurring
// @access  Private
const getRecurringBills = async (req, res, next) => {
  try {
    const { status, type } = req.query;
    const query = { userId: req.user._id };

    if (type && ['EXPENSE', 'INCOME'].includes(type.toUpperCase())) {
      query.type = type.toUpperCase();
    }

    if (status === 'ACTIVE') {
      query.isActive = true;
    } else if (status === 'INACTIVE') {
      query.isActive = false;
    }

    const bills = await RecurringBill.find(query)
      .populate('walletId', 'name type color balance')
      .populate('categoryId', 'name icon color type')
      .sort({ dueDay: 1, name: 1 });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const currentDay = now.getDate();

    let totalMonthlyCommitment = 0;
    let paidThisMonthAmount = 0;
    let pendingThisMonthAmount = 0;
    let dueSoonCount = 0;
    let overdueCount = 0;

    const enriched = bills.map((b) => {
      // Calculate normalized monthly amount
      let monthlyEquivalent = b.amount;
      if (b.frequency === 'WEEKLY') {
        monthlyEquivalent = b.amount * 4.33;
      } else if (b.frequency === 'YEARLY') {
        monthlyEquivalent = b.amount / 12;
      }

      if (b.isActive && b.type === 'EXPENSE') {
        totalMonthlyCommitment += monthlyEquivalent;
      }

      // Check if paid in current calendar month
      const isPaidThisMonth = isSameMonth(b.lastExecutedAt, now);

      // Determine next due date
      let nextDueDate;
      if (b.frequency === 'MONTHLY') {
        const targetDay = Math.min(b.dueDay, 28); // Safe day of month
        if (isPaidThisMonth) {
          // Next is next month
          nextDueDate = new Date(currentYear, currentMonth + 1, targetDay);
        } else {
          nextDueDate = new Date(currentYear, currentMonth, targetDay);
        }
      } else {
        // Fallback or custom
        nextDueDate = new Date(currentYear, currentMonth, Math.min(b.dueDay, 28));
      }

      // Status calculation
      let billStatus = 'PENDING';
      let daysRemaining = Math.ceil(
        (nextDueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (!b.isActive) {
        billStatus = 'PAUSED';
      } else if (isPaidThisMonth) {
        billStatus = 'PAID';
        if (b.type === 'EXPENSE') paidThisMonthAmount += b.amount;
      } else {
        if (b.type === 'EXPENSE') pendingThisMonthAmount += b.amount;

        if (currentDay > b.dueDay) {
          billStatus = 'OVERDUE';
          overdueCount++;
        } else if (b.dueDay - currentDay <= 3) {
          billStatus = 'DUE_SOON';
          dueSoonCount++;
        } else {
          billStatus = 'UPCOMING';
        }
      }

      return {
        _id: b._id,
        name: b.name,
        amount: b.amount,
        type: b.type,
        frequency: b.frequency,
        dueDay: b.dueDay,
        startDate: b.startDate,
        walletId: b.walletId,
        categoryId: b.categoryId,
        color: b.color || '#359FA0',
        notes: b.notes,
        isActive: b.isActive,
        lastExecutedAt: b.lastExecutedAt,
        monthlyEquivalent: Math.round(monthlyEquivalent),
        nextDueDate,
        daysRemaining,
        billStatus,
        isPaidThisMonth,
        createdAt: b.createdAt,
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      totalMonthlyCommitment: Math.round(totalMonthlyCommitment),
      paidThisMonthAmount: Math.round(paidThisMonthAmount),
      pendingThisMonthAmount: Math.round(pendingThisMonthAmount),
      dueSoonCount,
      overdueCount,
      activeCount: enriched.filter((item) => item.isActive).length,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a recurring bill
// @route   POST /api/v1/recurring
// @access  Private
const createRecurringBill = async (req, res, next) => {
  try {
    const {
      name,
      amount,
      type,
      frequency,
      dueDay,
      startDate,
      walletId,
      categoryId,
      color,
      notes,
    } = req.body;

    if (!name || !amount || !walletId || !categoryId || !dueDay) {
      return res.status(400).json({
        success: false,
        message: 'Mohon lengkapi nama, nominal, tanggal tempo, dompet, dan kategori',
      });
    }

    const bill = await RecurringBill.create({
      userId: req.user._id,
      name,
      amount: Number(amount),
      type: type || 'EXPENSE',
      frequency: frequency || 'MONTHLY',
      dueDay: Number(dueDay),
      startDate: startDate ? new Date(startDate) : new Date(),
      walletId,
      categoryId,
      color: color || '#359FA0',
      notes: notes || '',
      isActive: true,
    });

    const populated = await RecurringBill.findById(bill._id)
      .populate('walletId', 'name type color')
      .populate('categoryId', 'name icon color');

    res.status(201).json({
      success: true,
      message: 'Tagihan rutin berhasil dibuat',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a recurring bill
// @route   PUT /api/v1/recurring/:id
// @access  Private
const updateRecurringBill = async (req, res, next) => {
  try {
    let bill = await RecurringBill.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Tagihan rutin tidak ditemukan',
      });
    }

    const updatable = [
      'name',
      'amount',
      'type',
      'frequency',
      'dueDay',
      'startDate',
      'walletId',
      'categoryId',
      'color',
      'notes',
      'isActive',
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        bill[field] = req.body[field];
      }
    });

    await bill.save();

    const populated = await RecurringBill.findById(bill._id)
      .populate('walletId', 'name type color')
      .populate('categoryId', 'name icon color');

    res.json({
      success: true,
      message: 'Tagihan rutin berhasil diperbarui',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a recurring bill
// @route   DELETE /api/v1/recurring/:id
// @access  Private
const deleteRecurringBill = async (req, res, next) => {
  try {
    const bill = await RecurringBill.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Tagihan rutin tidak ditemukan',
      });
    }

    res.json({
      success: true,
      message: 'Tagihan rutin berhasil dihapus',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Execute 1-click payment for a recurring bill
// @route   POST /api/v1/recurring/:id/pay
// @access  Private
const payRecurringBill = async (req, res, next) => {
  try {
    const bill = await RecurringBill.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Tagihan rutin tidak ditemukan',
      });
    }

    const { walletId, note, date } = req.body;
    const targetWalletId = walletId || bill.walletId;

    const wallet = await Wallet.findOne({
      _id: targetWalletId,
      userId: req.user._id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Dompet pembayaran tidak ditemukan',
      });
    }

    const txDate = date ? new Date(date) : new Date();
    const txNote = note
      ? `[Tagihan Rutin] ${bill.name} - ${note}`
      : `[Tagihan Rutin] ${bill.name}`;

    // Create the actual transaction
    const transaction = await Transaction.create({
      userId: req.user._id,
      walletId: targetWalletId,
      categoryId: bill.categoryId,
      type: bill.type,
      amount: bill.amount,
      date: txDate,
      note: txNote,
    });

    // Adjust wallet balance atomically
    const balanceDelta = bill.type === 'EXPENSE' ? -bill.amount : bill.amount;
    await Wallet.findByIdAndUpdate(targetWalletId, {
      $inc: { balance: balanceDelta },
    });

    // Mark lastExecutedAt on recurring bill
    bill.lastExecutedAt = txDate;
    await bill.save();

    res.json({
      success: true,
      message: `Tagihan "${bill.name}" berhasil dibayar sebesar Rp ${bill.amount.toLocaleString('id-ID')}`,
      transaction,
      bill,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get calendar view events for recurring bills
// @route   GET /api/v1/recurring/calendar
// @access  Private
const getCalendarEvents = async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1; // 1-indexed (1-12)
    const year = parseInt(req.query.year) || now.getFullYear();

    const bills = await RecurringBill.find({
      userId: req.user._id,
      isActive: true,
    })
      .populate('walletId', 'name color')
      .populate('categoryId', 'name icon color');

    const daysInMonth = new Date(year, month, 0).getDate();
    const calendarDays = [];

    let totalMonthEstimate = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month - 1, day);
      const dayBills = [];

      bills.forEach((b) => {
        let matchesDay = false;

        if (b.frequency === 'MONTHLY') {
          // If dueDay matches or if month has fewer days and dueDay is capped
          const cappedDueDay = Math.min(b.dueDay, daysInMonth);
          if (day === cappedDueDay) matchesDay = true;
        } else if (b.frequency === 'WEEKLY') {
          // 1 (Sun) to 7 (Sat)
          const dayOfWeek = dayDate.getDay() + 1;
          if (dayOfWeek === b.dueDay) matchesDay = true;
        }

        if (matchesDay) {
          const isPaid = isSameMonth(b.lastExecutedAt, dayDate);
          dayBills.push({
            _id: b._id,
            name: b.name,
            amount: b.amount,
            type: b.type,
            color: b.color || '#359FA0',
            isPaid,
            walletName: b.walletId?.name,
            categoryName: b.categoryId?.name,
          });

          if (b.type === 'EXPENSE') {
            totalMonthEstimate += b.amount;
          }
        }
      });

      calendarDays.push({
        day,
        dateString: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        dayOfWeek: dayDate.getDay(), // 0 = Sun, 1 = Mon ...
        bills: dayBills,
        totalDayAmount: dayBills.reduce((acc, curr) => acc + curr.amount, 0),
      });
    }

    res.json({
      success: true,
      month,
      year,
      daysInMonth,
      totalMonthEstimate,
      days: calendarDays,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecurringBills,
  createRecurringBill,
  updateRecurringBill,
  deleteRecurringBill,
  payRecurringBill,
  getCalendarEvents,
};
