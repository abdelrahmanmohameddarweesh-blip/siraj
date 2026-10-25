import CinematicQuestBanner from '../components/CinematicQuestBanner';
import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import AdBanner from '../components/AdBanner';
import { useVoiceRecording } from '../hooks/useVoiceRecording';
import { getVoiceStyles } from '../components/voice/voiceStyles';
import { VoiceReaderStep } from '../components/voice/VoiceReaderStep';
import { VoiceAyahStep } from '../components/voice/VoiceAyahStep';
import { VoiceActiveCard } from '../components/voice/VoiceActiveCard';
import { VoiceScoredCard } from '../components/voice/VoiceScoredCard';

export default function VoiceScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useMemo(() => getVoiceStyles(colors), [colors]);

  const {
    step,
    setStep,
    selectedReader,
    currentAyah,
    setCurrentAyah,
    recitationStyle,
    setRecitationStyle,
    seconds,
    meteringHistory,
    liveVolume,
    scoreBreakdown,
    transcribedText,
    textMatchDetails,
    isTranscriptionSuccess,
    pulseAnim,
    hasShared,
    hasSaved,
    selectedSurahNumber,
    setSelectedSurahNumber,
    startAyahNumber,
    setStartAyahNumber,
    endAyahNumber,
    setEndAyahNumber,
    recordWholeSurah,
    setRecordWholeSurah,
    fetchingAyah,
    handleSelectReader,
    handleStartRecording,
    handleStopRecording,
    handleAnalyzeRecitation,
    handleReset,
    handleShareToFeed,
    handleSaveToProfile,
    loadSelectedAyahRange,
  } = useVoiceRecording();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={styles.outerContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <CinematicQuestBanner chapter={12} icon="🎙" titleAr="رحلة التلاوة" titleEn="Recitation Journey" descriptionAr="اختر قارئك، تدرب على الآيات، واستمع إلى تقدمك" descriptionEn="Choose a reciter, practise verses and review your progress" />
        <View style={styles.container}>
          {/* STEP 1: Qari Selection */}
          {step === 'select-reader' && (
            <VoiceReaderStep styles={styles} onSelectReader={handleSelectReader} />
          )}

          {/* STEP 1.5: Setup Ayah Selection */}
          {step === 'setup-ayah' && selectedReader && (
            <VoiceAyahStep
              selectedReader={selectedReader}
              selectedSurahNumber={selectedSurahNumber}
              startAyahNumber={startAyahNumber}
              endAyahNumber={endAyahNumber}
              recordWholeSurah={recordWholeSurah}
              fetchingAyah={fetchingAyah}
              styles={styles}
              onSelectQuickAyah={(a) => {
                setCurrentAyah(a);
                setStep('ready');
              }}
              onSetSelectedSurahNumber={(num) => {
                setSelectedSurahNumber(num);
                setStartAyahNumber(1);
                setEndAyahNumber(1);
                setRecordWholeSurah(false);
              }}
              onSetStartAyahNumber={(num) => {
                setStartAyahNumber(num);
                if (endAyahNumber < num) {
                  setEndAyahNumber(num);
                }
              }}
              onSetEndAyahNumber={setEndAyahNumber}
              onToggleRecordWholeSurah={() => {
                const total = selectedSurahNumber ? 7 : 1;
                setRecordWholeSurah(!recordWholeSurah);
                if (!recordWholeSurah) {
                  setStartAyahNumber(1);
                  setEndAyahNumber(total);
                } else {
                  setStartAyahNumber(1);
                  setEndAyahNumber(1);
                }
              }}
              onLoadSelectedAyahRange={loadSelectedAyahRange}
              onReset={handleReset}
            />
          )}

          {/* ACTIVE STEPS: Ready, Recording, Recorded, Analyzing */}
          {(step === 'ready' || step === 'recording' || step === 'recorded' || step === 'analyzing') &&
            selectedReader &&
            currentAyah && (
              <VoiceActiveCard
                step={step}
                selectedReader={selectedReader}
                currentAyah={currentAyah}
                recitationStyle={recitationStyle}
                seconds={seconds}
                recordingDuration={meteringHistory.length * 120}
                liveVolume={liveVolume}
                pulseAnim={pulseAnim}
                styles={styles}
                onSetRecitationStyle={setRecitationStyle}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                onAnalyzeRecitation={handleAnalyzeRecitation}
                onReset={handleReset}
              />
            )}

          {/* STEP 6: Scored Result State */}
          {step === 'scored' && selectedReader && (
            <VoiceScoredCard
              selectedReader={selectedReader}
              currentAyah={currentAyah}
              recitationStyle={recitationStyle}
              scoreBreakdown={scoreBreakdown}
              transcribedText={transcribedText}
              textMatchDetails={textMatchDetails}
              isTranscriptionSuccess={isTranscriptionSuccess}
              hasShared={hasShared}
              hasSaved={hasSaved}
              styles={styles}
              onShareToFeed={handleShareToFeed}
              onSaveToProfile={handleSaveToProfile}
              onReset={handleReset}
              onBack={() => navigation.goBack()}
            />
          )}
        </View>
      </ScrollView>
      <AdBanner />
    </View>
  );
}
