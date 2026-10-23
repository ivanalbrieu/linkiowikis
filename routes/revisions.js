// revisions.js
const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const Revision = require('../models/Revision');
const { renderMarkdown } = require('../utils/markdown-wiki');
const { formatDate } = require('../utils/dateHelpers');
const diff = require('diff'); // Correct import of the diff library 
const { Op } = require('sequelize');
const Category = require('../models/Category'); // Adjust the path as necessary to correctly point to your Category model file

// Define model associations here, right after model imports
Page.hasMany(Revision, { foreignKey: 'pageId' });
Revision.belongsTo(Page, { foreignKey: 'pageId', targetKey: 'page_id' });

// Function to fetch page history
router.get('/:title/history', async (req, res) => {
    const title = req.params.title.replace(/_/g, ' ');

    try {
        const page = await Page.findOne({ where: { title } });
        if (!page) {
            return res.status(404).send('Page not found');
        }

        const revisions = await Revision.findAll({
            where: { pageId: page.page_id },
            order: [['editedAt', 'DESC']]
        });

        res.render('history', { 
            title, 
            revisions,
            formatDate, // Ensure formatDate is passed here for use in the template
        });
    } catch (error) {
        console.error('Error fetching revision history:', error);
        res.status(500).send('Error fetching revision history');
    }
});

// Route to display a specific revision and navigation to adjacent revisions
router.get('/:title/diff', async (req, res) => {
    const title = req.params.title.replace(/_/g, ' ');
    const { oldid, newid } = req.query;

    try {
        const oldRevision = await Revision.findByPk(oldid);
        const newRevision = newid ? await Revision.findByPk(newid) : null;
        
        // Ensure oldRevision exists
        if (!oldRevision) {
            return res.status(404).send('Old revision not found');
        }

        // Fetch the page associated with the revision
        const page = await Page.findOne({
            where: { page_id: oldRevision.pageId },
            include: [{
                model: Category,
                as: 'Categories', // Assuming the association alias is 'Categories'
            }]
        });

        // Fetch older revision relative to the oldRevision being viewed
        const olderRevision = await Revision.findOne({
            where: {
                pageId: oldRevision.pageId,
                revisionId: { [Op.lt]: oldRevision.revisionId }
            },
            order: [['revisionId', 'DESC']]
        });

        // Determine the revisionId to compare against when fetching the newerRevision
        // If viewing a comparison (newRevision exists), use newRevision.revisionId
        // Otherwise, fall back to oldRevision.revisionId
        const comparisonRevisionId = newRevision ? newRevision.revisionId : oldRevision.revisionId;

        // Fetch newer revision relative to the comparisonRevisionId
        const newerRevision = await Revision.findOne({
            where: {
                pageId: oldRevision.pageId,
                revisionId: { [Op.gt]: comparisonRevisionId }
            },
            order: [['revisionId', 'ASC']]
        });

        // Render Markdown content to HTML
        const oldHtmlContent = await renderMarkdown(oldRevision.content);

        let newHtmlContent;
        if (newRevision) {
            newHtmlContent = await renderMarkdown(newRevision.content);
        }

        // Perform diff if both revisions are present, otherwise prepare content for single revision display
        let diffResult;
        if (oldRevision && newRevision) {
            // Use the original content for diffing, or the markdown content if you prefer
            diffResult = diff.diffWords(oldRevision.content, newRevision.content);
        }

        // Render the revision page with navigation links
        res.render('revision', {
            title,
            oldRevision: { ...oldRevision.toJSON(), content: oldHtmlContent },
            newRevision: newRevision ? { ...newRevision.toJSON(), content: newHtmlContent } : null,
            olderRevisionId: olderRevision ? olderRevision.revisionId : null,
            newerRevisionId: newerRevision ? newerRevision.revisionId : null,
            diffResult,
            formatDate,
            comparisonMode: !!newRevision,
            pageCategories: page ? page.Categories : [] // Pass the categories to the template
        });
    } catch (error) {
        console.error('Error fetching revisions for comparison:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
