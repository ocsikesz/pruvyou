import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, DAYS_RO, getCompletionColor } from '@/constants/theme';
import { fmt, today } from '@/utils/dates';
import type { Habit, HabitLog } from '@/utils/types';

interface DayCardProps {
  date: Date;
  dayIndex: number; // 0=Mon .. 6=Sun
  habits: Habit[];
  log: HabitLog;
  onPress: (dateStr: string) => void;
}

export default function DayCard({ date, dayIndex, habits, log, onPress }: DayCardProps) {
  const dateStr = fmt(date);
  const isToday = dateStr === fmt(today());
  const isFuture = date > today();

  // Calculate daily completion ratio
  const dailyHabits = habits.filter(h => h.frequency === 'daily');
  const totalHabits = dailyHabits.length;
  const doneCount = dailyHabits.filter(h => log[dateStr]?.[h.id]?.done).length;
  const ratio = totalHabits > 0 ? doneCount / totalHabits : 0;
  const pct = Math.round(ratio * 100);
  const fillColor = getCompletionColor(ratio);

  return (
    <TouchableOpacity
      onPress={() => onPress(dateStr)}
      activeOpacity={0.7}
      style={[
        styles.card,
        isToday && { borderColor: colors.gold, borderWidth: 2 },
        isFuture && { opacity: 0.4 },
      ]}
    >
      {/* Progress bar container */}
      <View style={styles.progressContainer}>
        {/* Background track */}
        <View style={styles.progressTrack}>
          {/* Filled portion - grows from bottom */}
          <View
            style={[
              styles.progressFill,
              {
                height: `${pct}%`,
                backgroundColor: fillColor,
              },
            ]}
          />
        </View>

        {/* Percentage overlay */}
        <View style={styles.percentOverlay}>
          <Text style={[
            styles.percentText,
            { color: pct > 45 ? '#1a1714' : colors.textMuted },
          ]}>
            {totalHabits > 0 ? `${pct}%` : '—'}
          </Text>
        </View>

        {/* Done count badge */}
        {totalHabits > 0 && (
          <View style={styles.countBadge}>
            <Text style={[styles.countText, { color: fillColor }]}>
              {doneCount}/{totalHabits}
            </Text>
          </View>
        )}
      </View>

      {/* Day label */}
      <View style={[styles.dayLabel, isToday && { backgroundColor: colors.gold + '20' }]}>
        <Text style={[styles.dayName, isToday && { color: colors.gold }]}>
          {DAYS_RO[dayIndex]}
        </Text>
        <Text style={[styles.dayNumber, isToday && { color: colors.gold }]}>
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
    left: 4,
    right: 4,
    top: 4,
    bottom: 4,
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
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  countBadge: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
  },
  countText: {
    fontSize: 9,
    fontWeight: '700',
  },
  dayLabel: {
    paddingVertical: 6,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: 0.5,
  },
  dayNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textMuted,
    marginTop: 1,
  },
});
