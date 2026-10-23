// delete.js
const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const Revision = require('../models/Revision');
const DeletedPage = require('../models/DeletedPage');
const DeletedRevision = require('../models/DeletedRevision');
const myCache = require('../config/cache'); // Import the cache instance

// Extracted reusable deletion logic
async function deletePageAndRevisions(page) {
    // Move page to DeletedPage before deletion
    await DeletedPage.create({
        ...page.toJSON(),
        deleted_at: new Date()
    });

    // Find and move all revisions to DeletedRevision before deletion
    const revisions = await Revision.findAll({ where: { pageId: page.page_id } });
    await Promise.all(revisions.map(revision => DeletedRevision.create({
        ...revision.toJSON(),
        edited_at: revision.editedAt || revision.edited_at,
        deleted_at: new Date()
    })));

    // Nullify the current_revision_id for the page before deleting the revisions
    await Page.update({ current_revision_id: null }, { where: { page_id: page.page_id } });

    // Delete revisions associated with the page
    await Revision.destroy({ where: { pageId: page.page_id } });

    // Finally, delete the page
    await Page.destroy({ where: { page_id: page.page_id } });
}

// Endpoint to display delete confirmation page
router.get('/:title/delete', async (req, res) => {
    const title = req.params.title.replace(/_/g, ' ');
    res.render('delete', { title });
});

// Endpoint to handle deletion confirmation form submission
router.post('/:title/delete', async (req, res) => {
    const title = req.params.title.replace(/_/g, ' ');
    try {
        const page = await Page.findOne({ where: { title } });
        if (!page) {
            return res.status(404).send('Page not found');
        }
        await deletePageAndRevisions(page);
        
        // Invalidate the cache
        myCache.del('nonRedirectPageCount');

        res.redirect('/wiki/');
    } catch (error) {
        console.error('Failed to delete the page:', error);
        res.status(500).send('Error deleting the page.');
    }
});

// Export router and deletePageAndRevisions function for reuse
module.exports = router;

// Export deletePageAndRevisions separately
module.exports.deletePageAndRevisions = deletePageAndRevisions;