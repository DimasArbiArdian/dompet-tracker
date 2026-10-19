const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
  .get(getCategories)
  .post(createCategory);

router.route('/:id')
  .delete(deleteCategory);

module.exports = router;
