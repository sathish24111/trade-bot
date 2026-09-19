import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().optional().default(''),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data.name, data.email, data.mobile, data.password);
    res.status(201).json({
      success: true,
      token: result.token,
      user: result.user,
      mode: 'DEMO MODE'
    });
  } catch (err: any) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data.email, data.password);
    res.json({
      success: true,
      token: result.token,
      user: result.user,
      mode: 'DEMO MODE'
    });
  } catch (err: any) {
    next(err);
  }
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await authService.getCurrentUser(req.user!.userId);
    res.json({
      success: true,
      user,
      mode: 'DEMO MODE'
    });
  } catch (err: any) {
    next(err);
  }
}
