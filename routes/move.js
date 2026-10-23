// move.js
const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const Revision = require('../models/Revision');
const Category = require('../models/Category');
const { deletePageAndRevisions } = require('./delete');

// Display form to move/rename a page
router.get('/:title/move', async (req, res) => {
    const titleParam = req.params.title.replace(/_/g, ' ');
    try {
        const page = await Page.findOne({ where: { title: titleParam } });
        if (!page) {
            req.flash('error_msg', 'Page not found.');
            return res.redirect('/wiki/');
        }
        res.render('move', { title: titleParam, oldTitle: titleParam, pageExists: !!page });
    } catch (error) {
        console.error('Error displaying move page form:', error);
        req.flash('error_msg', 'Internal Server Error.');
        res.redirect('/wiki/');
    }
});

// Process page move/rename
router.post('/:title/move', async (req, res) => {
    const oldTitle = req.params.title.replace(/_/g, ' ');
    const { newTitle, leaveRedirect, justification } = req.body;
    const editedBy = req.isAuthenticated() ? req.user.username : 'Anonymous';

    if (/^[a-z]/.test(newTitle)) {
        req.flash('error_msg', 'New title must not start with a lowercase letter.');
        return res.redirect(`/wiki/${encodeURIComponent(oldTitle.replace(/\s/g, '_'))}/move`);
    }

    if (newTitle === oldTitle) {
        req.flash('error_msg', 'New title must be different from the old title.');
        return res.redirect(`/wiki/${encodeURIComponent(oldTitle.replace(/\s/g, '_'))}/move`);
    }

    try {
        const oldPage = await Page.findOne({
            where: { title: oldTitle },
            include: [{ model: Category, as: 'Categories' }]
        });

        if (!oldPage) {
            req.flash('error_msg', 'Original page not found.');
            return res.redirect('/wiki/');
        }

        const newTitleExists = await Page.findOne({ where: { title: newTitle } });
        if (newTitleExists) {
            req.flash('error_msg', 'New title already exists. Choose a different title.');
            return res.redirect(`/wiki/${encodeURIComponent(oldTitle.replace(/\s/g, '_'))}/move`);
        }

        // Create a revision for the move operation
        await Revision.create({
            pageId: oldPage.page_id,
            content: oldPage.content,
            editedBy,
            justification: `Moved from ${oldTitle} to ${newTitle}. ${justification}`
        });

        if (leaveRedirect) {
            // If leaving a redirect, create a new page for the new title and redirect from the old title
            await Page.create({
                title: newTitle,
                content: oldPage.content,
                edited_by: editedBy
                // Additional page creation logic here, if necessary
            });

            // Update the old page to be a redirect
            await Page.update(
                { content: `#REDIRECT [[${newTitle}]]` },
                { where: { page_id: oldPage.page_id } }
            );
        } else {
            // If not leaving a redirect, simply update the old page to the new title
            await Page.update(
                { title: newTitle },
                { where: { page_id: oldPage.page_id } }
            );
        }

        req.flash('success_msg', 'Page moved successfully.');
        res.redirect(`/wiki/${encodeURIComponent(newTitle.replace(/\s/g, '_'))}`);
    } catch (error) {
        console.error('Error moving page:', error);
        req.flash('error_msg', 'Error moving page.');
        res.redirect(`/wiki/${encodeURIComponent(oldTitle.replace(/\s/g, '_'))}/move`);
    }
});

module.exports = router;
