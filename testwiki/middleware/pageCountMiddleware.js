// middleware/pageCountMiddleware.js
const { Op } = require('sequelize');
const Page = require('../models/Page');
const myCache = require('../config/cache');

async function pageCountMiddleware(req, res, next) {
    const pageCountKey = 'nonRedirectPageCount';
    let pageCount = myCache.get(pageCountKey);

    if (!pageCount) {
        try {
            pageCount = await Page.count({
                where: {
                    content: {
                        [Op.notLike]: '%#REDIRECT%'
                    }
                }
            });
            myCache.set(pageCountKey, pageCount, 600); // Cache for 10 minutes
        } catch (error) {
            console.error('Failed to count non-redirect pages:', error);
        }
    }

    res.locals.pagesCount = pageCount;
    next();
}

module.exports = pageCountMiddleware;
