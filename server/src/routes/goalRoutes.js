const express = require('express');
const router = express.Router();
const {
  getGoals,
  createGoal,
  updateGoal,
  depositToGoal,
  withdrawFromGoal,
  deleteGoal,
} = require('../controllers/goalController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .get(getGoals)
  .post(createGoal);

router.route('/:id')
  .put(updateGoal)
  .delete(deleteGoal);

router.post('/:id/deposit', depositToGoal);
router.post('/:id/withdraw', withdrawFromGoal);

module.exports = router;
