const express = require('express');
const router = express.Router();
const {
  getBudgets,
  upsertBudget,
  deleteBudget,
} = require('../controllers/budgetController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .get(getBudgets)
  .post(upsertBudget);

router.route('/:id')
  .delete(deleteBudget);

module.exports = router;
