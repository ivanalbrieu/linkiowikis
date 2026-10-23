const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const NodeCache = require('node-cache');
const myCache = new NodeCache();

router.get('/:title/purge', (req, res) => {
    const title = decodeURIComponent(req.params.title.replace(/_/g, ' '));
    const { oldid, newid } = req.query;
    res.render('purge', { title, oldid, newid });
});

router.post('/:title/purge', async (req, res) => {
    const title = decodeURIComponent(req.params.title.replace(/_/g, ' '));
    const { oldid, newid } = req.query;

    try {
        const pageExists = await Page.findOne({ where: { title: title } });
        if (!pageExists) {
            console.error(`Page not found: ${title}`);
            return res.status(404).send('Page not found.');
        }

        // Construct cache key based on the context: normal page, revision, or comparison
        let cacheKey = `page:${title}`;
        if (oldid) {
            cacheKey += `:revision:${oldid}`;
            if (newid) {
                cacheKey += `:comparison:${newid}`;
            }
        }
        
        // Attempt to delete the cache entry
        const success = myCache.del(cacheKey);
        console.log(success ? `Cache purged for ${cacheKey}` : `No cache entry found for ${cacheKey}`);
        
        // Initialize redirectUrl outside of if-else scope
        let redirectUrl = `/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

        if (oldid && newid) {
            // Redirect to comparison if both oldid and newid are present
            redirectUrl += `/diff?oldid=${oldid}&newid=${newid}`;
        } else if (oldid) {
            // Redirect to revision view if only oldid is present
            redirectUrl += `/diff?oldid=${oldid}`;
        }
        // No else needed for normal page redirect as it's set by default
        
        console.log(`Redirecting to URL: ${redirectUrl}`);
        res.redirect(redirectUrl);
    } catch (error) {
        console.error(`Failed to purge cache for page: ${title}`, error);
        res.status(500).send('Error purging cache.');
    }
});

module.exports = router;
