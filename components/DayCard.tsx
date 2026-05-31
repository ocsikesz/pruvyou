import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, brand, DAYS_SHORT, getCompletionColor } from '@/constants/theme';
import { fmt, today } from '@/utils/dates';
import type { Habit, HabitLog } from '@/utils/types';

interface DayCardProps {
  date: Date;
  dayIndex: number;
  habits: Habit[];
  log: HabitLog;
  onPress: (dateStr: string) => void;
}

export default function DayCard({ date, dayIndex, habits, log, onPress }: DayCardProps) {
  const dateStr = fmt(date);
  const isToday = dateStr === fmt(today());
  const isFuture = date > today();

  const activeHabits = habits.filter(h =>
    h.frequency === 'daily' || (h.frequency === 'weekly' && (h.selectedDays || []).includes(dayIndex))
  );
  const totalHabits = activeHabits.length;
  const doneCount = activeHabits.filter(h => log[dateStr]?.[h.id]?.done).length;
  const ratio = totalHabits > 0 ? doneCount / totalHabits : 0;
  const pct = Math.round(ratio * 100);
  const fillColor = getCompletionColor(ratio);

  return (
    <TouchableOpacity
      onPress={() => onPress(dateStr)}
      activeOpacity={0.7}
      style={[
        styles.card,
        isToday && { borderColor: brand.gold, borderWidth: 2 },
        isFuture && { opacity: 0.4 },
      ]}
    >
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { height: `${pct}%`, backgroundColor: fillColor },
            ]}
          />
        </View>
        <View style={styles.percentOverlay}>
          <Text style={[
            styles.percentText,
            { color: pct > 45 ? '#0D1219' : colors.textMuted },
          ]}>
            {totalHabits > 0 ? `${pct}%` : '—'}
          </Text>
        </View>
        {totalHabits > 0 && (
          <View style={styles.countBadge}>
            <Text style={[styles.countText, { color: fillColor }]}>
              {doneCount}/{totalHabits}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.dayLabel, isToday && { backgroundColor: brand.gold + '18' }]}>
        <Text style={[styles.dayName, isToday && { color: brand.gold }]}>
          {DAYS_SHORT[dayIndex]}
        </Text>
        <Text style={[styles.dayNumber, isToday && { color: brand.gold }]}>
          {date.getDate()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginHorizontal: 3,
    borderRadius: 14,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    minHeight: 140,
  },
  progressContainer: {
    flex: 1,
    padding: 4,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  progressTrack: {
    position: 'absolute',
    left: 4, right: 4, top: 4, bottom: 4,
    borderRadius: 10,
    backgroundColor: colors.bg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  progressFill: {
    width: '100%',
    borderRadius: 10,
    minHeight: 2,
  },
  percentOverlay: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: { fontSize: 14, fontWeight: '800', letterSpacing: -0.5 },
  countBadge: { position: 'absolute', top: 8, alignSelf: 'center' },
  countText: { fontSize: 9, fontWeight: '700' },
  dayLabel: {
    paddingVertical: 6,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dayName: { fontSize: 11, fontWeight: '700', color: colors.textDim, letterSpacing: 0.5 },
  dayNumber: { fontSize: 15, fontWeight: '800', color: colors.textMuted, marginTop: 1 },
});
