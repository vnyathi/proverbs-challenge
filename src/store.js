import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAozPmdmw30xQ9NtesETLPZgji2CSOEz8E",
  authDomain: "proverbs-challenge.firebaseapp.com",
  databaseURL: "https://proverbs-challenge-default-rtdb.firebaseio.com",
  projectId: "proverbs-challenge",
  storageBucket: "proverbs-challenge.firebasestorage.app",
  messagingSenderId: "311652557099",
  appId: "1:311652557099:web:226d30c3e23bab521b656e",
  measurementId: "G-ECEWR6TFG9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const ROOT = "proverbs/";

export const store = {
  get: async (key, shared) => {
    const path = (shared ? ROOT+"shared/" : ROOT+"priv/") + key.replace(/[:.]/g, "_");
    const snap = await get(ref(db, path));
    return snap.exists() ? { value: snap.val() } : null;
  },
  set: async (key, value, shared) => {
    const path = (shared ? ROOT+"shared/" : ROOT+"priv/") + key.replace(/[:.]/g, "_");
    await set(ref(db, path), value);
    return { key, value };
  },
  delete: async (key, shared) => {
    const path = (shared ? ROOT+"shared/" : ROOT+"priv/") + key.replace(/[:.]/g, "_");
    await remove(ref(db, path));
    return { deleted: true };
  },
  list: async (prefix, shared) => {
    const base = shared ? ROOT+"shared/" : ROOT+"priv/";
    const snap = await get(ref(db, base));
    if (!snap.exists()) return { keys: [] };
    const safePrefix = (prefix || "").replace(/[:.]/g, "_");
    const keys = Object.keys(snap.val())
      .filter(k => !safePrefix || k.startsWith(safePrefix))
      .map(k => k.replace(/_/g, ":"));
    return { keys };
  }
};