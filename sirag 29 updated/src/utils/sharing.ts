import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export async function shareAchievementWithImage(message: string) {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('خطأ', 'المشاركة غير متاحة على هذا الجهاز.');
      return;
    }

    // A beautiful spiritual lantern emerald/gold background image from Unsplash
    const imageUrl = 'https://images.unsplash.com/photo-1607513746994-51f7318ecf82?w=800';
    const localUri = `${FileSystem.cacheDirectory}congrats_card.jpg`;

    // Download the image template to local cache first
    const downloadRes = await FileSystem.downloadAsync(imageUrl, localUri);

    if (downloadRes.status !== 200) {
      throw new Error('Failed to download visual sharing template image');
    }

    // Share the downloaded image attached to the dialog
    // In Android/iOS, standard sharing allows sharing the file with text description overlay
    await Sharing.shareAsync(downloadRes.uri, {
      dialogTitle: 'مشاركة إنجاز بطل مسلم',
      mimeType: 'image/jpeg',
      UTI: 'public.jpeg',
    });
  } catch (err) {
    console.error('Error during image sharing:', err);
    Alert.alert('خطأ في المشاركة', 'حدث خطأ أثناء تحميل بطاقة الإنجاز، يرجى المحاولة لاحقاً.');
  }
}
