import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { env } from '../config/env';
import { User, UserResponse } from '../models/User';

export class AuthService {
  async register(name: string, email: string, mobile: string, password: string): Promise<{ token: string; user: UserResponse }> {
    const trimmedEmail = email.trim().toLowerCase();

    // Check existing
    const [existing]: any = await pool.query('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    if (existing.length > 0) {
      throw new Error('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result]: any = await pool.query(
      `INSERT INTO users (name, email, mobile, password_hash, demo_balance, account_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name.trim(), trimmedEmail, mobile.trim() || null, passwordHash, 10000.00, 'Demo Account']
    );

    const userId = result.insertId;

    // Create default settings
    await pool.query(
      `INSERT INTO user_settings (user_id, default_strategy, default_risk, default_duration)
       VALUES (?, 'EMA_RSI', 'LOW', 15)`,
      [userId]
    );

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

  async login(email: string, password: string): Promise<{ token: string; user: UserResponse }> {
    const trimmedEmail = email.trim().toLowerCase();

    const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ?', [trimmedEmail]);
    if (rows.length === 0) {
      throw new Error('Invalid email or password.');
    }

    const user: User = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash!);
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

  async getCurrentUser(userId: number): Promise<UserResponse> {
    const [rows]: any = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
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

  private generateToken(userId: number, email: string): string {
    return jwt.sign({ userId, email }, env.JWT_SECRET, { expiresIn: '7d' });
  }
}

export const authService = new AuthService();
