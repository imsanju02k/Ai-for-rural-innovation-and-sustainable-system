/**
 * Circuit Breaker Pattern Implementation
 * 
 * Protects against cascading failures when calling external services (AI models, APIs)
 * by detecting repeated failures and temporarily blocking requests.
 */

export enum CircuitState {
    CLOSED = 'CLOSED', // Normal operation
    OPEN = 'OPEN', // Circuit is open, requests are blocked
    HALF_OPEN = 'HALF_OPEN', // Testing if service has recovered
}

export interface CircuitBreakerOptions {
    failureThreshold: number; // Number of failures before opening circuit
    successThreshold: number; // Number of successes in HALF_OPEN before closing
    timeout: number; // Time in ms before attempting to close circuit
    failureRateThreshold?: number; // Percentage of failures (0-1) to trigger open
    volumeThreshold?: number; // Minimum number of requests before calculating failure rate
}

export interface CircuitBreakerStats {
    state: CircuitState;
    failures: number;
    successes: number;
    totalRequests: number;
    lastFailureTime: number | null;
    lastStateChange: number;
}

/**
 * Circuit Breaker for protecting against cascading failures
 */
export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount: number = 0;
    private successCount: number = 0;
    private totalRequests: number = 0;
    private lastFailureTime: number | null = null;
    private lastStateChange: number = Date.now();
    private nextAttemptTime: number = 0;

    constructor(
        private name: string,
        private options: CircuitBreakerOptions = {
            failureThreshold: 5,
            successThreshold: 2,
            timeout: 60000, // 1 minute
            failureRateThreshold: 0.5, // 50%
            volumeThreshold: 10,
        }
    ) { }

    /**
     * Execute an operation with circuit breaker protection
     */
    async execute<T>(operation: () => Promise<T>): Promise<T> {
        // Check if circuit is open
        if (this.state === CircuitState.OPEN) {
            if (Date.now() < this.nextAttemptTime) {
                throw new CircuitBreakerOpenError(
                    `Circuit breaker "${this.name}" is OPEN. Service unavailable.`
                );
            }
            // Transition to HALF_OPEN to test service
            this.transitionTo(CircuitState.HALF_OPEN);
        }

        this.totalRequests++;

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    /**
     * Handle successful operation
     */
    private onSuccess(): void {
        this.successCount++;

        if (this.state === CircuitState.HALF_OPEN) {
            // Check if we've had enough successes to close the circuit
            if (this.successCount >= this.options.successThreshold) {
                this.transitionTo(CircuitState.CLOSED);
                this.reset();
            }
        } else if (this.state === CircuitState.CLOSED) {
            // Reset failure count on success in CLOSED state
            this.failureCount = 0;
        }
    }

    /**
     * Handle failed operation
     */
    private onFailure(): void {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.state === CircuitState.HALF_OPEN) {
            // Any failure in HALF_OPEN state reopens the circuit
            this.transitionTo(CircuitState.OPEN);
            this.nextAttemptTime = Date.now() + this.options.timeout;
        } else if (this.state === CircuitState.CLOSED) {
            // Check if we should open the circuit
            if (this.shouldOpenCircuit()) {
                this.transitionTo(CircuitState.OPEN);
                this.nextAttemptTime = Date.now() + this.options.timeout;
            }
        }
    }

    /**
     * Determine if circuit should be opened based on failure threshold
     */
    private shouldOpenCircuit(): boolean {
        // Simple threshold check
        if (this.failureCount >= this.options.failureThreshold) {
            return true;
        }

        // Failure rate check (if configured)
        if (
            this.options.failureRateThreshold &&
            this.options.volumeThreshold &&
            this.totalRequests >= this.options.volumeThreshold
        ) {
            const failureRate = this.failureCount / this.totalRequests;
            return failureRate >= this.options.failureRateThreshold;
        }

        return false;
    }

    /**
     * Transition to a new circuit state
     */
    private transitionTo(newState: CircuitState): void {
        const oldState = this.state;
        this.state = newState;
        this.lastStateChange = Date.now();

        console.log(`Circuit breaker "${this.name}" transitioned from ${oldState} to ${newState}`);
    }

    /**
     * Reset circuit breaker counters
     */
    private reset(): void {
        this.failureCount = 0;
        this.successCount = 0;
        this.totalRequests = 0;
        this.lastFailureTime = null;
    }

    /**
     * Get current circuit breaker statistics
     */
    getStats(): CircuitBreakerStats {
        return {
            state: this.state,
            failures: this.failureCount,
            successes: this.successCount,
            totalRequests: this.totalRequests,
            lastFailureTime: this.lastFailureTime,
            lastStateChange: this.lastStateChange,
        };
    }

    /**
     * Manually reset the circuit breaker (for testing or admin operations)
     */
    forceReset(): void {
        this.transitionTo(CircuitState.CLOSED);
        this.reset();
        this.nextAttemptTime = 0;
    }

    /**
     * Get fallback response when circuit is open
     */
    getFallbackResponse<T>(fallback: T): T {
        if (this.state === CircuitState.OPEN) {
            console.warn(`Circuit breaker "${this.name}" is OPEN. Returning fallback response.`);
            return fallback;
        }
        throw new Error('Circuit is not open. No fallback needed.');
    }
}

/**
 * Custom error for circuit breaker open state
 */
export class CircuitBreakerOpenError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CircuitBreakerOpenError';
    }
}

/**
 * Circuit Breaker Manager - Singleton for managing multiple circuit breakers
 */
class CircuitBreakerManager {
    private breakers: Map<string, CircuitBreaker> = new Map();

    /**
     * Get or create a circuit breaker
     */
    getBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
        if (!this.breakers.has(name)) {
            this.breakers.set(name, new CircuitBreaker(name, options));
        }
        return this.breakers.get(name)!;
    }

    /**
     * Get all circuit breaker statistics
     */
    getAllStats(): Record<string, CircuitBreakerStats> {
        const stats: Record<string, CircuitBreakerStats> = {};
        this.breakers.forEach((breaker, name) => {
            stats[name] = breaker.getStats();
        });
        return stats;
    }

    /**
     * Reset all circuit breakers
     */
    resetAll(): void {
        this.breakers.forEach((breaker) => breaker.forceReset());
    }
}

// Export singleton instance
export const circuitBreakerManager = new CircuitBreakerManager();

/**
 * Predefined circuit breakers for AI services
 */

// Bedrock circuit breaker
export const bedrockCircuitBreaker = circuitBreakerManager.getBreaker('bedrock', {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000, // 1 minute
    failureRateThreshold: 0.5,
    volumeThreshold: 10,
});

// Rekognition circuit breaker
export const rekognitionCircuitBreaker = circuitBreakerManager.getBreaker('rekognition', {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000, // 1 minute
    failureRateThreshold: 0.5,
    volumeThreshold: 10,
});

/**
 * Fallback responses for AI services
 */

export const BEDROCK_FALLBACK_RESPONSES = {
    diseaseDetection: {
        diseases: [],
        isHealthy: true,
        generalAdvice:
            'Unable to analyze image at this time. Please try again later or consult with a local agricultural expert.',
    },
    marketPrediction: {
        predictions: [],
        overallTrend: 'stable',
        recommendation:
            'Market prediction service is temporarily unavailable. Please check back later.',
    },
    advisoryChat: {
        response:
            'I apologize, but I am temporarily unable to process your request. Please try again in a few moments, or contact your local agricultural extension office for immediate assistance.',
        recommendations: [],
        sources: [],
        isOutOfScope: false,
    },
    resourceOptimization: {
        irrigation: {
            dailyRequirement: 0,
            unit: 'mm',
            schedule: [],
            reasoning: 'Service temporarily unavailable',
        },
        fertilizer: {
            type: 'N/A',
            quantity: 0,
            unit: 'kg/hectare',
            applicationTiming: 'N/A',
            reasoning: 'Service temporarily unavailable',
        },
        costSavings: {
            waterSavings: 0,
            waterSavingsUnit: 'percent',
            fertilizerSavings: 0,
            fertilizerSavingsUnit: 'percent',
            estimatedCostSavings: 0,
            currency: 'INR',
            period: 'per month',
        },
        additionalRecommendations: [
            'Optimization service is temporarily unavailable. Please try again later.',
        ],
    },
};

export const REKOGNITION_FALLBACK_RESPONSE = {
    labels: [],
    moderationLabels: [],
};
