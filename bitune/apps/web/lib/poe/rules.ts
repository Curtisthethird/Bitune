/**
 * @file rules.ts
 * @compliance Section 4: Engagement Heartbeat Events (PoE)
 * @compliance Section 5: Verification Server and Anti-Fraud Logic
 * 
 * This module defines the deterministic constraints for validating digital media 
 * engagement events using Proof of Engagement (PoE).
 */

import { verifyNostrEvent } from '@/lib/nostr/events';

/** 
 * @section 4: Predetermined interval for heartbeat generation in seconds. 
 */
export const POE_HEARTBEAT_SECONDS = Number(process.env.POE_HEARTBEAT_SECONDS) || 5;

/** 
 * @section 6: The predefined threshold of verified playback required for eligibility. 
 */
export const POE_ELIGIBLE_SECONDS = Number(process.env.POE_ELIGIBLE_SECONDS) || 60;

/** 
 * @section 5: Timing constraints for clock skew (client vs server). 
 */
export const MAX_CLOCK_SKEW_MS = (Number(process.env.POE_MAX_CLOCK_SKEW_SECONDS) || 120) * 1000;

/** 
 * @section 5: Anti-fraud threshold for unnatural jumps in playback position. 
 */
export const MAX_POSITION_JUMP_MS = Number(process.env.POE_MAX_POSITION_JUMP_MS) || 15000;

/** 
 * @section 5: Minimum volume threshold to prevent silent "ghost" engagement. 
 */
export const POE_MIN_VOLUME = Number(process.env.POE_MIN_VOLUME) || 0.05;

/**
 * @section 4: Data structure for verified Proof of Engagement.
 */
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

/**
 * @section 5: Verification of cryptographic signature and event kind.
 */
export function validateEventStructure(event: any): RuleResult {
    if (!verifyNostrEvent(event)) return { valid: false, error: 'Invalid signature' };
    if (event.kind !== 30334) return { valid: false, error: 'Invalid kind' };
    return { valid: true };
}

/**
 * @section 5: Verification of state indicators (playback, visibility, volume).
 */
export function validateContent(content: PoEContent): RuleResult {
    if (!content.isPlaying) return { valid: false, error: 'Not playing' };
    if (!content.tabVisible) return { valid: false, error: 'Tab hidden' };
    if (content.volume < POE_MIN_VOLUME) return { valid: false, error: 'Volume too low' };
    if (content.playbackRate < 0.75 || content.playbackRate > 1.25) return { valid: false, error: 'Invalid rate' };
    return { valid: true };
}

/**
 * @section 5: Enforcement of timing constraints between client and server.
 */
export function validateTiming(serverNow: number, clientTs: number): RuleResult {
    const skewed = Math.abs(serverNow - clientTs);
    if (skewed > MAX_CLOCK_SKEW_MS) return { valid: false, error: 'Clock skew too large' };
    return { valid: true };
}

/**
 * @section 5: Enforcement of monotonic playback progression across events.
 */
export function validatePosition(currentMs: number, lastMs: number): RuleResult {
    if (currentMs < lastMs) {
        // Enforce monotonic progression: reject huge backward jumps (Section 5)
        const diff = lastMs - currentMs;
        if (diff > MAX_POSITION_JUMP_MS) return { valid: false, error: 'Jump back too large' };
    } else {
        // Enforce monotonic progression: reject huge forward jumps (Section 5)
        const diff = currentMs - lastMs;
        if (diff > MAX_POSITION_JUMP_MS) return { valid: false, error: 'Jump forward too large' };
    }
    return { valid: true };
}
