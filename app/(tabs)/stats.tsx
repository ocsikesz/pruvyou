import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, brand, getCompletionColor } from '@/constants/theme';
import { useHabits } from '@/hooks/useHabits';
import { fmt } from '@/utils/dates';

export default function StatsScreen() {
  const { habits, log, loaded } = useHabits();

  const last30 = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d);
    }
    return dates;
  }, []);

  const dailyHabits = habits.filter(h => h.frequency === 'daily');

  const dailyData = useMemo(() => {
    if (dailyHabits.length === 0) return [];
    return last30.map(d => {
      const ds = fmt(d);
      const done = dailyHabits.filter(h => log[ds]?.[h.id]?.done).length;
      return { date: d.getDate(), rate: Math.round((done / dailyHabits.length) * 100) };
    });
  }, [dailyHabits, log, last30]);

  const habitStats = useMemo(() => {
    return dailyHabits.map(h => {
      const done = last30.filter(d => log[fmt(d)]?.[h.id]?.done).length;
      return { name: h.icon + ' ' + h.name, rate: Math.round((done / 30) * 100), color: h.color, done };
    });
  }, [dailyHabits, log, last30]);

  const streaks = useMemo(() => {
    return dailyHabits.map(h => {
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        if (log[fmt(d)]?.[h.id]?.done) streak++;
        else break;
      }
      return { name: h.icon + ' ' + h.name, streak, color: h.color };
    }).sort((a, b) => b.streak - a.streak);
  }, [dailyHabits, log]);

  if (!loaded) return <View style={styles.container} />;

  if (habits.length === 0) {
    return (
      <View style={[styles.container, styles.empty]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📊</Text>
        <Text style={styles.emptyText}>Add habits to see your statistics</Text>
      </View>
    );
  }

  const maxRate = Math.max(...dailyData.map(d => d.rate), 1);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 30-day trend chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Completion rate (30 days)</Text>
        <View style={styles.chart}>
          {dailyData.map((d, i) => (
            <View key={i} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View style={[
                  styles.barFill,
                  {
                    height: `${d.rate}%`,
                    backgroundColor: getCompletionColor(d.rate / 100),
                  },
                ]} />
              </View>
              {i % 5 === 0 && <Text style={styles.barLabel}>{d.date}</Text>}
            </View>
          ))}
        </View>
      </View>

      {/* Per-habit bars */}
      {habitStats.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Per habit (30 days)</Text>
          {habitStats.map((h, i) => (
            <View key={i} style={styles.hBarRow}>
              <Text style={styles.hBarLabel} numberOfLines={1}>{h.name}</Text>
              <View style={styles.hBarTrack}>
                <View style={[styles.hBarFill, {
                  width: `${h.rate}%`,
                  backgroundColor: h.color,
                }]} />
              </View>
              <Text style={[styles.hBarPct, { color: h.color }]}>{h.rate}%</Text>
            </View>
          ))}
        </View>
      )}

      {/* Streaks */}
      {streaks.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔥 Current streaks</Text>
          {streaks.map((s, i) => (
            <View key={i} style={[styles.streakRow, i < streaks.length - 1 && styles.streakBorder]}>
              <Text style={styles.streakName}>{s.name}</Text>
              <Text style={[styles.streakCount, {
                color: s.streak > 7 ? colors.green : s.streak > 0 ? colors.yellow : colors.textDarkest,
              }]}>
                {s.streak} {s.streak === 1 ? 'day' : 'days'}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.borderLight, paddingHorizontal: 16, paddingTop: 12 },
  empty: { justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 13, color: colors.textDark },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: brand.blue, marginBottom: 14 },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    gap: 1,
  },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: {
    width: '100%',
    height: 120,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 3,
    minHeight: 1,
    opacity: 0.85,
  },
  barLabel: { fontSize: 8, color: colors.textDark, marginTop: 4 },
  hBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  hBarLabel: {
    width: 100,
    fontSize: 11,
    color: colors.textMuted,
    marginRight: 8,
  },
  hBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: colors.borderLight,
    borderRadius: 5,
    overflow: 'hidden',
  },
  hBarFill: { height: '100%', borderRadius: 5, opacity: 0.8 },
  hBarPct: { width: 40, textAlign: 'right', fontSize: 12, fontWeight: '700', marginLeft: 8 },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  streakBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  streakName: { fontSize: 13, color: colors.textMuted },
  streakCount: { fontSize: 16, fontWeight: '800' },
});
