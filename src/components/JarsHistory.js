import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DatabaseService from '../services/DatabaseService';
import { CATEGORIES } from './AddJarMovementModal';

export default function JarsHistory({ onClose }) {
  const insets = useSafeAreaInsets();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await DatabaseService.getAllJarMovements();
      setMovements(data);
    } catch (error) {
      console.error('Error loading jar history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group by date
  const groupedData = movements.reduce((groups, mov) => {
    const date = mov.created_at ? mov.created_at.split(' ')[0] : 'Sin fecha';
    if (!groups[date]) groups[date] = [];
    groups[date].push(mov);
    return groups;
  }, {});

  const sections = Object.entries(groupedData).map(([date, items]) => ({
    date,
    items,
    totalIn: items.filter((i) => i.type === 'Ingreso').reduce((s, i) => s + i.amount, 0),
    totalOut: items.filter((i) => i.type === 'Gasto').reduce((s, i) => s + i.amount, 0),
  }));

  const renderMovement = (item) => {
    const isIncome = item.type === 'Ingreso';
    const cat = item.category ? CATEGORIES.find(c => c.key === item.category) : null;
    return (
      <View style={styles.movItem} key={item.id}>
        <View style={[styles.movIcon, { backgroundColor: item.jar_color || '#007AFF' }]}>
          <Ionicons name={item.jar_icon || 'wallet-outline'} size={14} color="#FFFFFF" />
        </View>
        <View style={styles.movInfo}>
          <View style={styles.movNameRow}>
            <Text style={styles.movJarName}>{item.jar_name}</Text>
            {cat && !isIncome && (
              <View style={[styles.catBadge, { backgroundColor: cat.color + '20' }]}>
                <Ionicons name={cat.icon} size={10} color={cat.color} />
                <Text style={[styles.catBadgeText, { color: cat.color }]}>{cat.label}</Text>
              </View>
            )}
          </View>
          <Text style={styles.movDesc} numberOfLines={1}>
            {item.description || item.type}
          </Text>
          <Text style={styles.movTime}>{item.created_at ? item.created_at.split(' ')[1] : ''}</Text>
        </View>
        <Text style={[styles.movAmount, { color: isIncome ? '#34C759' : '#FF3B30' }]}>
          {isIncome ? '+' : '-'}${item.amount.toFixed(2)}
        </Text>
      </View>
    );
  };

  const renderSection = ({ item: section }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionDate}>{section.date}</Text>
        <View style={styles.sectionTotals}>
          {section.totalIn > 0 && (
            <Text style={[styles.sectionTotal, { color: '#34C759' }]}>+${section.totalIn.toFixed(2)}</Text>
          )}
          {section.totalOut > 0 && (
            <Text style={[styles.sectionTotal, { color: '#FF3B30' }]}>-${section.totalOut.toFixed(2)}</Text>
          )}
        </View>
      </View>
      {section.items.map(renderMovement)}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial de Frascos</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.date}
          renderItem={renderSection}
          contentContainerStyle={sections.length === 0 && styles.emptyListContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={50} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>Sin movimientos</Text>
              <Text style={styles.emptySubtitle}>
                Los movimientos de tus frascos aparecerán aquí
              </Text>
            </View>
          }
        />
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  sectionDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  sectionTotals: {
    flexDirection: 'row',
    gap: 10,
  },
  sectionTotal: {
    fontSize: 13,
    fontWeight: '700',
  },
  movItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 4,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  movIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  movInfo: {
    flex: 1,
  },
  movNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  catBadgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  movJarName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  movDesc: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 1,
  },
  movTime: {
    fontSize: 10,
    color: '#C7C7CC',
    marginTop: 1,
  },
  movAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
