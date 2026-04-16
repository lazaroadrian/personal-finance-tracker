import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DatabaseService from '../services/DatabaseService';
import { CATEGORIES } from './AddJarMovementModal';

export default function JarsDashboard({ jars, jarGroups = [], onClose, onSelectJar }) {
  const insets = useSafeAreaInsets();
  const [categoryStats, setCategoryStats] = useState([]);
  const totalBalance = jars.reduce((sum, j) => sum + (j.balance || 0), 0);
  const totalPercentage = jars.reduce((sum, j) => sum + (j.percentage || 0), 0);
  const goalsReached = jars.filter((j) => j.goal > 0 && j.balance >= j.goal).length;
  const goalsTotal = jars.filter((j) => j.goal > 0).length;

  // Agrupar frascos por grupo
  const jarsByGroup = jarGroups.map((group) => {
    const groupJars = jars.filter((j) => j.group_id === group.id);
    const groupBalance = groupJars.reduce((sum, j) => sum + (j.balance || 0), 0);
    const groupPercentage = groupJars.reduce((sum, j) => sum + (j.percentage || 0), 0);
    return { ...group, jars: groupJars, groupBalance, groupPercentage };
  }).filter(g => g.jars.length > 0);

  // Frascos sin grupo
  const orphanJars = jars.filter((j) => !j.group_id || !jarGroups.find(g => g.id === j.group_id));


  useEffect(() => {
    loadCategoryStats();
  }, []);

  const loadCategoryStats = async () => {
    try {
      const stats = await DatabaseService.getCategoryStats();
      setCategoryStats(stats);
    } catch (error) {
      console.error('Error loading category stats:', error);
    }
  };

  // Pie chart segments (simple arc representation via proportional bars)
  const segments = jars
    .filter((j) => j.balance > 0)
    .map((j) => ({
      ...j,
      proportion: totalBalance > 0 ? (j.balance / totalBalance) * 100 : 0,
    }));

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resumen de Frascos</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Total card */}
        <View style={styles.totalCard}>
          <Ionicons name="flask" size={32} color="#1A237E" />
          <Text style={styles.totalLabel}>Saldo total en frascos</Text>
          <Text style={styles.totalAmount}>${totalBalance.toFixed(2)}</Text>
          <View style={styles.totalRow}>
            <View style={styles.totalStat}>
              <Text style={styles.totalStatValue}>{jars.length}</Text>
              <Text style={styles.totalStatLabel}>Frascos</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalStat}>
              <Text style={styles.totalStatValue}>{totalPercentage}%</Text>
              <Text style={styles.totalStatLabel}>Asignado</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.totalStat}>
              <Text style={styles.totalStatValue}>{goalsReached}/{goalsTotal}</Text>
              <Text style={styles.totalStatLabel}>Metas</Text>
            </View>
          </View>
        </View>

        {/* Visual proportion bar */}
        {totalBalance > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Distribución del saldo</Text>
            <View style={styles.proportionBar}>
              {segments.map((seg) => (
                <View
                  key={seg.id}
                  style={[
                    styles.proportionSegment,
                    {
                      flex: seg.proportion,
                      backgroundColor: seg.color,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.legendGrid}>
              {segments.map((seg) => (
                <View key={seg.id} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
                  <Text style={styles.legendName} numberOfLines={1}>{seg.name}</Text>
                  <Text style={styles.legendPct}>{seg.proportion.toFixed(1)}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Individual jar cards grouped by group */}
        {jarsByGroup.map((group) => (
          <View key={group.id} style={styles.groupSection}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupHeaderIcon, { backgroundColor: group.color || '#1A237E' }]}>
                <Ionicons name={group.icon || 'flask-outline'} size={16} color="#FFFFFF" />
              </View>
              <View style={styles.groupHeaderInfo}>
                <Text style={styles.groupHeaderName}>{group.name}</Text>
                <Text style={styles.groupHeaderMeta}>
                  {group.groupPercentage}% asignado · ${group.groupBalance.toFixed(2)}
                </Text>
              </View>
            </View>
            {group.jars.map((jar) => {
              const goalReached = jar.goal > 0 && jar.balance >= jar.goal;
              const goalProgress = jar.goal > 0 ? Math.min((jar.balance / jar.goal) * 100, 100) : 0;
              const balanceProportion = totalBalance > 0 ? ((jar.balance / totalBalance) * 100).toFixed(1) : '0.0';

              return (
                <TouchableOpacity
                  key={jar.id}
                  style={[styles.jarCard, goalReached && styles.jarCardGoal]}
                  activeOpacity={0.7}
                  onPress={() => onSelectJar(jar)}
                >
                  <View style={styles.jarCardHeader}>
                    <View style={[styles.jarIcon, { backgroundColor: goalReached ? '#FFD700' : jar.color }]}>
                      <Ionicons name={jar.icon || 'wallet-outline'} size={20} color="#FFFFFF" />
                      {goalReached && (
                        <View style={styles.starBadge}>
                          <Ionicons name="star" size={8} color="#FFD700" />
                        </View>
                      )}
                    </View>
                    <View style={styles.jarCardInfo}>
                      <Text style={styles.jarCardName}>{jar.name}</Text>
                      <Text style={styles.jarCardPct}>{jar.percentage}% asignado · {balanceProportion}% del total</Text>
                    </View>
                    <Text style={[styles.jarCardBalance, goalReached && { color: '#FFD700' }]}>
                      ${jar.balance.toFixed(2)}
                    </Text>
                  </View>
                  {jar.goal > 0 && (
                    <View style={styles.jarGoalSection}>
                      <View style={styles.jarGoalBarBg}>
                        <View
                          style={[
                            styles.jarGoalBarFill,
                            {
                              width: `${goalProgress}%`,
                              backgroundColor: goalReached ? '#FFD700' : jar.color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.jarGoalLabel}>
                        {goalReached ? '★ Meta alcanzada' : `$${jar.balance.toFixed(0)} / $${jar.goal.toFixed(0)}`}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Frascos sin grupo */}
        {orphanJars.length > 0 && (
          <View style={styles.groupSection}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupHeaderIcon, { backgroundColor: '#8E8E93' }]}>
                <Ionicons name="flask-outline" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.groupHeaderInfo}>
                <Text style={styles.groupHeaderName}>Sin grupo</Text>
              </View>
            </View>
            {orphanJars.map((jar) => {
              const goalReached = jar.goal > 0 && jar.balance >= jar.goal;
              const goalProgress = jar.goal > 0 ? Math.min((jar.balance / jar.goal) * 100, 100) : 0;
              const balanceProportion = totalBalance > 0 ? ((jar.balance / totalBalance) * 100).toFixed(1) : '0.0';
              return (
                <TouchableOpacity
                  key={jar.id}
                  style={[styles.jarCard, goalReached && styles.jarCardGoal]}
                  activeOpacity={0.7}
                  onPress={() => onSelectJar(jar)}
                >
                  <View style={styles.jarCardHeader}>
                    <View style={[styles.jarIcon, { backgroundColor: goalReached ? '#FFD700' : jar.color }]}>
                      <Ionicons name={jar.icon || 'wallet-outline'} size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.jarCardInfo}>
                      <Text style={styles.jarCardName}>{jar.name}</Text>
                      <Text style={styles.jarCardPct}>{jar.percentage}% · {balanceProportion}% del total</Text>
                    </View>
                    <Text style={[styles.jarCardBalance, goalReached && { color: '#FFD700' }]}>
                      ${jar.balance.toFixed(2)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {jars.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="flask-outline" size={50} color="#C7C7CC" />
            <Text style={styles.emptyText}>No hay frascos creados</Text>
          </View>
        )}

        {/* Category distribution */}
        {categoryStats.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Gastos por categoría</Text>
            {(() => {
              const maxCat = Math.max(...categoryStats.map(c => c.total));
              const totalCat = categoryStats.reduce((s, c) => s + c.total, 0);
              return categoryStats.map((stat) => {
                const cat = CATEGORIES.find(c => c.key === stat.category);
                if (!cat) return null;
                const pct = totalCat > 0 ? ((stat.total / totalCat) * 100).toFixed(1) : '0.0';
                const barWidth = maxCat > 0 ? (stat.total / maxCat) * 100 : 0;
                return (
                  <View key={stat.category} style={styles.catRow}>
                    <View style={styles.catInfo}>
                      <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
                        <Ionicons name={cat.icon} size={14} color={cat.color} />
                      </View>
                      <Text style={styles.catName}>{cat.label}</Text>
                      <Text style={styles.catCount}>{stat.count}x</Text>
                    </View>
                    <View style={styles.catBarBg}>
                      <View style={[styles.catBarFill, { width: `${barWidth}%`, backgroundColor: cat.color }]} />
                    </View>
                    <View style={styles.catAmountRow}>
                      <Text style={styles.catAmount}>${stat.total.toFixed(2)}</Text>
                      <Text style={styles.catPct}>{pct}%</Text>
                    </View>
                  </View>
                );
              });
            })()}
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
  header: {
    backgroundColor: '#1A237E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  totalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 8,
  },
  totalAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1C1C1E',
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 16,
  },
  totalStat: {
    alignItems: 'center',
  },
  totalStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A237E',
  },
  totalStatLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2,
  },
  totalDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E5EA',
  },
  chartSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  proportionBar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 12,
  },
  proportionSegment: {
    height: '100%',
  },
  legendGrid: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  legendPct: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
  },
  jarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  jarCardGoal: {
    backgroundColor: '#FFFDE7',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  jarCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  jarIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarCardInfo: {
    flex: 1,
  },
  jarCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  jarCardPct: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
  jarCardBalance: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34C759',
  },
  jarGoalSection: {
    marginTop: 10,
  },
  jarGoalBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
  },
  jarGoalBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  jarGoalLabel: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 12,
  },
  catRow: {
    marginBottom: 12,
  },
  catInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  catIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  catCount: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  catBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
    marginBottom: 4,
  },
  catBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  catAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  catPct: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  groupSection: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  groupHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupHeaderInfo: {
    flex: 1,
  },
  groupHeaderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  groupHeaderMeta: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 1,
  },
});
