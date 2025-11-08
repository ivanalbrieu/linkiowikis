// models/DeletedPage.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Assuming this is correct path
const Page = require('./Page'); // Make sure the path to Page model is correct

// Assuming the structure is similar to Page but with an additional field for deleted_at
const DeletedPageAttributes = Object.assign({}, Page.rawAttributes, {
    deleted_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});
delete DeletedPageAttributes.createdAt; // Assuming these fields are not in your deleted_pages table
delete DeletedPageAttributes.updatedAt;

const DeletedPage = sequelize.define('DeletedPage', DeletedPageAttributes, {
    tableName: 'deleted_pages',
    timestamps: false // Prevent Sequelize from automatically adding timestamps
});

module.exports = DeletedPage;
