"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
        // Fetch live Deriv Demo balance
        const { derivDemoTradingService } = await Promise.resolve().then(() => __importStar(require('./trading/derivDemoTrading.service')));
        let derivInfo = derivDemoTradingService.getAccountInfo();
        if (!derivInfo.connected) {
            derivInfo = await derivDemoTradingService.ensureConnected();
        }
        const isDerivLinked = derivInfo.connected || !!derivInfo.loginId;
        const balance = isDerivLinked && derivInfo.balance > 0 ? derivInfo.balance : parseFloat(user.demo_balance.toString());
        const accountType = isDerivLinked && derivInfo.loginId ? `Deriv Demo (${derivInfo.loginId})` : user.account_type;
        // Sync to DB
        if (isDerivLinked && derivInfo.balance > 0) {
            await database_1.pool.query('UPDATE users SET demo_balance = ? WHERE id = ?', [balance, user.id]);
        }
        return {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                demoBalance: balance,
                accountType: accountType,
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
        // Check if Deriv Demo account is linked
        const { derivDemoTradingService } = await Promise.resolve().then(() => __importStar(require('./trading/derivDemoTrading.service')));
        let derivInfo = derivDemoTradingService.getAccountInfo();
        if (!derivInfo.connected) {
            derivInfo = await derivDemoTradingService.ensureConnected();
        }
        const isDerivLinked = derivInfo.connected || !!derivInfo.loginId;
        const balance = isDerivLinked && derivInfo.balance > 0 ? derivInfo.balance : parseFloat(user.demo_balance.toString());
        const accountType = isDerivLinked && derivInfo.loginId ? `Deriv Demo (${derivInfo.loginId})` : user.account_type;
        // Sync to DB
        if (isDerivLinked && derivInfo.balance > 0) {
            await database_1.pool.query('UPDATE users SET demo_balance = ? WHERE id = ?', [balance, user.id]);
        }
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            demoBalance: balance,
            accountType: accountType,
            isDemoMode: true
        };
    }
    generateToken(userId, email) {
        return jsonwebtoken_1.default.sign({ userId, email }, env_1.env.JWT_SECRET, { expiresIn: '7d' });
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
