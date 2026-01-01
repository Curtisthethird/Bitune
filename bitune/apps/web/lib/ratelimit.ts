export class RateLimiter {
    private requests: Map<string, number[]>;
    private limit: number;
    private window: number;

    constructor(limit: number, windowSeconds: number) {
        this.requests = new Map();
        this.limit = limit;
        this.window = windowSeconds * 1000;
    }

    check(key: string): boolean {
        const now = Date.now();
        const timestamps = this.requests.get(key) || [];

        // Filter out old timestamps
        const windowStart = now - this.window;
        const recent = timestamps.filter(t => t > windowStart);

        if (recent.length >= this.limit) {
            return false;
        }

        recent.push(now);
        this.requests.set(key, recent);
        return true;
    }
}

// Global limiters
// 5 uploads per hour per user
export const uploadLimiter = new RateLimiter(5, 3600);

// 10 profile updates per hour per user
export const profileLimiter = new RateLimiter(10, 3600); 
