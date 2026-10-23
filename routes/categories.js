const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Page = require('../models/Page');

// Create a new category
router.post('/', async (req, res) => {
    const { name, parentCategoryId } = req.body;
    try {
        const newCategory = await Category.create({ name, parentCategoryId });
        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).send('Internal Server Error');
    }
});

// List all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.json(categories);
    } catch (error) {
        console.error('Error retrieving categories:', error);
        res.status(500).send('Internal Server Error');
    }
});

// List pages within a category
router.get('/:categoryId/pages', async (req, res) => {
    const { categoryId } = req.params;
    try {
        const pages = await Page.findAll({
            where: { categoryId }
        });
        res.json(pages);
    } catch (error) {
        console.error('Error retrieving pages for category:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
