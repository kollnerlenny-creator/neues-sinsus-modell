import {
  ArrowLeft,
  Check,
  Copy,
  Lock,
  LogOut,
  Mail,
  MousePointerClick,
  Pencil,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useSiteContent } from '../context/ContentContext';
import { isAuthorizedAdminEmail } from '../services/siteContent';

const INPUT_CLASS =
  'w-full rounded-xl border border-white/[0.12] bg-[#06070a] px-3 py-2 text-sm text-[#f7f8f8] placeholder:text-[#62666d] focus:border-emerald-400 focus:outline-none transition-colors';
const LABEL_CLASS = 'block text-xs font-medium text-[#9ea4b0] mb-1';

function mapAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code ?? '')
      : '';
  const msg = err instanceof Error ? err.message : String(err);

  if (code.includes('popup-closed-by-user')) {
    return 'Anmeldefenster wurde geschlossen. Bitte erneut auf „Mit Google anmelden“ klicken.';
  }
  if (code.includes('popup-blocked')) {
    return 'Das Anmeldefenster wurde vom Browser blockiert. Bitte Pop-ups für diese Seite erlauben.';
  }
  if (code.includes('unauthorized-domain')) {
    return 'Diese Domain ist in der Firebase Console unter Authentication → Settings → Authorized domains noch nicht freigeschaltet.';
  }
  if (
    code.includes('invalid-credential') ||
    code.includes('wrong-password') ||
    code.includes('user-not-found')
  ) {
    return 'E-Mail oder Passwort ist falsch (oder dieses Konto wurde noch nicht in Firebase Authentication angelegt).';
  }
  if (code.includes('invalid-email')) {
    return 'Bitte eine gültige E-Mail-Adresse eingeben.';
  }
  if (code.includes('missing-password')) {
    return 'Bitte ein Passwort eingeben.';
  }
  if (code.includes('too-many-requests')) {
    return 'Zu viele Anmeldeversuche. Bitte kurz warten und erneut versuchen.';
  }
  if (code.includes('operation-not-allowed')) {
    return 'Diese Anmeldemethode ist im Firebase-Projekt unter Authentication → Sign-in method noch nicht aktiviert.';
  }
  return `Anmeldung fehlgeschlagen: ${msg}`;
}

interface AdminAuthGateProps {
  onExitAdmin: () => void;
}

export function AdminAuthGate({ onExitAdmin }: AdminAuthGateProps) {
  const {
    user,
    authReady,
    adminCheckLoading,
    signInWithGoogle,
    signInWithEmailPassword,
    sendVerificationEmail,
    refreshAdminStatus,
    signOut,
  } = useSiteContent();

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);

  const handleGoogleLogin = async () => {
    setAuthBusy(true);
    setAuthError(null);
    setVerifyMsg(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(mapAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedEmail = emailInput.trim();
    if (!trimmedEmail || !passwordInput) {
      setAuthError('Bitte E-Mail-Adresse und Passwort eingeben.');
      return;
    }
    setAuthBusy(true);
    setAuthError(null);
    setVerifyMsg(null);
    try {
      await signInWithEmailPassword(trimmedEmail, passwordInput);
      setPasswordInput('');
    } catch (err) {
      setAuthError(mapAuthError(err));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSendVerification = async () => {
    setVerifyBusy(true);
    setVerifyMsg(null);
    try {
      await sendVerificationEmail();
      setVerifyMsg({
        type: 'success',
        text: `Bestätigungs-E-Mail an ${user?.email ?? 'deine Adresse'} gesendet. Bitte Link öffnen (ggf. Spam-Ordner prüfen) und danach „Status prüfen“ klicken.`,
      });
    } catch (err) {
      setVerifyMsg({
        type: 'error',
        text: mapAuthError(err),
      });
    } finally {
      setVerifyBusy(false);
    }
  };

  const handleRefreshVerification = async () => {
    setVerifyBusy(true);
    setVerifyMsg(null);
    try {
      const allowed = await refreshAdminStatus();
      if (!allowed) {
        setVerifyMsg({
          type: 'error',
          text: 'Die Bestätigung ist noch nicht aktiv. Bitte zuerst den Link in der E-Mail öffnen (ggf. Spam-Ordner prüfen) und anschließend erneut prüfen.',
        });
      }
    } catch (err) {
      setVerifyMsg({
        type: 'error',
        text: mapAuthError(err),
      });
    } finally {
      setVerifyBusy(false);
    }
  };

  const copyUid = async () => {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(user.uid);
      setCopiedUid(true);
      window.setTimeout(() => setCopiedUid(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <main
      aria-labelledby="admin-gate-title"
      data-testid="admin-panel-modal"
      className="fixed inset-0 z-50 flex h-dvh w-full flex-col overflow-hidden bg-[#0b0d11] text-[#f7f8f8]"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.09] bg-[#0e1015] px-5 py-3.5 sm:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.04]">
            <Lock className="h-5 w-5 text-[#9ea4b0]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1
              id="admin-gate-title"
              className="font-display text-lg sm:text-xl font-semibold text-[#f7f8f8] truncate"
            >
              Admin-Ansicht · Anmeldung
            </h1>
            <p className="text-xs text-[#8a8f98] truncate">
              {user
                ? `Angemeldet als ${user.email || user.uid}`
                : 'Geschützter Redaktionsbereich · Anmeldung erforderlich'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {user && (
            <button
              type="button"
              onClick={() => void signOut()}
              data-testid="admin-signout-btn"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-[#cbd5e1] hover:bg-white/[0.08] cursor-pointer transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Abmelden</span>
            </button>
          )}
          <button
            type="button"
            onClick={onExitAdmin}
            aria-label="Zurück zur Website"
            data-testid="close-admin-modal-btn"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-[#cbd5e1] hover:bg-white/[0.1] hover:text-white cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Zur Website</span>
          </button>
        </div>
      </header>

      {!authReady || adminCheckLoading ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
          <RefreshCw
            className="h-6 w-6 animate-spin text-emerald-400"
            aria-hidden="true"
          />
          <p className="text-sm text-[#cbd5e1]">
            Anmeldestatus und Berechtigung werden geprüft…
          </p>
        </div>
      ) : !user ? (
        <div
          data-testid="admin-login-gate"
          className="sidebar-scroll flex flex-1 flex-col items-center justify-center overflow-y-auto p-6 sm:p-10 text-center"
        >
          <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.04]">
            <Lock className="h-6 w-6 text-emerald-400" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold text-[#f7f8f8]">
            Administrator-Anmeldung erforderlich
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-[#9ea4b0]">
            Melde dich an, um anschließend direkt auf der gesamten Website jeden
            Text und alle Kennzahlen zu bearbeiten.
          </p>

          <form
            onSubmit={(e) => void handleEmailLogin(e)}
            data-testid="admin-email-login-form"
            className="mt-6 w-full max-w-sm space-y-3 rounded-2xl border border-white/[0.1] bg-[#07090d] p-5 text-left"
          >
            <div>
              <label htmlFor="admin-email-input" className={LABEL_CLASS}>
                E-Mail-Adresse
              </label>
              <input
                id="admin-email-input"
                type="email"
                autoComplete="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="name@beispiel.de"
                data-testid="admin-email-input"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="admin-password-input" className={LABEL_CLASS}>
                Passwort
              </label>
              <input
                id="admin-password-input"
                type="password"
                autoComplete="current-password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                data-testid="admin-password-input"
                className={INPUT_CLASS}
              />
            </div>
            <button
              type="submit"
              disabled={authBusy}
              data-testid="admin-email-login-btn"
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#f7f8f8] px-5 py-2.5 text-sm font-semibold text-[#040406] hover:bg-white disabled:opacity-55 cursor-pointer transition-colors"
            >
              <Mail className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <span>
                {authBusy ? 'Anmeldung läuft…' : 'Mit E-Mail & Passwort anmelden'}
              </span>
            </button>
          </form>

          <div className="my-4 flex w-full max-w-sm items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.1]" />
            <span className="text-[11px] uppercase tracking-wider text-[#6e7582]">
              oder
            </span>
            <div className="h-px flex-1 bg-white/[0.1]" />
          </div>

          <button
            type="button"
            onClick={() => void handleGoogleLogin()}
            disabled={authBusy}
            data-testid="admin-google-login-btn"
            className="inline-flex w-full max-w-sm items-center justify-center gap-2.5 rounded-full border border-white/[0.14] bg-white/[0.04] px-6 py-2.5 text-sm font-medium text-[#f7f8f8] hover:bg-white/[0.09] disabled:opacity-55 cursor-pointer transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            <span>Mit Google anmelden</span>
          </button>

          {authError && (
            <div
              data-testid="admin-auth-error"
              className="mt-5 max-w-md rounded-2xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-200"
            >
              {authError}
            </div>
          )}
        </div>
      ) : !user.emailVerified && isAuthorizedAdminEmail(user.email) ? (
        <div
          data-testid="admin-verify-email-card"
          className="flex flex-1 flex-col items-center justify-center p-8 sm:p-14 text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/35 bg-amber-400/10">
            <Mail className="h-6 w-6 text-amber-300" aria-hidden="true" />
          </div>
          <h2 className="mt-5 font-display text-2xl font-semibold text-[#f7f8f8]">
            E-Mail-Adresse einmalig bestätigen
          </h2>
          <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-[#9ea4b0]">
            Dein Konto <strong className="text-[#f7f8f8]">{user.email}</strong>{' '}
            ist als Administrator berechtigt, die E-Mail-Adresse wurde in
            Firebase aber noch nicht verifiziert.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => void handleSendVerification()}
              disabled={verifyBusy}
              data-testid="admin-send-verification-btn"
              className="inline-flex items-center gap-2 rounded-full bg-[#f7f8f8] px-5 py-2.5 text-xs font-semibold text-[#040406] hover:bg-white disabled:opacity-55 cursor-pointer"
            >
              <Mail className="h-3.5 w-3.5 text-emerald-700" />
              <span>Bestätigungs-E-Mail senden</span>
            </button>
            <button
              type="button"
              onClick={() => void handleRefreshVerification()}
              disabled={verifyBusy}
              data-testid="admin-refresh-verification-btn"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-5 py-2.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/20 disabled:opacity-55 cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${verifyBusy ? 'animate-spin' : ''}`}
              />
              <span>Bereits bestätigt · Status prüfen</span>
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-full border border-white/[0.14] bg-white/[0.04] px-5 py-2.5 text-xs font-medium text-[#e2e8f0] hover:bg-white/[0.08] cursor-pointer"
            >
              Abmelden
            </button>
          </div>

          {verifyMsg && (
            <div
              className={`mt-5 max-w-md rounded-2xl border px-4 py-3 text-xs font-medium ${
                verifyMsg.type === 'success'
                  ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                  : 'border-rose-500/35 bg-rose-500/10 text-rose-200'
              }`}
            >
              {verifyMsg.text}
            </div>
          )}
        </div>
      ) : (
        <div
          data-testid="admin-access-denied"
          className="flex flex-1 flex-col items-center justify-center p-8 sm:p-14 text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/35 bg-rose-500/10">
            <ShieldAlert className="h-6 w-6 text-rose-400" aria-hidden="true" />
          </div>
          <h2 className="mt-5 font-display text-2xl font-semibold text-[#f7f8f8]">
            Kein Admin-Zugriff für dieses Konto
          </h2>
          <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-[#9ea4b0]">
            Du bist angemeldet als{' '}
            <strong className="text-[#f7f8f8]">{user.email}</strong>, dieses
            Konto ist jedoch nicht als Administrator hinterlegt.
          </p>

          <div className="mt-5 w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#06070a] p-4 text-left">
            <div className="text-xs font-medium text-[#8a8f98]">
              Deine Firebase User-UID (für /admins/{'{uid}'}):
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <code className="font-mono-tabular text-xs text-emerald-300 break-all">
                {user.uid}
              </code>
              <button
                type="button"
                onClick={() => void copyUid()}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-white/[0.12] bg-white/[0.04] px-2.5 py-1 text-xs text-[#e2e8f0] hover:bg-white/[0.09] cursor-pointer"
              >
                {copiedUid ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedUid ? 'Kopiert' : 'UID'}</span>
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-full bg-[#f7f8f8] px-5 py-2.5 text-xs font-semibold text-[#040406] hover:bg-white cursor-pointer"
            >
              Mit anderem Konto anmelden
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

interface AdminOverlayBarProps {
  onOpenDataDrawer: () => void;
  onExitAdmin: () => void;
}

export function AdminOverlayBar({
  onOpenDataDrawer,
  onExitAdmin,
}: AdminOverlayBarProps) {
  const {
    user,
    dirtyCount,
    adminTestInteraction,
    setAdminTestInteraction,
    saveBusy,
    saveStatus,
    saveAllDirtySections,
    discardDraftChanges,
    signOut,
  } = useSiteContent();

  return (
    <div
      data-testid="admin-overlay-bar"
      className="sticky top-0 z-50 border-b border-emerald-400/25 bg-[#090d11]/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.65)]"
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 sm:px-6">
        {/* Left status & guidance */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-400/35 bg-emerald-400/12">
            <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-[13px] font-semibold text-[#f7f8f8] truncate">
                Admin-Modus
              </span>
              {dirtyCount > 0 && (
                <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                  {dirtyCount} ungespeichert
                </span>
              )}
              {saveStatus && (
                <span
                  data-testid="admin-save-status"
                  className={`hidden md:inline text-xs font-medium ${
                    saveStatus.type === 'success'
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {saveStatus.text}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#8a8f98] truncate">
              {adminTestInteraction
                ? `Test-Modus aktiv (${user?.email ?? 'Admin'}) · Links & Buttons funktionieren normal`
                : 'Beliebigen Text oder Zahl direkt auf der Website anklicken & bearbeiten'}
            </p>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle Edit vs Test Interaction */}
          <div
            role="group"
            aria-label="Bearbeitungsmodus"
            className="inline-flex items-center rounded-full border border-white/[0.12] bg-[#06080b] p-0.5"
          >
            <button
              type="button"
              onClick={() => setAdminTestInteraction(false)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-medium cursor-pointer transition-colors ${
                !adminTestInteraction
                  ? 'bg-emerald-400 text-[#040406] font-semibold'
                  : 'text-[#9ea4b0] hover:text-white'
              }`}
            >
              <Pencil className="h-3 w-3" aria-hidden="true" />
              <span>Bearbeiten</span>
            </button>
            <button
              type="button"
              onClick={() => setAdminTestInteraction(true)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-medium cursor-pointer transition-colors ${
                adminTestInteraction
                  ? 'bg-[#f7f8f8] text-[#040406] font-semibold'
                  : 'text-[#9ea4b0] hover:text-white'
              }`}
            >
              <MousePointerClick className="h-3 w-3" aria-hidden="true" />
              <span>Testen</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenDataDrawer}
            data-testid="open-admin-data-drawer-btn"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.14] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#e2e8f0] hover:bg-white/[0.1] cursor-pointer transition-colors"
          >
            <Sliders className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            <span>3D-Daten &amp; Alle Felder</span>
          </button>

          {dirtyCount > 0 && (
            <>
              <button
                type="button"
                onClick={discardDraftChanges}
                disabled={saveBusy}
                className="inline-flex items-center gap-1 rounded-full border border-white/[0.12] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-[#cbd5e1] hover:bg-white/[0.08] cursor-pointer transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Verwerfen</span>
              </button>

              <button
                type="button"
                onClick={() => void saveAllDirtySections()}
                disabled={saveBusy}
                data-testid="admin-bar-save-btn"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400 px-3.5 py-1.5 text-xs font-semibold text-[#040406] hover:bg-emerald-300 disabled:opacity-55 cursor-pointer transition-colors shadow-sm"
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {saveBusy ? 'Speichere…' : `Speichern (${dirtyCount})`}
                </span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => void signOut()}
            data-testid="admin-signout-btn"
            title="Abmelden"
            className="inline-flex items-center gap-1 rounded-full border border-white/[0.12] bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-[#cbd5e1] hover:bg-white/[0.08] cursor-pointer transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden xl:inline">Abmelden</span>
          </button>

          <button
            type="button"
            onClick={onExitAdmin}
            data-testid="close-admin-modal-btn"
            className="inline-flex items-center gap-1 rounded-full border border-white/[0.12] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#f7f8f8] hover:bg-white/[0.1] cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Zur Website</span>
          </button>
        </div>
      </div>

      {saveStatus && (
        <div
          className={`md:hidden border-t px-4 py-1.5 text-xs font-medium ${
            saveStatus.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/20 bg-rose-500/10 text-rose-300'
          }`}
        >
          {saveStatus.text}
        </div>
      )}
    </div>
  );
}
