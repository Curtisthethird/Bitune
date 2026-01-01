import { verifyNostrEvent } from '@/lib/nostr/events';

export const POE_HEARTBEAT_SECONDS = Number(process.env.POE_HEARTBEAT_SECONDS) || 5;
export const POE_ELIGIBLE_SECONDS = Number(process.env.POE_ELIGIBLE_SECONDS) || 60;
export const MAX_CLOCK_SKEW_MS = (Number(process.env.POE_MAX_CLOCK_SKEW_SECONDS) || 120) * 1000;
export const MAX_POSITION_JUMP_MS = Number(process.env.POE_MAX_POSITION_JUMP_MS) || 15000;
export const POE_MIN_VOLUME = Number(process.env.POE_MIN_VOLUME) || 0.05;

export interface PoEContent {
    trackId: string;
    sessionId: string;
    positionMs: number;
    clientTs: number;
    isPlaying: boolean;
    playbackRate: number;
    volume: number;
    tabVisible: boolean;
}

export interface RuleResult {
    valid: boolean;
    error?: string;
}

export function validateEventStructure(event: any): RuleResult {
    if (!verifyNostrEvent(event)) return { valid: false, error: 'Invalid signature' };
    if (event.kind !== 30334) return { valid: false, error: 'Invalid kind' };
    return { valid: true };
}

export function validateContent(content: PoEContent): RuleResult {
    if (!content.isPlaying) return { valid: false, error: 'Not playing' };
    if (!content.tabVisible) return { valid: false, error: 'Tab hidden' };
    if (content.volume < POE_MIN_VOLUME) return { valid: false, error: 'Volume too low' };
    if (content.playbackRate < 0.75 || content.playbackRate > 1.25) return { valid: false, error: 'Invalid rate' };
    return { valid: true };
}

export function validateTiming(serverNow: number, clientTs: number): RuleResult {
    const skewed = Math.abs(serverNow - clientTs);
    if (skewed > MAX_CLOCK_SKEW_MS) return { valid: false, error: 'Clock skew too large' };
    return { valid: true };
}

export function validatePosition(currentMs: number, lastMs: number): RuleResult {
    if (currentMs < lastMs) {
        // Allow minor regression for loops or seeks?
        // Spec says "enforce monotonic... reject huge jumps... allow small jitter"
        // If regressing more than 2s (jitter), might be a seek back. Seeks are valid user behavior but we should be careful.
        // For MVP we might accept seeks but not credit time if completely resets?
        // Actually, "enforce monotonic playback position" implies seeking back shouldn't just be accepted as linear progress.
        // But we credit *time spent*, not position delta.
        // However, we want to prevent spoofing.
        // If user seeks back, position < last. That's fine, but maybe don't enforce strict monotonicity for *valid* events, just for *crediting* logic?
        // Spec says: "enforce monotonic playback position... allow small jitter; reject huge jumps forward/back"
        // This implies huge jumps are suspicious.
        const diff = lastMs - currentMs;
        if (diff > MAX_POSITION_JUMP_MS) return { valid: false, error: 'Jump back too large' };
    } else {
        const diff = currentMs - lastMs;
        if (diff > MAX_POSITION_JUMP_MS) return { valid: false, error: 'Jump forward too large' };
    }
    return { valid: true };
}
