// editor.js
const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const Category = require('../models/Category');
const moment = require('moment');
const Revision = require('../models/Revision');
const myCache = require('../config/cache');

// Route to handle editing a page or creating a new one
router.get('/:title/edit', async (req, res) => {
    const titleParam = req.params.title.replace(/_/g, ' ');

    try {
        let pageContent = '';
        let categoriesString = '';
        let pageExists = true;

        // Try to find an existing page
        const page = await Page.findOne({
            where: { title: titleParam },
            include: [{
                model: Category,
                as: 'Categories',
                through: { attributes: [] }
            }]
        });

        if (page) {
            // If the page exists, use its content and categories
            if (req.query.oldid) {
                // If an old revision ID is specified, load its content
                const revision = await Revision.findByPk(req.query.oldid);
                if (revision) {
                    pageContent = revision.content;
                } else {
                    return res.status(404).send('Revision not found');
                }
            } else {
                // Load the most recent content
                const latestRevision = await Revision.findOne({
                    where: { pageId: page.page_id },
                    order: [['editedAt', 'DESC']]
                });
                pageContent = latestRevision ? latestRevision.content : page.content;
            }

            // Prepare categories string for the template
            categoriesString = page.Categories.map(category => category.name).join(' ');
        } else {
            // If the page does not exist, prepare for a new page creation
            pageExists = false;
            pageContent = ''; // Default content for a new page
        }

        // Render the editor, passing whether the page exists and other needed data
        res.render('index', {
            title: titleParam,
            page: {
                content: pageContent,
                categoriesString: categoriesString
            },
            categoriesString: categoriesString,
            pageExists: pageExists,
            editMode: true
        });
    } catch (error) {
        console.error('Error fetching page for editing:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to process page creation/updating
router.post('/:title/save', async (req, res) => {
    const titleParam = req.params.title.replace(/_/g, ' ');
    let { content, justification, categories } = req.body;

    const editedBy = req.isAuthenticated() ? req.user.username : 'Anonymous';
    const timestampFormat = 'HH:mm, D MMMM YYYY';
    const timestamp = moment().format(timestampFormat);
    const userSignature = req.isAuthenticated() ? (req.user.signature || `User:${req.user.username}`) : 'Anonymous';
    const signatureWithTimestamp = `${userSignature} ${timestamp}`;

    content = content.replace(/~~~~/g, signatureWithTimestamp);

    try {
        let [page, created] = await Page.findOrCreate({
            where: { title: titleParam },
            defaults: {
                title: titleParam,
                content: content,
                edited_by: editedBy
            }
        });

        if (!created) {
            const latestRevision = await Revision.findOne({
                where: { pageId: page.page_id },
                order: [['editedAt', 'DESC']]
            });

            if (!latestRevision || latestRevision.content !== content) {
                const newRevision = await Revision.create({
                    pageId: page.page_id,
                    content,
                    editedBy: editedBy,
                    justification,
                });
                
                console.log("New revision ID:", newRevision.revisionId); 
                
                await page.update({
                    current_revision_id: newRevision.revisionId,
                    content: content,
                    edited_by: editedBy
                });         
            }
        } else {
            const newRevision = await Revision.create({
                pageId: page.page_id,
                content,
                editedBy: editedBy,
                justification,
            });

            await page.update({
                current_revision_id: newRevision.revisionId
            });
        }

        const categoryNames = categories.split(' ').filter(Boolean);
        const categoryInstances = await Promise.all(categoryNames.map(async (name) => {
            const [category, created] = await Category.findOrCreate({
                where: { name: name.trim() }
            });
            return category;
        }));

        await page.setCategories(categoryInstances.map(cat => cat.id));

        // Invalidate the cache
        myCache.del('nonRedirectPageCount');

        res.redirect(`/wiki/${encodeURIComponent(titleParam)}`);
    } catch (error) {
        console.error('Failed to save the page or handle categories:', error);
        res.status(500).send('Error saving the page or handling categories.');
    }
});

module.exports = router;
