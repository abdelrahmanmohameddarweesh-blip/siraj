import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Share,
  Clipboard,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { GroupQuizSettings } from './GroupQuizLobbyScreen';
import AdBanner from '../components/AdBanner';
import { EmptyState } from '../components/StateView';

const { width } = Dimensions.get('window');

// Avatars catalogue
const AVATARS = ['🕌', '⚔️', '🛡️', '🐎', '📖', '👑', '🦅', '🦁'];

interface Player {
  id: string;
  name: string;
  avatar: string;
  isReady: boolean;
  isAdmin: boolean;
  isBot?: boolean;
}

interface FloatingEmoji {
  id: string;
  emoji: string;
  playerId: string;
  xOffset: number;
}

export default function GroupQuizWaitingScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const styles = getStyles(colors);

  const { roomId, isAdmin: initialIsAdmin, initialSettings } = route.params || {};

  // Nickname entry state
  const [hasRegistered, setHasRegistered] = useState(false);
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  // Lobby settings
  const [isAdmin, setIsAdmin] = useState(!!initialIsAdmin);
  const [settings, setSettings] = useState<GroupQuizSettings>(
    initialSettings || {
      category: 'القرآن',
      difficulty: 'easy',
      questionType: 'MCQ',
      questionCount: 10,
      maxPlayers: 8,
      isPrivate: false,
    }
  );

  // Players in lobby list
  const [players, setPlayers] = useState<Player[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Floating emojis state
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const emojiIdCounter = useRef(0);

  // Active timers
  const botJoinTimers = useRef<any[]>([]);
  const botTauntTimer = useRef<any>(null);

  // Initial user setup
  useEffect(() => {
    if (isAdmin) {
      // Admin joins automatically with a default name
      setPlayers([
        {
          id: 'admin-user',
          name: language === 'ar' ? 'منشئ الغرفة (أنت)' : 'Host (You)',
          avatar: '👑',
          isReady: true,
          isAdmin: true,
        },
      ]);
      setNickname(language === 'ar' ? 'منشئ الغرفة' : 'Host');
      setHasRegistered(true);
    }
  }, [isAdmin]);

  // Simulate players joining the lobby to make it active and drive engagement
  useEffect(() => {
    if (hasRegistered) {
      const botNames = [
        { name: 'صلاح الدين', avatar: '🦁' },
        { name: 'أحمد', avatar: '🦅' },
        { name: 'عائشة', avatar: '📖' },
        { name: 'عمر', avatar: '🛡️' },
        { name: 'فاطمة', avatar: '🕌' },
      ];

      // Schedule bots joining
      botNames.forEach((bot, index) => {
        const timer = setTimeout(() => {
          setPlayers((prev) => {
            if (prev.length >= settings.maxPlayers) return prev;
            // Prevent duplicate bots
            if (prev.some((p) => p.name === bot.name)) return prev;

            return [
              ...prev,
              {
                id: `bot-${index}`,
                name: bot.name,
                avatar: bot.avatar,
                isReady: false,
                isAdmin: false,
                isBot: true,
              },
            ];
          });

          // Set bot to ready after another 2 seconds
          const readyTimer = setTimeout(() => {
            setPlayers((prev) =>
              prev.map((p) => (p.name === bot.name ? { ...p, isReady: true } : p))
            );
          }, 2000);
          botJoinTimers.current.push(readyTimer);
        }, (index + 1) * 3500);

        botJoinTimers.current.push(timer);
      });

      // Periodic simulated bot taunt reactions
      botTauntTimer.current = setInterval(() => {
        setPlayers((prev) => {
          const bots = prev.filter((p) => p.isBot);
          if (bots.length > 0) {
            const randomBot = bots[Math.floor(Math.random() * bots.length)];
            const emojis = ['🔥', '😂', '👊', '👑', '💡'];
            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            triggerFloatingEmoji(randomEmoji, randomBot.id);
          }
          return prev;
        });
      }, 5000);

      return () => {
        botJoinTimers.current.forEach((t) => clearTimeout(t));
        if (botTauntTimer.current) clearInterval(botTauntTimer.current);
      };
    }
  }, [hasRegistered, settings.maxPlayers]);

  const handleRegister = () => {
    if (!nickname.trim()) {
      Alert.alert(
        language === 'ar' ? 'تنبيه' : 'Warning',
        language === 'ar' ? 'الرجاء إدخال اسمك الكريم.' : 'Please enter your name.'
      );
      return;
    }
    const myPlayer: Player = {
      id: 'local-user',
      name: nickname.trim() + ' (أنت)',
      avatar: selectedAvatar,
      isReady: false,
      isAdmin: false,
    };
    setPlayers([
      {
        id: 'admin-user',
        name: language === 'ar' ? 'المنشئ (البطل)' : 'Host (Admin)',
        avatar: '👑',
        isReady: true,
        isAdmin: true,
      },
      myPlayer,
    ]);
    setHasRegistered(true);
  };

  const handleToggleReady = () => {
    const nextReady = !isReady;
    setIsReady(nextReady);
    setPlayers((prev) =>
      prev.map((p) => (p.id === 'local-user' ? { ...p, isReady: nextReady } : p))
    );
  };

  const handleKickPlayer = (id: string, name: string) => {
    Alert.alert(
      language === 'ar' ? 'طرد لاعب' : 'Kick Player',
      language === 'ar' ? `هل أنت متأكد من طرد اللاعب ${name}؟` : `Are you sure you want to kick ${name}?`,
      [
        { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ar' ? 'طرد' : 'Kick',
          style: 'destructive',
          onPress: () => {
            setPlayers((prev) => prev.filter((p) => p.id !== id));
          },
        },
      ]
    );
  };

  const triggerFloatingEmoji = (emoji: string, playerId: string) => {
    const id = `emoji-${emojiIdCounter.current++}`;
    const xOffset = Math.random() * 40 - 20; // jitter offset
    setFloatingEmojis((prev) => [...prev, { id, emoji, playerId, xOffset }]);

    // Remove emoji after 1.8 seconds
    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 1800);
  };

  const handleShareInvite = async () => {
    const inviteLink = `batlmuslim://join-room?roomId=${roomId}`;
    try {
      await Share.share({
        message:
          language === 'ar'
            ? `🕌 انضم معي في تحدي بطل مسلم الجماعي! كود الغرفة هو: ${roomId}\nرابط الانضمام المباشر: ${inviteLink}`
            : `🕌 Join my group quiz on Batl Muslim! Room code: ${roomId}\nDirect invite link: ${inviteLink}`,
      });
    } catch (error) {
      // Fallback: Copy to Clipboard
      Clipboard.setString(inviteLink);
      Alert.alert(
        language === 'ar' ? 'تم نسخ الرابط' : 'Link Copied',
        language === 'ar'
          ? 'تم نسخ رابط الدعوة إلى الحافظة لعدم دعم المشاركة التلقائية.'
          : 'Invite link copied to clipboard.'
      );
    }
  };

  const handleStartGame = () => {
    const activePlayers = players.filter((p) => p.id !== 'admin-user' && p.id !== 'local-user');
    const allReady = players.every((p) => p.isReady || p.isAdmin);

    if (players.length <= 1) {
      Alert.alert(
        language === 'ar' ? 'تنبيه' : 'Warning',
        language === 'ar'
          ? 'هل تريد بدء التحدي بمفردك؟ (سيتم تعبئة المقاعد المتبقية بمنافسين افتراضيين)'
          : 'Do you want to start alone? (Bots will fill active positions)',
        [
          { text: language === 'ar' ? 'انتظار' : 'Wait', style: 'cancel' },
          {
            text: language === 'ar' ? 'بدء الآن' : 'Start Now',
            onPress: () => launchQuiz(),
          },
        ]
      );
      return;
    }

    if (!allReady) {
      Alert.alert(
        language === 'ar' ? 'تأكيد البدء' : 'Force Start',
        language === 'ar'
          ? 'بعض اللاعبين ليسوا مستعدين بعد. هل تريد بدء التحدي فوراً؟'
          : 'Some players are not ready. Force start now?',
        [
          { text: language === 'ar' ? 'انتظار' : 'Wait', style: 'cancel' },
          {
            text: language === 'ar' ? 'بدء على أي حال' : 'Force Start',
            onPress: () => launchQuiz(),
          },
        ]
      );
    } else {
      launchQuiz();
    }
  };

  const launchQuiz = () => {
    navigation.navigate('GroupQuizActive', {
      roomId,
      settings,
      players,
    });
  };

  // Overlay registration modal
  if (!hasRegistered) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }} showsVerticalScrollIndicator={false}>
          <View style={styles.registerCard}>
          <Text style={styles.registerTitle}>
            {language === 'ar' ? '🛡️ بطاقة الانضمام للميدان' : '🛡️ Field Entrance Card'}
          </Text>
          <Text style={styles.registerSubtitle}>
            {language === 'ar'
              ? 'اختر اسمك المستعار ورمزك البطولي لتظهر لجميع الأبطال في الغرفة.'
              : 'Choose your nickname and hero badge.'}
          </Text>

          <TextInput
            style={styles.registerInput}
            placeholder={language === 'ar' ? 'اسم البطل (مثال: أسامة)' : 'Hero Name (e.g. Osama)'}
            placeholderTextColor="#9CA3AF"
            value={nickname}
            onChangeText={setNickname}
            maxLength={14}
            autoFocus
          />

          <Text style={styles.registerLabel}>
            {language === 'ar' ? 'اختر رمزك البطولي (Avatar):' : 'Select Hero Icon:'}
          </Text>
          <View style={styles.avatarGrid}>
            {AVATARS.map((avatar) => (
              <TouchableOpacity
                key={avatar}
                onPress={() => setSelectedAvatar(avatar)}
                style={[styles.avatarBadge, selectedAvatar === avatar && styles.avatarBadgeActive]}
              >
                <Text style={{ fontSize: 24 }}>{avatar}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            style={styles.registerSubmitBtn}
            activeOpacity={0.9}
          >
            <Text style={styles.registerSubmitBtnText}>
              {language === 'ar' ? '💪 دخول الغرفة' : '💪 Enter Room'}
            </Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('GroupQuizLobby')}
          style={styles.backBtn}
        >
          <Text style={{ fontSize: 20, color: colors.primaryDeep }}>➔</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>
            {language === 'ar' ? 'قاعة الانتظار' : 'Waiting Lobby'}
          </Text>
          <Text style={styles.headerRoomCode}>{roomId}</Text>
        </View>
        <TouchableOpacity onPress={handleShareInvite} style={styles.shareBtn}>
          <Text style={{ fontSize: 16 }}>🔗</Text>
        </TouchableOpacity>
      </View>

      {/* Main content body */}
      <ScrollView contentContainerStyle={styles.lobbyContent} showsVerticalScrollIndicator={false}>
        {/* Settings details display */}
        <View style={styles.settingsSummaryCard}>
          <Text style={styles.settingsSummaryTitle}>
            {language === 'ar' ? '📋 إعدادات المسابقة الحالية:' : '📋 Current Quiz Parameters:'}
          </Text>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsPill}>🎯 {settings.category}</Text>
            <Text style={styles.settingsPill}>⚡ {settings.difficulty === 'easy' ? 'سهل' : settings.difficulty === 'medium' ? 'متوسط' : 'صعب'}</Text>
            <Text style={styles.settingsPill}>✏️ {settings.questionType}</Text>
            <Text style={styles.settingsPill}>❓ {settings.questionCount} {language === 'ar' ? 'سؤال' : 'Q'}</Text>
          </View>
        </View>

        {/* Players list header */}
        <View style={styles.playersListHeader}>
          <Text style={styles.playersListCount}>
            {players.length} / {settings.maxPlayers} {language === 'ar' ? 'مشاركين' : 'players'}
          </Text>
          <Text style={styles.playersListTitle}>
            {language === 'ar' ? 'الأبطال المتواجدون:' : 'Joined Heroes:'}
          </Text>
        </View>

        {/* Players cards list */}
        <View style={styles.playersContainer}>
          {players.length === 0 ? (
            <EmptyState
              icon="⏳"
              title={language === 'ar' ? 'في انتظار انضمام الأبطال' : 'Waiting for Players'}
              description={
                language === 'ar'
                  ? 'لم ينضم أي متسابق بعد. شارك كود الغرفة مع أصدقائك أو انتظر وصول المنافسين!'
                  : 'No players have joined yet. Share the room code with friends to compete!'
              }
              actionLabel={language === 'ar' ? 'مشاركة رابط الدعوة 🔗' : 'Share Room Invite 🔗'}
              onAction={handleShareInvite}
            />
          ) : (
            players.map((player) => (
            <View key={player.id} style={styles.playerCard}>
              {/* Ready status indicator dot */}
              <View style={styles.playerCardLeft}>
                {player.isAdmin ? (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>{language === 'ar' ? 'المنشئ' : 'Host'}</Text>
                  </View>
                ) : (
                  <View style={[styles.readyDot, player.isReady ? { backgroundColor: '#10B981' } : { backgroundColor: '#9CA3AF' }]} />
                )}
                
                {/* Admin Kick player button */}
                {isAdmin && !player.isAdmin && (
                  <TouchableOpacity
                    onPress={() => handleKickPlayer(player.id, player.name)}
                    style={styles.kickBtn}
                  >
                    <Text style={styles.kickBtnText}>{language === 'ar' ? 'طرد' : 'Kick'}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Player details */}
              <View style={styles.playerCardRight}>
                <View style={styles.avatarCircle}>
                  <Text style={{ fontSize: 24 }}>{player.avatar}</Text>
                  
                  {/* Floating emojis overlay container */}
                  {floatingEmojis
                    .filter((e) => e.playerId === player.id)
                    .map((e) => (
                      <AnimatedEmoji key={e.id} emoji={e.emoji} xOffset={e.xOffset} />
                    ))}
                </View>
                <Text style={styles.playerName}>{player.name}</Text>
              </View>
            </View>
          )))}
        </View>
      </ScrollView>

      {/* Lobby Bottom Actions Bar */}
      <View style={styles.actionsBar}>
        {/* Taunts Row */}
        <View style={styles.tauntsRow}>
          {['🔥', '😂', '👊', '👑', '💡'].map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => triggerFloatingEmoji(emoji, isAdmin ? 'admin-user' : 'local-user')}
              style={styles.tauntBadge}
            >
              <Text style={{ fontSize: 20 }}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Start / Ready triggers */}
        {isAdmin ? (
          <TouchableOpacity
            onPress={handleStartGame}
            style={styles.startBtn}
            activeOpacity={0.9}
          >
            <Text style={styles.startBtnText}>
              {language === 'ar' ? '🚀 بدء المسابقة الآن' : '🚀 Start Quiz Now'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleToggleReady}
            style={[styles.startBtn, isReady ? { backgroundColor: '#34A853' } : { backgroundColor: colors.accentDeep }]}
            activeOpacity={0.9}
          >
            <Text style={styles.startBtnText}>
              {isReady ? (language === 'ar' ? '✅ جاهز للبدء' : '✅ Ready') : (language === 'ar' ? '⏳ تأكيد الاستعداد' : '⏳ Tap Ready')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <AdBanner />
    </View>
  );
}

// Animated Floating Emoji Component
function AnimatedEmoji({ emoji, xOffset }: { emoji: string; xOffset: number }) {
  const animatedY = useRef(new Animated.Value(0)).current;
  const animatedScale = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedY, {
        toValue: -80,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(animatedScale, {
          toValue: 1.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animatedScale, {
          toValue: 1.0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(animatedOpacity, {
        toValue: 0,
        delay: 1000,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.floatingEmoji,
        {
          transform: [
            { translateY: animatedY },
            { translateX: xOffset },
            { scale: animatedScale },
          ],
          opacity: animatedOpacity,
        },
      ]}
    >
      <Text style={{ fontSize: 26 }}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatingEmoji: {
    position: 'absolute',
    top: -10,
    zIndex: 999,
  },
});

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  headerRoomCode: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDeep,
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginTop: 2,
  },
  shareBtn: {
    padding: 8,
  },
  registerCard: {
    width: width * 0.88,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  registerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDeep,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  registerSubtitle: {
    fontSize: 11.5,
    color: colors.textSecondary,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  registerInput: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
    marginBottom: 16,
  },
  registerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginBottom: 12,
    textAlign: 'right',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  avatarBadge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarBadgeActive: {
    backgroundColor: '#E6F4EA',
    borderColor: '#34A853',
  },
  registerSubmitBtn: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  registerSubmitBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.surface,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  lobbyContent: {
    padding: 16,
    paddingBottom: 160,
  },
  settingsSummaryCard: {
    backgroundColor: '#EBF7F3',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D1EAE0',
    marginBottom: 20,
  },
  settingsSummaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
    marginBottom: 8,
  },
  settingsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  settingsPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 10.5,
    fontWeight: '700',
    color: '#065F46',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  playersListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playersListCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDeep,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  playersListTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  playersContainer: {
    gap: 10,
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerCardRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  adminBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  readyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  kickBtn: {
    backgroundColor: '#FCE8E6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  kickBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#C5221F',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  playerName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  actionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tauntsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  tauntBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startBtn: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: colors.primaryDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  startBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
});
