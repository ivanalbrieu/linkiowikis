// models/Revision.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Revision = sequelize.define('Revision', {
  revisionId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'revision_id', // Specifies the name of the field in the database
  },
  pageId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Pages', // Ensure this matches the name of your pages model
      key: 'page_id',
    },
    field: 'page_id',
  },
  content: DataTypes.TEXT('long'),
  editedBy: {
    type: DataTypes.STRING,
    allowNull: true, // Allows null for anonymous edits
    field: 'edited_by', // Maps editedBy in the model to edited_by in the database
  },
  justification: {
    type: DataTypes.TEXT, // Assuming justification is a text field
    allowNull: true, // Allows null if no justification is provided
    field: 'justification', // Maps justification in the model to justification in the database
  },
  editedAt: {
    type: DataTypes.DATE,
    field: 'edited_at', // Specifies the name of the field in the database
    defaultValue: DataTypes.NOW, // Automatically set the value to the current time
  }
}, {
  timestamps: false, // Disable automatic timestamps if your table does not use them
  underscored: true, // Indicates Sequelize to use snake_case for auto-generated fields
});

module.exports = Revision;
