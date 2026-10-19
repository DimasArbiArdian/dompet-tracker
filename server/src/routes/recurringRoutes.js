const express = require('express');
const {
  getRecurringBills,
  createRecurringBill,
  updateRecurringBill,
  deleteRecurringBill,
  payRecurringBill,
  getCalendarEvents,
} = require('../controllers/recurringController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getRecurringBills)
  .post(createRecurringBill);

router.get('/calendar', getCalendarEvents);

router.route('/:id')
  .put(updateRecurringBill)
  .delete(deleteRecurringBill);

router.post('/:id/pay', payRecurringBill);

module.exports = router;
