const Sequelize = require('sequelize')
const connection = require('../database/database')

const User = connection.define('user', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        default: Date.now()
    },
    updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
    }
})

module.exports = User