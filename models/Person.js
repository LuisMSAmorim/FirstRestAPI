const Sequelize = require('sequelize')
const connection = require('../database/database')

const Person = connection.define('person', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    age: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    createdAt:{
        type: Sequelize.DATE,
        allowNull: false,
        default: Date.now()
    },
    updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
    }
})

module.exports = Person