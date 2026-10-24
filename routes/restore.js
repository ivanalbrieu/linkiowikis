// routes/restore.js
const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const Revision = require('../models/Revision');
const DeletedPage = require('../models/DeletedPage');
const DeletedRevision = require('../models/DeletedRevision');
const myCache = require('../config/cache');
const { formatDate } = require('../utils/dateHelpers');

// GET /wiki/:title/restore - View deleted page and revisions available for restoration
router.get('/:title/restore', async (req, res) => {
    const title = decodeURIComponent(req.params.title.replace(/_/g, ' '));

    try {
        const deletedPage = await DeletedPage.findOne({
            where: { title },
            order: [['deleted_at', 'DESC']]
        });

        if (!deletedPage) {
            req.flash('error_msg', 'No deleted record found for this page.');
            return res.redirect(`/wiki/${encodeURIComponent(title.replace(/\s/g, '_'))}`);
        }

        // Fetch deleted revisions associated with this page_id
        const deletedRevisions = await DeletedRevision.findAll({
            where: {
                pageId: deletedPage.page_id || deletedPage.pageId
            },
            order: [['revisionId', 'DESC']]
        });

        // Check if an active page with the same title already exists
        const existingLivePage = await Page.findOne({ where: { title } });

        res.render('restore', {
            title,
            deletedPage,
            deletedRevisions,
            existingLivePage: !!existingLivePage,
            formatDate
        });
    } catch (error) {
        console.error('Error fetching deleted page for restore:', error);
        res.status(500).send('Error fetching deleted records.');
    }
});

// POST /wiki/:title/restore - Perform page and revision restoration
router.post('/:title/restore', async (req, res) => {
    const title = decodeURIComponent(req.params.title.replace(/_/g, ' '));
    const { selectedRevisions, restoreAll } = req.body;

    try {
        const deletedPage = await DeletedPage.findOne({
            where: { title },
            order: [['deleted_at', 'DESC']]
        });

        if (!deletedPage) {
            req.flash('error_msg', 'No deleted page found to restore.');
            return res.redirect('/wiki/');
        }

        const pageId = deletedPage.page_id || deletedPage.pageId;

        // Fetch deleted revisions
        const allDeletedRevisions = await DeletedRevision.findAll({
            where: { pageId },
            order: [['revisionId', 'ASC']]
        });

        let revisionsToRestore = [];
        if (restoreAll === 'true' || !selectedRevisions) {
            revisionsToRestore = allDeletedRevisions;
        } else {
            const selectedIds = Array.isArray(selectedRevisions)
                ? selectedRevisions.map(id => parseInt(id, 10))
                : [parseInt(selectedRevisions, 10)];
            revisionsToRestore = allDeletedRevisions.filter(r => selectedIds.includes(r.revisionId));
        }

        if (revisionsToRestore.length === 0 && allDeletedRevisions.length > 0) {
            req.flash('error_msg', 'Please select at least one revision to restore.');
            return res.redirect(`/wiki/${encodeURIComponent(title.replace(/\s/g, '_'))}/restore`);
        }

        // Determine newest revision content and author
        const newestRev = revisionsToRestore[revisionsToRestore.length - 1];
        const contentToRestore = newestRev ? newestRev.content : (deletedPage.content || '');
        const authorToRestore = newestRev ? (newestRev.editedBy || newestRev.edited_by) : (deletedPage.edited_by || 'System');

        // Check if live page already exists (e.g. recreated under same name)
        let livePage = await Page.findOne({ where: { title } });

        if (!livePage) {
            // Re-create the page in live pages table
            livePage = await Page.create({
                title: deletedPage.title,
                content: contentToRestore,
                edited_by: authorToRestore
            });
        }

        // Restore the revisions to live revisions table
        let latestRestoredRevId = null;
        for (const rev of revisionsToRestore) {
            const restoredRevision = await Revision.create({
                pageId: livePage.page_id,
                content: rev.content,
                editedBy: rev.editedBy || rev.edited_by || 'Anonymous',
                justification: rev.justification ? `[Restored] ${rev.justification}` : '[Restored revision]',
                editedAt: rev.editedAt || rev.edited_at || new Date()
            });
            latestRestoredRevId = restoredRevision.revisionId;

            // Remove restored revision from deleted_revisions archive
            await DeletedRevision.destroy({
                where: { revisionId: rev.revisionId }
            });
        }

        // Update current_revision_id on live page
        if (latestRestoredRevId) {
            await Page.update(
                { current_revision_id: latestRestoredRevId, content: contentToRestore },
                { where: { page_id: livePage.page_id } }
            );
        }

        // Check if all revisions for this deleted page were restored
        const remainingRevs = await DeletedRevision.count({ where: { pageId } });
        if (remainingRevs === 0) {
            // Full restore complete, clean up DeletedPage archive record
            await DeletedPage.destroy({ where: { page_id: pageId } });
        }

        // Invalidate nonRedirectPageCount cache
        myCache.del('nonRedirectPageCount');

        req.flash('success_msg', `Page "${title}" successfully restored.`);
        res.redirect(`/wiki/${encodeURIComponent(title.replace(/\s/g, '_'))}`);
    } catch (error) {
        console.error('Failed to restore page:', error);
        req.flash('error_msg', 'Failed to restore page: ' + error.message);
        res.redirect(`/wiki/${encodeURIComponent(title.replace(/\s/g, '_'))}`);
    }
});

module.exports = router;
