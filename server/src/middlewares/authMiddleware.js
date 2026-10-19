const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Pengguna tidak ditemukan atau sesi telah berakhir',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth verification error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Token otorisasi tidak valid atau telah kedaluwarsa',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak: Tidak ada token otorisasi',
    });
  }
};

module.exports = { protect };
