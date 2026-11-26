import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import type { MilieuId } from '../data/milieus';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrors';
import {
  aggregateSurveyResults,
  clampSurveyCoord,
  CLIENT_ID_REGEX,
  generateSurveyCode,
  isValidSurveyCode,
  normalizeSurveyCode,
  VALID_MILIEU_IDS,
  type AggregatedMilieuBucket,
  type LiveSurveyAggregation,
  type LiveSurveySession,
  type SurveyResponseDoc,
} from '../utils/liveSurveyMath';

export {
  aggregateSurveyResults,
  generateSurveyCode,
  isValidSurveyCode,
  normalizeSurveyCode,
  type AggregatedMilieuBucket,
  type LiveSurveyAggregation,
  type LiveSurveySession,
  type SurveyResponseDoc,
};

const TITLE_MAX_LENGTH = 80;
const CLIENT_STORAGE_KEY = 'sinus_2035_survey_client_id';

export function getOrCreateClientId(): string {
  if (typeof window !== 'undefined') {
    const existing = window.localStorage.getItem(CLIENT_STORAGE_KEY);
    if (
      existing &&
      existing.length >= 8 &&
      existing.length <= 64 &&
      CLIENT_ID_REGEX.test(existing)
    ) {
      return existing;
    }
  }

  let generated = 'dev_';
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    generated += crypto.randomUUID().replace(/-/g, '').slice(0, 24);
  } else {
    generated += `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  }
  const safeId = generated.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CLIENT_STORAGE_KEY, safeId);
  }
  return safeId;
}

function sanitizeTitle(rawTitle?: string): string {
  const trimmed = (rawTitle ?? '').trim().slice(0, TITLE_MAX_LENGTH);
  return trimmed.length > 0 ? trimmed : 'Live-Umfrage SINUS 2035';
}

export async function createLiveSurvey(
  rawTitle?: string,
): Promise<LiveSurveySession> {
  const title = sanitizeTitle(rawTitle);

  for (let attempt = 0; attempt < 4; attempt++) {
    const code = generateSurveyCode();
    const docPath = `surveys/${code}`;
    const ref = doc(db, 'surveys', code);

    let alreadyExists = false;
    try {
      const snap = await getDoc(ref);
      alreadyExists = snap.exists();
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, docPath);
    }

    if (alreadyExists) continue;

    try {
      await setDoc(ref, {
        code,
        title,
        status: 'active',
        createdAt: serverTimestamp(),
      });
      return { code, title, status: 'active' };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  }

  throw new Error('Es konnte kein eindeutiger Umfrage-Code erzeugt werden.');
}

export async function fetchLiveSurvey(
  rawCode: string,
): Promise<LiveSurveySession | null> {
  const code = normalizeSurveyCode(rawCode);
  if (!isValidSurveyCode(code)) {
    return null;
  }

  const docPath = `surveys/${code}`;
  try {
    const snap = await getDoc(doc(db, 'surveys', code));
    if (!snap.exists()) return null;
    const data = snap.data();
    if (data.status !== 'active') return null;
    return {
      code: String(data.code || code),
      title: String(data.title || 'Live-Umfrage SINUS 2035'),
      status: 'active',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

export async function checkAlreadySubmitted(
  rawCode: string,
): Promise<SurveyResponseDoc | null> {
  const code = normalizeSurveyCode(rawCode);
  if (!isValidSurveyCode(code)) return null;
  const clientId = getOrCreateClientId();
  const docPath = `surveys/${code}/responses/${clientId}`;

  try {
    const snap = await getDoc(doc(db, 'surveys', code, 'responses', clientId));
    if (!snap.exists()) return null;
    const data = snap.data();
    const milieuId = data.milieuId as MilieuId;
    if (!VALID_MILIEU_IDS.has(milieuId)) return null;
    return {
      surveyCode: code,
      clientId,
      milieuId,
      uX: Number(data.uX ?? 50),
      uY: Number(data.uY ?? 50),
      uZ: Number(data.uZ ?? 50),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

export async function submitLiveSurveyResponse(params: {
  code: string;
  milieuId: MilieuId;
  uX: number;
  uY: number;
  uZ: number;
}): Promise<SurveyResponseDoc> {
  const code = normalizeSurveyCode(params.code);
  if (!isValidSurveyCode(code)) {
    throw new Error('Ungültiger Umfrage-Code.');
  }
  if (!VALID_MILIEU_IDS.has(params.milieuId)) {
    throw new Error('Ungültiges Milieu.');
  }

  const clientId = getOrCreateClientId();
  const uX = clampSurveyCoord(params.uX);
  const uY = clampSurveyCoord(params.uY);
  const uZ = clampSurveyCoord(params.uZ);
  const docPath = `surveys/${code}/responses/${clientId}`;

  try {
    await setDoc(doc(db, 'surveys', code, 'responses', clientId), {
      surveyCode: code,
      clientId,
      milieuId: params.milieuId,
      uX,
      uY,
      uZ,
      createdAt: serverTimestamp(),
    });
    return {
      surveyCode: code,
      clientId,
      milieuId: params.milieuId,
      uX,
      uY,
      uZ,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export function subscribeToSurveyResponses(
  rawCode: string,
  onUpdate: (responses: SurveyResponseDoc[]) => void,
  onSyncError?: (message: string) => void,
): () => void {
  const code = normalizeSurveyCode(rawCode);
  if (!isValidSurveyCode(code)) {
    return () => {};
  }

  const responsesPath = `surveys/${code}/responses`;
  const q = query(
    collection(db, 'surveys', code, 'responses'),
    where('surveyCode', '==', code),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const rows: SurveyResponseDoc[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const milieuId = d.milieuId as MilieuId;
        if (VALID_MILIEU_IDS.has(milieuId)) {
          rows.push({
            surveyCode: code,
            clientId: String(d.clientId || docSnap.id),
            milieuId,
            uX: clampSurveyCoord(Number(d.uX ?? 50)),
            uY: clampSurveyCoord(Number(d.uY ?? 50)),
            uZ: clampSurveyCoord(Number(d.uZ ?? 50)),
          });
        }
      });
      onUpdate(rows);
    },
    (error) => {
      onSyncError?.('Verbindung zur Live-Umfrage unterbrochen.');
      handleFirestoreError(error, OperationType.LIST, responsesPath);
    },
  );
}
