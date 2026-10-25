import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from './config';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export default app;
