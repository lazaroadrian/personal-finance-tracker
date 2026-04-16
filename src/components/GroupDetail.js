import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DatabaseService from '../services/DatabaseService';

export default function GroupDetail({ group, onClose, onSelectJar, onAddJar, onDistribute, onGroupUpdated }) {
  const [jars, setJars] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadJars = useCallback(async () => {
    try {
      const groupJars = await DatabaseService.getJarsByGroup(group.id);
      setJars(groupJars);
    } catch (error) {
      console.error('Error loading group jars:', error);
    } finally {
      setLoading(false);
    }
  }, [group.id]);

  useEffect(() => {
    loadJars();
  }, [loadJars]);

  const totalPercentage = jars.reduce((sum, j) => sum + (j.percentage || 0), 0);
  const totalBalance = jars.reduce((sum, j) => sum + (j.balance || 0), 0);

  const handleDeleteJar = (jar) => {
    Alert.alert(
      'Eliminar frasco',
      `¿Eliminar "${jar.name}"? Se perderán todos los movimientos asociados. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.deleteJar(jar.id);
              await loadJars();
              if (onGroupUpdated) onGroupUpdated();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el frasco');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={group.color || '#1A237E'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: group.color || '#1A237E' }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Ionicons name={group.icon || 'flask-outline'} size={20} color="#FFFFFF" />
            <Text style={styles.headerTitle} numberOfLines={1}>{group.name}</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.headerStats}>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatLabel}>Frascos</Text>
            <Text style={styles.headerStatValue}>{jars.length}</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatLabel}>Asignado</Text>
            <Text style={styles.headerStatValue}>{totalPercentage.toFixed(0)}%</Text>
          </View>
          <View style={styles.headerStatItem}>
            <Text style={styles.headerStatLabel}>Balance</Text>
            <Text style={[styles.headerStatValue, { color: '#A5D6A7' }]}>
              ${totalBalance.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Percentage bar */}
      <View style={styles.percentageBar}>
        <View style={styles.percentageBarBg}>
          <View
            style={[
              styles.percentageBarFill,
              {
                width: `${Math.min(totalPercentage, 100)}%`,
                backgroundColor: totalPercentage > 100 ? '#FF3B30' : '#34C759',
              },
            ]}
          />
        </View>
      </View>

      {/* Jar list */}
      <ScrollView style={styles.jarList} contentContainerStyle={styles.jarListContent}>
        {jars.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="flask-outline" size={60} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>Sin frascos</Text>
            <Text style={styles.emptySubtitle}>Agrega frascos a este grupo para comenzar</Text>
          </View>
        ) : (
          jars.map((jar) => {
            const goalReached = jar.goal > 0 && jar.balance >= jar.goal;
            return (
              <TouchableOpacity
                key={jar.id}
                style={[styles.jarItem, goalReached && styles.jarItemGoalReached]}
                activeOpacity={0.7}
                onPress={() => onSelectJar(jar)}
              >
                <View style={[styles.jarIcon, { backgroundColor: goalReached ? '#FFD700' : jar.color }]}>
                  <Ionicons name={jar.icon || 'wallet-outline'} size={20} color="#FFFFFF" />
                  {goalReached && (
                    <View style={styles.starBadge}>
                      <Ionicons name="star" size={10} color="#FFD700" />
                    </View>
                  )}
                </View>
                <View style={styles.jarInfo}>
                  <View style={styles.jarNameRow}>
                    <Text style={styles.jarName} numberOfLines={1}>{jar.name}</Text>
                    <Text style={styles.jarPercentage}>{jar.percentage}%</Text>
                  </View>
                  <Text style={[styles.jarBalance, goalReached && styles.jarBalanceGoal]}>
                    ${jar.balance.toFixed(2)}
                  </Text>
                  {jar.goal > 0 && (
                    <View style={styles.goalRow}>
                      <View style={styles.goalBarBg}>
                        <View
                          style={[
                            styles.goalBarFill,
                            {
                              width: `${Math.min((jar.balance / jar.goal) * 100, 100)}%`,
                              backgroundColor: goalReached ? '#FFD700' : jar.color,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.goalText}>
                        {goalReached ? '★' : `$${jar.goal.toFixed(0)}`}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.deleteJarBtn}
                  onPress={() => handleDeleteJar(jar)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Bottom buttons */}
      <View style={styles.bottomBtns}>
        <TouchableOpacity
          style={styles.distributeBtnSidebar}
          onPress={() => onDistribute(jars)}
          activeOpacity={0.8}
          disabled={jars.length === 0}
        >
          <Ionicons name="git-branch-outline" size={20} color="#FFFFFF" />
          <Text style={styles.btnText}>Distribuir ingreso</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addJarBtn, { backgroundColor: group.color || '#1A237E' }]}
          onPress={() => onAddJar(group.id)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={18} color="#FFFFFF" />
          <Text style={styles.btnText}>Agregar frasco</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  headerStatItem: {
    alignItems: 'center',
  },
  headerStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  headerStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  percentageBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  percentageBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
  },
  percentageBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  jarList: {
    flex: 1,
  },
  jarListContent: {
    paddingVertical: 8,
  },
  jarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  jarItemGoalReached: {
    backgroundColor: '#FFFDE7',
  },
  jarIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },
  jarInfo: {
    flex: 1,
  },
  jarNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jarName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  jarPercentage: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 8,
  },
  jarBalance: {
    fontSize: 15,
    fontWeight: '700',
    color: '#34C759',
    marginTop: 2,
  },
  jarBalanceGoal: {
    color: '#FFD700',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  goalBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
  },
  goalBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  goalText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8E8E93',
  },
  deleteJarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  bottomBtns: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  distributeBtnSidebar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 12,
  },
  addJarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
