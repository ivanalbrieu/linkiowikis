// models/DeletedRevision.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Assuming this is correct path
const Revision = require('./Revision'); // Make sure the path to Revision model is correct

// Assuming the structure is similar to Revision but with an additional field for deleted_at
const DeletedRevisionAttributes = Object.assign({}, Revision.rawAttributes, {
    deleted_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});
delete DeletedRevisionAttributes.createdAt; // Assuming these fields are not in your deleted_revisions table
delete DeletedRevisionAttributes.updatedAt;

const DeletedRevision = sequelize.define('DeletedRevision', DeletedRevisionAttributes, {
    tableName: 'deleted_revisions',
    timestamps: false // Prevent Sequelize from automatically adding timestamps
});

module.exports = DeletedRevision;
