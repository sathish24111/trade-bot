"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portfolioExposureController = exports.PortfolioExposureController = void 0;
const portfolioExposure_service_1 = require("../services/monitoring/portfolioExposure.service");
class PortfolioExposureController {
    async getOverview(req, res) {
        try {
            const exposure = await portfolioExposure_service_1.portfolioExposureService.calculatePortfolioExposure({
                portfolioId: 'default-portfolio',
                totalEquity: 10000.0,
                cashBalance: 8500.0,
                positions: [
                    {
                        asset: 'BTC/USD',
                        strategy: 'EMA_RSI',
                        direction: 'BUY',
                        amount: 1500.0,
                        unrealizedPnl: 45.0
                    }
                ],
                dailyLoss: 0.0,
                currentDrawdown: 1.2
            });
            return res.json({
                success: true,
                exposure,
                mode: 'PAPER',
                isRealMoney: false,
                brokerConnected: false
            });
        }
        catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
    async getExposure(req, res) {
        return this.getOverview(req, res);
    }
}
exports.PortfolioExposureController = PortfolioExposureController;
exports.portfolioExposureController = new PortfolioExposureController();
