import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
];

/**
 * Creates a GoogleAuthProvider configured with the Drive read-only scope.
 * Accepts optional prompt override (e.g. 'select_account' to allow selecting a second Google account).
 */
export function createGoogleProvider(selectAccount = false) {
  const provider = new GoogleAuthProvider();
  SCOPES.forEach((scope) => provider.addScope(scope));
  if (selectAccount) {
    provider.setCustomParameters({
      prompt: 'select_account',
    });
  }
  return provider;
}

/**
 * Sign in using Firebase popup and return the Firebase User & the Google Drive Access Token.
 */
export async function signInWithGoogleDrive(selectAccount = false): Promise<{
  user: User;
  accessToken: string;
}> {
  const provider = createGoogleProvider(selectAccount);
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);

  if (!credential?.accessToken) {
    throw new Error('Não foi possível obter o token de acesso do Google Drive.');
  }

  return {
    user: result.user,
    accessToken: credential.accessToken,
  };
}

export async function logoutFirebase() {
  await signOut(auth);
}
