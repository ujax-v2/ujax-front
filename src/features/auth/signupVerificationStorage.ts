import type { SignupVerificationSession } from '@/api/auth';

const SIGNUP_VERIFICATION_STORAGE_KEY = 'signupVerificationSession';
const SIGNUP_VERIFICATION_PENDING_KEY = 'signupVerificationPending';
const SIGNUP_DRAFT_STORAGE_KEY = 'signupDraft';
const SIGNUP_TERMS_STORAGE_KEY = 'signupTermsAgreement';
const SIGNUP_TERMS_VERSION = 2;

export const SIGNUP_VERIFICATION_READY_EVENT = 'ujaxSignupVerificationReady';
export const SIGNUP_VERIFICATION_FAILED_EVENT = 'ujaxSignupVerificationFailed';
export const REQUIRED_SIGNUP_TERM_IDS = ['terms', 'privacy'] as const;

export type RequiredSignupTermId = typeof REQUIRED_SIGNUP_TERM_IDS[number];

export interface PendingSignupVerification {
  email: string;
  expiresAt: string;
  requestId: string;
}

export interface SignupDraft {
  email: string;
  nickname: string;
  checkedEmail: string;
}

export interface SignupTermsAgreement {
  version: number;
  agreedAt: string;
  agreements: Record<RequiredSignupTermId, boolean>;
}

function createDefaultSignupTermAgreements() {
  return REQUIRED_SIGNUP_TERM_IDS.reduce((acc, id) => {
    acc[id] = false;
    return acc;
  }, {} as Record<RequiredSignupTermId, boolean>);
}

function isSignupTermsAgreement(value: unknown): value is SignupTermsAgreement {
  if (!value || typeof value !== 'object') return false;

  const agreement = value as SignupTermsAgreement;
  if (agreement.version !== SIGNUP_TERMS_VERSION || typeof agreement.agreedAt !== 'string') {
    return false;
  }

  return REQUIRED_SIGNUP_TERM_IDS.every((id) => typeof agreement.agreements?.[id] === 'boolean');
}

export function getSignupVerificationSession(): SignupVerificationSession | null {
  try {
    const stored = sessionStorage.getItem(SIGNUP_VERIFICATION_STORAGE_KEY);
    return stored ? JSON.parse(stored) as SignupVerificationSession : null;
  } catch {
    return null;
  }
}

export function saveSignupVerificationSession(session: SignupVerificationSession) {
  try {
    sessionStorage.setItem(SIGNUP_VERIFICATION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearSignupVerificationSession() {
  try {
    sessionStorage.removeItem(SIGNUP_VERIFICATION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getPendingSignupVerification(): PendingSignupVerification | null {
  try {
    const stored = sessionStorage.getItem(SIGNUP_VERIFICATION_PENDING_KEY);
    return stored ? JSON.parse(stored) as PendingSignupVerification : null;
  } catch {
    return null;
  }
}

export function savePendingSignupVerification(session: PendingSignupVerification) {
  try {
    sessionStorage.setItem(SIGNUP_VERIFICATION_PENDING_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function clearPendingSignupVerification() {
  try {
    sessionStorage.removeItem(SIGNUP_VERIFICATION_PENDING_KEY);
  } catch {
    // ignore
  }
}

export function getSignupDraft(): SignupDraft | null {
  try {
    const stored = sessionStorage.getItem(SIGNUP_DRAFT_STORAGE_KEY);
    return stored ? JSON.parse(stored) as SignupDraft : null;
  } catch {
    return null;
  }
}

export function saveSignupDraft(draft: SignupDraft) {
  try {
    sessionStorage.setItem(SIGNUP_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // ignore
  }
}

export function clearSignupDraft() {
  try {
    sessionStorage.removeItem(SIGNUP_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getSignupTermsAgreement(): SignupTermsAgreement | null {
  try {
    const stored = sessionStorage.getItem(SIGNUP_TERMS_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as unknown;
    return isSignupTermsAgreement(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSignupTermsAgreement(agreements: Record<RequiredSignupTermId, boolean>) {
  try {
    sessionStorage.setItem(SIGNUP_TERMS_STORAGE_KEY, JSON.stringify({
      version: SIGNUP_TERMS_VERSION,
      agreedAt: new Date().toISOString(),
      agreements: {
        ...createDefaultSignupTermAgreements(),
        ...agreements,
      },
    } satisfies SignupTermsAgreement));
  } catch {
    // ignore
  }
}

export function clearSignupTermsAgreement() {
  try {
    sessionStorage.removeItem(SIGNUP_TERMS_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasAcceptedRequiredSignupTerms() {
  const agreement = getSignupTermsAgreement();
  if (!agreement) return false;

  return REQUIRED_SIGNUP_TERM_IDS.every((id) => agreement.agreements[id]);
}
