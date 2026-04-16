import React, {useEffect, useState} from 'react';
import {
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
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
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
import DefaultMessageModal from './src/components/DefaultMessageModal';
import Sidebar from './src/components/Sidebar';
import AddJarModal from './src/components/AddJarModal';
import JarDetail from './src/components/JarDetail';
import DistributeIncomeModal from './src/components/DistributeIncomeModal';
import TransferJarModal from './src/components/TransferJarModal';
import JarsDashboard from './src/components/JarsDashboard';
import JarsHistory from './src/components/JarsHistory';
import JarsEvolution from './src/components/JarsEvolution';
import ReminderConfig from './src/components/ReminderConfig';
import GroupDetail from './src/components/GroupDetail';
import AddGroupModal from './src/components/AddGroupModal';
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
  const [methodStats, setMethodStats] = useState({
    cash_balance: 0,
    transfer_balance: 0,
  });

  // Estados de modales
  const [showAddDebtorModal, setShowAddDebtorModal] = useState(false);
  const [showAddMovementModal, setShowAddMovementModal] = useState(false);
  const [showDefaultMsg, setShowDefaultMsg] = useState(false);
  const [showEditDebtorModal, setShowEditDebtorModal] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState(null);

  // Estados de filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('recent');
  const [refreshing, setRefreshing] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Estados de frascos y sidebar
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAddJarModal, setShowAddJarModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showJarsDashboard, setShowJarsDashboard] = useState(false);
  const [showJarsHistory, setShowJarsHistory] = useState(false);
  const [showJarsEvolution, setShowJarsEvolution] = useState(false);
  const [showReminderConfig, setShowReminderConfig] = useState(false);
  const [selectedJar, setSelectedJar] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [addJarGroupId, setAddJarGroupId] = useState(null);
  const [distributeJars, setDistributeJars] = useState([]);
  const [jars, setJars] = useState([]);
  const [jarGroups, setJarGroups] = useState([]);

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
      await loadJars();
      await loadJarGroups();
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
      const mStats = await DatabaseService.getMethodStats();
      setMethodStats(mStats);
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
        movementData.description,
        movementData.method
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

  // ============ JARS ============

  const loadJars = async () => {
    try {
      const allJars = await DatabaseService.getAllJars();
      setJars(allJars);
    } catch (error) {
      console.error('Error loading jars:', error);
    }
  };

  const loadJarGroups = async () => {
    try {
      const groups = await DatabaseService.getAllJarGroups();
      setJarGroups(groups);
    } catch (error) {
      console.error('Error loading jar groups:', error);
    }
  };

  const handleAddGroup = async (groupData) => {
    try {
      await DatabaseService.addJarGroup(groupData.name, groupData.color, groupData.icon);
      await loadJarGroups();
      setShowAddGroupModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', 'Grupo creado correctamente');
    } catch (error) {
      console.error('Error adding group:', error);
      Alert.alert('Error', 'No se pudo crear el grupo');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await DatabaseService.deleteJarGroup(groupId);
      await loadJarGroups();
      await loadJars();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Éxito', 'Grupo eliminado correctamente');
    } catch (error) {
      console.error('Error deleting group:', error);
      Alert.alert('Error', 'No se pudo eliminar el grupo');
    }
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setShowSidebar(false);
  };

  const handleAddJar = async (jarData) => {
    try {
      await DatabaseService.addJar(
        jarData.name,
        jarData.percentage,
        jarData.color,
        jarData.icon,
        jarData.goal,
        jarData.groupId
      );
      await loadJars();
      await loadJarGroups();
      setShowAddJarModal(false);
      // Refrescar el grupo seleccionado si existe
      if (selectedGroup && jarData.groupId === selectedGroup.id) {
        const updatedGroup = await DatabaseService.getJarGroupById(selectedGroup.id);
        if (updatedGroup) {
          const stats = await DatabaseService.getJarsByGroup(updatedGroup.id);
          updatedGroup.jar_count = stats.length;
          updatedGroup.total_balance = stats.reduce((sum, j) => sum + (j.balance || 0), 0);
          setSelectedGroup(updatedGroup);
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', 'Frasco creado correctamente');
    } catch (error) {
      console.error('Error adding jar:', error);
      Alert.alert('Error', 'No se pudo crear el frasco');
    }
  };

  const handleSelectJar = (jar) => {
    setSelectedJar(jar);
  };

  const handleDistributeIncome = async (distributions) => {
    try {
      await DatabaseService.distributeIncome(distributions);
      await loadJars();
      await loadJarGroups();
      setShowDistributeModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', 'Ingreso distribuido en los frascos');
    } catch (error) {
      console.error('Error distributing income:', error);
      Alert.alert('Error', 'No se pudo distribuir el ingreso');
    }
  };

  const handleTransferJar = async ({ fromJarId, toJarId, amount }) => {
    try {
      await DatabaseService.transferBetweenJars(fromJarId, toJarId, amount);
      await loadJars();
      await loadJarGroups();
      setShowTransferModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', 'Transferencia realizada correctamente');
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo realizar la transferencia');
    }
  };

  const handleLoadTemplate = () => {
    Alert.alert(
      'Cargar plantilla',
      'Se crearán los 6 frascos de la teoría de T. Harv Eker (Necesidades 55%, Libertad Financiera 10%, Educación 10%, Diversión 10%, Ahorro 10%, Donaciones 5%). ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cargar',
          onPress: async () => {
            try {
              await DatabaseService.seedSixJarsTemplate();
              await loadJars();
              await loadJarGroups();
              setShowSidebar(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Éxito', '6 frascos creados correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudieron crear los frascos');
            }
          },
        },
      ]
    );
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

      {/* Desglose por método */}
      <View style={styles.methodContainer}>
        <View style={styles.methodCard}>
          <Ionicons name="cash-outline" size={13} color="#FF9500" />
          <Text style={styles.methodLabel}>Efectivo</Text>
          <Text style={[styles.methodValue, {color: '#34C759'}]} numberOfLines={1} adjustsFontSizeToFit>
            ${(methodStats.cash_balance || 0).toFixed(2)}
          </Text>
        </View>
        <View style={styles.methodCard}>
          <Ionicons name="phone-portrait-outline" size={13} color="#5856D6" />
          <Text style={styles.methodLabel}>Transferencia</Text>
          <Text style={[styles.methodValue, {color: '#34C759'}]} numberOfLines={1} adjustsFontSizeToFit>
            ${(methodStats.transfer_balance || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Botón colapsable de búsqueda y filtros */}
      <TouchableOpacity
        style={styles.filterToggleButton}
        onPress={() => setShowFilters(!showFilters)}
        activeOpacity={0.7}
      >
        <Ionicons name="search-outline" size={16} color="#1A237E" />
        <Text style={styles.filterToggleText}>Buscar y filtrar</Text>
        <Ionicons name={showFilters ? 'chevron-up' : 'chevron-down'} size={16} color="#8E8E93" />
      </TouchableOpacity>

      {showFilters && (
        <View style={styles.filterPanel}>
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
          <FilterBar
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            selectedSort={selectedSort}
            onSortChange={setSelectedSort}
          />
        </View>
      )}

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
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#F8F8F8" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A237E" />

      {/* Si hay un frasco seleccionado, mostrar detalle */}
      {selectedJar ? (
        <JarDetail
          jar={selectedJar}
          onClose={() => setSelectedJar(null)}
          onJarUpdated={async () => { await loadJars(); await loadJarGroups(); }}
        />
      ) : selectedGroup ? (
        <GroupDetail
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          onSelectJar={handleSelectJar}
          onAddJar={(groupId) => {
            setAddJarGroupId(groupId);
            setShowAddJarModal(true);
          }}
          onDistribute={(groupJars) => {
            setDistributeJars(groupJars);
            setShowDistributeModal(true);
          }}
          onGroupUpdated={async () => { await loadJars(); await loadJarGroups(); }}
        />
      ) : showJarsDashboard ? (
        <JarsDashboard
          jars={jars}
          jarGroups={jarGroups}
          onClose={() => setShowJarsDashboard(false)}
          onSelectJar={(jar) => {
            setShowJarsDashboard(false);
            setSelectedJar(jar);
          }}
        />
      ) : showJarsHistory ? (
        <JarsHistory onClose={() => setShowJarsHistory(false)} />
      ) : showJarsEvolution ? (
        <JarsEvolution onClose={() => setShowJarsEvolution(false)} />
      ) : (
      <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleContainer}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => setShowSidebar(true)}>
              <Ionicons name="menu" size={20} color="#FFFFFF" />
            </TouchableOpacity>
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
              style={styles.headerIconButton}
              onPress={() => setShowDefaultMsg(true)}>
              <Ionicons name="settings-outline" size={20} color="rgba(255,255,255,0.9)" />
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
          <View style={styles.headerBalanceRight}>
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
            onDeleteMovement={async (movementId) => {
              try {
                await DatabaseService.deleteMovement(movementId);
                await loadDebtors();
                await loadStats();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                Alert.alert('Éxito', 'Movimiento eliminado y balance revertido');
              } catch (error) {
                Alert.alert('Error', error.message || 'No se pudo eliminar el movimiento');
              }
            }}
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
          await loadJars();
          await loadJarGroups();
        }}
      />

      <DefaultMessageModal
        visible={showDefaultMsg}
        onClose={() => setShowDefaultMsg(false)}
      />

      </>
      )}

      {/* Modales de frascos - fuera del condicional para que funcionen desde GroupDetail */}
      <AddJarModal
        visible={showAddJarModal}
        onClose={() => {
          setShowAddJarModal(false);
          setAddJarGroupId(null);
        }}
        onSave={handleAddJar}
        groupId={addJarGroupId}
      />

      <AddGroupModal
        visible={showAddGroupModal}
        onClose={() => setShowAddGroupModal(false)}
        onSave={handleAddGroup}
      />

      <DistributeIncomeModal
        visible={showDistributeModal}
        onClose={() => {
          setShowDistributeModal(false);
          setDistributeJars([]);
        }}
        onDistribute={handleDistributeIncome}
        jars={distributeJars.length > 0 ? distributeJars : jars}
      />

      <TransferJarModal
        visible={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onTransfer={handleTransferJar}
        jars={jars}
      />

      <ReminderConfig
        visible={showReminderConfig}
        onClose={() => setShowReminderConfig(false)}
      />

      {/* Sidebar - siempre montado fuera del condicional */}
      <Sidebar
        visible={showSidebar}
        onClose={() => setShowSidebar(false)}
        jarGroups={jarGroups}
        onSelectGroup={handleSelectGroup}
        onAddGroup={() => {
          setShowSidebar(false);
          setShowAddGroupModal(true);
        }}
        onDeleteGroup={handleDeleteGroup}
        onTransfer={() => {
          setShowSidebar(false);
          setShowTransferModal(true);
        }}
        onDashboard={() => {
          setShowSidebar(false);
          setShowJarsDashboard(true);
        }}
        onHistory={() => {
          setShowSidebar(false);
          setShowJarsHistory(true);
        }}
        onEvolution={() => {
          setShowSidebar(false);
          setShowJarsEvolution(true);
        }}
        onReminder={() => {
          setShowSidebar(false);
          setShowReminderConfig(true);
        }}
        onLoadTemplate={handleLoadTemplate}
      />
    </SafeAreaView>
    </SafeAreaProvider>
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
    paddingTop: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBalanceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBalanceAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerBalanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
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
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 2,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
  },
  filterToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A237E',
  },
  filterPanel: {
    marginTop: 4,
  },
  methodContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 8,
  },
  methodCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  methodLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
  },
  methodValue: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 'auto',
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
