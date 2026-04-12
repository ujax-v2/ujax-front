import type { SignupVerificationSession } from '@/api/auth';

const SIGNUP_VERIFICATION_STORAGE_KEY = 'signupVerificationSession';
const SIGNUP_DRAFT_STORAGE_KEY = 'signupDraft';
const SIGNUP_TERMS_STORAGE_KEY = 'signupTermsAgreement';
const SIGNUP_TERMS_VERSION = 2;

export const REQUIRED_SIGNUP_TERM_IDS = ['terms', 'privacy'] as const;

export type RequiredSignupTermId = typeof REQUIRED_SIGNUP_TERM_IDS[number];

export interface SignupDraft {
  email: string;
  nickname: string;
  password: string;
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

function isSignupDraft(value: unknown): value is SignupDraft {
  if (!value || typeof value !== 'object') return false;

  const draft = value as SignupDraft;
  return typeof draft.email === 'string'
    && typeof draft.nickname === 'string'
    && typeof draft.password === 'string'
    && typeof draft.checkedEmail === 'string';
}

function isSignupVerificationSession(value: unknown): value is SignupVerificationSession {
  if (!value || typeof value !== 'object') return false;

  const session = value as SignupVerificationSession;
  return typeof session.requestToken === 'string'
    && typeof session.email === 'string'
    && typeof session.expiresAt === 'string';
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
    if (!stored) return null;

    const parsed = JSON.parse(stored) as unknown;
    return isSignupVerificationSession(parsed) ? parsed : null;
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

export function getSignupDraft(): SignupDraft | null {
  try {
    const stored = sessionStorage.getItem(SIGNUP_DRAFT_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as unknown;
    return isSignupDraft(parsed) ? parsed : null;
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
