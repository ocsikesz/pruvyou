import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, brand, PALETTE } from '@/constants/theme';
import { STANDARD_CATEGORYS, getAllCategories, type Category } from '@/constants/categories';
import type { Habit } from '@/utils/types';

interface HabitFormProps {
  habit?: Habit | null;
  customCategories: Category[];
  onSave: (h: any) => void;
  onCancel: () => void;
  onAddCategory: (cat: Category) => void;
}

export default function HabitForm({ habit, customCategories, onSave, onCancel, onAddCategory }: HabitFormProps) {
  const [name, setName] = useState(habit?.name || '');
  const [type, setType] = useState<'check' | 'timer'>(habit?.type || 'check');
  const [freq, setFreq] = useState<'daily' | 'weekly'>(habit?.frequency || 'daily');
  const [mins, setMins] = useState(String(habit?.targetMinutes || 15));
  const [selectedDays, setSelectedDays] = useState<number[]>(habit?.selectedDays || []);
  const [categoryId, setCategoryId] = useState(habit?.categoryId || 'sport');

  // New category form
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PALETTE[0]);
  const [newCatIcon, setNewCatIcon] = useState<string | null>(null);

  const allCategories = getAllCategories(customCategories);
  const selectedCat = allCategories.find(c => c.id === categoryId);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: false,
    });
    if (!result.canceled && result.assets[0]) {
      setNewCatIcon(result.assets[0].uri);
    }
  };

  const saveNewCategory = () => {
    if (!newCatName.trim()) {
      Alert.alert('Error', 'Enter a category name');
      return;
    }
    const cat: Category = {
      id: 'custom_' + Date.now(),
      name: newCatName.trim(),
      icon: 'custom',
      customIconUri: newCatIcon || undefined,
      color: newCatColor,
      isCustom: true,
    };
    onAddCategory(cat);
    setCategoryId(cat.id);
    setShowNewCat(false);
    setNewCatName('');
    setNewCatIcon(null);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const cat = allCategories.find(c => c.id === categoryId);
    onSave({
      ...(habit || {}),
      name: name.trim(),
      type,
      frequency: freq,
      targetMinutes: parseInt(mins) || 15,
      weeklyTarget: freq === 'weekly' ? selectedDays.length : 7,
            selectedDays: freq === 'weekly' ? selectedDays : [],
      icon: cat?.icon === 'custom' ? '📌' : (cat?.icon || '🎯'),
      color: cat?.color || PALETTE[0],
      categoryId,
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{habit ? 'Edit habit' : 'New habit'}</Text>

      {/* ── Category Selection ── */}
      <Text style={styles.label}>CATEGORY</Text>
      <View style={styles.catGrid}>
        {allCategories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => setCategoryId(cat.id)}
            style={[
              styles.catBtn,
              categoryId === cat.id && { borderColor: cat.color, borderWidth: 2, backgroundColor: cat.color + '15' },
            ]}
          >
            {cat.isCustom && cat.customIconUri ? (
              <Image source={{ uri: cat.customIconUri }} style={styles.catIconImg} />
            ) : (
              <Text style={styles.catEmoji}>{cat.icon}</Text>
            )}
            <Text style={[
              styles.catLabel,
              categoryId === cat.id && { color: cat.color },
            ]} numberOfLines={1}>
              {cat.name}
            </Text>
            <View style={[styles.catDot, { backgroundColor: cat.color }]} />
          </TouchableOpacity>
        ))}

        {/* Add new category button */}
        <TouchableOpacity
          onPress={() => setShowNewCat(!showNewCat)}
          style={[styles.catBtn, styles.catBtnAdd]}
        >
          <Text style={styles.catAddIcon}>＋</Text>
          <Text style={styles.catAddLabel}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* ── New Category Form ── */}
      {showNewCat && (
        <View style={styles.newCatBox}>
          <Text style={styles.newCatTitle}>New category</Text>

          <Text style={styles.label}>NUME CATEGORY</Text>
          <TextInput
            value={newCatName}
            onChangeText={setNewCatName}
            placeholder="e.g. Meditation"
            placeholderTextColor={colors.textDark}
            style={styles.input}
          />

          <Text style={styles.label}>ICON</Text>
          <TouchableOpacity onPress={pickImage} style={styles.iconUpload}>
            {newCatIcon ? (
              <Image source={{ uri: newCatIcon }} style={styles.iconPreview} />
            ) : (
              <View style={styles.iconPlaceholder}>
                <Text style={{ fontSize: 24, color: colors.textDark }}>📷</Text>
                <Text style={{ fontSize: 10, color: colors.textDark, marginTop: 4 }}>Upload image</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>COLOR</Text>
          <View style={styles.colorRow}>
            {PALETTE.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setNewCatColor(c)}
                style={[styles.colorBtn, { backgroundColor: c }, newCatColor === c && styles.colorBtnActive]}
              />
            ))}
          </View>

          <View style={styles.newCatActions}>
            <TouchableOpacity onPress={() => setShowNewCat(false)} style={styles.cancelSmall}>
              <Text style={styles.cancelSmallText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={saveNewCategory} style={[styles.saveSmall, { backgroundColor: newCatColor }]}>
              <Text style={styles.saveSmallText}>Save category</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Habit Name ── */}
      <Text style={styles.label}>HABIT NAME</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Morning abs 15 min"
        placeholderTextColor={colors.textDark}
        style={styles.input}
      />

      {/* ── Type ── */}
      <Text style={styles.label}>TYPE</Text>
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
          <Text style={styles.label}>TARGET (MINUTES/DAY)</Text>
          <TextInput value={mins} onChangeText={setMins} keyboardType="number-pad" style={styles.input} />
        </>
      )}

      {/* ── Frequency ── */}
      <Text style={styles.label}>FREQUENCY</Text>
      <View style={styles.toggleRow}>
        {([['daily', 'Daily'], ['weekly', 'Weekly']] as const).map(([v, l]) => (
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
          <Text style={styles.label}>SELECT DAYS</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, i) => {
              const sel = selectedDays.includes(i);
              return (
                <TouchableOpacity key={i} onPress={() => toggleDaySelection(i)}
                  style={[styles.toggle, { flex: 0, width: 42, padding: 8 },
                    sel && { backgroundColor: cat.color, borderColor: cat.color }]}>
                  <Text style={[styles.toggleText, sel && { color: '#0D1219' }]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={{ fontSize: 10, color: '#4D5E74', marginBottom: 12 }}>
            {selectedDays.length > 0
              ? selectedDays.length + 'x per week: ' + selectedDays.map(d => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]).join(', ')
              : 'Tap the days you want to do this habit'}
          </Text>
        </>
      )}

      {/* ── Actions ── */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: selectedCat?.color || brand.blue }]}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    maxHeight: 600,
  },
  title: { fontSize: 18, fontWeight: '700', color: brand.blue, marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '600', color: colors.textDim, letterSpacing: 1, marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, padding: 12, color: colors.text, fontSize: 14, marginBottom: 12,
  },

  // Category grid
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catBtn: {
    width: '30%', flexGrow: 1, minWidth: 90,
    backgroundColor: colors.bg, borderRadius: 12, padding: 10,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  catBtnAdd: { borderStyle: 'dashed', borderColor: colors.textDark },
  catEmoji: { fontSize: 24, marginBottom: 4 },
  catIconImg: { width: 28, height: 28, borderRadius: 6, marginBottom: 4 },
  catLabel: { fontSize: 10, fontWeight: '600', color: colors.textDim, textAlign: 'center' },
  catDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  catAddIcon: { fontSize: 20, color: colors.textDark, marginBottom: 2 },
  catAddLabel: { fontSize: 10, fontWeight: '600', color: colors.textDark },

  // New category
  newCatBox: {
    backgroundColor: colors.bg, borderRadius: 12, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight,
  },
  newCatTitle: { fontSize: 14, fontWeight: '700', color: brand.blue, marginBottom: 12 },
  iconUpload: {
    width: 80, height: 80, borderRadius: 12,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    overflow: 'hidden',
  },
  iconPreview: { width: 80, height: 80, borderRadius: 12 },
  iconPlaceholder: { alignItems: 'center' },
  colorRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  colorBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'transparent' },
  colorBtnActive: { borderColor: '#fff', borderWidth: 3 },
  newCatActions: { flexDirection: 'row', gap: 8 },
  cancelSmall: {
    flex: 1, padding: 10, borderRadius: 8, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  cancelSmallText: { fontSize: 12, fontWeight: '600', color: colors.textDim },
  saveSmall: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  saveSmallText: { fontSize: 12, fontWeight: '700', color: colors.bg },

  // Toggles
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  toggle: {
    flex: 1, padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg, alignItems: 'center',
  },
  toggleActive: { borderWidth: 2, borderColor: brand.blue, backgroundColor: brand.blue + '15' },
  toggleText: { fontSize: 13, fontWeight: '600', color: colors.textDark },
  toggleTextActive: { color: brand.blue },

  // Actions
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 10, backgroundColor: colors.bg,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  cancelText: { fontSize: 13, fontWeight: '600', color: colors.textDim },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, alignItems: 'center' },
  saveText: { fontSize: 13, fontWeight: '700', color: colors.bg },
});
