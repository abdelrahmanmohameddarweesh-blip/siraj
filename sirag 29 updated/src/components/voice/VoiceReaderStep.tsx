import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { readers, type Reader } from '../../data/readers';

interface VoiceReaderStepProps {
  styles: any;
  onSelectReader: (reader: Reader) => void;
}

export function VoiceReaderStep({ styles, onSelectReader }: VoiceReaderStepProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>اختر الشيخ القارئ لمحاكاة تلاوته:</Text>
      <View style={styles.readersList}>
        {readers.map((reader) => (
          <TouchableOpacity
            key={reader.id}
            style={styles.readerRow}
            onPress={() => onSelectReader(reader)}
            activeOpacity={0.85}
          >
            <View style={styles.readerEmojiContainer}>
              <Text style={styles.readerEmoji}>{reader.emoji}</Text>
            </View>
            <View style={styles.readerInfo}>
              <Text style={styles.readerName}>{reader.name}</Text>
              <Text style={styles.readerDesc}>{reader.styleDescription}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
