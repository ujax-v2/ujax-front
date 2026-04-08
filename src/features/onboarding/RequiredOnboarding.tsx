import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { CheckCircle2, ExternalLink, Link2, RefreshCw, UserRound } from 'lucide-react';
import { Button, Card } from '@/components/ui/Base';
import { updateMe } from '@/api/user';
import { parseApiError } from '@/utils/error';
import { useOnboardingRequirements } from '@/hooks/useOnboardingRequirements';
import { userState } from '@/store/atoms';
import { useT } from '@/i18n';
import extensionInstallGuide from '@/assets/images/extension-install-guide.svg';

const EXTENSION_STORE_URL =
  'https://chromewebstore.google.com/detail/ujax-problem-collector/odgcochkdbjimknlhdipkpimllachhbd';

function normalizeBojId(value?: string | null) {
  return String(value ?? '').trim();
}

export const RequiredOnboarding = () => {
  const t = useT();
  const location = useLocation();
  const [user, setUser] = useRecoilState(userState);
  const [bojIdInput, setBojIdInput] = useState(user.baekjoonId || '');
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const {
    hasBojId,
    extensionConnected,
    extensionChecking,
    isComplete,
    refreshExtensionStatus,
  } = useOnboardingRequirements(user.isLoggedIn, user.baekjoonId);

  const redirectPath = useMemo(() => {
    const from = (location.state as { from?: string } | null)?.from;
    if (!from || from.startsWith('/onboarding/required')) return '/';
    return from;
  }, [location.state]);

  useEffect(() => {
    setBojIdInput(user.baekjoonId || '');
  }, [user.baekjoonId]);

  useEffect(() => {
    if (!saveSuccess) return;
    const timer = window.setTimeout(() => setSaveSuccess(''), 2400);
    return () => window.clearTimeout(timer);
  }, [saveSuccess]);

  if (isComplete) {
    return <Navigate to={redirectPath} replace />;
  }

  const normalizedInput = normalizeBojId(bojIdInput);
  const normalizedSaved = normalizeBojId(user.baekjoonId);
  const canSaveBojId = !saving && normalizedInput.length > 0 && normalizedInput !== normalizedSaved;

  const handleSaveBojId = async () => {
    setSaveError('');
    setSaveSuccess('');
    if (!normalizedInput) {
      setSaveError(t('settings.profile.baekjoonWhitespaceError'));
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMe({ baekjoonId: normalizedInput });
      const updatedBojId = normalizeBojId(updated.baekjoonId);
      setUser((prev) => ({
        ...prev,
        name: updated.name,
        profileImageUrl: updated.profileImageUrl ?? '',
        baekjoonId: updatedBojId,
      }));
      setBojIdInput(updatedBojId);
      setSaveSuccess(t('onboarding.boj.saved'));
    } catch (err) {
      setSaveError(parseApiError(err, t('onboarding.boj.saveError')));
    } finally {
      setSaving(false);
    }
  };

  const extensionStatusText = extensionConnected
    ? t('onboarding.extension.statusConnected')
    : extensionChecking
      ? t('onboarding.extension.statusChecking')
      : t('onboarding.extension.statusNotConnected');

  return (
    <div className="min-h-screen bg-page px-4 py-10 md:py-14">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Card className="border-border-default bg-surface p-7 md:p-9">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary">
                {t('onboarding.title')}
              </h1>
              <p className="mt-2 text-sm md:text-base text-text-muted">
                {t('onboarding.subtitle')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400">
                {extensionConnected ? '1/1' : '0/1'} {t('onboarding.step.extension')}
              </div>
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300">
                {hasBojId ? '1/1' : '0/1'} {t('onboarding.step.boj')}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="border-border-default bg-surface p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-emerald-500/12 p-2 text-emerald-400">
                  <Link2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-faint">
                    STEP 1
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-text-primary">
                    {t('onboarding.extension.title')}
                  </h2>
                  <p className="mt-1 text-sm text-text-muted">
                    {t('onboarding.extension.desc')}
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  extensionConnected
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : extensionChecking
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-red-500/15 text-red-400'
                }`}
              >
                {extensionStatusText}
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-border-subtle bg-surface-subtle/50">
              <img
                src={extensionInstallGuide}
                alt={t('onboarding.extension.guideAlt')}
                className="h-auto w-full object-cover"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => window.open(EXTENSION_STORE_URL, '_blank', 'noopener,noreferrer')}
              >
                {t('onboarding.extension.installButton')}
                <ExternalLink className="ml-1.5 h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                disabled={extensionChecking}
                onClick={refreshExtensionStatus}
              >
                {extensionChecking ? t('onboarding.extension.checkingButton') : t('onboarding.extension.checkButton')}
                <RefreshCw className={`ml-1.5 h-4 w-4 ${extensionChecking ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <p className="mt-3 text-xs text-text-faint">
              {t('onboarding.extension.hint')}
            </p>
          </Card>

          <Card className="border-border-default bg-surface p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-indigo-500/12 p-2 text-indigo-300">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-faint">
                  STEP 2
                </p>
                <h2 className="mt-1 text-lg font-bold text-text-primary">
                  {t('onboarding.boj.title')}
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  {t('onboarding.boj.desc')}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-1.5 block text-xs font-semibold text-text-faint">
                {t('settings.profile.baekjoonId')} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={bojIdInput}
                onChange={(e) => setBojIdInput(e.target.value)}
                onBlur={() => setBojIdInput((prev) => prev.trim())}
                placeholder={t('settings.profile.baekjoonPlaceholder')}
                className="w-full rounded-lg border border-border-subtle bg-input-bg px-3 py-2 text-sm text-text-secondary outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <p className="mt-1.5 text-xs text-text-faint">
                {t('onboarding.boj.helper')}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={!canSaveBojId}
                onClick={handleSaveBojId}
              >
                {saving ? t('common.saving') : t('common.save')}
              </Button>
              {saveSuccess && (
                <p className="text-xs font-medium text-emerald-400">{saveSuccess}</p>
              )}
              {saveError && (
                <p className="text-xs font-medium text-red-400">{saveError}</p>
              )}
            </div>
          </Card>
        </div>

        <Card className="border-border-default bg-surface p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-text-muted">
              {t('onboarding.footer')}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className={`inline-flex items-center gap-1 ${extensionConnected ? 'text-emerald-400' : 'text-text-faint'}`}>
                <CheckCircle2 className="h-4 w-4" />
                {t('onboarding.step.extension')}
              </span>
              <span className={`inline-flex items-center gap-1 ${hasBojId ? 'text-emerald-400' : 'text-text-faint'}`}>
                <CheckCircle2 className="h-4 w-4" />
                {t('onboarding.step.boj')}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
