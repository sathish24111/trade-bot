"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestMetricsService = exports.RequestMetricsService = void 0;
class RequestMetricsService {
    routeMap = new Map();
    allLatencies = [];
    totalRequests = 0;
    totalErrors = 0;
    MAX_LATENCY_SAMPLES = 5000;
    recordRequest(method, endpoint, statusCode, durationMs) {
        this.totalRequests++;
        if (statusCode >= 400) {
            this.totalErrors++;
        }
        const key = `${method} ${endpoint}`;
        let metric = this.routeMap.get(key);
        if (!metric) {
            metric = {
                endpoint,
                method,
                count: 0,
                errors: 0,
                totalDurationMs: 0,
                latencies: []
            };
            this.routeMap.set(key, metric);
        }
        metric.count++;
        if (statusCode >= 400) {
            metric.errors++;
        }
        metric.totalDurationMs += durationMs;
        metric.latencies.push(durationMs);
        if (metric.latencies.length > 500) {
            metric.latencies.shift();
        }
        this.allLatencies.push(durationMs);
        if (this.allLatencies.length > this.MAX_LATENCY_SAMPLES) {
            this.allLatencies.shift();
        }
    }
    calculatePercentile(latencies, percentile) {
        if (latencies.length === 0)
            return 0;
        const sorted = [...latencies].sort((a, b) => a - b);
        const index = Math.min(Math.floor((percentile / 100) * sorted.length), sorted.length - 1);
        return Math.round(sorted[index] * 100) / 100;
    }
    getMetricsSummary() {
        const avgLatency = this.allLatencies.length > 0
            ? Math.round((this.allLatencies.reduce((a, b) => a + b, 0) / this.allLatencies.length) * 100) / 100
            : 0;
        const routes = Array.from(this.routeMap.values()).map(r => ({
            endpoint: r.endpoint,
            method: r.method,
            count: r.count,
            errors: r.errors,
            avgLatencyMs: Math.round((r.totalDurationMs / (r.count || 1)) * 100) / 100,
            p95Ms: this.calculatePercentile(r.latencies, 95)
        }));
        return {
            totalRequests: this.totalRequests,
            totalErrors: this.totalErrors,
            errorRate: this.totalRequests > 0 ? Math.round((this.totalErrors / this.totalRequests) * 10000) / 100 : 0,
            avgLatencyMs: avgLatency,
            p50Ms: this.calculatePercentile(this.allLatencies, 50),
            p95Ms: this.calculatePercentile(this.allLatencies, 95),
            p99Ms: this.calculatePercentile(this.allLatencies, 99),
            routes
        };
    }
    reset() {
        this.routeMap.clear();
        this.allLatencies = [];
        this.totalRequests = 0;
        this.totalErrors = 0;
    }
}
exports.RequestMetricsService = RequestMetricsService;
exports.requestMetricsService = new RequestMetricsService();
