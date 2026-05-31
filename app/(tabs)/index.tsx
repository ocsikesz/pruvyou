import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, DAYS_SHORT, getCompletionColor } from "@/constants/theme";
import { useHabits } from '@/hooks/useHabits';
import { getWeekDates, fmt, today, clamp } from '@/utils/dates';
import DayCard from '@/components/DayCard';

export default function HomeScreen() {
  const { habits, log, loaded, toggleDay, addMinutes } = useHabits();
  const [weekOff, setWeekOff] = useState(0);

  const weekDates = useMemo(() => getWeekDates(weekOff), [weekOff]);
  const todayStr = fmt(today());

  if (!loaded) {
    return (
      <View style={styles.loading}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>⏳</Text>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (habits.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🌱</Text>
        <Text style={styles.emptyTitle}>No habits yet</Text>
        <Text style={styles.emptySubtitle}>
          Go to the Habits tab to add your first habit
        </Text>
      </View>
    );
  }

  const dailyHabits = habits.filter(h => h.frequency === 'daily');
  const weeklyHabits = habits.filter(h => h.frequency === 'weekly');

  // Overall week score
  const weekScore = dailyHabits.length > 0
    ? weekDates.reduce((sum, d) => {
        const ds = fmt(d);
        const done = dailyHabits.filter(h => log[ds]?.[h.id]?.done).length;
        return sum + done;
      }, 0)
    : 0;
  const weekTotal = dailyHabits.length * 7;
  const weekPct = weekTotal > 0 ? Math.round((weekScore / weekTotal) * 100) : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Week navigator */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => setWeekOff(w => w - 1)} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={18} color={colors.textDim} />
        </TouchableOpacity>
        <View style={styles.weekInfo}>
          <Text style={styles.weekLabel}>
            {weekOff === 0 ? 'This week' :
              `${weekDates[0].toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} – ${weekDates[6].toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`}
          </Text>
          <Text style={[styles.weekScore, { color: getCompletionColor(weekPct / 100) }]}>
            {weekPct}% completed
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setWeekOff(w => Math.min(0, w + 1))}
          style={[styles.navBtn, weekOff >= 0 && { opacity: 0.3 }]}
          disabled={weekOff >= 0}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
        </TouchableOpacity>
      </View>

      {/* ── 7 Day Cards ── */}
      <View style={styles.cardsRow}>
        {weekDates.map((d, i) => (
          <DayCard
            key={i}
            date={d}
            dayIndex={i}
            habits={habits}
            log={log}
            onPress={(ds) => {
              // Toggle all incomplete habits for the day or open detail
              dailyHabits.forEach(h => {
                if (h.type === 'check' && !log[ds]?.[h.id]?.done) {
                  // don't auto-toggle, let them use the detail below
                }
              });
            }}
          />
        ))}
      </View>

      {/* ── Today's habits checklist ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today — {today().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        {dailyHabits.map(habit => {
          const entry = log[todayStr]?.[habit.id];
          const done = !!entry?.done;
          return (
            <TouchableOpacity
              key={habit.id}
              onPress={() => {
                if (habit.type === 'check') {
                  toggleDay(habit.id, todayStr);
                }
              }}
              style={[styles.habitRow, done && { borderColor: habit.color + '40' }]}
            >
              <View style={[styles.checkCircle, done && { backgroundColor: habit.color, borderColor: habit.color }]}>
                {done && <Ionicons name="checkmark" size={16} color={colors.bg} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.habitName, done && { textDecorationLine: 'line-through', color: colors.textDim }]}>
                  {habit.icon} {habit.name}
                </Text>
                {habit.type === 'timer' && (
                  <Text style={styles.habitMeta}>
                    {entry?.minutes || 0} / {habit.targetMinutes} min
                  </Text>
                )}
              </View>
              {habit.type === 'timer' && (
                <View style={styles.timerBtns}>
                  <TouchableOpacity
                    onPress={() => addMinutes(habit.id, todayStr, -5, habit.targetMinutes)}
                    style={styles.timerBtn}
                  >
                    <Text style={styles.timerBtnText}>-5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => addMinutes(habit.id, todayStr, 5, habit.targetMinutes)}
                    style={styles.timerBtn}
                  >
                    <Text style={styles.timerBtnText}>+5</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Weekly habits ── */}
      {weeklyHabits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly</Text>
          {weeklyHabits.map(habit => {
            const weekTotal = weekDates.reduce((sum, d) => {
              const ds = fmt(d);
              if (habit.type === 'timer') return sum + (log[ds]?.[habit.id]?.minutes || 0);
              return sum + (log[ds]?.[habit.id]?.done ? 1 : 0);
            }, 0);
            const target = habit.type === 'timer'
              ? habit.targetMinutes * (habit.weeklyTarget || 1)
              : (habit.weeklyTarget || 3);
            const ratio = target > 0 ? weekTotal / target : 0;
            return (
              <View key={habit.id} style={styles.weeklyCard}>
                <View style={styles.weeklyHeader}>
                  <Text style={styles.habitName}>{habit.icon} {habit.name}</Text>
                  <Text style={[styles.weeklyScore, { color: getCompletionColor(Math.min(1, ratio)) }]}>
                    {weekTotal}{habit.type === 'timer' ? 'm' : ''} / {target}{habit.type === 'timer' ? 'm' : 'x'}
                  </Text>
                </View>
                <View style={styles.progressBarH}>
                  <View style={[styles.progressFillH, {
                    width: `${Math.min(100, ratio * 100)}%`,
                    backgroundColor: habit.color,
                  }]} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { fontSize: 16, color: colors.accent },
  empty: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: { fontSize: 20, color: colors.textDim, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: colors.textDark, textAlign: 'center' },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekInfo: { alignItems: 'center' },
  weekLabel: { fontSize: 13, color: colors.textDim, fontWeight: '500' },
  weekScore: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  cardsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.textDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitName: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  habitMeta: { fontSize: 11, color: colors.textDark, marginTop: 2 },
  timerBtns: { flexDirection: 'row', gap: 6 },
  timerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timerBtnText: { fontSize: 12, fontWeight: '700', color: colors.accent },
  weeklyCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weeklyScore: { fontSize: 14, fontWeight: '700' },
  progressBarH: {
    height: 6,
    backgroundColor: colors.bg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFillH: {
    height: '100%',
    borderRadius: 3,
  },
});
