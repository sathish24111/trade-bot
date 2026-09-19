"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const env_1 = require("../config/env");
class AuthService {
    async register(name, email, mobile, password) {
        const trimmedEmail = email.trim().toLowerCase();
        // Check existing
        const [existing] = await database_1.pool.query('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
        if (existing.length > 0) {
            throw new Error('An account with this email already exists.');
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const [result] = await database_1.pool.query(`INSERT INTO users (name, email, mobile, password_hash, demo_balance, account_type)
       VALUES (?, ?, ?, ?, ?, ?)`, [name.trim(), trimmedEmail, mobile.trim() || null, passwordHash, 10000.00, 'Demo Account']);
        const userId = result.insertId;
        // Create default settings
        await database_1.pool.query(`INSERT INTO user_settings (user_id, default_strategy, default_risk, default_duration)
       VALUES (?, 'EMA_RSI', 'LOW', 15)`, [userId]);
        const token = this.generateToken(userId, trimmedEmail);
        return {
            token,
            user: {
                id: userId,
                name: name.trim(),
                email: trimmedEmail,
                mobile: mobile.trim() || null,
                demoBalance: 10000.00,
                accountType: 'Demo Account',
                isDemoMode: true
            }
        };
    }
    async login(email, password) {
        const trimmedEmail = email.trim().toLowerCase();
        const [rows] = await database_1.pool.query('SELECT * FROM users WHERE email = ?', [trimmedEmail]);
        if (rows.length === 0) {
            throw new Error('Invalid email or password.');
        }
        const user = rows[0];
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password.');
        }
        const token = this.generateToken(user.id, user.email);
        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                demoBalance: parseFloat(user.demo_balance.toString()),
                accountType: user.account_type,
                isDemoMode: true
            }
        };
    }
    async getCurrentUser(userId) {
        const [rows] = await database_1.pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            throw new Error('User not found.');
        }
        const user = rows[0];
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            demoBalance: parseFloat(user.demo_balance.toString()),
            accountType: user.account_type,
            isDemoMode: true
        };
    }
    generateToken(userId, email) {
        return jsonwebtoken_1.default.sign({ userId, email }, env_1.env.JWT_SECRET, { expiresIn: '7d' });
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
