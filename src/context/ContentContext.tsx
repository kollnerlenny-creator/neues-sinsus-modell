import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  createDefaultSiteContent,
  type ContentSectionId,
  type SiteContentState,
} from '../data/siteContentDefaults';
import { auth } from '../firebase';
import {
  checkUserIsAdmin,
  resetSiteContentSection,
  saveSiteContentSection,
  signInAdminWithGoogle,
  signOutAdmin,
  subscribeToSiteContent,
} from '../services/siteContent';

interface ContentContextValue {
  content: SiteContentState;
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  adminCheckLoading: boolean;
  rulesMissingWarning: boolean;
  signInWithGoogle: () => Promise<User>;
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
  const [content, setContent] = useState<SiteContentState>(() =>
    createDefaultSiteContent(),
  );
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(false);
  const [rulesMissingWarning, setRulesMissingWarning] = useState(false);
  const [subVersion, setSubVersion] = useState(0);

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
        setContent((prev) => ({
          ...prev,
          [sectionId]: data,
        }));
      },
      (missing) => {
        setRulesMissingWarning(missing);
      },
    );
    return () => unsubscribe();
  }, [subVersion]);

  const refreshRulesStatus = useCallback(() => {
    setSubVersion((v) => v + 1);
  }, []);

  const saveSection = useCallback(
    async <K extends ContentSectionId>(
      sectionId: K,
      data: SiteContentState[K],
    ) => {
      const saved = await saveSiteContentSection(sectionId, data);
      setContent((prev) => ({
        ...prev,
        [sectionId]: saved,
      }));
      setRulesMissingWarning(false);
    },
    [],
  );

  const resetSection = useCallback(async (sectionId: ContentSectionId) => {
    await resetSiteContentSection(sectionId);
    const defaults = createDefaultSiteContent();
    setContent((prev) => ({
      ...prev,
      [sectionId]: defaults[sectionId],
    }));
  }, []);

  return (
    <ContentContext.Provider
      value={{
        content,
        user,
        authReady,
        isAdmin,
        adminCheckLoading,
        rulesMissingWarning,
        signInWithGoogle: signInAdminWithGoogle,
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
