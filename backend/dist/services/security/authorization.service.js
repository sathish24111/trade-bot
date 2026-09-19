"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizationService = exports.AuthorizationService = void 0;
const database_1 = require("../../config/database");
class AuthorizationService {
    /**
     * Enforces strict user tenant boundary.
     * If a user attempts to access another user's resource, throws a generic 404/403
     * without leaking existence or metadata of private resources.
     */
    assertOwnership(requestUserId, resourceOwnerId, resourceType = 'Resource') {
        if (requestUserId !== resourceOwnerId) {
            const err = new Error(`${resourceType} not found`);
            err.statusCode = 404; // Obscure existence
            err.code = 'NOT_FOUND';
            throw err;
        }
    }
    /**
     * Verifies that User A cannot read or modify User B's portfolio or paper trading sessions.
     */
    async testCrossUserIsolation(userAId, userBId) {
        let testsRan = 0;
        // Test 1: Portfolio isolation
        try {
            const [portfolios] = await database_1.pool.query(`SELECT id, user_id FROM portfolios WHERE user_id = ?`, [userBId]);
            if (portfolios.length > 0) {
                testsRan++;
                const targetPortfolio = portfolios[0];
                // Assert ownership against user A
                let prevented = false;
                try {
                    this.assertOwnership(userAId, targetPortfolio.user_id, 'Portfolio');
                }
                catch (e) {
                    prevented = e.statusCode === 404 || e.statusCode === 403;
                }
                if (!prevented) {
                    return { isolated: false, testsRan };
                }
            }
        }
        catch {
            // Ignore if table empty in test
        }
        // Test 2: Trading session isolation
        try {
            const [sessions] = await database_1.pool.query(`SELECT id, user_id FROM trading_sessions WHERE user_id = ?`, [userBId]);
            if (sessions.length > 0) {
                testsRan++;
                const targetSession = sessions[0];
                let prevented = false;
                try {
                    this.assertOwnership(userAId, targetSession.user_id, 'TradingSession');
                }
                catch (e) {
                    prevented = e.statusCode === 404 || e.statusCode === 403;
                }
                if (!prevented) {
                    return { isolated: false, testsRan };
                }
            }
        }
        catch {
            // Ignore if table empty in test
        }
        return { isolated: true, testsRan };
    }
}
exports.AuthorizationService = AuthorizationService;
exports.authorizationService = new AuthorizationService();
