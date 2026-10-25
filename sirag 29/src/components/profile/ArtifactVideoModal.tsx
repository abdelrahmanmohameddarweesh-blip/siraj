import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { HistoricalArtifact } from './profileConstants';

interface ArtifactVideoModalProps {
  artifact: HistoricalArtifact | null;
  styles: any;
  onClose: () => void;
}

export function ArtifactVideoModal({ artifact, styles, onClose }: ArtifactVideoModalProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  if (!artifact) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={!!artifact}
      onRequestClose={onClose}
    >
      <View style={styles.modalCenteredView}>
        <View style={[styles.modalView, { backgroundColor: colors.surface }]}>
          {/* Top Row */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={language === 'ar' ? 'إغلاق' : 'Close'}
            >
              <Text style={{ fontSize: 24, color: colors.textPrimary }}>✕</Text>
            </TouchableOpacity>
            <Text style={[styles.modalHeaderTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
              {artifact.badge} {language === 'ar' ? artifact.titleAr : artifact.titleEn}
            </Text>
          </View>

          {/* YouTube Native WebPlayer */}
          {artifact.youtubeVideoId && (
            <View style={styles.playerContainer}>
              <WebView
                style={styles.youtubePlayer}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsFullscreenVideo={true}
                scrollEnabled={false}
                source={{ uri: `https://www.youtube.com/embed/${artifact.youtubeVideoId}?rel=0&autoplay=0&showinfo=0&controls=1` }}
              />
            </View>
          )}

          {/* Scrollable Story Content */}
          <ScrollView style={styles.storyScroll} contentContainerStyle={styles.storyContent} showsVerticalScrollIndicator={false}>
            <View style={styles.scrollDesignCard}>
              <Text style={styles.scrollHeader}>📖 القصة التاريخية والدينية للمقتنى:</Text>
              <Text style={styles.storyTextAr}>{artifact.descAr}</Text>

              {/* Detailed educational extra text block */}
              <Text style={styles.extraHistoryText}>
                {artifact.id === 'art_zulfiqar' &&
                  'كان هذا السيف مهدى للإمام علي رضي الله عنه من النبي ﷺ في غزوة أحد بعد أن تكسر سيفه، وجاء في الأثر دفاعه المستميت وبطولته التي نصرت جيش المسلمين وثبتت أركان المعركة.'}
                {artifact.id === 'art_khalid' &&
                  'يعتبر سيف خالد رمزاً للعبقرية العسكرية الإسلامية الفريدة، حيث لم يهزم خالد في جاهلية ولا إسلام وقاد فتوحات الشام والعراق بمهارة خارقة مخلصاً نيته لله تعالى.'}
                {artifact.id === 'art_hamzah' &&
                  'كان حمزة بن عبد المطلب رضي الله عنه يقاتل بسيفين ويرتدي ريشة النعامة على صدره كعلامة للشجاعة، وبذل روحه ودرعه فداءً لدعوة الحق وحماية لرسول الله.'}
                {artifact.id === 'art_saad' &&
                  'سعد بن أبي وقاص رضي الله عنه هو أحد العشرة المبشرين بالجنة، وصاحب الدعوة المستجابة التي دعا له بها النبي ﷺ، وكان قوسه الحارس الأمين في أحد.'}
                {artifact.id === 'art_alparslan' &&
                  'معركة ملاذكرد في عام 1071م غيرت مجرى التاريخ الإسلامي، حيث كسر السلطان السلجوقي الطوق عن الأمة الإسلامية وفتح ألب أرسلان أبواب الأناضول للإسلام.'}
                {artifact.id === 'art_uqab' &&
                  'كانت راية العقاب تخفق بالتوحيد في كل موطن، وهي رمز العزة والتمكين في صدر الإسلام وتوضح اجتماع كلمة المسلمين تحت راية واحدة تعلي كلمة الله.'}
                {artifact.id === 'art_ring' &&
                  'خاتم الفضة النبوي الشريف يعكس الدقة الإدارية والتنظيمية في عهد النبوة، حيث استخدم لتوثيق المراسلات الرسمية للملوك مثل هرقل والمقوقس وكسرى ودعوتهم للتوحيد.'}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
