const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Category = require('../models/Category');
const Wallet = require('../models/Wallet');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Default categories seeding based on PRD colors & finance categories
const defaultCategories = [
  // Expense categories
  { name: 'Makanan & Minuman', type: 'EXPENSE', icon: 'utensils', color: '#FF8C52' }, // Coral
  { name: 'Transportasi', type: 'EXPENSE', icon: 'car', color: '#359FA0' },        // Teal
  { name: 'Belanja Harian', type: 'EXPENSE', icon: 'shopping-bag', color: '#8AD6D1' }, // Mint
  { name: 'Tagihan & Utilitas', type: 'EXPENSE', icon: 'file-text', color: '#112A2B' }, // Deep Slate
  { name: 'Hiburan & Hobi', type: 'EXPENSE', icon: 'film', color: '#FF8C52' },       // Coral
  { name: 'Kesehatan', type: 'EXPENSE', icon: 'activity', color: '#359FA0' },         // Teal
  { name: 'Pendidikan', type: 'EXPENSE', icon: 'book', color: '#8AD6D1' },           // Mint
  { name: 'Lainnya', type: 'EXPENSE', icon: 'more-horizontal', color: '#527072' },

  // Income categories
  { name: 'Gaji Pokok', type: 'INCOME', icon: 'briefcase', color: '#359FA0' },       // Teal
  { name: 'Freelance & Bisnis', type: 'INCOME', icon: 'laptop', color: '#8AD6D1' },   // Mint
  { name: 'Investasi & Dividen', type: 'INCOME', icon: 'trending-up', color: '#359FA0' },
  { name: 'Bonus & Hadiah', type: 'INCOME', icon: 'gift', color: '#FF8C52' },
  { name: 'Pemasukan Lainnya', type: 'INCOME', icon: 'dollar-sign', color: '#527072' },
];

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Mohon isi semua data (Nama, Email, Password)',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal 6 karakter',
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar, silakan login',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      currency: 'IDR',
    });

    // Seed default categories for this new user
    const categoriesToInsert = defaultCategories.map((cat) => ({
      ...cat,
      userId: user._id,
      isDefault: true,
    }));
    await Category.insertMany(categoriesToInsert);

    // Seed default primary wallet "Dompet Tunai" and "Rekening Bank"
    await Wallet.create([
      {
        userId: user._id,
        name: 'Dompet Tunai',
        type: 'CASH',
        balance: 0,
        color: '#8AD6D1',
        icon: 'banknote',
      },
      {
        userId: user._id,
        name: 'Rekening Bank',
        type: 'BANK',
        balance: 0,
        color: '#359FA0',
        icon: 'landmark',
      },
    ]);

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        monthlyCycleStartDay: user.monthlyCycleStartDay,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/v1/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Mohon masukkan email dan password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        monthlyCycleStartDay: user.monthlyCycleStartDay,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        monthlyCycleStartDay: user.monthlyCycleStartDay,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile & preferences
// @route   PUT /api/v1/auth/me
// @access  Private
const updateMe = async (req, res, next) => {
  try {
    const { name, currency, monthlyCycleStartDay } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (currency) user.currency = currency;
    if (monthlyCycleStartDay) user.monthlyCycleStartDay = Number(monthlyCycleStartDay);

    await user.save();

    res.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        monthlyCycleStartDay: user.monthlyCycleStartDay,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateMe,
};
