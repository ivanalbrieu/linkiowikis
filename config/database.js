const { Sequelize } = require('sequelize');

// Sequelize instance
const sequelize = new Sequelize('linkiowikistestwiki', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false, // Toggle console logging
});

// Test the connection
async function testDatabaseConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testDatabaseConnection();

module.exports = sequelize;
