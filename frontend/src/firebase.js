import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKey",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "playmysong-998d4.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "playmysong-998d4",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "playmysong-998d4.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "00000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:00000000000:web:00000000000000"
};

let app;
let storage;

try {
  app = initializeApp(firebaseConfig);
  storage = getStorage(app);
} catch (e) {
  console.log('Firebase not configured:', e.message);
}

export async function uploadMusicFile(file, establishmentId) {
  if (!storage) {
    throw new Error('Firebase Storage non configuré. Utilisez YouTube ou un fichier local.');
  }
  
  const fileName = `${establishmentId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, `music/${fileName}`);
  
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  
  return downloadURL;
}

export { storage, ref, getDownloadURL };
