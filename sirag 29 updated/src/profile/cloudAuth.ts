import { getAuth } from 'firebase/auth';
import app from '../firebase/init';
export const profileAuth = getAuth(app);
