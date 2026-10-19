const Category = require('../models/Category');

// @desc    Get all categories for logged-in user
// @route   GET /api/v1/categories
// @access  Private
const getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    const filter = {
      $or: [{ userId: req.user._id }, { userId: null, isDefault: true }],
    };

    if (type && ['INCOME', 'EXPENSE'].includes(type.toUpperCase())) {
      filter.type = type.toUpperCase();
    }

    const categories = await Category.find(filter).sort({ name: 1 });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a custom category
// @route   POST /api/v1/categories
// @access  Private
const createCategory = async (req, res, next) => {
  try {
    const { name, type, icon, color } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan jenis kategori wajib diisi',
      });
    }

    const category = await Category.create({
      userId: req.user._id,
      name,
      type: type.toUpperCase(),
      icon: icon || 'tag',
      color: color || '#359FA0',
      isDefault: false,
    });

    res.status(201).json({
      success: true,
      message: 'Kategori berhasil dibuat',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete custom category
// @route   DELETE /api/v1/categories/:id
// @access  Private
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori kustom tidak ditemukan atau tidak dapat dihapus',
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Kategori berhasil dihapus',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  deleteCategory,
};
