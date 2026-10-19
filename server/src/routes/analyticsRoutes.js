const express = require('express');
const router = express.Router();
const {
  getSummary,
  getByCategory,
  getCashflowTrend,
  getTagsSummary,
  getFinancialHealthScore,
  getExecutiveReport,
} = require('../controllers/analyticsController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/summary', getSummary);
router.get('/by-category', getByCategory);
router.get('/cashflow-trend', getCashflowTrend);
router.get('/tags', getTagsSummary);
router.get('/health', getFinancialHealthScore);
router.get('/report', getExecutiveReport);

module.exports = router;
