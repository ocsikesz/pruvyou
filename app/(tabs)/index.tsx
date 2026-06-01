import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, brand, DAYS_SHORT, getCompletionColor } from '@/constants/theme';
import { STANDARD_CATEGORIES } from '@/constants/categories';
import { useHabits } from '@/hooks/useHabits';
import { getWeekDates, fmt, today } from '@/utils/dates';
import ProgressRing from '@/components/ProgressRing';

export default function HomeScreen() {
  const { habits, log, loaded, toggleDay, addMinutes } = useHabits();
  const [weekOff, setWeekOff] = useState(0);
  const weekDates = useMemo(() => getWeekDates(weekOff), [weekOff]);
  const todayStr = fmt(today());
  const todayDayIdx = today().getDay() === 0 ? 6 : today().getDay() - 1;

  if (!loaded) return <View style={st.container}><Text style={{ fontSize: 40, textAlign: 'center', marginTop: 100 }}>⏳</Text></View>;

  const todayHabits = habits.filter(h =>
    h.frequency === 'daily' || (h.frequency === 'weekly' && (h.selectedDays || []).includes(todayDayIdx))
  );
  const doneToday = todayHabits.filter(h => log[todayStr]?.[h.id]?.done).length;
  const todayRatio = todayHabits.length > 0 ? doneToday / todayHabits.length : 0;

  const weekDone = weekDates.reduce((sum, d, i) => {
    const ds = fmt(d);
    const active = habits.filter(h => h.frequency === 'daily' || (h.frequency === 'weekly' && (h.selectedDays || []).includes(i)));
    return sum + active.filter(h => log[ds]?.[h.id]?.done).length;
  }, 0);
  const weekTotal = weekDates.reduce((sum, _, i) =>
    sum + habits.filter(h => h.frequency === 'daily' || (h.frequency === 'weekly' && (h.selectedDays || []).includes(i))).length, 0);
  const weekRatio = weekTotal > 0 ? weekDone / weekTotal : 0;

  const bestStreak = habits.reduce((best, h) => {
    let s = 0;
    for (let i = 0; i < 365; i++) { const d = new Date(); d.setDate(d.getDate() - i); if (log[fmt(d)]?.[h.id]?.done) s++; else break; }
    return Math.max(best, s);
  }, 0);
  const streakRatio = Math.min(1, bestStreak / 30);

  const grouped = STANDARD_CATEGORIES.map(cat => ({
    cat, habits: habits.filter(h => h.categoryId === cat.id),
  })).filter(g => g.habits.length > 0);

  if (habits.length === 0) return (
    <View style={[st.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>🌱</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textDim }}>No habits yet</Text>
      <Text style={{ fontSize: 13, color: colors.textDark, marginTop: 8 }}>Go to the Habits tab to add your first habit</Text>
    </View>
  );

  return (
    <ScrollView style={st.container} showsVerticalScrollIndicator={false}>
      {/* Tagline */}
      <Text style={st.tagline}>
        Track. <Text style={{ color: brand.green }}>Achieve.</Text> <Text style={{ color: brand.gold }}>Triumph.</Text>
      </Text>

      {/* Progress Rings */}
      <View style={st.ringWrap}>
        <View style={st.ringBox}>
          <View style={{ position: 'absolute' }}><ProgressRing size={160} strokeWidth={10} progress={weekRatio} color={brand.green} /></View>
          <View style={{ position: 'absolute', left: 15, top: 15 }}><ProgressRing size={130} strokeWidth={10} progress={todayRatio} color={brand.blue} /></View>
          <View style={{ position: 'absolute', left: 30, top: 30 }}><ProgressRing size={100} strokeWidth={10} progress={streakRatio} color={brand.gold} /></View>
          <View style={st.ringCenter}>
            <Text style={st.ringPct}>{Math.round(weekRatio * 100)}%</Text>
            <Text style={st.ringLabel}>weekly goal</Text>
          </View>
        </View>
      </View>
      <View style={st.legendRow}>
        <View style={st.legendItem}><View style={[st.legendDot, { backgroundColor: brand.green }]} /><Text style={st.legendText}>Week</Text></View>
        <View style={st.legendItem}><View style={[st.legendDot, { backgroundColor: brand.blue }]} /><Text style={st.legendText}>Today</Text></View>
        <View style={st.legendItem}><View style={[st.legendDot, { backgroundColor: brand.gold }]} /><Text style={st.legendText}>Streak</Text></View>
      </View>

      {/* Week nav */}
      <View style={st.weekNav}>
        <TouchableOpacity onPress={() => setWeekOff(w => w - 1)} style={st.navBtn}>
          <Ionicons name="chevron-back" size={16} color={colors.textDim} />
        </TouchableOpacity>
        <Text style={st.weekLabel}>{weekOff === 0 ? 'This week' :
          `${weekDates[0].toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} – ${weekDates[6].toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`}</Text>
        <TouchableOpacity onPress={() => setWeekOff(w => Math.min(0, w + 1))} style={[st.navBtn, weekOff >= 0 && { opacity: 0.3 }]} disabled={weekOff >= 0}>
          <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
        </TouchableOpacity>
      </View>

      {/* Category Cards */}
      {grouped.map(({ cat, habits: ch }) => (
        <View key={cat.id} style={[st.catCard, { backgroundColor: cat.bg, borderColor: cat.border }]}>
          <View style={st.catHeader}>
            <View style={[st.catIcon, { backgroundColor: cat.color + '20' }]}>
              <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
            </View>
            <Text style={[st.catTitle, { color: cat.color }]}>{cat.name}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </View>

          {ch.map(h => {
            const entry = log[todayStr]?.[h.id];
            const done = !!entry?.done;

            if (h.type === 'timer') {
              const mins = entry?.minutes || 0;
              const ratio = h.targetMinutes > 0 ? mins / h.targetMinutes : 0;
              return (
                <View key={h.id} style={{ marginTop: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: cat.color }}>{h.icon} {h.name}</Text>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: cat.color }}>{mins}/{h.targetMinutes} min</Text>
                  </View>
                  <View style={[st.progressTrack, { backgroundColor: cat.border }]}>
                    <View style={{ height: '100%', width: `${Math.min(100, ratio * 100)}%`, backgroundColor: cat.color, borderRadius: 3 }} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                    <TouchableOpacity onPress={() => addMinutes(h.id, todayStr, -5, h.targetMinutes)} style={[st.miniBtn, { borderColor: cat.border }]}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: cat.color }}>-5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => addMinutes(h.id, todayStr, 5, h.targetMinutes)} style={[st.miniBtn, { borderColor: cat.border }]}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: cat.color }}>+5</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            return (
              <View key={h.id} style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: cat.color }}>{h.icon} {h.name}</Text>
                  {done && <Text style={{ fontSize: 10, fontWeight: '700', color: brand.green }}>✓</Text>}
                </View>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {weekDates.map((d, i) => {
                    const ds = fmt(d);
                    const dayDone = log[ds]?.[h.id]?.done;
                    const isToday = ds === todayStr;
                    const scheduled = h.frequency === 'daily' || (h.selectedDays || []).includes(i);
                    return (
                      <TouchableOpacity key={i} onPress={() => { if (scheduled) toggleDay(h.id, ds); }}
                        style={[st.dayPill,
                          dayDone && { backgroundColor: cat.color, borderColor: cat.color },
                          isToday && !dayDone && { borderColor: brand.gold, borderWidth: 2 },
                          !scheduled && { opacity: 0.3 },
                        ]}>
                        <Text style={[st.dayPillDay, dayDone && { color: '#fff' }]}>{DAYS_SHORT[i].substring(0, 2)}</Text>
                        <Text style={[st.dayPillNum, dayDone && { color: '#fff' }]}>{d.getDate()}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {(() => {
            let streak = 0;
            for (const h of ch) {
              let s = 0;
              for (let i = 0; i < 365; i++) { const d = new Date(); d.setDate(d.getDate() - i); if (log[fmt(d)]?.[h.id]?.done) s++; else break; }
              streak = Math.max(streak, s);
            }
            return streak > 0 ? <Text style={{ fontSize: 11, fontWeight: '700', color: cat.color, marginTop: 10 }}>{streak} day streak 🔥</Text> : null;
          })()}
        </View>
      ))}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16 },
  tagline: { textAlign: 'center', fontSize: 14, fontWeight: '600', color: colors.textMuted, marginVertical: 12 },
  ringWrap: { alignItems: 'center', marginBottom: 12 },
  ringBox: { width: 160, height: 160, position: 'relative' },
  ringCenter: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  ringPct: { fontSize: 28, fontWeight: '800', color: colors.text },
  ringLabel: { fontSize: 10, fontWeight: '600', color: colors.textDim },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: '600', color: colors.textDim },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  weekLabel: { fontSize: 12, fontWeight: '600', color: colors.textDim },
  catCard: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  catHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  catIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  catTitle: { fontSize: 14, fontWeight: '700', flex: 1, marginLeft: 10 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 2 },
  miniBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, borderWidth: 1, backgroundColor: '#fff' },
  dayPill: { flex: 1, height: 40, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dayPillDay: { fontSize: 8, fontWeight: '700', color: colors.textDim, letterSpacing: 0.3 },
  dayPillNum: { fontSize: 12, fontWeight: '800', color: colors.textMuted },
});
