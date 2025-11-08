// models/Category.js
const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Adjust the path as necessary

class Category extends Model {}

Category.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  parent_category_id: { // Changed to lowercase underscored
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  }
}, {
  sequelize,
  modelName: 'Category',
  tableName: 'categories',
  timestamps: false,
  underscored: true, // Ensure Sequelize uses underscores instead of camelCasing
});

module.exports = Category;
