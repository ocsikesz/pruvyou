import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors } from '@/constants/theme';
import { useHabits } from '@/hooks/useHabits';
import HabitForm from '@/components/HabitForm';
import type { Habit } from '@/utils/types';

export default function HabitsScreen() {
  const { habits, loaded, addHabit, updateHabit, deleteHabit } = useHabits();
  const [showAdd, setShowAdd] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);

  if (!loaded) return <View style={styles.container} />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        onPress={() => { setShowAdd(true); setEditHabit(null); }}
        style={styles.addBtn}
      >
        <Text style={styles.addBtnText}>＋ Adaugă obicei nou</Text>
      </TouchableOpacity>

      {(showAdd || editHabit) && (
        <HabitForm
          habit={editHabit}
          onSave={(h) => {
            if (editHabit) updateHabit(h);
            else addHabit(h);
            setShowAdd(false);
            setEditHabit(null);
          }}
          onCancel={() => { setShowAdd(false); setEditHabit(null); }}
        />
      )}

      {habits.length === 0 && !showAdd && (
        <View style={styles.empty}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>📋</Text>
          <Text style={styles.emptyText}>Apasă butonul de mai sus pentru a crea primul obicei</Text>
        </View>
      )}

      {habits.map(h => (
        <View key={h.id} style={styles.card}>
          <View style={styles.cardLeft}>
            <Text style={{ fontSize: 24 }}>{h.icon}</Text>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.cardName}>{h.name}</Text>
              <Text style={styles.cardMeta}>
                {h.type === 'timer' ? `${h.targetMinutes} min` : 'Checkbox'} · {h.frequency === 'daily' ? 'Zilnic' : 'Săptămânal'}
                {h.frequency === 'weekly' && h.weeklyTarget ? ` · ${h.weeklyTarget}x/săpt` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => setEditHabit(h)} style={styles.actionBtn}>
              <Text>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Șterge', `Ștergi "${h.name}"?`, [
                  { text: 'Anulează', style: 'cancel' },
                  { text: 'Șterge', style: 'destructive', onPress: () => deleteHabit(h.id) },
                ]);
              }}
              style={styles.actionBtn}
            >
              <Text>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  addBtn: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.gold,
    alignItems: 'center',
    marginBottom: 16,
  },
  addBtnText: { fontSize: 15, fontWeight: '700', color: colors.bg },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 13, color: colors.textDark },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  cardName: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  cardMeta: { fontSize: 11, color: colors.textDark, marginTop: 3 },
  cardActions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
