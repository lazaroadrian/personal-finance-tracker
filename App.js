import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DatabaseService from './src/services/DatabaseService';
import DebtorCard from './src/components/DebtorCard';
import AddDebtorModal from './src/components/AddDebtorModal';
import AddMovementModal from './src/components/AddMovementModal';
import EditDebtorModal from './src/components/EditDebtorModal';
import FilterBar from './src/components/FilterBar';
import SearchBar from './src/components/SearchBar';
import StatsChart from './src/components/StatsChart';
import BackupRestore from './src/components/BackupRestore';
import * as Haptics from 'expo-haptics';

function App() {
  const [debtors, setDebtors] = useState([]);
  const [filteredDebtors, setFilteredDebtors] = useState([]);
  const [movements, setMovements] = useState({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_owed_to_me: 0,
    total_i_owe: 0,
    net_balance: 0,
    total_debtors: 0,
  });

  // Estados de modales
  const [showAddDebtorModal, setShowAddDebtorModal] = useState(false);
  const [showAddMovementModal, setShowAddMovementModal] = useState(false);
  const [showEditDebtorModal, setShowEditDebtorModal] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState(null);

  // Estados de filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('recent');
  const [refreshing, setRefreshing] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showBackup, setShowBackup] = useState(false);

  useEffect(() => {
    initializeDatabase();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [debtors, searchQuery, selectedFilter, selectedSort]);

  const initializeDatabase = async () => {
    try {
      await DatabaseService.initDB();
      await loadDebtors();
      await loadStats();
      setLoading(false);
    } catch (error) {
      console.error('Error initializing database:', error);
      Alert.alert('Error', 'No se pudo inicializar la base de datos');
      setLoading(false);
    }
  };

  const loadDebtors = async () => {
    try {
      const allDebtors = await DatabaseService.getAllDebtors();
      setDebtors(allDebtors);

      // Cargar movimientos en paralelo
      const movementEntries = await Promise.all(
        allDebtors.map(async (debtor) => {
          const debtorMovements = await DatabaseService.getMovementsByDebtor(debtor.id);
          return [debtor.id, debtorMovements];
        })
      );
      const allMovements = Object.fromEntries(movementEntries);
      setMovements(allMovements);
    } catch (error) {
      console.error('Error loading debtors:', error);
      Alert.alert('Error', 'No se pudieron cargar los deudores');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDebtors();
    await loadStats();
    setRefreshing(false);
  };

  const loadStats = async () => {
    try {
      const statistics = await DatabaseService.getTotalStats();
      setStats(statistics);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAddDebtor = async debtorData => {
    try {
      await DatabaseService.addDebtor(
        debtorData.name,
        debtorData.phone,
        debtorData.balance,
        debtorData.whatsappMessage
      );
      await loadDebtors();
      await loadStats();
      setShowAddDebtorModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', 'Deudor agregado correctamente');
    } catch (error) {
      console.error('Error adding debtor:', error);
      Alert.alert('Error', 'No se pudo agregar el deudor');
    }
  };

  const handleDeleteDebtor = async debtorId => {
    try {
      await DatabaseService.deleteDebtor(debtorId);
      await loadDebtors();
      await loadStats();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Éxito', 'Deudor eliminado correctamente');
    } catch (error) {
      console.error('Error deleting debtor:', error);
      Alert.alert('Error', 'No se pudo eliminar el deudor');
    }
  };

  const handleAddMovement = debtor => {
    setSelectedDebtor(debtor);
    setShowAddMovementModal(true);
  };

  const handleEditDebtor = debtor => {
    setSelectedDebtor(debtor);
    setShowEditDebtorModal(true);
  };

  const handleSaveEdit = async debtorData => {
    try {
      await DatabaseService.updateDebtor(
        debtorData.id,
        debtorData.name,
        debtorData.phone,
        debtorData.whatsappMessage
      );
      await loadDebtors();
      setShowEditDebtorModal(false);
      setSelectedDebtor(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', 'Deudor actualizado correctamente');
    } catch (error) {
      console.error('Error updating debtor:', error);
      Alert.alert('Error', 'No se pudo actualizar el deudor');
    }
  };

  const handleSaveMovement = async movementData => {
    try {
      await DatabaseService.addMovement(
        movementData.debtorId,
        movementData.amount,
        movementData.type,
        movementData.description
      );
      await loadDebtors();
      await loadStats();
      setShowAddMovementModal(false);
      setSelectedDebtor(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', 'Movimiento registrado correctamente');
    } catch (error) {
      console.error('Error adding movement:', error);
      Alert.alert('Error', 'No se pudo registrar el movimiento');
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...debtors];

    // Aplicar búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        debtor =>
          debtor.name.toLowerCase().includes(query) ||
          debtor.phone.toLowerCase().includes(query)
      );
    }

    // Aplicar filtro
    if (selectedFilter === 'owed_to_me') {
      filtered = filtered.filter(debtor => parseFloat(debtor.balance) > 0);
    } else if (selectedFilter === 'i_owe') {
      filtered = filtered.filter(debtor => parseFloat(debtor.balance) < 0);
    }

    // Aplicar ordenamiento
    switch (selectedSort) {
      case 'recent':
        filtered.sort(
          (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
        );
        break;
      case 'amount_desc':
        filtered.sort(
          (a, b) => Math.abs(parseFloat(b.balance)) - Math.abs(parseFloat(a.balance))
        );
        break;
      case 'amount_asc':
        filtered.sort(
          (a, b) => Math.abs(parseFloat(a.balance)) - Math.abs(parseFloat(b.balance))
        );
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredDebtors(filtered);
  };

  const renderHeader = () => (
    <View>
      {/* Resumen de estadísticas */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, {flex: 0.7}]}>
          <Text style={styles.statLabel}>Deudores</Text>
          <Text style={styles.statValue}>{stats.total_debtors || 0}</Text>
        </View>
        <View style={[styles.statCard, styles.positiveCard, {flex: 1.15}]}>
          <Text style={styles.statLabel}>Me deben</Text>
          <Text style={[styles.statValue, styles.positiveValue]} numberOfLines={1} adjustsFontSizeToFit>
            ${Math.abs(stats.total_owed_to_me || 0).toFixed(2)}
          </Text>
        </View>
        <View style={[styles.statCard, styles.negativeCard, {flex: 1.15}]}>
          <Text style={styles.statLabel}>Les debo</Text>
          <Text style={[styles.statValue, styles.negativeValue]} numberOfLines={1} adjustsFontSizeToFit>
            -${Math.abs(stats.total_i_owe || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Barra de búsqueda */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />

      {/* Barra de filtros */}
      <FilterBar
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
      />

      {/* Contador de resultados */}
      <View style={styles.resultCountContainer}>
        <Text style={styles.resultCount}>
          {filteredDebtors.length}{' '}
          {filteredDebtors.length === 1 ? 'resultado' : 'resultados'}
        </Text>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={80} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>No hay deudores</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedFilter !== 'all'
          ? 'No se encontraron resultados con los filtros aplicados'
          : 'Agrega tu primer deudor para comenzar'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="wallet-outline" size={22} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Gestor de Cuentas</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => setShowBackup(true)}>
              <Ionicons name="save-outline" size={20} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerIconButton, showStats && styles.headerIconButtonActive]}
              onPress={() => setShowStats(!showStats)}>
              <Ionicons
                name={showStats ? 'list' : 'stats-chart'}
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddDebtorModal(true)}>
              <Ionicons name="add" size={24} color="#1A237E" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerBalance}>
          <Text style={styles.headerSubtitle}>Balance neto</Text>
          <Text style={[
            styles.headerBalanceAmount,
            {color: parseFloat(stats.net_balance) >= 0 ? '#A5D6A7' : '#EF9A9A'}
          ]}>
            {parseFloat(stats.net_balance) >= 0 ? '' : '-'}${Math.abs(stats.net_balance || 0).toFixed(2)}
          </Text>
          <View style={[
            styles.headerBalanceBadge,
            parseFloat(stats.net_balance) >= 0 ? styles.badgePositive : styles.badgeNegative
          ]}>
            <Text style={styles.headerBalanceBadgeText}>
              {parseFloat(stats.net_balance) >= 0 ? 'A favor' : 'En contra'}
            </Text>
          </View>
        </View>
      </View>

      {showStats ? (
        <StatsChart debtors={debtors} movements={movements} onGoBack={() => setShowStats(false)} />
      ) : (
      <FlatList
        data={filteredDebtors}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <DebtorCard
            debtor={item}
            onDelete={handleDeleteDebtor}
            onAddMovement={handleAddMovement}
            onEdit={handleEditDebtor}
            movements={movements[item.id] || []}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        contentContainerStyle={
          filteredDebtors.length === 0 && styles.emptyListContent
        }
      />
      )}

      {/* Modales */}
      <AddDebtorModal
        visible={showAddDebtorModal}
        onClose={() => setShowAddDebtorModal(false)}
        onSave={handleAddDebtor}
      />

      <AddMovementModal
        visible={showAddMovementModal}
        onClose={() => {
          setShowAddMovementModal(false);
          setSelectedDebtor(null);
        }}
        onSave={handleSaveMovement}
        debtor={selectedDebtor}
      />

      <EditDebtorModal
        visible={showEditDebtorModal}
        onClose={() => {
          setShowEditDebtorModal(false);
          setSelectedDebtor(null);
        }}
        onSave={handleSaveEdit}
        debtor={selectedDebtor}
      />

      <BackupRestore
        visible={showBackup}
        onClose={() => setShowBackup(false)}
        onRestoreComplete={async () => {
          await loadDebtors();
          await loadStats();
        }}
      />
    </SafeAreaView>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    backgroundColor: '#1A237E',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 12,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  headerBalance: {
    alignItems: 'center',
  },
  headerBalanceAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  headerBalanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  badgePositive: {
    backgroundColor: 'rgba(52, 199, 89, 0.25)',
  },
  badgeNegative: {
    backgroundColor: 'rgba(255, 59, 48, 0.25)',
  },
  headerBalanceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  positiveCard: {
    backgroundColor: '#E8F5E9',
  },
  negativeCard: {
    backgroundColor: '#FFEBEE',
  },
  statLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  positiveValue: {
    color: '#34C759',
  },
  negativeValue: {
    color: '#FF3B30',
  },
  resultCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultCount: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default App;
