import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CommunityPost {
  id: string;
  userName: string;
  userLevel: number;
  countryCode: string;
  surahName: string;
  ayahNumber: number | string;
  readerId: string;
  readerName: string;
  matchPercentage: number;
  style: 'murattal' | 'mujawwad';
  duration?: string;
  ayahsCount?: number | string;
  playsCount?: number;
  sharesCount?: number;
  mashallahCount: number;
  subhanallahCount: number;
  createdAt: string;
  hasVotedMashallah?: boolean;
  hasVotedSubhanallah?: boolean;
}

export const seedCommunityPosts: CommunityPost[] = [
  {
    id: 'p1',
    userName: 'خالد عبد الرحمن',
    userLevel: 7,
    countryCode: 'EG',
    surahName: 'سورة الكهف',
    ayahNumber: '1-10',
    readerId: 'abdulbasit',
    readerName: 'الشيخ عبد الباسط عبد الصمد',
    matchPercentage: 88,
    style: 'mujawwad',
    duration: '02:15',
    ayahsCount: '١٠ آيات',
    playsCount: 1420,
    sharesCount: 42,
    mashallahCount: 142,
    subhanallahCount: 98,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'p2',
    userName: 'عائشة المالكي',
    userLevel: 5,
    countryCode: 'SA',
    surahName: 'سورة يس',
    ayahNumber: '1-12',
    readerId: 'husary',
    readerName: 'الشيخ محمود خليل الحصري',
    matchPercentage: 92,
    style: 'murattal',
    duration: '01:45',
    ayahsCount: '١٢ آية',
    playsCount: 890,
    sharesCount: 28,
    mashallahCount: 205,
    subhanallahCount: 110,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'p3',
    userName: 'سليمان الخطيب',
    userLevel: 12,
    countryCode: 'JO',
    surahName: 'سورة الملك',
    ayahNumber: 'السورة كاملة',
    readerId: 'free_voice',
    readerName: 'تلاوة حرّة بصوتك الخاص 🎤',
    matchPercentage: 95,
    style: 'murattal',
    duration: '04:10',
    ayahsCount: '٣٠ آية (السورة كاملة)',
    playsCount: 2150,
    sharesCount: 74,
    mashallahCount: 312,
    subhanallahCount: 184,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'p4',
    userName: 'ياسين الفاسي',
    userLevel: 9,
    countryCode: 'MA',
    surahName: 'سورة الرحمن',
    ayahNumber: '1-16',
    readerId: 'sudais',
    readerName: 'الشيخ عبد الرحمن السديس',
    matchPercentage: 81,
    style: 'murattal',
    duration: '01:30',
    ayahsCount: '١٦ آية',
    playsCount: 650,
    sharesCount: 19,
    mashallahCount: 119,
    subhanallahCount: 76,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

const FEED_STORAGE_KEY = 'community-recitation-posts-data';

export async function readCommunityPosts(): Promise<CommunityPost[]> {
  try {
    const data = await AsyncStorage.getItem(FEED_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    await AsyncStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(seedCommunityPosts));
    return seedCommunityPosts;
  } catch (err) {
    console.error('Error reading community posts:', err);
    return seedCommunityPosts;
  }
}

export async function saveCommunityPosts(posts: CommunityPost[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(posts));
  } catch (err) {
    console.error('Error saving community posts:', err);
  }
}

export async function addCommunityPost(post: Omit<CommunityPost, 'id' | 'mashallahCount' | 'subhanallahCount' | 'createdAt'>): Promise<CommunityPost[]> {
  const current = await readCommunityPosts();
  const newPost: CommunityPost = {
    ...post,
    id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    duration: post.duration || '01:20',
    ayahsCount: post.ayahsCount || '٧ آيات',
    playsCount: 1,
    sharesCount: 0,
    mashallahCount: 0,
    subhanallahCount: 0,
    createdAt: new Date().toISOString(),
  };
  const updated = [newPost, ...current];
  await saveCommunityPosts(updated);
  return updated;
}
