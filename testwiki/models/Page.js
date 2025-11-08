// models/Page.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Revision = require('./Revision'); // Import the Revision model

const Page = sequelize.define('Page', {
  page_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: DataTypes.STRING,
  content: DataTypes.TEXT('long'),
  edited_by: {
    type: DataTypes.STRING,
    allowNull: true, // or false, depending on your requirements
  },
  current_revision_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Assuming it can be null if no revisions have been made yet
    references: {
      model: 'revisions', // Name of the table, ensure it matches your setup
      key: 'revision_id' // Primary key of the referenced table, adjust if necessary
    }
  }
  // Include other fields as needed...
}, {
  tableName: 'pages',
  timestamps: false,
  underscored: true,
});

// Add a beforeFind hook to include the latest revision's content in the query result
Page.addHook('beforeFind', async (options) => {
  if (options.include) {
    const revisionIncludeIndex = options.include.findIndex(include => include.model === Revision);
    if (revisionIncludeIndex !== -1) {
      options.include[revisionIncludeIndex].attributes.push('content');
      options.include[revisionIncludeIndex].where = { id: sequelize.col('Page.current_revision_id') };
    }
  }
});
  
module.exports = Page;