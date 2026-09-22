// In-Memory Rate Limiter and Account Lockout Protection
// Guards admin authentication against brute-force and credential stuffing attacks

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

class RateLimiter {
  private attempts: Map<string, AttemptRecord> = new Map();

  // Clean up expired entries every 10 minutes
  constructor() {
    if (typeof setInterval !== 'undefined') {
      const timer = setInterval(() => this.cleanup(), 10 * 60 * 1000);
      if (timer.unref) timer.unref();
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (
        (record.lockedUntil && now > record.lockedUntil) ||
        (!record.lockedUntil && now - record.firstAttemptAt > WINDOW_MS)
      ) {
        this.attempts.delete(key);
      }
    }
  }

  public isLockedOut(key: string): { locked: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      return { locked: false, retryAfterSeconds: 0 };
    }

    if (record.lockedUntil && now < record.lockedUntil) {
      const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return { locked: true, retryAfterSeconds };
    }

    // Lockout expired
    if (record.lockedUntil && now >= record.lockedUntil) {
      this.attempts.delete(key);
      return { locked: false, retryAfterSeconds: 0 };
    }

    return { locked: false, retryAfterSeconds: 0 };
  }

  public recordFailure(key: string): {
    locked: boolean;
    attemptsLeft: number;
    retryAfterSeconds: number;
  } {
    const now = Date.now();
    let record = this.attempts.get(key);

    if (!record || now - record.firstAttemptAt > WINDOW_MS) {
      record = { count: 1, firstAttemptAt: now, lockedUntil: null };
      this.attempts.set(key, record);
      return { locked: false, attemptsLeft: MAX_ATTEMPTS - 1, retryAfterSeconds: 0 };
    }

    record.count += 1;

    if (record.count >= MAX_ATTEMPTS) {
      record.lockedUntil = now + LOCKOUT_MS;
      const retryAfterSeconds = Math.ceil(LOCKOUT_MS / 1000);
      return { locked: true, attemptsLeft: 0, retryAfterSeconds };
    }

    return {
      locked: false,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - record.count),
      retryAfterSeconds: 0,
    };
  }

  public reset(key: string) {
    this.attempts.delete(key);
  }
}

// Global singleton instance
export const authRateLimiter = new RateLimiter();
