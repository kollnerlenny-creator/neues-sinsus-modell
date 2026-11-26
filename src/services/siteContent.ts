import {
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  CONTENT_SECTION_IDS,
  createDefaultSiteContent,
  sanitizeSectionData,
  type ContentSectionId,
  type SiteContentState,
} from '../data/siteContentDefaults';
import { auth, db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrors';

export const ADMIN_EMAILS = [
  'm91681001@gmail.com',
  'lenny.koellner@gmail.com',
] as const;

export const PRIMARY_ADMIN_EMAIL = ADMIN_EMAILS[0];

export function isAuthorizedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase() as (typeof ADMIN_EMAILS)[number]);
}

export async function signInAdminWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function signInAdminWithEmailPassword(
  email: string,
  password: string,
): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

export async function sendAdminVerificationEmail(user: User): Promise<void> {
  await sendEmailVerification(user);
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

export async function checkUserIsAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  if (user.emailVerified && isAuthorizedAdminEmail(user.email)) {
    return true;
  }

  const adminDocPath = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch (error) {
    const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    if (msg.includes('permission') || msg.includes('insufficient')) {
      return false;
    }
    handleFirestoreError(error, OperationType.GET, adminDocPath);
  }
}

export function subscribeToSiteContent(
  onSectionLoaded: <K extends ContentSectionId>(
    sectionId: K,
    data: SiteContentState[K],
  ) => void,
  onRulesStatus?: (rulesMissing: boolean) => void,
): () => void {
  let cancelled = false;
  const unsubs: Array<() => void> = [];
  const defaults = createDefaultSiteContent();

  async function initSubscriptions() {
    try {
      // Probe one valid section doc first to check whether external Firebase rules include /siteContent
      const probeRef = doc(db, 'siteContent', 'meta');
      await getDoc(probeRef);
      if (cancelled) return;
      onRulesStatus?.(false);

      for (const sectionId of CONTENT_SECTION_IDS) {
        const docPath = `siteContent/${sectionId}`;
        const ref = doc(db, 'siteContent', sectionId);
        const unsub = onSnapshot(
          ref,
          (snapshot) => {
            if (cancelled) return;
            if (!snapshot.exists()) {
              onSectionLoaded(sectionId, defaults[sectionId]);
              return;
            }
            const raw = snapshot.data() as SiteContentState[typeof sectionId];
            const clean = sanitizeSectionData(sectionId, raw);
            onSectionLoaded(sectionId, clean);
          },
          (error) => {
            const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
            if (msg.includes('permission') || msg.includes('insufficient')) {
              onRulesStatus?.(true);
              return;
            }
            handleFirestoreError(error, OperationType.GET, docPath);
          },
        );
        unsubs.push(unsub);
      }
    } catch (error) {
      if (cancelled) return;
      const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      if (msg.includes('permission') || msg.includes('insufficient')) {
        onRulesStatus?.(true);
        return;
      }
      // Offline / network fallback keeps default editorial data active
      console.warn('SiteContent sync paused (using defaults):', msg);
    }
  }

  void initSubscriptions();

  return () => {
    cancelled = true;
    for (const unsub of unsubs) {
      unsub();
    }
  };
}

export async function saveSiteContentSection<K extends ContentSectionId>(
  sectionId: K,
  data: SiteContentState[K],
): Promise<SiteContentState[K]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Nicht angemeldet. Bitte zuerst anmelden.');
  }

  const sanitized = sanitizeSectionData(sectionId, data);
  const docPath = `siteContent/${sectionId}`;

  try {
    await setDoc(doc(db, 'siteContent', sectionId), {
      ...sanitized,
      updatedAt: serverTimestamp(),
      updatedBy: user.uid,
    });
    return sanitized;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function resetSiteContentSection(
  sectionId: ContentSectionId,
): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Nicht angemeldet. Bitte zuerst anmelden.');
  }
  const docPath = `siteContent/${sectionId}`;
  try {
    await deleteDoc(doc(db, 'siteContent', sectionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
