"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getMe = getMe;
const zod_1 = require("zod");
const auth_service_1 = require("../services/auth.service");
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    mobile: zod_1.z.string().optional().default(''),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters')
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required')
});
async function register(req, res, next) {
    try {
        const data = registerSchema.parse(req.body);
        const result = await auth_service_1.authService.register(data.name, data.email, data.mobile, data.password);
        res.status(201).json({
            success: true,
            token: result.token,
            user: result.user,
            mode: 'DEMO MODE'
        });
    }
    catch (err) {
        next(err);
    }
}
async function login(req, res, next) {
    try {
        const data = loginSchema.parse(req.body);
        const result = await auth_service_1.authService.login(data.email, data.password);
        res.json({
            success: true,
            token: result.token,
            user: result.user,
            mode: 'DEMO MODE'
        });
    }
    catch (err) {
        next(err);
    }
}
async function getMe(req, res, next) {
    try {
        const user = await auth_service_1.authService.getCurrentUser(req.user.userId);
        res.json({
            success: true,
            user,
            mode: 'DEMO MODE'
        });
    }
    catch (err) {
        next(err);
    }
}
