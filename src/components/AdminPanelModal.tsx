import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Database,
  Grid2x2,
  Layers,
  ListChecks,
  Lock,
  LogOut,
  Mail,
  PieChart,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Trash2,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import { useSiteContent } from '../context/ContentContext';
import type { ShapeVariant } from '../data/milieus';
import {
  CONTENT_SECTION_IDS,
  VALID_MILIEU_ID_LIST,
  type ContentSectionId,
  type SiteContentState,
} from '../data/siteContentDefaults';
import { ADMIN_EMAILS, isAuthorizedAdminEmail } from '../services/siteContent';

interface AdminPanelModalProps {
  open: boolean;
  onClose: () => void;
}

const TAB_META: Array<{
  id: ContentSectionId;
  label: string;
  shortLabel: string;
}> = [
  { id: 'meta', label: 'Startseite & Navigation', shortLabel: 'Meta & Hero' },
  { id: 'milieus_2035', label: '6 Milieus (2035)', shortLabel: '2035 (6)' },
  { id: 'milieus_2026', label: '10 Milieus (2026)', shortLabel: '2026 (10)' },
  { id: 'axes_rifts', label: '3D-Achsen & Gräben', shortLabel: 'Achsen/Gräben' },
  { id: 'transformation', label: 'Transformation', shortLabel: 'Transformation' },
  { id: 'distribution', label: 'Verteilung', shortLabel: 'Verteilung' },
  { id: 'self_test', label: 'Selbsttest', shortLabel: 'Selbsttest' },
];

const SHAPE_OPTIONS: Array<{ value: ShapeVariant; label: string }> = [
  { value: 'tower_triangle', label: 'Aufsteigendes Dreieck (Avantgarde)' },
  { value: 'block_rectangle', label: 'Massiver Block (Konservativ)' },
  { value: 'slender_pillar', label: 'Schlanker Turm (Digital-Adaptiv)' },
  { value: 'fractured_shards', label: 'Gespaltene Schollen (Mitte)' },
  { value: 'broad_plateau', label: 'Breites Plateau (Senioren)' },
  { value: 'flat_slab', label: 'Flache Basisplatte (Prekariat)' },
];

const COPYABLE_FIRESTORE_RULES_HINT = `// Ergänzung für firestore.rules im externen Firebase-Projekt
// (Vollständige Datei liegt im Projekt-Root unter /firestore.rules)
function isAdmin() {
  return request.auth != null && (
    (request.auth.token.email_verified == true
      && request.auth.token.email in [${ADMIN_EMAILS.map((e) => `'${e}'`).join(', ')}]) ||
    exists(/databases/$(database)/documents/admins/$(request.auth.uid))
  );
}

match /admins/{adminUid} {
  allow get: if request.auth != null && request.auth.uid == adminUid;
  allow list, create, update, delete: if false;
}

match /siteContent/{sectionId} {
  allow get: if sectionId in [
    'meta', 'milieus_2035', 'milieus_2026',
    'axes_rifts', 'transformation', 'distribution', 'self_test'
  ];
  allow list: if false;
  allow create, update, delete: if isAdmin();
}`;

const INPUT_CLASS =
  'w-full rounded-xl border border-white/[0.12] bg-[#06070a] px-3 py-2 text-sm text-[#f7f8f8] placeholder:text-[#62666d] focus:border-emerald-400 focus:outline-none transition-colors';
const TEXTAREA_CLASS =
  'w-full rounded-xl border border-white/[0.12] bg-[#06070a] px-3 py-2 text-sm text-[#f7f8f8] placeholder:text-[#62666d] focus:border-emerald-400 focus:outline-none transition-colors min-h-[76px] resize-y';
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

export function AdminPanelModal({ open, onClose }: AdminPanelModalProps) {
  const {
    content,
    user,
    authReady,
    isAdmin,
    adminCheckLoading,
    rulesMissingWarning,
    signInWithGoogle,
    signInWithEmailPassword,
    sendVerificationEmail,
    refreshAdminStatus,
    signOut,
    saveSection,
    resetSection,
    refreshRulesStatus,
  } = useSiteContent();

  const [activeTab, setActiveTab] = useState<ContentSectionId>('meta');
  const [draft, setDraft] = useState<SiteContentState>(() =>
    structuredClone(content),
  );
  const [dirtyMap, setDirtyMap] = useState<Record<ContentSectionId, boolean>>({
    meta: false,
    milieus_2035: false,
    milieus_2026: false,
    axes_rifts: false,
    transformation: false,
    distribution: false,
    self_test: false,
  });

  const [selected2035Idx, setSelected2035Idx] = useState(0);
  const [selected2026Idx, setSelected2026Idx] = useState(0);

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);

  // Sync non-dirty sections when remote content updates or modal opens
  useEffect(() => {
    if (!open) return;
    setDraft((prev) => {
      const next = structuredClone(prev);
      for (const id of CONTENT_SECTION_IDS) {
        if (!dirtyMap[id]) {
          (next as unknown as Record<ContentSectionId, unknown>)[id] =
            structuredClone(content[id]);
        }
      }
      return next;
    });
  }, [open, content, dirtyMap]);

  useEffect(() => {
    if (!open) {
      setConfirmReset(false);
      setSaveStatus(null);
    }
  }, [open]);

  const updateSectionDraft = useCallback(
    <K extends ContentSectionId>(
      sectionId: K,
      updater: (prev: SiteContentState[K]) => SiteContentState[K],
    ) => {
      setDraft((prev) => ({
        ...prev,
        [sectionId]: updater(prev[sectionId]),
      }));
      setDirtyMap((prev) => ({ ...prev, [sectionId]: true }));
      setSaveStatus(null);
      setConfirmReset(false);
    },
    [],
  );

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

  const handleSaveCurrent = async () => {
    setSaveBusy(true);
    setSaveStatus(null);
    try {
      await saveSection(activeTab, draft[activeTab]);
      setDirtyMap((prev) => ({ ...prev, [activeTab]: false }));
      setSaveStatus({
        type: 'success',
        text: `Sektion „${TAB_META.find((t) => t.id === activeTab)?.shortLabel}“ gespeichert.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveStatus({
        type: 'error',
        text: msg.toLowerCase().includes('permission')
          ? 'Speichern blockiert: Firestore-Regeln für /siteContent fehlen oder Konto ist kein Admin.'
          : `Fehler beim Speichern: ${msg}`,
      });
    } finally {
      setSaveBusy(false);
    }
  };

  const handleSaveAllDirty = async () => {
    const dirtyIds = CONTENT_SECTION_IDS.filter((id) => dirtyMap[id]);
    if (dirtyIds.length === 0) return;
    setSaveBusy(true);
    setSaveStatus(null);
    try {
      for (const id of dirtyIds) {
        await saveSection(id, draft[id]);
      }
      setDirtyMap({
        meta: false,
        milieus_2035: false,
        milieus_2026: false,
        axes_rifts: false,
        transformation: false,
        distribution: false,
        self_test: false,
      });
      setSaveStatus({
        type: 'success',
        text: `${dirtyIds.length} geänderte Sektion(en) in Firestore gespeichert.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveStatus({
        type: 'error',
        text: msg.toLowerCase().includes('permission')
          ? 'Speichern blockiert: Firestore-Regeln für /siteContent prüfen.'
          : `Fehler beim Speichern: ${msg}`,
      });
    } finally {
      setSaveBusy(false);
    }
  };

  const handleResetActiveSection = async () => {
    setSaveBusy(true);
    setSaveStatus(null);
    try {
      await resetSection(activeTab);
      setDirtyMap((prev) => ({ ...prev, [activeTab]: false }));
      setConfirmReset(false);
      setSaveStatus({
        type: 'success',
        text: 'Sektion auf Standardwerte zurückgesetzt.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveStatus({
        type: 'error',
        text: `Zurücksetzen fehlgeschlagen: ${msg}`,
      });
    } finally {
      setSaveBusy(false);
    }
  };

  const copyText = async (text: string, which: 'uid' | 'rules') => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === 'uid') {
        setCopiedUid(true);
        window.setTimeout(() => setCopiedUid(false), 1800);
      } else {
        setCopiedRules(true);
        window.setTimeout(() => setCopiedRules(false), 1800);
      }
    } catch {
      // Ignore clipboard failures
    }
  };

  const dirtyCount = CONTENT_SECTION_IDS.filter((id) => dirtyMap[id]).length;
  const sum2035 = useMemo(
    () =>
      Math.round(
        draft.milieus_2035.milieus.reduce((s, m) => s + m.share2035, 0) * 10,
      ) / 10,
    [draft.milieus_2035.milieus],
  );
  const sum2026Of6 = useMemo(
    () =>
      Math.round(
        draft.milieus_2035.milieus.reduce((s, m) => s + m.share2026, 0) * 10,
      ) / 10,
    [draft.milieus_2035.milieus],
  );
  const sumClassic2026 = useMemo(
    () =>
      Math.round(
        draft.milieus_2026.classicMilieus.reduce((s, m) => s + m.share2026, 0) * 10,
      ) / 10,
    [draft.milieus_2026.classicMilieus],
  );

  if (!open) return null;

  return (
    <main
      aria-labelledby="admin-modal-title"
      data-testid="admin-panel-modal"
      className="fixed inset-0 z-50 flex h-dvh w-full flex-col overflow-hidden bg-[#0b0d11] text-[#f7f8f8]"
    >
      {/* Fullscreen Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.09] bg-[#0e1015] px-5 py-3.5 sm:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.04]">
            {isAdmin ? (
              <ShieldCheck className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            ) : (
              <Lock className="h-5 w-5 text-[#9ea4b0]" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <h1
              id="admin-modal-title"
              className="font-display text-lg sm:text-xl font-semibold text-[#f7f8f8] truncate"
            >
              Admin-Ansicht · Inhalte &amp; 3D-Daten verwalten
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
            onClick={onClose}
            aria-label="Zurück zur Website"
            data-testid="close-admin-modal-btn"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-[#cbd5e1] hover:bg-white/[0.1] hover:text-white cursor-pointer transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Zur Website</span>
          </button>
        </div>
      </header>

          {/* Body Switch: Auth Gate vs Denied vs Authorized CMS Editor */}
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
              <h3 className="mt-4 font-display text-2xl font-semibold text-[#f7f8f8]">
                Administrator-Anmeldung erforderlich
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#9ea4b0]">
                Melde dich mit deinem Admin-Konto an, um Texte, Prozentwerte,
                Resilienz-Koordinaten, Achsen, Gräben und Selbsttest-Fragen
                zentral zu bearbeiten.
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
                    {authBusy
                      ? 'Anmeldung läuft…'
                      : 'Mit E-Mail & Passwort anmelden'}
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
          ) : !isAdmin ? (
            !user.emailVerified && isAuthorizedAdminEmail(user.email) ? (
              <div
                data-testid="admin-verify-email-card"
                className="flex flex-1 flex-col items-center justify-center p-8 sm:p-14 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/35 bg-amber-400/10">
                  <Mail className="h-6 w-6 text-amber-300" aria-hidden="true" />
                </div>
                <h3 className="mt-5 font-display text-2xl font-semibold text-[#f7f8f8]">
                  E-Mail-Adresse einmalig bestätigen
                </h3>
                <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-[#9ea4b0]">
                  Dein Konto{' '}
                  <strong className="text-[#f7f8f8]">{user.email}</strong> ist
                  als Administrator berechtigt, die E-Mail-Adresse wurde in
                  Firebase aber noch nicht verifiziert. Aus Sicherheitsgründen
                  erlauben die Firestore-Regeln Schreibzugriffe erst nach
                  Bestätigung.
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
                <h3 className="mt-5 font-display text-2xl font-semibold text-[#f7f8f8]">
                  Kein Admin-Zugriff für dieses Konto
                </h3>
                <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-[#9ea4b0]">
                  Du bist angemeldet als{' '}
                  <strong className="text-[#f7f8f8]">{user.email}</strong>, dieses
                  Konto ist jedoch nicht als Administrator hinterlegt.
                </p>

                <div className="mt-5 w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#06070a] p-4 text-left">
                  <div className="text-xs font-medium text-[#8a8f98]">
                    Deine Firebase User-UID (für /admins/{'{uid}'} im eigenen Projekt):
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <code className="font-mono-tabular text-xs text-emerald-300 break-all">
                      {user.uid}
                    </code>
                    <button
                      type="button"
                      onClick={() => void copyText(user.uid, 'uid')}
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
            )
          ) : (
            /* Authorized Full CMS Editor */
            <div
              data-testid="admin-editor"
              className="flex flex-1 min-h-0 flex-col"
            >
              {/* External Firebase Rules Warning (shown only if /siteContent rules aren't published yet) */}
              {rulesMissingWarning && (
                <div className="border-b border-amber-500/30 bg-amber-500/10 px-5 py-3 text-xs text-amber-100">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-start gap-2 max-w-3xl">
                      <AlertTriangle
                        className="h-4 w-4 shrink-0 text-amber-400 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>
                        <strong>Hinweis zum externen Firebase-Projekt:</strong>{' '}
                        Die Firestore-Regeln für <code className="font-mono-tabular">/siteContent</code>{' '}
                        sind in diesem Firebase-Projekt noch nicht aktiv. Änderungen werden bis dahin lokal im Standardmodus angezeigt.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void copyText(COPYABLE_FIRESTORE_RULES_HINT, 'rules')
                        }
                        className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-400/25 cursor-pointer"
                      >
                        {copiedRules ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span>
                          {copiedRules ? 'Regeln kopiert' : 'Regeln kopieren'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={refreshRulesStatus}
                        className="inline-flex items-center gap-1 rounded-full border border-white/[0.15] bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white hover:bg-white/[0.12] cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Erneut prüfen</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto border-b border-white/[0.08] bg-[#090b0f] px-5 py-2.5 sm:px-8 sidebar-scroll">
                {TAB_META.map((tab) => {
                  const active = activeTab === tab.id;
                  const dirty = dirtyMap[tab.id];
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setConfirmReset(false);
                        setSaveStatus(null);
                      }}
                      data-testid={`admin-tab-${tab.id}`}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#f7f8f8] text-[#040406] font-semibold'
                          : 'border border-white/[0.08] bg-white/[0.02] text-[#9ea4b0] hover:text-white'
                      }`}
                    >
                      <span>{tab.shortLabel}</span>
                      {dirty && (
                        <span
                          className={`h-2 w-2 rounded-full ${
                            active ? 'bg-emerald-600' : 'bg-emerald-400'
                          }`}
                          title="Ungespeicherte Änderungen"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Scrollable Editor Form */}
              <div className="sidebar-scroll flex-1 overflow-y-auto px-5 py-6 sm:px-8">
                <div className="mx-auto w-full max-w-[1440px] space-y-6">
                {/* TAB 1: META & HERO */}
                {activeTab === 'meta' && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 space-y-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Grid2x2 className="h-4 w-4 text-emerald-400" />
                        <span>Navigation &amp; Footer</span>
                      </h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={LABEL_CLASS}>Markenname oben links</label>
                          <input
                            type="text"
                            value={draft.meta.navBrand}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                navBrand: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>CTA-Button oben rechts</label>
                          <input
                            type="text"
                            value={draft.meta.navCtaLabel}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                navCtaLabel: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Footer links</label>
                          <input
                            type="text"
                            value={draft.meta.footerLeft}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                footerLeft: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Footer rechts</label>
                          <input
                            type="text"
                            value={draft.meta.footerRight}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                footerRight: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className={LABEL_CLASS}>Navigations-Links</div>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                          {draft.meta.navLinks.map((link, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#07090d] p-2.5"
                            >
                              <input
                                type="text"
                                value={link.label}
                                onChange={(e) =>
                                  updateSectionDraft('meta', (p) => ({
                                    ...p,
                                    navLinks: p.navLinks.map((l, i) =>
                                      i === idx ? { ...l, label: e.target.value } : l,
                                    ),
                                  }))
                                }
                                placeholder="Label"
                                className={INPUT_CLASS}
                              />
                              <input
                                type="text"
                                value={link.href}
                                onChange={(e) =>
                                  updateSectionDraft('meta', (p) => ({
                                    ...p,
                                    navLinks: p.navLinks.map((l, i) =>
                                      i === idx ? { ...l, href: e.target.value } : l,
                                    ),
                                  }))
                                }
                                placeholder="#anker"
                                className={`${INPUT_CLASS} max-w-[125px] font-mono-tabular text-xs`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 space-y-4">
                      <h3 className="text-sm font-semibold text-white">
                        Hero-Einstieg &amp; 3 Strukturverschiebungen
                      </h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={LABEL_CLASS}>Eyebrow / Dachzeile</label>
                          <input
                            type="text"
                            value={draft.meta.heroEyebrow}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                heroEyebrow: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Hauptüberschrift (H1)</label>
                          <input
                            type="text"
                            value={draft.meta.heroHeadline}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                heroHeadline: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Einleitungstext</label>
                        <textarea
                          value={draft.meta.heroLead}
                          onChange={(e) =>
                            updateSectionDraft('meta', (p) => ({
                              ...p,
                              heroLead: e.target.value,
                            }))
                          }
                          className={TEXTAREA_CLASS}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div>
                          <label className={LABEL_CLASS}>Button 1 (3D-Modell)</label>
                          <input
                            type="text"
                            value={draft.meta.heroExploreBtn}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                heroExploreBtn: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Button 2 (Selbsttest)</label>
                          <input
                            type="text"
                            value={draft.meta.heroSelftestBtn}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                heroSelftestBtn: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Scroll-Hinweis unten</label>
                          <input
                            type="text"
                            value={draft.meta.heroScrollCue}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                heroScrollCue: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={LABEL_CLASS}>Box-Kopfzeile links</label>
                          <input
                            type="text"
                            value={draft.meta.heroShiftsBarTitle}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                heroShiftsBarTitle: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Box-Kopfzeile rechts</label>
                          <input
                            type="text"
                            value={draft.meta.heroShiftsBarTag}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                heroShiftsBarTag: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {draft.meta.heroShifts.map((shift, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-white/[0.08] bg-[#07090d] p-4 space-y-2.5"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={shift.accent}
                                onChange={(e) =>
                                  updateSectionDraft('meta', (p) => ({
                                    ...p,
                                    heroShifts: p.heroShifts.map((s, i) =>
                                      i === idx ? { ...s, accent: e.target.value } : s,
                                    ),
                                  }))
                                }
                                className="h-8 w-8 rounded border border-white/20 bg-transparent cursor-pointer"
                              />
                              <input
                                type="text"
                                value={shift.metric}
                                onChange={(e) =>
                                  updateSectionDraft('meta', (p) => ({
                                    ...p,
                                    heroShifts: p.heroShifts.map((s, i) =>
                                      i === idx ? { ...s, metric: e.target.value } : s,
                                    ),
                                  }))
                                }
                                placeholder="Kennzahl"
                                className={INPUT_CLASS}
                              />
                            </div>
                            <input
                              type="text"
                              value={shift.title}
                              onChange={(e) =>
                                updateSectionDraft('meta', (p) => ({
                                  ...p,
                                  heroShifts: p.heroShifts.map((s, i) =>
                                    i === idx ? { ...s, title: e.target.value } : s,
                                  ),
                                }))
                              }
                              placeholder="Titel"
                              className={INPUT_CLASS}
                            />
                            <textarea
                              value={shift.detail}
                              onChange={(e) =>
                                updateSectionDraft('meta', (p) => ({
                                  ...p,
                                  heroShifts: p.heroShifts.map((s, i) =>
                                    i === idx ? { ...s, detail: e.target.value } : s,
                                  ),
                                }))
                              }
                              placeholder="Beschreibung"
                              className={TEXTAREA_CLASS}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 space-y-4">
                      <h3 className="text-sm font-semibold text-white">
                        Sektion 01 (3D-Bühne) &amp; Sektion 02 (6 Milieus) Kopfzeilen
                      </h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={LABEL_CLASS}>3D-Bühne Eyebrow</label>
                          <input
                            type="text"
                            value={draft.meta.stageEyebrow}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                stageEyebrow: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>3D-Bühne Titel</label>
                          <input
                            type="text"
                            value={draft.meta.stageHeadline}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                stageHeadline: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>3D-Bühne Beschreibung</label>
                        <textarea
                          value={draft.meta.stageDescription}
                          onChange={(e) =>
                            updateSectionDraft('meta', (p) => ({
                              ...p,
                              stageDescription: e.target.value,
                            }))
                          }
                          className={TEXTAREA_CLASS}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={LABEL_CLASS}>Schalter-Text 2026</label>
                          <input
                            type="text"
                            value={draft.meta.stageMode2026Label}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                stageMode2026Label: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Schalter-Text 2035</label>
                          <input
                            type="text"
                            value={draft.meta.stageMode2035Label}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                stageMode2035Label: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Legende X-Achse</label>
                          <input
                            type="text"
                            value={draft.meta.stageAxisKeyX}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                stageAxisKeyX: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Legende Y-Achse</label>
                          <input
                            type="text"
                            value={draft.meta.stageAxisKeyY}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                stageAxisKeyY: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Legende Z-Achse</label>
                          <input
                            type="text"
                            value={draft.meta.stageAxisKeyZ}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                stageAxisKeyZ: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>

                      <div className="border-t border-white/[0.08] pt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={LABEL_CLASS}>Detail-Grid Eyebrow</label>
                          <input
                            type="text"
                            value={draft.meta.gridEyebrow}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                gridEyebrow: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Detail-Grid Überschrift</label>
                          <input
                            type="text"
                            value={draft.meta.gridHeadline}
                            onChange={(e) =>
                              updateSectionDraft('meta', (p) => ({
                                ...p,
                                gridHeadline: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Detail-Grid Einleitung</label>
                        <textarea
                          value={draft.meta.gridDescription}
                          onChange={(e) =>
                            updateSectionDraft('meta', (p) => ({
                              ...p,
                              gridDescription: e.target.value,
                            }))
                          }
                          className={TEXTAREA_CLASS}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: MILIEUS 2035 (6) */}
                {activeTab === 'milieus_2035' && (() => {
                  const list = draft.milieus_2035.milieus;
                  const m = list[selected2035Idx] ?? list[0];
                  const updateMilieu = (patch: Partial<typeof m>) => {
                    updateSectionDraft('milieus_2035', (p) => ({
                      ...p,
                      milieus: p.milieus.map((item, idx) =>
                        idx === selected2035Idx ? { ...item, ...patch } : item,
                      ),
                    }));
                  };

                  return (
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.02] p-4">
                        <div className="flex flex-wrap gap-2">
                          {list.map((item, idx) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setSelected2035Idx(idx)}
                              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                                idx === selected2035Idx
                                  ? 'bg-[#f7f8f8] text-[#040406] font-semibold'
                                  : 'border border-white/[0.1] bg-[#07090d] text-[#cbd5e1] hover:text-white'
                              }`}
                            >
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: item.colorHex }}
                              />
                              <span>
                                {item.shortName} ({item.share2035}%)
                              </span>
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 font-mono-tabular text-xs">
                          <span
                            className={
                              Math.abs(sum2035 - 100) < 0.05
                                ? 'text-emerald-400 font-semibold'
                                : 'text-amber-400 font-semibold'
                            }
                          >
                            Summe 2035: {sum2035}%
                          </span>
                          <span className="text-[#8a8f98]">
                            Basis 2026: {sum2026Of6}%
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div className="sm:col-span-2">
                            <label className={LABEL_CLASS}>Vollständiger Name</label>
                            <input
                              type="text"
                              value={m.name}
                              onChange={(e) => updateMilieu({ name: e.target.value })}
                              className={INPUT_CLASS}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>Kurzname (Badge)</label>
                            <input
                              type="text"
                              value={m.shortName}
                              onChange={(e) => updateMilieu({ shortName: e.target.value })}
                              className={INPUT_CLASS}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                          <div>
                            <label className={LABEL_CLASS}>Anteil 2035 (%)</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={m.share2035}
                              onChange={(e) =>
                                updateMilieu({ share2035: Number(e.target.value) || 0 })
                              }
                              className={`${INPUT_CLASS} font-mono-tabular`}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>Anteil 2026 (%)</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={m.share2026}
                              onChange={(e) =>
                                updateMilieu({ share2026: Number(e.target.value) || 0 })
                              }
                              className={`${INPUT_CLASS} font-mono-tabular`}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>Resilienz (0–100)</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              value={m.resilienceScore}
                              onChange={(e) =>
                                updateMilieu({
                                  resilienceScore: Math.round(Number(e.target.value) || 0),
                                })
                              }
                              className={`${INPUT_CLASS} font-mono-tabular`}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>Farbe (Hex)</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={m.colorHex}
                                onChange={(e) =>
                                  updateMilieu({ colorHex: e.target.value })
                                }
                                className="h-9 w-10 rounded border border-white/20 bg-transparent cursor-pointer"
                              />
                              <input
                                type="text"
                                value={m.colorHex}
                                onChange={(e) =>
                                  updateMilieu({ colorHex: e.target.value })
                                }
                                className={`${INPUT_CLASS} font-mono-tabular text-xs`}
                              />
                            </div>
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>3D-Leuchtfarbe</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={m.emissiveHex}
                                onChange={(e) =>
                                  updateMilieu({ emissiveHex: e.target.value })
                                }
                                className="h-9 w-10 rounded border border-white/20 bg-transparent cursor-pointer"
                              />
                              <input
                                type="text"
                                value={m.emissiveHex}
                                onChange={(e) =>
                                  updateMilieu({ emissiveHex: e.target.value })
                                }
                                className={`${INPUT_CLASS} font-mono-tabular text-xs`}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          <div>
                            <label className={LABEL_CLASS}>2035 Status-Badge</label>
                            <input
                              type="text"
                              value={m.badge2035}
                              onChange={(e) => updateMilieu({ badge2035: e.target.value })}
                              className={INPUT_CLASS}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>Resilienz-Bewertung</label>
                            <input
                              type="text"
                              value={m.resilienceRatingLabel}
                              onChange={(e) =>
                                updateMilieu({ resilienceRatingLabel: e.target.value })
                              }
                              className={INPUT_CLASS}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>3D-Inselform</label>
                            <select
                              value={m.shapeVariant}
                              onChange={(e) =>
                                updateMilieu({
                                  shapeVariant: e.target.value as ShapeVariant,
                                })
                              }
                              className={INPUT_CLASS}
                            >
                              {SHAPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* 3D Coordinates */}
                        <div className="rounded-xl border border-white/[0.08] bg-[#07090d] p-4">
                          <div className="text-xs font-semibold text-[#cbd5e1] mb-3">
                            3D-Koordinaten &amp; Geometrie (live im WebGL-Raum)
                          </div>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                            <div>
                              <label className={LABEL_CLASS}>2035 X (−10..10)</label>
                              <input
                                type="number"
                                step={0.1}
                                value={m.pos2035.x}
                                onChange={(e) =>
                                  updateMilieu({
                                    pos2035: { ...m.pos2035, x: Number(e.target.value) || 0 },
                                  })
                                }
                                className={`${INPUT_CLASS} font-mono-tabular`}
                              />
                            </div>
                            <div>
                              <label className={LABEL_CLASS}>2035 Y/Tiefe (−8..8)</label>
                              <input
                                type="number"
                                step={0.1}
                                value={m.pos2035.z}
                                onChange={(e) =>
                                  updateMilieu({
                                    pos2035: { ...m.pos2035, z: Number(e.target.value) || 0 },
                                  })
                                }
                                className={`${INPUT_CLASS} font-mono-tabular`}
                              />
                            </div>
                            <div>
                              <label className={LABEL_CLASS}>Flughöhe (0.2..8.5)</label>
                              <input
                                type="number"
                                step={0.1}
                                value={m.elevation2035}
                                onChange={(e) =>
                                  updateMilieu({
                                    elevation2035: Number(e.target.value) || 0.2,
                                  })
                                }
                                className={`${INPUT_CLASS} font-mono-tabular`}
                              />
                            </div>
                            <div>
                              <label className={LABEL_CLASS}>Skalierung (0.5..1.8)</label>
                              <input
                                type="number"
                                step={0.05}
                                value={m.scale2035}
                                onChange={(e) =>
                                  updateMilieu({ scale2035: Number(e.target.value) || 1 })
                                }
                                className={`${INPUT_CLASS} font-mono-tabular`}
                              />
                            </div>
                            <div>
                              <label className={LABEL_CLASS}>Radius (0.8..4.2)</label>
                              <input
                                type="number"
                                step={0.05}
                                value={m.footprintRadius}
                                onChange={(e) =>
                                  updateMilieu({
                                    footprintRadius: Number(e.target.value) || 2,
                                  })
                                }
                                className={`${INPUT_CLASS} font-mono-tabular`}
                              />
                            </div>
                            <div>
                              <label className={LABEL_CLASS}>2026 X</label>
                              <input
                                type="number"
                                step={0.1}
                                value={m.pos2026.x}
                                onChange={(e) =>
                                  updateMilieu({
                                    pos2026: { ...m.pos2026, x: Number(e.target.value) || 0 },
                                  })
                                }
                                className={`${INPUT_CLASS} font-mono-tabular`}
                              />
                            </div>
                            <div>
                              <label className={LABEL_CLASS}>2026 Y/Tiefe</label>
                              <input
                                type="number"
                                step={0.1}
                                value={m.pos2026.z}
                                onChange={(e) =>
                                  updateMilieu({
                                    pos2026: { ...m.pos2026, z: Number(e.target.value) || 0 },
                                  })
                                }
                                className={`${INPUT_CLASS} font-mono-tabular`}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className={LABEL_CLASS}>Soziale Lage (Label)</label>
                            <input
                              type="text"
                              value={m.socialLayerLabel}
                              onChange={(e) =>
                                updateMilieu({ socialLayerLabel: e.target.value })
                              }
                              className={INPUT_CLASS}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>Werteorientierung (Label)</label>
                            <input
                              type="text"
                              value={m.valueOrientationLabel}
                              onChange={(e) =>
                                updateMilieu({ valueOrientationLabel: e.target.value })
                              }
                              className={INPUT_CLASS}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={LABEL_CLASS}>Kurzfassung / Auf einen Blick</label>
                          <textarea
                            value={m.causalChainSummary}
                            onChange={(e) =>
                              updateMilieu({ causalChainSummary: e.target.value })
                            }
                            className={TEXTAREA_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Entstehung aus 2026</label>
                          <textarea
                            value={m.originFrom2026}
                            onChange={(e) =>
                              updateMilieu({ originFrom2026: e.target.value })
                            }
                            className={TEXTAREA_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Soziologisches Profil</label>
                          <textarea
                            value={m.detailedProfile}
                            onChange={(e) =>
                              updateMilieu({ detailedProfile: e.target.value })
                            }
                            className={TEXTAREA_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Resilienz-Mechanismus 2035</label>
                          <textarea
                            value={m.resilienceMechanism}
                            onChange={(e) =>
                              updateMilieu({ resilienceMechanism: e.target.value })
                            }
                            className={TEXTAREA_CLASS}
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className={LABEL_CLASS}>Typische Lebensrealität</label>
                            <textarea
                              value={m.everydayExamples}
                              onChange={(e) =>
                                updateMilieu({ everydayExamples: e.target.value })
                              }
                              className={TEXTAREA_CLASS}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>Gesellschaftliche Konfliktlinie</label>
                            <textarea
                              value={m.conflictLine}
                              onChange={(e) =>
                                updateMilieu({ conflictLine: e.target.value })
                              }
                              className={TEXTAREA_CLASS}
                            />
                          </div>
                        </div>

                        {/* Causal Chain Steps */}
                        <div className="rounded-xl border border-white/[0.08] bg-[#07090d] p-4 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#cbd5e1]">
                              Kausalkette-Schritte ({m.causalChain.length})
                            </span>
                            {m.causalChain.length < 6 && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateMilieu({
                                    causalChain: [...m.causalChain, 'Neuer Schritt'],
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-full border border-white/[0.12] px-2.5 py-1 text-xs text-[#e2e8f0] hover:bg-white/[0.08] cursor-pointer"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Schritt</span>
                              </button>
                            )}
                          </div>
                          {m.causalChain.map((step, sIdx) => (
                            <div key={sIdx} className="flex items-center gap-2">
                              <span className="font-mono-tabular text-xs text-[#62666d] w-6">
                                0{sIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={step}
                                onChange={(e) =>
                                  updateMilieu({
                                    causalChain: m.causalChain.map((st, i) =>
                                      i === sIdx ? e.target.value : st,
                                    ),
                                  })
                                }
                                className={INPUT_CLASS}
                              />
                              {m.causalChain.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateMilieu({
                                      causalChain: m.causalChain.filter((_, i) => i !== sIdx),
                                    })
                                  }
                                  aria-label="Schritt entfernen"
                                  className="p-2 text-[#8a8f98] hover:text-rose-400 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Key Drivers */}
                        <div className="rounded-xl border border-white/[0.08] bg-[#07090d] p-4 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#cbd5e1]">
                              Schlüsseltreiber ({m.keyDrivers.length})
                            </span>
                            {m.keyDrivers.length < 6 && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateMilieu({
                                    keyDrivers: [...m.keyDrivers, 'Neuer Treiber'],
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-full border border-white/[0.12] px-2.5 py-1 text-xs text-[#e2e8f0] hover:bg-white/[0.08] cursor-pointer"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Treiber</span>
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {m.keyDrivers.map((drv, dIdx) => (
                              <div key={dIdx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={drv}
                                  onChange={(e) =>
                                    updateMilieu({
                                      keyDrivers: m.keyDrivers.map((d, i) =>
                                        i === dIdx ? e.target.value : d,
                                      ),
                                    })
                                  }
                                  className={INPUT_CLASS}
                                />
                                {m.keyDrivers.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateMilieu({
                                        keyDrivers: m.keyDrivers.filter((_, i) => i !== dIdx),
                                      })
                                    }
                                    aria-label="Treiber entfernen"
                                    className="p-2 text-[#8a8f98] hover:text-rose-400 cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 3: MILIEUS 2026 (10) */}
                {activeTab === 'milieus_2026' && (() => {
                  const list = draft.milieus_2026.classicMilieus;
                  const c = list[selected2026Idx] ?? list[0];
                  const updateClassic = (patch: Partial<typeof c>) => {
                    updateSectionDraft('milieus_2026', (p) => ({
                      ...p,
                      classicMilieus: p.classicMilieus.map((item, idx) =>
                        idx === selected2026Idx ? { ...item, ...patch } : item,
                      ),
                    }));
                  };

                  return (
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.02] p-4">
                        <div className="flex flex-wrap gap-2">
                          {list.map((item, idx) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setSelected2026Idx(idx)}
                              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                                idx === selected2026Idx
                                  ? 'bg-[#f7f8f8] text-[#040406] font-semibold'
                                  : 'border border-white/[0.1] bg-[#07090d] text-[#cbd5e1] hover:text-white'
                              }`}
                            >
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: item.colorHex }}
                              />
                              <span>
                                {item.shortName} ({item.share2026}%)
                              </span>
                            </button>
                          ))}
                        </div>
                        <span
                          className={`font-mono-tabular text-xs font-semibold ${
                            Math.abs(sumClassic2026 - 100) < 0.05
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          Summe 2026: {sumClassic2026}%
                        </span>
                      </div>

                      <div className="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                          <div className="sm:col-span-2">
                            <label className={LABEL_CLASS}>Name 2026</label>
                            <input
                              type="text"
                              value={c.name}
                              onChange={(e) => updateClassic({ name: e.target.value })}
                              className={INPUT_CLASS}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>Kurzname</label>
                            <input
                              type="text"
                              value={c.shortName}
                              onChange={(e) => updateClassic({ shortName: e.target.value })}
                              className={INPUT_CLASS}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>Anteil 2026 (%)</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={c.share2026}
                              onChange={(e) =>
                                updateClassic({ share2026: Number(e.target.value) || 0 })
                              }
                              className={`${INPUT_CLASS} font-mono-tabular`}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
                          <div>
                            <label className={LABEL_CLASS}>Farbe</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={c.colorHex}
                                onChange={(e) => updateClassic({ colorHex: e.target.value })}
                                className="h-9 w-10 rounded border border-white/20 bg-transparent cursor-pointer"
                              />
                              <input
                                type="text"
                                value={c.colorHex}
                                onChange={(e) => updateClassic({ colorHex: e.target.value })}
                                className={`${INPUT_CLASS} font-mono-tabular text-xs`}
                              />
                            </div>
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>Pos X</label>
                            <input
                              type="number"
                              step={0.1}
                              value={c.pos.x}
                              onChange={(e) =>
                                updateClassic({
                                  pos: { ...c.pos, x: Number(e.target.value) || 0 },
                                })
                              }
                              className={`${INPUT_CLASS} font-mono-tabular`}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>Pos Y/Tiefe</label>
                            <input
                              type="number"
                              step={0.1}
                              value={c.pos.z}
                              onChange={(e) =>
                                updateClassic({
                                  pos: { ...c.pos, z: Number(e.target.value) || 0 },
                                })
                              }
                              className={`${INPUT_CLASS} font-mono-tabular`}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>Radius X</label>
                            <input
                              type="number"
                              step={0.1}
                              value={c.radiusX}
                              onChange={(e) =>
                                updateClassic({ radiusX: Number(e.target.value) || 1 })
                              }
                              className={`${INPUT_CLASS} font-mono-tabular`}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>Radius Y/Z</label>
                            <input
                              type="number"
                              step={0.1}
                              value={c.radiusZ}
                              onChange={(e) =>
                                updateClassic({ radiusZ: Number(e.target.value) || 1 })
                              }
                              className={`${INPUT_CLASS} font-mono-tabular`}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>Rotation (rad)</label>
                            <input
                              type="number"
                              step={0.05}
                              value={c.rotationY}
                              onChange={(e) =>
                                updateClassic({ rotationY: Number(e.target.value) || 0 })
                              }
                              className={`${INPUT_CLASS} font-mono-tabular`}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className={LABEL_CLASS}>Soziale Lage</label>
                            <input
                              type="text"
                              value={c.socialLayer}
                              onChange={(e) => updateClassic({ socialLayer: e.target.value })}
                              className={INPUT_CLASS}
                            />
                          </div>
                          <div>
                            <label className={LABEL_CLASS}>Werteorientierung</label>
                            <input
                              type="text"
                              value={c.valueOrientation}
                              onChange={(e) =>
                                updateClassic({ valueOrientation: e.target.value })
                              }
                              className={INPUT_CLASS}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={LABEL_CLASS}>Charakteristik 2026</label>
                          <textarea
                            value={c.description}
                            onChange={(e) => updateClassic({ description: e.target.value })}
                            className={TEXTAREA_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Entwicklung bis 2035</label>
                          <textarea
                            value={c.evolvesInto}
                            onChange={(e) => updateClassic({ evolvesInto: e.target.value })}
                            className={TEXTAREA_CLASS}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 4: AXES & RIFTS */}
                {activeTab === 'axes_rifts' && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 space-y-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Sliders className="h-4 w-4 text-emerald-400" />
                        <span>3D-Achsenbeschriftungen ({draft.axes_rifts.axisLabels.length})</span>
                      </h3>
                      <div className="space-y-3">
                        {draft.axes_rifts.axisLabels.map((ax, idx) => (
                          <div
                            key={ax.id}
                            className="grid grid-cols-1 gap-3 rounded-xl border border-white/[0.08] bg-[#07090d] p-4 sm:grid-cols-12 sm:items-end"
                          >
                            <div className="sm:col-span-3">
                              <label className={LABEL_CLASS}>
                                Achse {ax.axis} · Haupttext
                              </label>
                              <input
                                type="text"
                                value={ax.text}
                                onChange={(e) =>
                                  updateSectionDraft('axes_rifts', (p) => ({
                                    ...p,
                                    axisLabels: p.axisLabels.map((item, i) =>
                                      i === idx ? { ...item, text: e.target.value } : item,
                                    ),
                                  }))
                                }
                                className={INPUT_CLASS}
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <label className={LABEL_CLASS}>Untertitel</label>
                              <input
                                type="text"
                                value={ax.subtext ?? ''}
                                onChange={(e) =>
                                  updateSectionDraft('axes_rifts', (p) => ({
                                    ...p,
                                    axisLabels: p.axisLabels.map((item, i) =>
                                      i === idx ? { ...item, subtext: e.target.value } : item,
                                    ),
                                  }))
                                }
                                className={INPUT_CLASS}
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className={LABEL_CLASS}>Akzentfarbe</label>
                              <input
                                type="color"
                                value={ax.accentColor}
                                onChange={(e) =>
                                  updateSectionDraft('axes_rifts', (p) => ({
                                    ...p,
                                    axisLabels: p.axisLabels.map((item, i) =>
                                      i === idx
                                        ? { ...item, accentColor: e.target.value }
                                        : item,
                                    ),
                                  }))
                                }
                                className="h-9 w-full rounded border border-white/20 bg-transparent cursor-pointer"
                              />
                            </div>
                            <div className="sm:col-span-4 grid grid-cols-3 gap-2">
                              <div>
                                <label className={LABEL_CLASS}>X</label>
                                <input
                                  type="number"
                                  step={0.2}
                                  value={ax.worldPos.x}
                                  onChange={(e) =>
                                    updateSectionDraft('axes_rifts', (p) => ({
                                      ...p,
                                      axisLabels: p.axisLabels.map((item, i) =>
                                        i === idx
                                          ? {
                                              ...item,
                                              worldPos: {
                                                ...item.worldPos,
                                                x: Number(e.target.value) || 0,
                                              },
                                            }
                                          : item,
                                      ),
                                    }))
                                  }
                                  className={`${INPUT_CLASS} font-mono-tabular`}
                                />
                              </div>
                              <div>
                                <label className={LABEL_CLASS}>Höhe</label>
                                <input
                                  type="number"
                                  step={0.2}
                                  value={ax.worldPos.y}
                                  onChange={(e) =>
                                    updateSectionDraft('axes_rifts', (p) => ({
                                      ...p,
                                      axisLabels: p.axisLabels.map((item, i) =>
                                        i === idx
                                          ? {
                                              ...item,
                                              worldPos: {
                                                ...item.worldPos,
                                                y: Number(e.target.value) || 0,
                                              },
                                            }
                                          : item,
                                      ),
                                    }))
                                  }
                                  className={`${INPUT_CLASS} font-mono-tabular`}
                                />
                              </div>
                              <div>
                                <label className={LABEL_CLASS}>Tiefe</label>
                                <input
                                  type="number"
                                  step={0.2}
                                  value={ax.worldPos.z}
                                  onChange={(e) =>
                                    updateSectionDraft('axes_rifts', (p) => ({
                                      ...p,
                                      axisLabels: p.axisLabels.map((item, i) =>
                                        i === idx
                                          ? {
                                              ...item,
                                              worldPos: {
                                                ...item.worldPos,
                                                z: Number(e.target.value) || 0,
                                              },
                                            }
                                          : item,
                                      ),
                                    }))
                                  }
                                  className={`${INPUT_CLASS} font-mono-tabular`}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 space-y-4">
                      <h3 className="text-sm font-semibold text-white">
                        Rote Trennlinien / Gräben 2035 ({draft.axes_rifts.riftLines.length})
                      </h3>
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {draft.axes_rifts.riftLines.map((rift, rIdx) => (
                          <div
                            key={rift.id}
                            className="rounded-xl border border-white/[0.08] bg-[#07090d] p-4 space-y-3"
                          >
                            <div>
                              <label className={LABEL_CLASS}>Bezeichnung Graben</label>
                              <input
                                type="text"
                                value={rift.label}
                                onChange={(e) =>
                                  updateSectionDraft('axes_rifts', (p) => ({
                                    ...p,
                                    riftLines: p.riftLines.map((rl, i) =>
                                      i === rIdx ? { ...rl, label: e.target.value } : rl,
                                    ),
                                  }))
                                }
                                className={INPUT_CLASS}
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-[#9ea4b0]">
                                <span>Pfadpunkte (X / Z)</span>
                                {rift.points.length < 10 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateSectionDraft('axes_rifts', (p) => ({
                                        ...p,
                                        riftLines: p.riftLines.map((rl, i) =>
                                          i === rIdx
                                            ? {
                                                ...rl,
                                                points: [
                                                  ...rl.points,
                                                  rl.points[rl.points.length - 1] ?? {
                                                    x: 0,
                                                    z: 0,
                                                  },
                                                ],
                                              }
                                            : rl,
                                        ),
                                      }))
                                    }
                                    className="inline-flex items-center gap-1 rounded-full border border-white/[0.12] px-2 py-0.5 text-[11px] text-white hover:bg-white/[0.08] cursor-pointer"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>Punkt</span>
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {rift.points.map((pt, pIdx) => (
                                  <div key={pIdx} className="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      step={0.2}
                                      value={pt.x}
                                      onChange={(e) =>
                                        updateSectionDraft('axes_rifts', (p) => ({
                                          ...p,
                                          riftLines: p.riftLines.map((rl, i) =>
                                            i === rIdx
                                              ? {
                                                  ...rl,
                                                  points: rl.points.map((op, pi) =>
                                                    pi === pIdx
                                                      ? { ...op, x: Number(e.target.value) || 0 }
                                                      : op,
                                                  ),
                                                }
                                              : rl,
                                          ),
                                        }))
                                      }
                                      className={`${INPUT_CLASS} font-mono-tabular text-xs`}
                                    />
                                    <input
                                      type="number"
                                      step={0.2}
                                      value={pt.z}
                                      onChange={(e) =>
                                        updateSectionDraft('axes_rifts', (p) => ({
                                          ...p,
                                          riftLines: p.riftLines.map((rl, i) =>
                                            i === rIdx
                                              ? {
                                                  ...rl,
                                                  points: rl.points.map((op, pi) =>
                                                    pi === pIdx
                                                      ? { ...op, z: Number(e.target.value) || 0 }
                                                      : op,
                                                  ),
                                                }
                                              : rl,
                                          ),
                                        }))
                                      }
                                      className={`${INPUT_CLASS} font-mono-tabular text-xs`}
                                    />
                                    {rift.points.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateSectionDraft('axes_rifts', (p) => ({
                                            ...p,
                                            riftLines: p.riftLines.map((rl, i) =>
                                              i === rIdx
                                                ? {
                                                    ...rl,
                                                    points: rl.points.filter((_, pi) => pi !== pIdx),
                                                  }
                                                : rl,
                                            ),
                                          }))
                                        }
                                        className="p-1.5 text-[#8a8f98] hover:text-rose-400 cursor-pointer"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 5: TRANSFORMATION */}
                {activeTab === 'transformation' && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 space-y-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Layers className="h-4 w-4 text-emerald-400" />
                        <span>Sektion 03 · Überschrift &amp; 3 Kernargumente</span>
                      </h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={LABEL_CLASS}>Eyebrow</label>
                          <input
                            type="text"
                            value={draft.transformation.eyebrow}
                            onChange={(e) =>
                              updateSectionDraft('transformation', (p) => ({
                                ...p,
                                eyebrow: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Überschrift</label>
                          <input
                            type="text"
                            value={draft.transformation.headline}
                            onChange={(e) =>
                              updateSectionDraft('transformation', (p) => ({
                                ...p,
                                headline: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Einleitungstext</label>
                        <textarea
                          value={draft.transformation.description}
                          onChange={(e) =>
                            updateSectionDraft('transformation', (p) => ({
                              ...p,
                              description: e.target.value,
                            }))
                          }
                          className={TEXTAREA_CLASS}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                        {draft.transformation.arguments.map((arg, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-white/[0.08] bg-[#07090d] p-4 space-y-2.5"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={arg.number}
                                onChange={(e) =>
                                  updateSectionDraft('transformation', (p) => ({
                                    ...p,
                                    arguments: p.arguments.map((a, i) =>
                                      i === idx ? { ...a, number: e.target.value } : a,
                                    ),
                                  }))
                                }
                                className={`${INPUT_CLASS} max-w-[70px] font-mono-tabular`}
                              />
                              <input
                                type="text"
                                value={arg.title}
                                onChange={(e) =>
                                  updateSectionDraft('transformation', (p) => ({
                                    ...p,
                                    arguments: p.arguments.map((a, i) =>
                                      i === idx ? { ...a, title: e.target.value } : a,
                                    ),
                                  }))
                                }
                                className={INPUT_CLASS}
                              />
                            </div>
                            <textarea
                              value={arg.body}
                              onChange={(e) =>
                                updateSectionDraft('transformation', (p) => ({
                                  ...p,
                                  arguments: p.arguments.map((a, i) =>
                                    i === idx ? { ...a, body: e.target.value } : a,
                                  ),
                                }))
                              }
                              className={TEXTAREA_CLASS}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 space-y-4">
                      <h3 className="text-sm font-semibold text-white">
                        Rechenweg &amp; Begründung (4 Schritte)
                      </h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={LABEL_CLASS}>Rechenweg Eyebrow</label>
                          <input
                            type="text"
                            value={draft.transformation.calcEyebrow}
                            onChange={(e) =>
                              updateSectionDraft('transformation', (p) => ({
                                ...p,
                                calcEyebrow: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Rechenweg Titel</label>
                          <input
                            type="text"
                            value={draft.transformation.calcHeadline}
                            onChange={(e) =>
                              updateSectionDraft('transformation', (p) => ({
                                ...p,
                                calcHeadline: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {draft.transformation.calcSteps.map((step, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-white/[0.08] bg-[#07090d] p-4 space-y-2.5"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={step.color}
                                onChange={(e) =>
                                  updateSectionDraft('transformation', (p) => ({
                                    ...p,
                                    calcSteps: p.calcSteps.map((s, i) =>
                                      i === idx ? { ...s, color: e.target.value } : s,
                                    ),
                                  }))
                                }
                                className="h-8 w-8 rounded border border-white/20 bg-transparent cursor-pointer"
                              />
                              <input
                                type="text"
                                value={step.title}
                                onChange={(e) =>
                                  updateSectionDraft('transformation', (p) => ({
                                    ...p,
                                    calcSteps: p.calcSteps.map((s, i) =>
                                      i === idx ? { ...s, title: e.target.value } : s,
                                    ),
                                  }))
                                }
                                className={INPUT_CLASS}
                              />
                              <input
                                type="text"
                                value={step.delta}
                                onChange={(e) =>
                                  updateSectionDraft('transformation', (p) => ({
                                    ...p,
                                    calcSteps: p.calcSteps.map((s, i) =>
                                      i === idx ? { ...s, delta: e.target.value } : s,
                                    ),
                                  }))
                                }
                                className={`${INPUT_CLASS} max-w-[130px] font-mono-tabular`}
                              />
                            </div>
                            <textarea
                              value={step.summary}
                              onChange={(e) =>
                                updateSectionDraft('transformation', (p) => ({
                                  ...p,
                                  calcSteps: p.calcSteps.map((s, i) =>
                                    i === idx ? { ...s, summary: e.target.value } : s,
                                  ),
                                }))
                              }
                              className={TEXTAREA_CLASS}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">
                          Systemvergleichs-Matrix ({draft.transformation.comparisonRows.length} Zeilen)
                        </h3>
                        {draft.transformation.comparisonRows.length < 10 && (
                          <button
                            type="button"
                            onClick={() =>
                              updateSectionDraft('transformation', (p) => ({
                                ...p,
                                comparisonRows: [
                                  ...p.comparisonRows,
                                  {
                                    criterion: 'Neues Kriterium',
                                    model2026: 'Stand 2026',
                                    model2035: 'Stand 2035',
                                  },
                                ],
                              }))
                            }
                            className="inline-flex items-center gap-1 rounded-full border border-white/[0.12] px-3 py-1 text-xs text-white hover:bg-white/[0.08] cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Zeile</span>
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={LABEL_CLASS}>Vergleich Titel</label>
                          <input
                            type="text"
                            value={draft.transformation.compHeadline}
                            onChange={(e) =>
                              updateSectionDraft('transformation', (p) => ({
                                ...p,
                                compHeadline: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Vergleich Untertitel</label>
                          <input
                            type="text"
                            value={draft.transformation.compDescription}
                            onChange={(e) =>
                              updateSectionDraft('transformation', (p) => ({
                                ...p,
                                compDescription: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        {draft.transformation.comparisonRows.map((row, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-1 gap-3 rounded-xl border border-white/[0.08] bg-[#07090d] p-4 sm:grid-cols-12"
                          >
                            <div className="sm:col-span-3">
                              <label className={LABEL_CLASS}>Dimension</label>
                              <input
                                type="text"
                                value={row.criterion}
                                onChange={(e) =>
                                  updateSectionDraft('transformation', (p) => ({
                                    ...p,
                                    comparisonRows: p.comparisonRows.map((r, i) =>
                                      i === idx ? { ...r, criterion: e.target.value } : r,
                                    ),
                                  }))
                                }
                                className={INPUT_CLASS}
                              />
                            </div>
                            <div className="sm:col-span-4">
                              <label className={LABEL_CLASS}>2026 (2D)</label>
                              <textarea
                                value={row.model2026}
                                onChange={(e) =>
                                  updateSectionDraft('transformation', (p) => ({
                                    ...p,
                                    comparisonRows: p.comparisonRows.map((r, i) =>
                                      i === idx ? { ...r, model2026: e.target.value } : r,
                                    ),
                                  }))
                                }
                                className={TEXTAREA_CLASS}
                              />
                            </div>
                            <div className="sm:col-span-4">
                              <label className={LABEL_CLASS}>2035 (3D)</label>
                              <textarea
                                value={row.model2035}
                                onChange={(e) =>
                                  updateSectionDraft('transformation', (p) => ({
                                    ...p,
                                    comparisonRows: p.comparisonRows.map((r, i) =>
                                      i === idx ? { ...r, model2035: e.target.value } : r,
                                    ),
                                  }))
                                }
                                className={TEXTAREA_CLASS}
                              />
                            </div>
                            <div className="sm:col-span-1 flex items-end justify-end">
                              {draft.transformation.comparisonRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSectionDraft('transformation', (p) => ({
                                      ...p,
                                      comparisonRows: p.comparisonRows.filter((_, i) => i !== idx),
                                    }))
                                  }
                                  className="p-2 text-[#8a8f98] hover:text-rose-400 cursor-pointer"
                                  aria-label="Vergleichszeile entfernen"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 6: DISTRIBUTION */}
                {activeTab === 'distribution' && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 space-y-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                        <PieChart className="h-4 w-4 text-emerald-400" />
                        <span>Sektion 04 · Prozentverteilung &amp; Kausalketten</span>
                      </h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={LABEL_CLASS}>Eyebrow</label>
                          <input
                            type="text"
                            value={draft.distribution.eyebrow}
                            onChange={(e) =>
                              updateSectionDraft('distribution', (p) => ({
                                ...p,
                                eyebrow: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Überschrift</label>
                          <input
                            type="text"
                            value={draft.distribution.headline}
                            onChange={(e) =>
                              updateSectionDraft('distribution', (p) => ({
                                ...p,
                                headline: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={LABEL_CLASS}>Einleitungstext</label>
                          <textarea
                            value={draft.distribution.description}
                            onChange={(e) =>
                              updateSectionDraft('distribution', (p) => ({
                                ...p,
                                description: e.target.value,
                              }))
                            }
                            className={TEXTAREA_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Bilanz-Fußzeile</label>
                          <input
                            type="text"
                            value={draft.distribution.ledgerFooterLabel}
                            onChange={(e) =>
                              updateSectionDraft('distribution', (p) => ({
                                ...p,
                                ledgerFooterLabel: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {draft.distribution.causalShifts.map((shift, idx) => (
                        <div
                          key={shift.number + idx}
                          className="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 space-y-4"
                        >
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                            <div>
                              <label className={LABEL_CLASS}>Nr.</label>
                              <input
                                type="text"
                                value={shift.number}
                                onChange={(e) =>
                                  updateSectionDraft('distribution', (p) => ({
                                    ...p,
                                    causalShifts: p.causalShifts.map((s, i) =>
                                      i === idx ? { ...s, number: e.target.value } : s,
                                    ),
                                  }))
                                }
                                className={`${INPUT_CLASS} font-mono-tabular`}
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className={LABEL_CLASS}>Faktor-Tag</label>
                              <input
                                type="text"
                                value={shift.tag}
                                onChange={(e) =>
                                  updateSectionDraft('distribution', (p) => ({
                                    ...p,
                                    causalShifts: p.causalShifts.map((s, i) =>
                                      i === idx ? { ...s, tag: e.target.value } : s,
                                    ),
                                  }))
                                }
                                className={INPUT_CLASS}
                              />
                            </div>
                            <div>
                              <label className={LABEL_CLASS}>Übergang</label>
                              <input
                                type="text"
                                value={shift.transition}
                                onChange={(e) =>
                                  updateSectionDraft('distribution', (p) => ({
                                    ...p,
                                    causalShifts: p.causalShifts.map((s, i) =>
                                      i === idx ? { ...s, transition: e.target.value } : s,
                                    ),
                                  }))
                                }
                                className={`${INPUT_CLASS} font-mono-tabular`}
                              />
                            </div>
                            <div>
                              <label className={LABEL_CLASS}>Delta</label>
                              <input
                                type="text"
                                value={shift.delta}
                                onChange={(e) =>
                                  updateSectionDraft('distribution', (p) => ({
                                    ...p,
                                    causalShifts: p.causalShifts.map((s, i) =>
                                      i === idx ? { ...s, delta: e.target.value } : s,
                                    ),
                                  }))
                                }
                                className={`${INPUT_CLASS} font-mono-tabular`}
                              />
                            </div>
                            <div>
                              <label className={LABEL_CLASS}>Farbe</label>
                              <input
                                type="color"
                                value={shift.accentColor}
                                onChange={(e) =>
                                  updateSectionDraft('distribution', (p) => ({
                                    ...p,
                                    causalShifts: p.causalShifts.map((s, i) =>
                                      i === idx ? { ...s, accentColor: e.target.value } : s,
                                    ),
                                  }))
                                }
                                className="h-9 w-full rounded border border-white/20 bg-transparent cursor-pointer"
                              />
                            </div>
                          </div>

                          <div>
                            <label className={LABEL_CLASS}>Leitfrage</label>
                            <input
                              type="text"
                              value={shift.question}
                              onChange={(e) =>
                                updateSectionDraft('distribution', (p) => ({
                                  ...p,
                                  causalShifts: p.causalShifts.map((s, i) =>
                                    i === idx ? { ...s, question: e.target.value } : s,
                                  ),
                                }))
                              }
                              className={INPUT_CLASS}
                            />
                          </div>

                          {shift.subGroups ? (
                            <div className="space-y-3">
                              {shift.subGroups.map((sg, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="rounded-xl border border-white/[0.08] bg-[#07090d] p-4 space-y-2.5"
                                >
                                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                                    <div className="sm:col-span-2">
                                      <label className={LABEL_CLASS}>Milieu-Name</label>
                                      <input
                                        type="text"
                                        value={sg.name}
                                        onChange={(e) =>
                                          updateSectionDraft('distribution', (p) => ({
                                            ...p,
                                            causalShifts: p.causalShifts.map((s, i) =>
                                              i === idx
                                                ? {
                                                    ...s,
                                                    subGroups: s.subGroups?.map((g, gi) =>
                                                      gi === sIdx
                                                        ? { ...g, name: e.target.value }
                                                        : g,
                                                    ),
                                                  }
                                                : s,
                                            ),
                                          }))
                                        }
                                        className={INPUT_CLASS}
                                      />
                                    </div>
                                    <div>
                                      <label className={LABEL_CLASS}>Anteil</label>
                                      <input
                                        type="text"
                                        value={sg.share}
                                        onChange={(e) =>
                                          updateSectionDraft('distribution', (p) => ({
                                            ...p,
                                            causalShifts: p.causalShifts.map((s, i) =>
                                              i === idx
                                                ? {
                                                    ...s,
                                                    subGroups: s.subGroups?.map((g, gi) =>
                                                      gi === sIdx
                                                        ? { ...g, share: e.target.value }
                                                        : g,
                                                    ),
                                                  }
                                                : s,
                                            ),
                                          }))
                                        }
                                        className={`${INPUT_CLASS} font-mono-tabular`}
                                      />
                                    </div>
                                    <div>
                                      <label className={LABEL_CLASS}>Farbe</label>
                                      <input
                                        type="color"
                                        value={sg.color}
                                        onChange={(e) =>
                                          updateSectionDraft('distribution', (p) => ({
                                            ...p,
                                            causalShifts: p.causalShifts.map((s, i) =>
                                              i === idx
                                                ? {
                                                    ...s,
                                                    subGroups: s.subGroups?.map((g, gi) =>
                                                      gi === sIdx
                                                        ? { ...g, color: e.target.value }
                                                        : g,
                                                    ),
                                                  }
                                                : s,
                                            ),
                                          }))
                                        }
                                        className="h-9 w-full rounded border border-white/20 bg-transparent cursor-pointer"
                                      />
                                    </div>
                                  </div>
                                  <textarea
                                    value={sg.text}
                                    onChange={(e) =>
                                      updateSectionDraft('distribution', (p) => ({
                                        ...p,
                                        causalShifts: p.causalShifts.map((s, i) =>
                                          i === idx
                                            ? {
                                                ...s,
                                                subGroups: s.subGroups?.map((g, gi) =>
                                                  gi === sIdx
                                                    ? { ...g, text: e.target.value }
                                                    : g,
                                                ),
                                              }
                                            : s,
                                        ),
                                      }))
                                    }
                                    className={TEXTAREA_CLASS}
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div>
                                <label className={LABEL_CLASS}>Ausgangslage 2026</label>
                                <textarea
                                  value={shift.baseline2026 ?? ''}
                                  onChange={(e) =>
                                    updateSectionDraft('distribution', (p) => ({
                                      ...p,
                                      causalShifts: p.causalShifts.map((s, i) =>
                                        i === idx ? { ...s, baseline2026: e.target.value } : s,
                                      ),
                                    }))
                                  }
                                  className={TEXTAREA_CLASS}
                                />
                              </div>
                              <div>
                                <label className={LABEL_CLASS}>Entwicklung-Label</label>
                                <input
                                  type="text"
                                  value={shift.developmentLabel ?? ''}
                                  onChange={(e) =>
                                    updateSectionDraft('distribution', (p) => ({
                                      ...p,
                                      causalShifts: p.causalShifts.map((s, i) =>
                                        i === idx
                                          ? { ...s, developmentLabel: e.target.value }
                                          : s,
                                      ),
                                    }))
                                  }
                                  className={INPUT_CLASS}
                                />
                              </div>
                              <div>
                                <label className={LABEL_CLASS}>Entwicklung bis 2035</label>
                                <textarea
                                  value={shift.development2035 ?? ''}
                                  onChange={(e) =>
                                    updateSectionDraft('distribution', (p) => ({
                                      ...p,
                                      causalShifts: p.causalShifts.map((s, i) =>
                                        i === idx
                                          ? { ...s, development2035: e.target.value }
                                          : s,
                                      ),
                                    }))
                                  }
                                  className={TEXTAREA_CLASS}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 7: SELF TEST */}
                {activeTab === 'self_test' && (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 space-y-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                        <ListChecks className="h-4 w-4 text-emerald-400" />
                        <span>Selbsttest Überschriften &amp; Antwort-Skala (1–5)</span>
                      </h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className={LABEL_CLASS}>Eyebrow</label>
                          <input
                            type="text"
                            value={draft.self_test.eyebrow}
                            onChange={(e) =>
                              updateSectionDraft('self_test', (p) => ({
                                ...p,
                                eyebrow: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLASS}>Überschrift</label>
                          <input
                            type="text"
                            value={draft.self_test.headline}
                            onChange={(e) =>
                              updateSectionDraft('self_test', (p) => ({
                                ...p,
                                headline: e.target.value,
                              }))
                            }
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>Beschreibung</label>
                        <textarea
                          value={draft.self_test.description}
                          onChange={(e) =>
                            updateSectionDraft('self_test', (p) => ({
                              ...p,
                              description: e.target.value,
                            }))
                          }
                          className={TEXTAREA_CLASS}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                        {draft.self_test.scaleOptions.map((opt, idx) => (
                          <div
                            key={opt.value}
                            className="rounded-xl border border-white/[0.08] bg-[#07090d] p-3 space-y-2"
                          >
                            <div className="font-mono-tabular text-xs font-semibold text-emerald-400">
                              Stufe {opt.value}
                            </div>
                            <input
                              type="text"
                              value={opt.label}
                              onChange={(e) =>
                                updateSectionDraft('self_test', (p) => ({
                                  ...p,
                                  scaleOptions: p.scaleOptions.map((o, i) =>
                                    i === idx ? { ...o, label: e.target.value } : o,
                                  ),
                                }))
                              }
                              className={INPUT_CLASS}
                            />
                            <input
                              type="text"
                              value={opt.shortLabel}
                              onChange={(e) =>
                                updateSectionDraft('self_test', (p) => ({
                                  ...p,
                                  scaleOptions: p.scaleOptions.map((o, i) =>
                                    i === idx ? { ...o, shortLabel: e.target.value } : o,
                                  ),
                                }))
                              }
                              className={`${INPUT_CLASS} text-xs`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 space-y-4">
                      <h3 className="text-sm font-semibold text-white">
                        10 Selbsttest-Fragen
                      </h3>
                      <div className="space-y-3">
                        {draft.self_test.questions.map((q, idx) => (
                          <div
                            key={q.id}
                            className="rounded-xl border border-white/[0.08] bg-[#07090d] p-4 space-y-3"
                          >
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="font-mono-tabular text-xs font-semibold text-emerald-400">
                                Frage {q.id}
                              </span>
                              <select
                                value={q.dimension}
                                onChange={(e) =>
                                  updateSectionDraft('self_test', (p) => ({
                                    ...p,
                                    questions: p.questions.map((item, i) =>
                                      i === idx
                                        ? {
                                            ...item,
                                            dimension: e.target.value as 'X' | 'Y' | 'Z',
                                          }
                                        : item,
                                    ),
                                  }))
                                }
                                className={`${INPUT_CLASS} max-w-[110px]`}
                              >
                                <option value="X">Achse X</option>
                                <option value="Y">Achse Y</option>
                                <option value="Z">Achse Z</option>
                              </select>
                              <input
                                type="text"
                                value={q.dimensionLabel}
                                onChange={(e) =>
                                  updateSectionDraft('self_test', (p) => ({
                                    ...p,
                                    questions: p.questions.map((item, i) =>
                                      i === idx
                                        ? { ...item, dimensionLabel: e.target.value }
                                        : item,
                                    ),
                                  }))
                                }
                                className={`${INPUT_CLASS} flex-1 min-w-[200px]`}
                              />
                              <label className="inline-flex items-center gap-2 text-xs text-[#cbd5e1] cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={q.inverted}
                                  onChange={(e) =>
                                    updateSectionDraft('self_test', (p) => ({
                                      ...p,
                                      questions: p.questions.map((item, i) =>
                                        i === idx
                                          ? { ...item, inverted: e.target.checked }
                                          : item,
                                      ),
                                    }))
                                  }
                                  className="h-4 w-4 accent-emerald-400 rounded cursor-pointer"
                                />
                                <span>Invertiert (6 − Antwort)</span>
                              </label>
                            </div>
                            <textarea
                              value={q.text}
                              onChange={(e) =>
                                updateSectionDraft('self_test', (p) => ({
                                  ...p,
                                  questions: p.questions.map((item, i) =>
                                    i === idx ? { ...item, text: e.target.value } : item,
                                  ),
                                }))
                              }
                              className={TEXTAREA_CLASS}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/[0.09] bg-white/[0.02] p-5 space-y-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Database className="h-4 w-4 text-emerald-400" />
                        <span>Ziel-Koordinaten (0–100) &amp; Ergebnistexte pro Milieu</span>
                      </h3>
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {VALID_MILIEU_ID_LIST.map((mId) => {
                          const milieuObj = draft.milieus_2035.milieus.find(
                            (m) => m.id === mId,
                          );
                          const coord = draft.self_test.idealCoords[mId];
                          return (
                            <div
                              key={mId}
                              className="rounded-xl border border-white/[0.08] bg-[#07090d] p-4 space-y-3"
                            >
                              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: milieuObj?.colorHex ?? '#fff' }}
                                />
                                <span>{milieuObj?.name ?? mId}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className={LABEL_CLASS}>Ideal X</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={coord.x}
                                    onChange={(e) =>
                                      updateSectionDraft('self_test', (p) => ({
                                        ...p,
                                        idealCoords: {
                                          ...p.idealCoords,
                                          [mId]: {
                                            ...p.idealCoords[mId],
                                            x: Number(e.target.value) || 0,
                                          },
                                        },
                                      }))
                                    }
                                    className={`${INPUT_CLASS} font-mono-tabular`}
                                  />
                                </div>
                                <div>
                                  <label className={LABEL_CLASS}>Ideal Y</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={coord.y}
                                    onChange={(e) =>
                                      updateSectionDraft('self_test', (p) => ({
                                        ...p,
                                        idealCoords: {
                                          ...p.idealCoords,
                                          [mId]: {
                                            ...p.idealCoords[mId],
                                            y: Number(e.target.value) || 0,
                                          },
                                        },
                                      }))
                                    }
                                    className={`${INPUT_CLASS} font-mono-tabular`}
                                  />
                                </div>
                                <div>
                                  <label className={LABEL_CLASS}>Ideal Z</label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={coord.z}
                                    onChange={(e) =>
                                      updateSectionDraft('self_test', (p) => ({
                                        ...p,
                                        idealCoords: {
                                          ...p.idealCoords,
                                          [mId]: {
                                            ...p.idealCoords[mId],
                                            z: Number(e.target.value) || 0,
                                          },
                                        },
                                      }))
                                    }
                                    className={`${INPUT_CLASS} font-mono-tabular`}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className={LABEL_CLASS}>Ergebnis-Deutungssatz</label>
                                <textarea
                                  value={draft.self_test.secondSentences[mId]}
                                  onChange={(e) =>
                                    updateSectionDraft('self_test', (p) => ({
                                      ...p,
                                      secondSentences: {
                                        ...p.secondSentences,
                                        [mId]: e.target.value,
                                      },
                                    }))
                                  }
                                  className={TEXTAREA_CLASS}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>

              {/* Sticky Bottom Action Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.09] bg-[#0e1015] px-5 py-3.5 sm:px-8">
                <div className="flex flex-wrap items-center gap-2">
                  {confirmReset ? (
                    <div className="flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1">
                      <span className="text-xs font-medium text-rose-200">
                        Sektion auf Standard zurücksetzen?
                      </span>
                      <button
                        type="button"
                        onClick={() => void handleResetActiveSection()}
                        disabled={saveBusy}
                        className="rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-rose-400 cursor-pointer"
                      >
                        Ja, zurücksetzen
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="text-xs text-[#cbd5e1] hover:text-white cursor-pointer px-1"
                      >
                        Abbrechen
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmReset(true)}
                      disabled={saveBusy}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-[#cbd5e1] hover:bg-white/[0.08] cursor-pointer transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Sektion zurücksetzen</span>
                    </button>
                  )}

                  {saveStatus && (
                    <span
                      data-testid="admin-save-status"
                      className={`text-xs font-medium ${
                        saveStatus.type === 'success'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {saveStatus.text}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {dirtyCount > 1 && (
                    <button
                      type="button"
                      onClick={() => void handleSaveAllDirty()}
                      disabled={saveBusy}
                      data-testid="admin-save-all-btn"
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/25 cursor-pointer transition-colors"
                    >
                      <Save className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Alle {dirtyCount} speichern</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleSaveCurrent()}
                    disabled={saveBusy}
                    data-testid="admin-save-section-btn"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#f7f8f8] px-5 py-2 text-xs sm:text-[13px] font-semibold text-[#040406] hover:bg-white disabled:opacity-55 cursor-pointer transition-colors shadow-sm"
                  >
                    <Save className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {saveBusy ? 'Speichere…' : 'Sektion speichern'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
    </main>
  );
}
