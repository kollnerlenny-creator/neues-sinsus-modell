import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  CONTENT_SECTION_IDS,
  createDefaultSiteContent,
  type ContentSectionId,
  type SiteContentState,
} from '../data/siteContentDefaults';
import { auth } from '../firebase';
import {
  checkUserIsAdmin,
  resetSiteContentSection,
  saveSiteContentSection,
  sendAdminVerificationEmail,
  signInAdminWithEmailPassword,
  signInAdminWithGoogle,
  signOutAdmin,
  subscribeToSiteContent,
} from '../services/siteContent';

export interface AdminSaveStatus {
  type: 'success' | 'error';
  text: string;
}

const EMPTY_DIRTY_MAP: Record<ContentSectionId, boolean> = {
  meta: false,
  milieus_2035: false,
  milieus_2026: false,
  axes_rifts: false,
  transformation: false,
  distribution: false,
  self_test: false,
};

interface ContentContextValue {
  content: SiteContentState;
  publishedContent: SiteContentState;
  draft: SiteContentState;
  dirtyMap: Record<ContentSectionId, boolean>;
  dirtyCount: number;
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  adminCheckLoading: boolean;
  rulesMissingWarning: boolean;
  adminModeActive: boolean;
  setAdminModeActive: (active: boolean) => void;
  isAdminEditMode: boolean;
  adminTestInteraction: boolean;
  setAdminTestInteraction: (testing: boolean) => void;
  canInlineEdit: boolean;
  saveBusy: boolean;
  saveStatus: AdminSaveStatus | null;
  clearSaveStatus: () => void;
  updateSectionDraft: <K extends ContentSectionId>(
    sectionId: K,
    updater: (prev: SiteContentState[K]) => SiteContentState[K],
  ) => void;
  saveAllDirtySections: () => Promise<void>;
  discardDraftChanges: () => void;
  signInWithGoogle: () => Promise<User>;
  signInWithEmailPassword: (email: string, password: string) => Promise<User>;
  sendVerificationEmail: () => Promise<void>;
  refreshAdminStatus: () => Promise<boolean>;
  signOut: () => Promise<void>;
  saveSection: <K extends ContentSectionId>(
    sectionId: K,
    data: SiteContentState[K],
  ) => Promise<void>;
  resetSection: (sectionId: ContentSectionId) => Promise<void>;
  refreshRulesStatus: () => void;
}

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [publishedContent, setPublishedContent] = useState<SiteContentState>(() =>
    createDefaultSiteContent(),
  );
  const [draft, setDraft] = useState<SiteContentState>(() =>
    createDefaultSiteContent(),
  );
  const [dirtyMap, setDirtyMap] =
    useState<Record<ContentSectionId, boolean>>(EMPTY_DIRTY_MAP);

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(false);
  const [rulesMissingWarning, setRulesMissingWarning] = useState(false);
  const [subVersion, setSubVersion] = useState(0);
  const [, setAuthRefreshTick] = useState(0);

  const [adminModeActive, setAdminModeActive] = useState(false);
  const [adminTestInteraction, setAdminTestInteraction] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveStatus, setSaveStatus] = useState<AdminSaveStatus | null>(null);

  // 1. Track Firebase Auth state and verify admin authorization
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!active) return;
      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser) {
        setIsAdmin(false);
        setAdminCheckLoading(false);
        return;
      }

      setAdminCheckLoading(true);
      checkUserIsAdmin(nextUser)
        .then((allowed) => {
          if (active) setIsAdmin(allowed);
        })
        .catch(() => {
          if (active) setIsAdmin(false);
        })
        .finally(() => {
          if (active) setAdminCheckLoading(false);
        });
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // 2. Subscribe to real-time Firestore CMS content sections
  useEffect(() => {
    const unsubscribe = subscribeToSiteContent(
      (sectionId, data) => {
        setPublishedContent((prev) => ({
          ...prev,
          [sectionId]: data,
        }));
        setDraft((prev) => {
          if (dirtyMap[sectionId]) return prev;
          return {
            ...prev,
            [sectionId]: structuredClone(data),
          };
        });
      },
      (missing) => {
        setRulesMissingWarning(missing);
      },
    );
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subVersion]);

  // Keep clean sections in draft synced whenever publishedContent updates
  useEffect(() => {
    setDraft((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const id of CONTENT_SECTION_IDS) {
        if (!dirtyMap[id]) {
          (next as unknown as Record<ContentSectionId, unknown>)[id] =
            structuredClone(publishedContent[id]);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [publishedContent, dirtyMap]);

  const refreshRulesStatus = useCallback(() => {
    setSubVersion((v) => v + 1);
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Nicht angemeldet.');
    }
    await sendAdminVerificationEmail(currentUser);
  }, []);

  const refreshAdminStatus = useCallback(async (): Promise<boolean> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setUser(null);
      setIsAdmin(false);
      return false;
    }
    setAdminCheckLoading(true);
    try {
      await currentUser.reload();
      await currentUser.getIdToken(true);
      const updatedUser = auth.currentUser;
      setUser(updatedUser);
      setAuthRefreshTick((t) => t + 1);
      if (updatedUser) {
        const allowed = await checkUserIsAdmin(updatedUser);
        setIsAdmin(allowed);
        return allowed;
      }
      setIsAdmin(false);
      return false;
    } finally {
      setAdminCheckLoading(false);
    }
  }, []);

  const clearSaveStatus = useCallback(() => {
    setSaveStatus(null);
  }, []);

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
    },
    [],
  );

  const saveSection = useCallback(
    async <K extends ContentSectionId>(
      sectionId: K,
      data: SiteContentState[K],
    ) => {
      const saved = await saveSiteContentSection(sectionId, data);
      setPublishedContent((prev) => ({
        ...prev,
        [sectionId]: saved,
      }));
      setDraft((prev) => ({
        ...prev,
        [sectionId]: structuredClone(saved),
      }));
      setDirtyMap((prev) => ({ ...prev, [sectionId]: false }));
      setRulesMissingWarning(false);
    },
    [],
  );

  const saveAllDirtySections = useCallback(async () => {
    const dirtyIds = CONTENT_SECTION_IDS.filter((id) => dirtyMap[id]);
    if (dirtyIds.length === 0) return;

    setSaveBusy(true);
    setSaveStatus(null);
    try {
      for (const id of dirtyIds) {
        await saveSection(id, draft[id]);
      }
      setSaveStatus({
        type: 'success',
        text: `${dirtyIds.length} geänderte Sektion(en) gespeichert.`,
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
  }, [dirtyMap, draft, saveSection]);

  const discardDraftChanges = useCallback(() => {
    setDraft(structuredClone(publishedContent));
    setDirtyMap({ ...EMPTY_DIRTY_MAP });
    setSaveStatus({
      type: 'success',
      text: 'Ungespeicherte Änderungen verworfen.',
    });
  }, [publishedContent]);

  const resetSection = useCallback(async (sectionId: ContentSectionId) => {
    await resetSiteContentSection(sectionId);
    const defaults = createDefaultSiteContent();
    setPublishedContent((prev) => ({
      ...prev,
      [sectionId]: defaults[sectionId],
    }));
    setDraft((prev) => ({
      ...prev,
      [sectionId]: structuredClone(defaults[sectionId]),
    }));
    setDirtyMap((prev) => ({ ...prev, [sectionId]: false }));
  }, []);

  const dirtyCount = useMemo(
    () => CONTENT_SECTION_IDS.filter((id) => dirtyMap[id]).length,
    [dirtyMap],
  );

  const isAdminEditMode = adminModeActive && isAdmin;
  const canInlineEdit = isAdminEditMode && !adminTestInteraction;

  return (
    <ContentContext.Provider
      value={{
        content: isAdminEditMode ? draft : publishedContent,
        publishedContent,
        draft,
        dirtyMap,
        dirtyCount,
        user,
        authReady,
        isAdmin,
        adminCheckLoading,
        rulesMissingWarning,
        adminModeActive,
        setAdminModeActive,
        isAdminEditMode,
        adminTestInteraction,
        setAdminTestInteraction,
        canInlineEdit,
        saveBusy,
        saveStatus,
        clearSaveStatus,
        updateSectionDraft,
        saveAllDirtySections,
        discardDraftChanges,
        signInWithGoogle: signInAdminWithGoogle,
        signInWithEmailPassword: signInAdminWithEmailPassword,
        sendVerificationEmail,
        refreshAdminStatus,
        signOut: signOutAdmin,
        saveSection,
        resetSection,
        refreshRulesStatus,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}

export function useSiteContent(): ContentContextValue {
  const ctx = useContext(ContentContext);
  if (!ctx) {
    throw new Error('useSiteContent must be used inside ContentProvider');
  }
  return ctx;
}
