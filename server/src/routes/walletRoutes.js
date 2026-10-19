const express = require('express');
const router = express.Router();
const {
  getWallets,
  createWallet,
  updateWallet,
  deleteWallet,
} = require('../controllers/walletController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .get(getWallets)
  .post(createWallet);

router.route('/:id')
  .put(updateWallet)
  .delete(deleteWallet);

module.exports = router;
