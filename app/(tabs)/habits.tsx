import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { colors } from '@/constants/theme';
import { getCategoryById, getAllCategories } from '@/constants/categories';
import { useHabits } from '@/hooks/useHabits';
import HabitForm from '@/components/HabitForm';
import type { Habit } from '@/utils/types';

export default function HabitsScreen() {
  const { habits, loaded, customCategories, addHabit, updateHabit, deleteHabit, addCustomCategory } = useHabits();
  const [showAdd, setShowAdd] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);

  if (!loaded) return <View style={styles.container} />;

  // Group habits by category
  const allCats = getAllCategories(customCategories);
  const grouped = allCats
    .map(cat => ({
      category: cat,
      habits: habits.filter(h => h.categoryId === cat.id),
    }))
    .filter(g => g.habits.length > 0);

  // Habits without category
  const uncategorized = habits.filter(h => !allCats.find(c => c.id === h.categoryId));

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
          customCategories={customCategories}
          onSave={(h) => {
            if (editHabit) updateHabit(h);
            else addHabit(h);
            setShowAdd(false);
            setEditHabit(null);
          }}
          onCancel={() => { setShowAdd(false); setEditHabit(null); }}
          onAddCategory={addCustomCategory}
        />
      )}

      {habits.length === 0 && !showAdd && (
        <View style={styles.empty}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>📋</Text>
          <Text style={styles.emptyText}>Apasă butonul de mai sus pentru a crea primul obicei</Text>
        </View>
      )}

      {/* Grouped by category */}
      {grouped.map(({ category, habits: catHabits }) => (
        <View key={category.id} style={styles.catSection}>
          <View style={styles.catHeader}>
            {category.isCustom && category.customIconUri ? (
              <Image source={{ uri: category.customIconUri }} style={styles.catIcon} />
            ) : (
              <Text style={{ fontSize: 18 }}>{category.icon}</Text>
            )}
            <Text style={[styles.catName, { color: category.color }]}>{category.name}</Text>
            <View style={[styles.catBadge, { backgroundColor: category.color + '20' }]}>
              <Text style={[styles.catBadgeText, { color: category.color }]}>{catHabits.length}</Text>
            </View>
          </View>
          {catHabits.map(h => (
            <HabitCard
              key={h.id}
              habit={h}
              category={category}
              onEdit={() => setEditHabit(h)}
              onDelete={() => {
                Alert.alert('Șterge', `Ștergi "${h.name}"?`, [
                  { text: 'Anulează', style: 'cancel' },
                  { text: 'Șterge', style: 'destructive', onPress: () => deleteHabit(h.id) },
                ]);
              }}
            />
          ))}
        </View>
      ))}

      {/* Uncategorized */}
      {uncategorized.length > 0 && (
        <View style={styles.catSection}>
          <View style={styles.catHeader}>
            <Text style={{ fontSize: 18 }}>📌</Text>
            <Text style={[styles.catName, { color: colors.textDim }]}>Fără categorie</Text>
          </View>
          {uncategorized.map(h => (
            <HabitCard
              key={h.id}
              habit={h}
              onEdit={() => setEditHabit(h)}
              onDelete={() => {
                Alert.alert('Șterge', `Ștergi "${h.name}"?`, [
                  { text: 'Anulează', style: 'cancel' },
                  { text: 'Șterge', style: 'destructive', onPress: () => deleteHabit(h.id) },
                ]);
              }}
            />
          ))}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function HabitCard({ habit, category, onEdit, onDelete }: {
  habit: Habit;
  category?: any;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.card, { borderLeftWidth: 3, borderLeftColor: category?.color || colors.textDark }]}>
      <View style={styles.cardLeft}>
        <View style={{ marginLeft: 4, flex: 1 }}>
          <Text style={styles.cardName}>{habit.icon} {habit.name}</Text>
          <Text style={styles.cardMeta}>
            {habit.type === 'timer' ? `${habit.targetMinutes} min` : 'Checkbox'} · {habit.frequency === 'daily' ? 'Zilnic' : 'Săptămânal'}
            {habit.frequency === 'weekly' && habit.weeklyTarget ? ` · ${habit.weeklyTarget}x/săpt` : ''}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
          <Text>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
          <Text>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: 12 },
  addBtn: {
    padding: 16, borderRadius: 12, backgroundColor: colors.gold,
    alignItems: 'center', marginBottom: 16,
  },
  addBtnText: { fontSize: 15, fontWeight: '700', color: colors.bg },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 13, color: colors.textDark },

  // Category sections
  catSection: { marginBottom: 20 },
  catHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 8, paddingHorizontal: 4,
  },
  catIcon: { width: 22, height: 22, borderRadius: 4 },
  catName: { fontSize: 14, fontWeight: '700', flex: 1 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  catBadgeText: { fontSize: 11, fontWeight: '700' },

  // Habit cards
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, borderRadius: 12, padding: 14,
    marginBottom: 6, borderWidth: 1, borderColor: colors.border,
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  cardName: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  cardMeta: { fontSize: 11, color: colors.textDark, marginTop: 3 },
  cardActions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
});
