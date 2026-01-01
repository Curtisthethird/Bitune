import { Session } from '@shared/types';
import { POE_ELIGIBILITY_THRESHOLD_SECONDS } from '@shared/constants';

export function isEligible(session: Session): boolean {
    if (!session) return false;
    return session.creditedSeconds >= POE_ELIGIBILITY_THRESHOLD_SECONDS;
}

export function calculateCreditedSeconds(currentSeconds: number, increment: number): number {
    return currentSeconds + increment;
}
