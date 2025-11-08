// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  // In your User model definition
  avatar: {
    type: DataTypes.STRING,
    allowNull: true, // This allows the column to be null if the user does not upload an avatar
  },
  username: {
    type: DataTypes.STRING, 
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  signature: {
    type: DataTypes.TEXT, // TEXT type can store longer strings than STRING
    allowNull: true, // Allow users not to have a custom signature
  }
}, {
  // Specify the table name
  tableName: 'users',
  // Enable timestamps
  timestamps: true,
  // Rename fields according to your database column names
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  // Additional model options as needed
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
},
});

module.exports = User;
