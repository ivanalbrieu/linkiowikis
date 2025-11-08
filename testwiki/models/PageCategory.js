// models/PageCategory.js
const Page = require('./Page');
const Category = require('./Category');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Adjust the path as needed

// Define the PageCategory model
const PageCategory = sequelize.define('PageCategory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      page_id: { // Changed to lowercase underscored
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'pages',
          key: 'id',
        }
      },
      category_id: { // Changed to lowercase underscored
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id',
        }
      },
    }, {
        tableName: 'page_categories',
        timestamps: false, // Disable timestamps
        underscored: true,
      });

// Define associations between Page and PageCategory
Page.belongsToMany(Category, { through: 'PageCategory', foreignKey: 'page_id', otherKey: 'category_id' });
Category.belongsToMany(Page, { through: 'PageCategory', foreignKey: 'category_id', otherKey: 'page_id' });

module.exports = PageCategory;

