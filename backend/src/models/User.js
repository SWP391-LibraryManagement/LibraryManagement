// models/user.model.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    UserId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    Username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    Email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    PasswordHash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    Phone: {
        type: DataTypes.STRING(20)
    },
    Status: {
        type: DataTypes.ENUM(
            'ACTIVE',
            'INACTIVE',
            'LOCKED'
        ),
        defaultValue: 'ACTIVE'
    },
    EmailVerifiedAt: DataTypes.DATE,
    FailedLoginCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    LockedUntil: DataTypes.DATE,
    LastLoginAt: DataTypes.DATE,
    CreatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    UpdatedAt: DataTypes.DATE
}, {
    tableName: 'Users',
    timestamps: false
});

module.exports = User;