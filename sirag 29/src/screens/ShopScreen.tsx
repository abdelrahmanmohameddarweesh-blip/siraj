import CinematicSectionHeader from '../components/CinematicSectionHeader';
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Dimensions, Modal } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentUserProfile, unlockShopItem } from '../firebase/auth';
import { WebView } from 'react-native-webview';
import { LoadingState, EmptyState, ErrorState } from '../components/StateView';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Define Shop Item Interface
interface ShopItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  cost: number;
  category: 'artifacts' | 'themes';
  badge: string;
  youtubeVideoId?: string; // Optional for non-artifacts
}

const SHOP_ITEMS: ShopItem[] = [
  // 1. Muslim History Legendary Artifacts
  {
    id: 'art_zulfiqar',
    titleAr: 'سيف "ذو الفقار" الشريف',
    titleEn: 'Ali\'s Zulfiqar Sword',
    descAr: 'السيف الأسطوري ذو الرأسين للإمام علي بن أبي طالب رضي الله عنه، رمز الشجاعة والإيمان.',
    descEn: 'The legendary double-pointed sword of Imam Ali, a symbol of bravery and faith.',
    cost: 250,
    category: 'artifacts',
    badge: '⚔️',
    youtubeVideoId: 'q2vP164x65A',
  },
  {
    id: 'art_khalid',
    titleAr: 'سيف "خالد بن الوليد"',
    titleEn: 'Sword of Khalid ibn al-Walid',
    descAr: 'سيف القائد المظفر "سيف الله المسلول" الذي خاض به فتوحات الإسلام الكبرى.',
    descEn: 'The sword of the legendary commander, "The Drawn Sword of Allah".',
    cost: 200,
    category: 'artifacts',
    badge: '🗡️',
    youtubeVideoId: 'E5yN5rR_qgU',
  },
  {
    id: 'art_hamzah',
    titleAr: 'درع "حمزة بن عبد المطلب"',
    titleEn: 'Shield of Hamzah',
    descAr: 'درع "أسد الله وسيد الشهداء" الذي خاض به بدر وأحد مدافعاً عن النبي ﷺ.',
    descEn: 'The battle shield of Hamzah, the "Lion of Allah", who defended the Prophet (ﷺ) at Badr and Uhud.',
    cost: 180,
    category: 'artifacts',
    badge: '🛡️',
    youtubeVideoId: 'gW3zJbM-tG4',
  },
  {
    id: 'art_saad',
    titleAr: 'قوس "سعد بن أبي وقاص"',
    titleEn: 'Bow of Sa\'d ibn Abi Waqqas',
    descAr: 'قوس أول من رمى بسهم في سبيل الله، الصحابي الذي فداه النبي بأبويه يوم أحد.',
    descEn: 'The bow of the first companion to shoot an arrow in the way of Allah.',
    cost: 150,
    category: 'artifacts',
    badge: '🏹',
    youtubeVideoId: 'yvP6K1K92oA',
  },
  {
    id: 'art_alparslan',
    titleAr: 'خوذة السلطان "ألب أرسلان"',
    titleEn: 'Helmet of Alp Arslan',
    descAr: 'خوذة بطل معركة ملاذكرد الخالدة الذي حمى ديار الإسلام من الزوال.',
    descEn: 'The helmet of Alp Arslan, hero of the Battle of Manzikert who defended the Islamic world.',
    cost: 180,
    category: 'artifacts',
    badge: '🪖',
    youtubeVideoId: 'U1B9a4X_3L0',
  },
  {
    id: 'art_uqab',
    titleAr: 'الراية النبوية "العُقاب"',
    titleEn: 'Al-Uqab Banner of the Prophet',
    descAr: 'الراية السوداء الرسمية للنبي محمد ﷺ في الغزوات وصدر الإسلام.',
    descEn: 'The official black banner of the Prophet Muhammad (ﷺ) during battles.',
    cost: 300,
    category: 'artifacts',
    badge: '🏴',
    youtubeVideoId: 'jP5Vb_x4O3w',
  },
  {
    id: 'art_ring',
    titleAr: 'خاتم "الرسول ﷺ" الشريف',
    titleEn: 'Signet Ring of the Prophet',
    descAr: 'خاتم الفضة المنقوش عليه "محمد رسول الله" الذي استخدمه لختم رسائل دعوة الملوك للإسلام.',
    descEn: 'The Prophet’s (ﷺ) silver signet ring used to seal the letters calling kings to Islam.',
    cost: 220,
    category: 'artifacts',
    badge: '💍',
    youtubeVideoId: 't2VbX4k92OA',
  },
  // 2. Background Themes
  {
    id: 'theme_nabawi',
    titleAr: 'محراب المسجد النبوي',
    titleEn: 'Masjid Nabawi Sanctuary',
    descAr: 'خلفية خضراء داكنة بنقوش المسجد النبوي الشريف.',
    descEn: 'A deep emerald theme inspired by the Prophet’s Mosque.',
    cost: 150,
    category: 'themes',
    badge: '🟢',
  },
  {
    id: 'theme_kaaba',
    titleAr: 'كسوة الكعبة المشرفة',
    titleEn: 'Holy Kaaba Kiswah',
    descAr: 'خلفية سوداء فاخرة مطرزة بخطوط ذهبية قرآنية.',
    descEn: 'A luxurious dark theme inspired by the Kiswah of the Kaaba.',
    cost: 200,
    category: 'themes',
    badge: '⚫',
  },
  {
    id: 'theme_waterfalls',
    titleAr: 'شلالات الجنان',
    titleEn: 'Heavenly Waterfalls',
    descAr: 'سمة متحركة ناعمة مستوحاة من عيون الجنة وأنهارها.',
    descEn: 'A soft blue theme inspired by the springs of Paradise.',
    cost: 250,
    category: 'themes',
    badge: '🔵',
  },
];

export default function ShopScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language, backArrow } = useLanguage();
  const { user, updateUserFields } = useAuth();

  const [activeTab, setActiveTab] = useState<'artifacts' | 'themes'>('artifacts');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  // Modal Interactive Card State
  const [selectedArtifact, setSelectedArtifact] = useState<ShopItem | null>(null);

  const loadProfile = async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const currentProfile = await getCurrentUserProfile(user.uid);
      setProfile(currentProfile);
    } catch (err) {
      console.error(err);
      setError(
        language === 'ar'
          ? 'تعذر تحميل بيانات المتجر. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.'
          : 'Could not load store data. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.uid]);

  const handlePurchase = async (item: ShopItem) => {
    if (!user?.uid) return;

    const currentBalance = profile?.sirajBalance ?? 50;
    const unlocked = profile?.unlockedItems ?? [];

    if (unlocked.includes(item.id)) {
      if (item.category === 'artifacts') {
        setSelectedArtifact(item);
      } else {
        Alert.alert(
          language === 'ar' ? 'تنبيه' : 'Alert',
          language === 'ar' ? 'لقد قمت بشراء هذا العنصر بالفعل!' : 'You already own this item!'
        );
      }
      return;
    }

    if (currentBalance < item.cost) {
      Alert.alert(
        language === 'ar' ? 'عذراً' : 'Sorry',
        language === 'ar' 
          ? `رصيد السراج الخاص بك غير كافٍ. تحتاج إلى ${item.cost - currentBalance} سراج إضافي للوصول لهذا العنصر.` 
          : `Insufficient Siraj balance. You need ${item.cost - currentBalance} more Siraj to buy this item.`
      );
      return;
    }

    setBuyingId(item.id);
    try {
      const updatedUser = await unlockShopItem(user.uid, item.id, item.cost);
      setProfile(updatedUser);
      updateUserFields({
        sirajBalance: updatedUser.sirajBalance,
        unlockedItems: updatedUser.unlockedItems,
      });
      Alert.alert(
        language === 'ar' ? 'تهانينا! 🎉' : 'Congratulations! 🎉',
        language === 'ar' 
          ? `تم تفعيل "${item.titleAr}" بنجاح وخصم ${item.cost} سراج من محفظتك.` 
          : `"${item.titleEn}" unlocked successfully. Deducted ${item.cost} Siraj.`
      );
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'حدث خطأ أثناء الشراء');
    } finally {
      setBuyingId(null);
    }
  };

  const filteredItems = useMemo(() => {
    return SHOP_ITEMS.filter(item => item.category === activeTab);
  }, [activeTab]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER ROW */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20, color: colors.primary }}>{backArrow}</Text>
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
            {language === 'ar' ? 'متجر السراج' : 'The Siraj Shop'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {language === 'ar' ? 'استبدل أنوار السراج بمميزات حصرية' : 'Redeem Siraj Points for Custom Features'}
          </Text>
        </View>

        {/* Wallet Balance */}
        <View style={[styles.walletBadge, { backgroundColor: colors.primaryLight }]}>
          <Text style={{ fontSize: 16, marginRight: 4 }}>🕯️</Text>
          <Text style={[styles.walletText, { color: colors.primary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
            {profile?.sirajBalance ?? 50}
          </Text>
        </View>
      </View>

      {/* TABS SELECTOR */}
      <View style={styles.tabContainer}>
        {(['artifacts', 'themes'] as const).map(tab => {
          const isActive = activeTab === tab;
          const tabLabel = {
            artifacts: language === 'ar' ? 'مقتنيات التاريخ' : 'History Vault',
            themes: language === 'ar' ? 'سمات الصرح' : 'Themes'
          }[tab];

          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabBtn,
                { borderBottomColor: isActive ? colors.primary : 'transparent', borderBottomWidth: isActive ? 3 : 0 }
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? colors.primary : colors.textSecondary, fontFamily: isActive ? 'IBMPlexSansArabic-Bold' : 'IBMPlexSansArabic-Medium' }
                ]}
              >
                {tabLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ITEMS LIST */}
      {loading ? (
        <LoadingState message={language === 'ar' ? 'جارٍ تحميل المتجر والسرج...' : 'Loading shop...'} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadProfile} />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon="🛍️"
          title={language === 'ar' ? 'لا توجد عناصر حالياً' : 'No Items Available'}
          description={language === 'ar' ? 'ترقب إضافة مقتنيات وثيمات جديدة قريباً بإذن الله!' : 'Stay tuned for new items coming soon!'}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <CinematicSectionHeader titleAr="كنوز السراج" titleEn="Siraj Treasures" subtitleAr="مكافآت لرحلتك في التعلّم" subtitleEn="Rewards for your learning journey" symbol="✧" />
          {filteredItems.map(item => {
            const isUnlocked = profile?.unlockedItems?.includes(item.id);
            const isBuying = buyingId === item.id;

            return (
              <View
                key={item.id}
                style={[
                  styles.itemCard,
                  { backgroundColor: colors.surface, borderColor: isUnlocked ? colors.primary : colors.border }
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.badgeContainer, { backgroundColor: colors.border }]}>
                    <Text style={{ fontSize: 24 }}>{item.badge}</Text>
                  </View>
                  
                  <View style={styles.metaContainer}>
                    <Text style={[styles.itemTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                      {language === 'ar' ? item.titleAr : item.titleEn}
                    </Text>
                    <Text style={[styles.itemDesc, { color: colors.textSecondary }]}>
                      {language === 'ar' ? item.descAr : item.descEn}
                    </Text>
                  </View>
                </View>

                <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

                <View style={styles.cardFooter}>
                  {isUnlocked ? (
                    item.category === 'artifacts' ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                        onPress={() => setSelectedArtifact(item)}
                      >
                        <Text style={styles.actionBtnText}>
                          {language === 'ar' ? '📖 استعراض قصة المقتنى والفيلم' : '📖 View Story & Video'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.unlockedTag, { backgroundColor: colors.primaryLight }]}>
                        <Text style={[styles.unlockedText, { color: colors.primary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                          {language === 'ar' ? '✓ تم التفعيل' : '✓ Unlocked'}
                        </Text>
                      </View>
                    )
                  ) : (
                    <TouchableOpacity
                      style={[styles.buyBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handlePurchase(item)}
                      disabled={isBuying}
                    >
                      {isBuying ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.buyBtnText}>
                            {language === 'ar' ? `شراء بـ ${item.cost}` : `Redeem for ${item.cost}`}
                          </Text>
                          <Text style={{ fontSize: 13, marginLeft: 4 }}>🕯️</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* INTERACTIVE MULTIMEDIA CARD OVERLAY MODAL */}
      {selectedArtifact && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedArtifact}
          onRequestClose={() => setSelectedArtifact(null)}
        >
          <View style={styles.modalCenteredView}>
            <View style={[styles.modalView, { backgroundColor: colors.surface }]}>
              {/* Top Row */}
              <View style={styles.modalHeader}>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedArtifact(null)}>
                  <Text style={{ fontSize: 24, color: colors.textPrimary }}>✕</Text>
                </TouchableOpacity>
                <Text style={[styles.modalHeaderTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                  {selectedArtifact.badge} {language === 'ar' ? selectedArtifact.titleAr : selectedArtifact.titleEn}
                </Text>
              </View>

              {/* YouTube Native WebPlayer */}
              {selectedArtifact.youtubeVideoId && (
                <View style={styles.playerContainer}>
                  <WebView
                    style={styles.youtubePlayer}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowsFullscreenVideo={true}
                    scrollEnabled={false}
                    source={{ uri: `https://www.youtube.com/embed/${selectedArtifact.youtubeVideoId}?rel=0&autoplay=0&showinfo=0&controls=1` }}
                  />
                </View>
              )}

              {/* Scrollable Story Content */}
              <ScrollView style={styles.storyScroll} contentContainerStyle={styles.storyContent} showsVerticalScrollIndicator={false}>
                <View style={styles.scrollDesignCard}>
                  <Text style={styles.scrollHeader}>📖 القصة التاريخية والدينية للمقتنى:</Text>
                  <Text style={styles.storyTextAr}>{selectedArtifact.descAr}</Text>
                  
                  {/* Detailed educational extra text block */}
                  <Text style={styles.extraHistoryText}>
                    {selectedArtifact.id === 'art_zulfiqar' && 
                      'كان هذا السيف مهدى للإمام علي رضي الله عنه من النبي ﷺ في غزوة أحد بعد أن تكسر سيفه، وجاء في الأثر دفاعه المستميت وبطولته التي نصرت جيش المسلمين وثبتت أركان المعركة.'}
                    {selectedArtifact.id === 'art_khalid' && 
                      'يعتبر سيف خالد رمزاً للعبقرية العسكرية الإسلامية الفريدة، حيث لم يهزم خالد في جاهلية ولا إسلام وقاد فتوحات الشام والعراق بمهارة خارقة مخلصاً نيته لله تعالى.'}
                    {selectedArtifact.id === 'art_hamzah' && 
                      'كان حمزة بن عبد المطلب رضي الله عنه يقاتل بسيفين ويرتدي ريشة النعامة على صدره كعلامة للشجاعة، وبذل روحه ودرعه فداءً لدعوة الحق وحماية لرسول الله.'}
                    {selectedArtifact.id === 'art_saad' && 
                      'سعد بن أبي وقاص رضي الله عنه هو أحد العشرة المبشرين بالجنة، وصاحب الدعوة المستجابة التي دعا له بها النبي ﷺ، وكان قوسه الحارس الأمين في أحد.'}
                    {selectedArtifact.id === 'art_alparslan' && 
                      'معركة ملاذكرد في عام 1071م غيرت مجرى التاريخ الإسلامي، حيث كسر السلطان السلجوقي الطوق عن الأمة الإسلامية وفتح ألب أرسلان أبواب الأناضول للإسلام.'}
                    {selectedArtifact.id === 'art_uqab' && 
                      'كانت راية العقاب تخفق بالتوحيد في كل موطن، وهي رمز العزة والتمكين في صدر الإسلام وتوضح اجتماع كلمة المسلمين تحت راية واحدة تعلي كلمة الله.'}
                    {selectedArtifact.id === 'art_ring' && 
                      'خاتم الفضة النبوي الشريف يعكس الدقة الإدارية والتنظيمية في عهد النبوة، حيث استخدم لتوثيق المراسلات الرسمية للملوك مثل هرقل والمقوقس وكسرى ودعوتهم للتوحيد.'}
                  </Text>

                  <View style={styles.englishDivider} />
                  
                  <Text style={styles.scrollHeaderEn}>English Narrative:</Text>
                  <Text style={styles.storyTextEn}>{selectedArtifact.descEn}</Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 5,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 15,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  walletText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  tabBtn: {
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  badgeContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaContainer: {
    flex: 1,
    marginRight: 14,
    alignItems: 'flex-end',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'right',
  },
  cardDivider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.6,
  },
  cardFooter: {
    alignItems: 'flex-start',
  },
  buyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  unlockedTag: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 15,
  },
  unlockedText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalView: {
    width: SCREEN_WIDTH * 0.92,
    height: SCREEN_HEIGHT * 0.85,
    borderRadius: 24,
    paddingTop: 15,
    paddingHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalCloseBtn: {
    padding: 5,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerContainer: {
    height: 190,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginVertical: 15,
    borderWidth: 1.5,
    borderColor: '#E5B942',
  },
  youtubePlayer: {
    flex: 1,
  },
  storyScroll: {
    flex: 1,
  },
  storyContent: {
    paddingBottom: 30,
  },
  scrollDesignCard: {
    backgroundColor: '#FFFDF9',
    borderColor: '#E5C158',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
  },
  scrollHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B8860B',
    marginBottom: 8,
    textAlign: 'right',
  },
  storyTextAr: {
    fontSize: 14,
    color: '#4A3B32',
    lineHeight: 22,
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  extraHistoryText: {
    fontSize: 13,
    color: '#605045',
    lineHeight: 20,
    textAlign: 'right',
    marginTop: 10,
    fontStyle: 'italic',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  englishDivider: {
    height: 1,
    backgroundColor: '#E5C158',
    marginVertical: 15,
    opacity: 0.4,
  },
  scrollHeaderEn: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B8860B',
    marginBottom: 8,
    textAlign: 'left',
  },
  storyTextEn: {
    fontSize: 13,
    color: '#4A3B32',
    lineHeight: 20,
    textAlign: 'left',
  },
});
