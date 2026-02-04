const categoryRepo = require('../repositories/categoryRepository');
const { v4: uuidv4 } = require('uuid');

exports.getAll = async (req, res) => {
    const categories = await categoryRepo.getAll();
    res.render('categories/list', { categories });
};

exports.handleCreate = async (req, res) => {
    const { name, description } = req.body;
    const newCat = {
        categoryId: uuidv4(),
        name,
        description
    };
    await categoryRepo.create(newCat);
    res.redirect('/categories');
};

exports.handleDelete = async (req, res) => {
    await categoryRepo.delete(req.params.id);
    res.redirect('/categories');
};