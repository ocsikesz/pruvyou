import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors, PALETTE, ICONS } from '@/constants/theme';
import type { Habit } from '@/utils/types';

interface HabitFormProps {
  habit?: Habit | null;
  onSave: (h: any) => void;
  onCancel: () => void;
}

export default function HabitForm({ habit, onSave, onCancel }: HabitFormProps) {
  const [name, setName] = useState(habit?.name || '');
  const [type, setType] = useState<'check' | 'timer'>(habit?.type || 'check');
  const [freq, setFreq] = useState<'daily' | 'weekly'>(habit?.frequency || 'daily');
  const [mins, setMins] = useState(String(habit?.targetMinutes || 15));
  const [weeklyTarget, setWeeklyTarget] = useState(String(habit?.weeklyTarget || 3));
  const [icon, setIcon] = useState(habit?.icon || '🎯');
  const [color, setColor] = useState(habit?.color || PALETTE[0]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      ...(habit || {}),
      name: name.trim(),
      type,
      frequency: freq,
      targetMinutes: parseInt(mins) || 15,
      weeklyTarget: parseInt(weeklyTarget) || 3,
      icon,
      color,
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{habit ? 'Editează obiceiul' : 'Obicei nou'}</Text>

      <Text style={styles.label}>NUME</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="ex: Abdomene"
        placeholderTextColor={colors.textDark}
        style={styles.input}
      />

      <Text style={styles.label}>ICON</Text>
      <View style={styles.row}>
        {ICONS.map(ic => (
          <TouchableOpacity
            key={ic}
            onPress={() => setIcon(ic)}
            style={[styles.iconBtn, icon === ic && styles.iconBtnActive]}
          >
            <Text style={{ fontSize: 20 }}>{ic}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>TIP</Text>
      <View style={styles.toggleRow}>
        {([['check', '✓ Checkbox'], ['timer', '⏱ Timer']] as const).map(([v, l]) => (
          <TouchableOpacity
            key={v}
            onPress={() => setType(v)}
            style={[styles.toggle, type === v && styles.toggleActive]}
          >
            <Text style={[styles.toggleText, type === v && styles.toggleTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {type === 'timer' && (
        <>
          <Text style={styles.label}>TARGET (MINUTE/ZI)</Text>
          <TextInput
            value={mins}
            onChangeText={setMins}
            keyboardType="number-pad"
            style={styles.input}
          />
        </>
      )}

      <Text style={styles.label}>FRECVENȚĂ</Text>
      <View style={styles.toggleRow}>
        {([['daily', 'Zilnic'], ['weekly', 'Săptămânal']] as const).map(([v, l]) => (
          <TouchableOpacity
            key={v}
            onPress={() => setFreq(v)}
            style={[styles.toggle, freq === v && styles.toggleActive]}
          >
            <Text style={[styles.toggleText, freq === v && styles.toggleTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {freq === 'weekly' && (
        <>
          <Text style={styles.label}>CÂTE ORI PE SĂPTĂMÂNĂ?</Text>
          <TextInput
            value={weeklyTarget}
            onChangeText={setWeeklyTarget}
            keyboardType="number-pad"
            style={styles.input}
          />
        </>
      )}

      <Text style={styles.label}>CULOARE</Text>
      <View style={styles.row}>
        {PALETTE.map(c => (
          <TouchableOpacity
            key={c}
            onPress={() => setColor(c)}
            style={[styles.colorBtn, { backgroundColor: c }, color === c && styles.colorBtnActive]}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Anulează</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveText}>Salvează</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCardHover,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gold,
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textDim,
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    fontSize: 14,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnActive: {
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.gold + '15',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  toggle: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  toggleActive: {
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.gold + '15',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
  },
  toggleTextActive: {
    color: colors.gold,
  },
  colorBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorBtnActive: {
    borderColor: '#fff',
    borderWidth: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDim,
  },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.gold,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.bg,
  },
});
