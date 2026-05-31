import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { colors, MONTHS_RO, getCompletionColor } from '@/constants/theme';
import { useHabits } from '@/hooks/useHabits';
import { getMonthDates, fmt } from '@/utils/dates';

export default function ReportScreen() {
  const { habits, log, loaded } = useHabits();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [exporting, setExporting] = useState(false);

  const dates = useMemo(() => getMonthDates(year, month), [year, month]);

  const monthData = useMemo(() => {
    return habits.map(h => {
      const entries = dates.map(d => {
        const ds = fmt(d);
        const entry = log[ds]?.[h.id];
        return { date: ds, done: !!entry?.done, minutes: entry?.minutes || 0 };
      });
      const doneCount = entries.filter(e => e.done).length;
      const totalMinutes = entries.reduce((s, e) => s + e.minutes, 0);
      return {
        habit: h, entries, doneCount, totalMinutes,
        rate: dates.length > 0 ? Math.round((doneCount / dates.length) * 100) : 0,
      };
    });
  }, [habits, log, dates]);

  const buildMonthSheet = useCallback((y: number, m: number) => {
    const mDates = getMonthDates(y, m);
    const wsData: any[][] = [
      ['Raport Obiceiuri — ' + MONTHS_RO[m] + ' ' + y],
      [],
      ['Obicei', 'Tip', 'Frecvență', ...mDates.map(d => d.getDate()), 'Total', 'Rată %'],
    ];
    habits.forEach(h => {
      const vals: any[] = [];
      let doneCount = 0;
      let totalMins = 0;
      mDates.forEach(d => {
        const ds = fmt(d);
        const entry = log[ds]?.[h.id];
        if (h.type === 'timer') {
          vals.push(entry?.minutes || 0);
          totalMins += entry?.minutes || 0;
        } else {
          vals.push(entry?.done ? '✓' : '');
        }
        if (entry?.done) doneCount++;
      });
      const rate = mDates.length > 0 ? Math.round((doneCount / mDates.length) * 100) : 0;
      wsData.push([
        h.name,
        h.type === 'timer' ? 'Timer' : 'Checkbox',
        h.frequency === 'daily' ? 'Zilnic' : 'Săptămânal',
        ...vals,
        h.type === 'timer' ? `${totalMins} min` : `${doneCount}/${mDates.length}`,
        `${rate}%`,
      ]);
    });
    wsData.push([]);
    wsData.push(['Generat:', new Date().toLocaleString('ro-RO')]);
    return XLSX.utils.aoa_to_sheet(wsData);
  }, [habits, log]);

  const exportFullYear = useCallback(async () => {
    if (habits.length === 0) {
      Alert.alert('Info', 'Adaugă obiceiuri mai întâi');
      return;
    }
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData: any[][] = [
        [`Raport Anual Obiceiuri — ${year}`],
        [],
        ['Obicei', 'Tip', ...MONTHS_RO.map(m => m.substring(0, 3)), 'Media Anuală'],
      ];
      habits.forEach(h => {
        const rates: number[] = [];
        for (let m = 0; m < 12; m++) {
          const mDates = getMonthDates(year, m);
          let done = 0;
          mDates.forEach(d => { if (log[fmt(d)]?.[h.id]?.done) done++; });
          rates.push(mDates.length > 0 ? Math.round((done / mDates.length) * 100) : 0);
        }
        const avg = Math.round(rates.reduce((a, b) => a + b, 0) / 12);
        summaryData.push([h.icon + ' ' + h.name, h.type === 'timer' ? 'Timer' : 'Checkbox', ...rates.map(r => `${r}%`), `${avg}%`]);
      });
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Sumar Anual');

      for (let m = 0; m < 12; m++) {
        const ws = buildMonthSheet(year, m);
        XLSX.utils.book_append_sheet(wb, ws, MONTHS_RO[m].substring(0, 10));
      }

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const fileName = `raport_obiceiuri_${year}.xlsx`;
      const filePath = FileSystem.cacheDirectory + fileName;
      await FileSystem.writeAsStringAsync(filePath, wbout, { encoding: FileSystem.EncodingType.Base64 });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Exportă raport anual',
        });
      } else {
        Alert.alert('Succes', `Fișierul a fost salvat: ${fileName}`);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Eroare', 'Nu s-a putut genera raportul');
    }
    setExporting(false);
  }, [habits, log, year, buildMonthSheet]);

  if (!loaded) return <View style={styles.container} />;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Year selector */}
      <View style={styles.yearNav}>
        <TouchableOpacity onPress={() => setYear(y => y - 1)} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={16} color={colors.textDim} />
        </TouchableOpacity>
        <Text style={styles.yearText}>{year}</Text>
        <TouchableOpacity onPress={() => setYear(y => y + 1)} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
        </TouchableOpacity>
      </View>

      {/* Full year export */}
      <TouchableOpacity onPress={exportFullYear} disabled={exporting} style={[styles.exportBtn, exporting && { opacity: 0.5 }]}>
        <Ionicons name="download-outline" size={20} color={colors.bg} />
        <Text style={styles.exportBtnText}>
          {exporting ? 'Se generează...' : `Export Excel Anual ${year} — 12 sheet-uri`}
        </Text>
      </TouchableOpacity>
      <Text style={styles.exportHint}>
        Generează un .xlsx cu sheet „Sumar Anual" + 12 sheet-uri lunare.{'\n'}
        Partajează-l direct în Google Drive, WhatsApp, etc.
      </Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Month navigator */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => {
          if (month === 0) { setMonth(11); setYear(y => y - 1); }
          else setMonth(m => m - 1);
        }} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={16} color={colors.textDim} />
        </TouchableOpacity>
        <Text style={styles.monthText}>{MONTHS_RO[month]} {year}</Text>
        <TouchableOpacity onPress={() => {
          if (month === 11) { setMonth(0); setYear(y => y + 1); }
          else setMonth(m => m + 1);
        }} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
        </TouchableOpacity>
      </View>

      {/* Monthly summary */}
      {monthData.map(({ habit, doneCount, totalMinutes, rate }) => (
        <View key={habit.id} style={styles.summaryCard}>
          <View style={styles.summaryLeft}>
            <Text style={{ fontSize: 20 }}>{habit.icon}</Text>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.summaryName}>{habit.name}</Text>
              <Text style={styles.summaryMeta}>
                {habit.type === 'timer' ? `${totalMinutes} min total` : `${doneCount}/${dates.length} zile`}
              </Text>
            </View>
          </View>
          <Text style={[styles.summaryRate, { color: getCompletionColor(rate / 100) }]}>
            {rate}%
          </Text>
        </View>
      ))}

      {/* Heatmap */}
      {habits.filter(h => h.frequency === 'daily').length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Heatmap — {MONTHS_RO[month]}</Text>
          {habits.filter(h => h.frequency === 'daily').slice(0, 5).map(h => (
            <View key={h.id} style={{ marginBottom: 12 }}>
              <Text style={styles.heatLabel}>{h.icon} {h.name}</Text>
              <View style={styles.heatRow}>
                {dates.map((d, i) => {
                  const done = log[fmt(d)]?.[h.id]?.done;
                  return (
                    <View key={i} style={[
                      styles.heatCell,
                      { backgroundColor: done ? h.color : colors.border, opacity: done ? 0.85 : 0.35 },
                    ]} />
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: 12 },
  yearNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 14 },
  yearText: { fontSize: 20, fontWeight: '800', color: colors.accent },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  monthText: { fontSize: 16, fontWeight: '700', color: colors.accent },
  navBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 16, borderRadius: 12, backgroundColor: colors.accent, marginBottom: 6,
  },
  exportBtnText: { fontSize: 14, fontWeight: '700', color: colors.bg },
  exportHint: { fontSize: 11, color: colors.textDark, textAlign: 'center', marginBottom: 16, lineHeight: 17 },
  divider: { height: 1, backgroundColor: colors.border, marginBottom: 16 },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.bgCard, borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: colors.border,
  },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  summaryName: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  summaryMeta: { fontSize: 11, color: colors.textDark, marginTop: 2 },
  summaryRate: { fontSize: 22, fontWeight: '800' },
  card: {
    backgroundColor: colors.bgCard, borderRadius: 14, padding: 16,
    marginTop: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.accent, marginBottom: 14 },
  heatLabel: { fontSize: 11, color: colors.textDim, marginBottom: 4 },
  heatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  heatCell: { width: 14, height: 14, borderRadius: 3 },
});
