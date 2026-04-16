import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatabaseService from '../services/DatabaseService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_HEIGHT = 180;
const BAR_GAP = 3;

export default function JarsEvolution({ onClose }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [jarsData, setJarsData] = useState([]);
  const [selectedJar, setSelectedJar] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'weekly'

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedJar) {
      processChartData(selectedJar, viewMode);
    } else if (jarsData.length > 0) {
      processOverallChart(viewMode);
    }
  }, [selectedJar, viewMode, jarsData]);

  const loadData = async () => {
    try {
      const data = await DatabaseService.getAllJarsBalanceHistory();
      setJarsData(data);
    } catch (error) {
      console.error('Error loading evolution data:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupByDay = (movements) => {
    const groups = {};
    let running = 0;
    for (const m of movements) {
      const day = m.created_at.substring(0, 10);
      const change = m.type === 'Ingreso' ? m.amount : -m.amount;
      running += change;
      groups[day] = running;
    }
    return groups;
  };

  const groupByWeek = (movements) => {
    const groups = {};
    let running = 0;
    for (const m of movements) {
      const date = new Date(m.created_at);
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const weekKey = startOfWeek.toISOString().substring(0, 10);
      const change = m.type === 'Ingreso' ? m.amount : -m.amount;
      running += change;
      groups[weekKey] = running;
    }
    return groups;
  };

  const processChartData = (jar, mode) => {
    const jarInfo = jarsData.find(j => j.id === jar.id);
    if (!jarInfo || jarInfo.movements.length === 0) {
      setChartData([]);
      return;
    }

    const groups = mode === 'daily'
      ? groupByDay(jarInfo.movements)
      : groupByWeek(jarInfo.movements);

    const entries = Object.entries(groups).map(([date, balance]) => ({
      date,
      label: formatDateLabel(date, mode),
      value: balance,
      color: jar.color,
    }));

    // últimos 14 puntos max
    setChartData(entries.slice(-14));
  };

  const processOverallChart = (mode) => {
    // Sumar balances de todos los frascos por período
    const allMovements = [];
    for (const jar of jarsData) {
      for (const m of jar.movements) {
        allMovements.push({ ...m, jarId: jar.id });
      }
    }
    allMovements.sort((a, b) => a.created_at.localeCompare(b.created_at));

    if (allMovements.length === 0) {
      setChartData([]);
      return;
    }

    // Calcular balance total acumulado por día/semana
    const balanceByJar = {};
    const groups = {};

    for (const m of allMovements) {
      const key = mode === 'daily'
        ? m.created_at.substring(0, 10)
        : (() => {
            const date = new Date(m.created_at);
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay());
            return startOfWeek.toISOString().substring(0, 10);
          })();

      if (!balanceByJar[m.jarId]) balanceByJar[m.jarId] = 0;
      balanceByJar[m.jarId] += m.type === 'Ingreso' ? m.amount : -m.amount;

      groups[key] = Object.values(balanceByJar).reduce((s, v) => s + v, 0);
    }

    const entries = Object.entries(groups).map(([date, balance]) => ({
      date,
      label: formatDateLabel(date, mode),
      value: balance,
      color: '#1A237E',
    }));

    setChartData(entries.slice(-14));
  };

  const formatDateLabel = (dateStr, mode) => {
    const parts = dateStr.split('-');
    if (mode === 'weekly') return `S${parts[1]}/${parts[2]}`;
    return `${parts[2]}/${parts[1]}`;
  };

  const renderBarChart = () => {
    if (chartData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Ionicons name="analytics-outline" size={48} color="#CCC" />
          <Text style={styles.emptyChartText}>Sin datos de movimientos</Text>
        </View>
      );
    }

    const maxValue = Math.max(...chartData.map(d => Math.abs(d.value)), 1);
    const barWidth = Math.max(
      12,
      (SCREEN_WIDTH - 80 - (chartData.length * BAR_GAP)) / chartData.length
    );

    return (
      <View style={styles.chartWrapper}>
        {/* Y axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>${maxValue.toFixed(0)}</Text>
          <Text style={styles.yLabel}>${(maxValue / 2).toFixed(0)}</Text>
          <Text style={styles.yLabel}>$0</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
          <View style={styles.chartArea}>
            {/* Grid lines */}
            <View style={[styles.gridLine, { top: 0 }]} />
            <View style={[styles.gridLine, { top: CHART_HEIGHT / 2 }]} />
            <View style={[styles.gridLine, { top: CHART_HEIGHT }]} />

            {/* Bars */}
            <View style={styles.barsContainer}>
              {chartData.map((d, i) => {
                const barHeight = Math.max(4, (Math.abs(d.value) / maxValue) * CHART_HEIGHT);
                return (
                  <View key={i} style={[styles.barColumn, { width: barWidth }]}>
                    <View style={styles.barSpace}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: barHeight,
                            backgroundColor: d.color || '#007AFF',
                            borderRadius: barWidth > 16 ? 6 : 3,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.xLabel, { width: barWidth }]} numberOfLines={1}>
                      {d.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Evolución</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* View mode toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'daily' && styles.modeBtnActive]}
            onPress={() => setViewMode('daily')}
          >
            <Text style={[styles.modeBtnText, viewMode === 'daily' && styles.modeBtnTextActive]}>
              Diario
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'weekly' && styles.modeBtnActive]}
            onPress={() => setViewMode('weekly')}
          >
            <Text style={[styles.modeBtnText, viewMode === 'weekly' && styles.modeBtnTextActive]}>
              Semanal
            </Text>
          </TouchableOpacity>
        </View>

        {/* Jar selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.jarSelector}>
          <TouchableOpacity
            style={[
              styles.jarChip,
              !selectedJar && styles.jarChipActive,
              !selectedJar && { borderColor: '#1A237E' },
            ]}
            onPress={() => setSelectedJar(null)}
          >
            <Ionicons name="apps" size={14} color={!selectedJar ? '#1A237E' : '#999'} />
            <Text style={[styles.jarChipText, !selectedJar && { color: '#1A237E' }]}>Todos</Text>
          </TouchableOpacity>
          {jarsData.map(jar => (
            <TouchableOpacity
              key={jar.id}
              style={[
                styles.jarChip,
                selectedJar?.id === jar.id && styles.jarChipActive,
                selectedJar?.id === jar.id && { borderColor: jar.color },
              ]}
              onPress={() => setSelectedJar(jar)}
            >
              <Ionicons
                name={jar.icon}
                size={14}
                color={selectedJar?.id === jar.id ? jar.color : '#999'}
              />
              <Text
                style={[
                  styles.jarChipText,
                  selectedJar?.id === jar.id && { color: jar.color },
                ]}
                numberOfLines={1}
              >
                {jar.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            {selectedJar ? selectedJar.name : 'Balance total'}
          </Text>
          {renderBarChart()}
        </View>

        {/* Summary per jar */}
        {!selectedJar && jarsData.length > 0 && (
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Resumen por frasco</Text>
            {jarsData.map(jar => {
              const totalIn = jar.movements
                .filter(m => m.type === 'Ingreso')
                .reduce((s, m) => s + m.amount, 0);
              const totalOut = jar.movements
                .filter(m => m.type === 'Gasto')
                .reduce((s, m) => s + m.amount, 0);
              return (
                <View key={jar.id} style={styles.summaryCard}>
                  <View style={[styles.summaryDot, { backgroundColor: jar.color }]} />
                  <View style={styles.summaryInfo}>
                    <Text style={styles.summaryName}>{jar.name}</Text>
                    <Text style={styles.summaryDetail}>
                      {jar.movements.length} movimientos
                    </Text>
                  </View>
                  <View style={styles.summaryAmounts}>
                    <Text style={styles.summaryIn}>+${totalIn.toFixed(2)}</Text>
                    <Text style={styles.summaryOut}>-${totalOut.toFixed(2)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#1A237E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#E8E8ED',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  modeBtnTextActive: {
    color: '#333',
  },
  jarSelector: {
    marginBottom: 16,
    flexGrow: 0,
  },
  jarChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 8,
    gap: 6,
  },
  jarChipActive: {
    backgroundColor: '#F0F4FF',
  },
  jarChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    maxWidth: 90,
  },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  chartWrapper: {
    flexDirection: 'row',
  },
  yAxis: {
    width: 45,
    height: CHART_HEIGHT + 20,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  yLabel: {
    fontSize: 10,
    color: '#999',
    textAlign: 'right',
  },
  chartScroll: {
    flex: 1,
  },
  chartArea: {
    height: CHART_HEIGHT + 20,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
    gap: BAR_GAP,
  },
  barColumn: {
    alignItems: 'center',
  },
  barSpace: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '80%',
    minHeight: 4,
  },
  xLabel: {
    fontSize: 9,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyChart: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyChartText: {
    fontSize: 14,
    color: '#999',
  },
  summarySection: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  summaryDetail: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  summaryAmounts: {
    alignItems: 'flex-end',
  },
  summaryIn: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34C759',
  },
  summaryOut: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
    marginTop: 2,
  },
});
