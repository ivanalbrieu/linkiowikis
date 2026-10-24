// pages.js
const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const Category = require('../models/Category');
const PageCategory = require('../models/PageCategory');
const DeletedPage = require('../models/DeletedPage');
const { renderMarkdown } = require('../utils/markdown-wiki');

// Function to check if the title is one of the excluded routes
const isExcludedRoute = (title) => {
    const excludedRoutes = [
        'login',
        'register',
        'account',
        'user',
        "categories", 
        'themedesigner',
        'settings',
        'statistics',
        'updatedb', 
        'resetrequest',
        'resettoken',
        'contributions',
        'logs', 
        'version',
        'analytics',
    ];
    return excludedRoutes.includes(title.toLowerCase());
};

// Function to check if title needs capitalization redirection
const needsCapitalizationRedirection = (title) => {
    // Ensure title's first letter is lowercase, it's not an excluded route, and it's more than a single character
    return title[0] === title[0].toLowerCase() && !isExcludedRoute(title) && title.length > 1;
};

// Route to render a page
router.get('/:title', async (req, res, next) => {
    const titleParam = decodeURIComponent(req.params.title.replace(/_/g, ' '));
    const categories = await Category.findAll();

    if (isExcludedRoute(titleParam.toLowerCase())) {
        console.log(`Special route accessed: ${titleParam}`);
        return next('route');
    }

    // Check if the first character is a lowercase letter
    if (/^[a-z]/.test(titleParam)) {
        const capitalizedTitle = titleParam.charAt(0).toUpperCase() + titleParam.slice(1);
        return res.redirect(`/wiki/${encodeURIComponent(capitalizedTitle.replace(/\s/g, '_'))}`);
    }

    try {
        let page = await Page.findOne({
            where: { title: titleParam },
            include: [{
                model: Category,
                as: 'Categories', // Adjust if you've used a different alias
                through: { attributes: [] } // Exclude attributes from the join table if not needed
            }]
        });

        // Check if the page exists in the deleted_pages table
        const deletedPage = await DeletedPage.findOne({
            where: { title: titleParam }
        });

        let previouslyDeletedNotice = ""; // Initialize the notice as an empty string

        if (deletedPage) {
            const encodedTitle = encodeURIComponent(titleParam.replace(/\s/g, '_'));
            const dateStr = deletedPage.deleted_at ? new Date(deletedPage.deleted_at).toLocaleDateString() : '';
            previouslyDeletedNotice = `
                <div class="alert alert-danger flex items-center justify-between flex-wrap gap-2 mb-4" role="alert">
                    <span><strong>Notice:</strong> This page was previously deleted${dateStr ? ' on ' + dateStr : ''}.</span>
                    <a href="/wiki/${encodedTitle}/restore" class="btn btn-primary btn-flat text-xs px-2.5 py-1 text-black font-medium inline-flex items-center gap-1.5 no-underline">
                        <i class="fa-solid fa-rotate-left"></i> View deleted history & restore
                    </a>
                </div>`;
        }

        let htmlContent = '';

        // Check for redirect in the page content
        if (page && page.content.startsWith("#REDIRECT")) {
            const redirectMatch = page.content.match(/^#REDIRECT \[\[(.*?)\]\]$/i);

            if (redirectMatch) {
                const targetTitle = redirectMatch[1].trim();
                const targetPage = await Page.findOne({ where: { title: targetTitle } });

                if (!targetPage) {
                    // If the target page does not exist, render the current page with a notice
                    page.content =
                    `<div class="redirect-notice">
                        <i class="fa-solid fa-arrows-turn-right"></i> <a class="text-danger" href="/wiki/${encodeURIComponent(targetTitle)}">${targetTitle}</a>
                    </div>`;
                } else if (req.query.redirect === 'no') {
                    // If ?redirect=no is specified, show the redirect notice with a blue link
                    page.content =
                    `<div class="redirect-notice">
                        <i class="fa-solid fa-arrows-turn-right"></i> <a class="text-primary" href="/wiki/${encodeURIComponent(targetTitle)}">${targetTitle}</a>
                    </div>`;
                } else {
                    // Perform the redirect if the target page exists and ?redirect=no is not specified
                    return res.redirect(`/wiki/${encodeURIComponent(targetTitle)}?redirect_from=${encodeURIComponent(titleParam)}`);
                }

            }
        }

        // Check for redirect_from query to add notice
        if (req.query.redirect_from) {
            const redirectedFromTitle = decodeURIComponent(req.query.redirect_from).replace(/_/g, ' ');
            htmlContent += `<small class="text-muted">(Redirected from <a href="/wiki/${encodeURIComponent(req.query.redirect_from)}?redirect=no">${redirectedFromTitle}</a>)</small>`;
        }

        // Regular page rendering
        if (page) {
            htmlContent += await renderMarkdown(page.content);
    
            res.render('index', {
                title: page.title,
                page: { ...page.toJSON(), content: htmlContent },
                pageExists: true,
                editMode: false,
                categories: page.Categories.map(category => ({ // Use the categories associated with this page
                    name: category.name,
                    url: `/wiki/category/${encodeURIComponent(category.name.replace(/\s/g, '_'))}`
                }))
            });
        } else {
            // Non-existent page
            res.render('index', {
                title: titleParam,
                pageExists: false,
                page: {
                    title: titleParam,
                    content: previouslyDeletedNotice + "<p class=\"text-gray-700\">This page does not exist. You can create this page by clicking the \"Create\" button.</p>"
                },
                editMode: false
            });
        }
    } catch (error) {
        console.error('Error fetching page:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to process category addition from outside the
router.post('/:title/addCategories', async (req, res) => {
    const decodedTitle = decodeURIComponent(req.params.title.replace(/_/g, ' ')); // Adjust based on your title storage format
    console.log(`Decoded and processed title: ${decodedTitle}`);
    const { categories } = req.body;

    try {
        const page = await Page.findOne({ where: { title: decodedTitle } });
        if (!page) {
            return res.status(404).send('Page not found');
        }

        // Iterate over categories and add them to the page
        for (const categoryName of categories) {
            // Ensure category names are trimmed for consistency
            const trimmedCategoryName = categoryName.trim();
            const [category, created] = await Category.findOrCreate({
                where: { name: trimmedCategoryName }
            });

            // Associate the category with the page
            await page.addCategory(category);
        }

        res.status(200).send('Categories added successfully');
    } catch (error) {
        console.error('Failed to add categories:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
