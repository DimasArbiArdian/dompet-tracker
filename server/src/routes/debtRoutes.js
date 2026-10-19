const express = require('express');
const router = express.Router();
const {
  getDebts,
  createDebt,
  updateDebt,
  recordPayment,
  deleteDebt,
} = require('../controllers/debtController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .get(getDebts)
  .post(createDebt);

router.route('/:id')
  .put(updateDebt)
  .delete(deleteDebt);

router.post('/:id/pay', recordPayment);

module.exports = router;
