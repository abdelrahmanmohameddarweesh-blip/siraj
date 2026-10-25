import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJsonStore } from './createJsonStore';
export const { readJSON, updateJSON } = createJsonStore(AsyncStorage);
