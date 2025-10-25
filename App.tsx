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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DatabaseService from './src/services/DatabaseService';
import DebtorCard from './src/components/DebtorCard';
import AddDebtorModal from './src/components/AddDebtorModal';
import AddMovementModal from './src/components/AddMovementModal';
import FilterBar from './src/components/FilterBar';
import SearchBar from './src/components/SearchBar';

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
  const [selectedDebtor, setSelectedDebtor] = useState(null);

  // Estados de filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('recent');

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

      // Cargar movimientos para cada deudor
      const allMovements = {};
      for (const debtor of allDebtors) {
        const debtorMovements = await DatabaseService.getMovementsByDebtor(
          debtor.id
        );
        allMovements[debtor.id] = debtorMovements;
      }
      setMovements(allMovements);
    } catch (error) {
      console.error('Error loading debtors:', error);
      Alert.alert('Error', 'No se pudieron cargar los deudores');
    }
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
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Deudores</Text>
          <Text style={styles.statValue}>{stats.total_debtors || 0}</Text>
        </View>
        <View style={[styles.statCard, styles.positiveCard]}>
          <Text style={styles.statLabel}>Me deben</Text>
          <Text style={[styles.statValue, styles.positiveValue]}>
            ${Math.abs(stats.total_owed_to_me || 0).toFixed(2)}
          </Text>
        </View>
        <View style={[styles.statCard, styles.negativeCard]}>
          <Text style={styles.statLabel}>Les debo</Text>
          <Text style={[styles.statValue, styles.negativeValue]}>
            ${Math.abs(stats.total_i_owe || 0).toFixed(2)}
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
      <Icon name="people-outline" size={80} color="#C7C7CC" />
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
      <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Gestión de Deudas</Text>
          <Text style={styles.headerSubtitle}>
            Balance neto: ${' '}
            <Text
              style={[
                styles.netBalance,
                parseFloat(stats.net_balance) >= 0
                  ? styles.positiveValue
                  : styles.negativeValue,
              ]}>
              {Math.abs(stats.net_balance || 0).toFixed(2)}
            </Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddDebtorModal(true)}>
          <Icon name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Lista de deudores */}
      <FlatList
        data={filteredDebtors}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <DebtorCard
            debtor={item}
            onDelete={handleDeleteDebtor}
            onAddMovement={handleAddMovement}
            movements={movements[item.id] || []}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={
          filteredDebtors.length === 0 && styles.emptyListContent
        }
      />

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  netBalance: {
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
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
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
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
