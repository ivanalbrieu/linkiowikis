// utils/pageExists.js
const Page = require('../models/Page');

async function pageExists(title) {
  const page = await Page.findOne({ where: { title } });
  return !!page; // Converts truthy/falsy to boolean
}

module.exports = pageExists;
