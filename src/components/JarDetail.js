import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DatabaseService from '../services/DatabaseService';
import AddJarMovementModal from './AddJarMovementModal';
import { CATEGORIES } from './AddJarMovementModal';

export default function JarDetail({ jar: initialJar, onClose, onJarUpdated }) {
  const insets = useSafeAreaInsets();
  const [jar, setJar] = useState(initialJar);
  const [movements, setMovements] = useState([]);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [editName, setEditName] = useState('');
  const [editPercentage, setEditPercentage] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [monthlySpending, setMonthlySpending] = useState(0);

  const goalReached = jar.goal > 0 && jar.balance >= jar.goal;
  const goalProgress = jar.goal > 0 ? Math.min((jar.balance / jar.goal) * 100, 100) : 0;

  const budgetSet = (jar.monthly_budget || 0) > 0;
  const budgetUsed = budgetSet ? Math.min((monthlySpending / jar.monthly_budget) * 100, 100) : 0;
  const budgetWarning = budgetSet && budgetUsed >= 80;
  const budgetExceeded = budgetSet && monthlySpending >= jar.monthly_budget;

  useEffect(() => {
    loadMovements();
    loadBudgetData();
  }, []);

  const loadMovements = async () => {
    try {
      const data = await DatabaseService.getJarMovements(jar.id);
      setMovements(data);
    } catch (error) {
      console.error('Error loading jar movements:', error);
    }
  };

  const loadBudgetData = async () => {
    try {
      const spent = await DatabaseService.getMonthlySpending(jar.id);
      setMonthlySpending(spent);
    } catch (error) {
      console.error('Error loading budget data:', error);
    }
  };

  const refreshJar = async () => {
    try {
      const updated = await DatabaseService.getJarById(jar.id);
      setJar(updated);
      await loadBudgetData();
      onJarUpdated();
    } catch (error) {
      console.error('Error refreshing jar:', error);
    }
  };

  const handleSaveMovement = async (movementData) => {
    try {
      await DatabaseService.addJarMovement(
        movementData.jarId,
        movementData.amount,
        movementData.type,
        movementData.description,
        movementData.category || ''
      );
      await refreshJar();
      await loadMovements();
      setShowMovementModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', `${movementData.type} registrado correctamente`);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo registrar el movimiento');
    }
  };

  const handleSetGoal = async () => {
    const goalValue = parseFloat(goalInput);
    if (isNaN(goalValue) || goalValue < 0) {
      Alert.alert('Error', 'Ingresa un valor válido para la meta');
      return;
    }
    try {
      await DatabaseService.setJarGoal(jar.id, goalValue);
      await refreshJar();
      setShowGoalModal(false);
      setGoalInput('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Éxito', goalValue > 0 ? 'Meta establecida' : 'Meta eliminada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo establecer la meta');
    }
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }
    const pct = parseFloat(editPercentage) || 0;
    if (pct < 0 || pct > 100) {
      Alert.alert('Error', 'El porcentaje debe estar entre 0 y 100');
      return;
    }
    try {
      const budget = parseFloat(editBudget) || 0;
      await DatabaseService.updateJar(jar.id, editName.trim(), pct, jar.color, jar.icon, jar.goal, budget);
      await refreshJar();
      setShowEditModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el frasco');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar frasco',
      `¿Estás seguro de eliminar "${jar.name}"? Se perderán todos sus movimientos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.deleteJar(jar.id);
              onJarUpdated();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              onClose();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el frasco');
            }
          },
        },
      ]
    );
  };

  const openEditModal = () => {
    setEditName(jar.name);
    setEditPercentage(jar.percentage.toString());
    setEditBudget((jar.monthly_budget || 0) > 0 ? jar.monthly_budget.toString() : '');
    setShowEditModal(true);
  };

  const renderMovement = ({ item }) => {
    const isIncome = item.type === 'Ingreso';
    const cat = item.category ? CATEGORIES.find(c => c.key === item.category) : null;
    return (
      <View style={styles.movementItem}>
        <View style={[styles.movementIcon, { backgroundColor: isIncome ? '#E8F5E9' : '#FFEBEE' }]}>
          <Ionicons
            name={cat && !isIncome ? cat.icon : (isIncome ? 'arrow-down-circle' : 'arrow-up-circle')}
            size={18}
            color={cat && !isIncome ? cat.color : (isIncome ? '#34C759' : '#FF3B30')}
          />
        </View>
        <View style={styles.movementInfo}>
          <View style={styles.movementTypeRow}>
            <Text style={styles.movementType}>{item.type}</Text>
            {cat && !isIncome && (
              <View style={[styles.categoryBadge, { backgroundColor: cat.color + '20' }]}>
                <Text style={[styles.categoryBadgeText, { color: cat.color }]}>{cat.label}</Text>
              </View>
            )}
          </View>
          {item.description ? (
            <Text style={styles.movementDesc} numberOfLines={1}>{item.description}</Text>
          ) : null}
          <Text style={styles.movementDate}>{item.created_at}</Text>
        </View>
        <Text style={[styles.movementAmount, { color: isIncome ? '#34C759' : '#FF3B30' }]}>
          {isIncome ? '+' : '-'}${item.amount.toFixed(2)}
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Balance card */}
      <View style={[styles.balanceCard, goalReached && styles.balanceCardGoal]}>
        <View style={[styles.balanceIcon, { backgroundColor: goalReached ? '#FFD700' : jar.color }]}>
          <Ionicons name={jar.icon || 'wallet-outline'} size={28} color="#FFFFFF" />
          {goalReached && (
            <View style={styles.starBadgeLarge}>
              <Ionicons name="star" size={14} color="#FFD700" />
            </View>
          )}
        </View>
        <Text style={[styles.balanceAmount, goalReached && { color: '#FFD700' }]}>
          ${jar.balance.toFixed(2)}
        </Text>
        <Text style={styles.balanceLabel}>{jar.percentage}% de ingresos</Text>

        {jar.goal > 0 && (
          <View style={styles.goalSection}>
            <View style={styles.goalBarBg}>
              <View
                style={[
                  styles.goalBarFill,
                  {
                    width: `${goalProgress}%`,
                    backgroundColor: goalReached ? '#FFD700' : jar.color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.goalLabel, goalReached && { color: '#FFD700' }]}>
              {goalReached
                ? '★ ¡Meta alcanzada!'
                : `$${jar.balance.toFixed(2)} / $${jar.goal.toFixed(2)}`}
            </Text>
          </View>
        )}

        {budgetSet && (
          <View style={styles.budgetSection}>
            <View style={styles.budgetHeader}>
              <Ionicons name="wallet-outline" size={14} color={budgetExceeded ? '#FF3B30' : budgetWarning ? '#FF9500' : '#8E8E93'} />
              <Text style={[styles.budgetTitle, budgetExceeded && { color: '#FF3B30' }, budgetWarning && !budgetExceeded && { color: '#FF9500' }]}>
                Presupuesto mensual
              </Text>
            </View>
            <View style={styles.goalBarBg}>
              <View
                style={[
                  styles.goalBarFill,
                  {
                    width: `${budgetUsed}%`,
                    backgroundColor: budgetExceeded ? '#FF3B30' : budgetWarning ? '#FF9500' : '#34C759',
                  },
                ]}
              />
            </View>
            <Text style={[styles.budgetLabel, budgetExceeded && { color: '#FF3B30' }]}>
              {budgetExceeded
                ? `⚠ Excedido: $${monthlySpending.toFixed(2)} / $${jar.monthly_budget.toFixed(2)}`
                : `$${monthlySpending.toFixed(2)} / $${jar.monthly_budget.toFixed(2)} gastado`}
            </Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#34C759' }]}
          onPress={() => setShowMovementModal(true)}
        >
          <Ionicons name="add-circle" size={18} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Movimiento</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FF9500' }]}
          onPress={() => {
            setGoalInput(jar.goal > 0 ? jar.goal.toString() : '');
            setShowGoalModal(true);
          }}
        >
          <Ionicons name="flag" size={18} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Meta</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#5856D6' }]}
          onPress={openEditModal}
        >
          <Ionicons name="create" size={18} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#FF3B30' }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={18} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>Borrar</Text>
        </TouchableOpacity>
      </View>

      {/* History header */}
      <View style={styles.historyHeader}>
        <Ionicons name="time-outline" size={16} color="#8E8E93" />
        <Text style={styles.historyTitle}>Historial de movimientos</Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={50} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>Sin movimientos</Text>
      <Text style={styles.emptySubtitle}>Agrega un ingreso o gasto para comenzar</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{jar.name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={movements}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMovement}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={movements.length === 0 && styles.emptyListContent}
      />

      {/* Add movement modal */}
      <AddJarMovementModal
        visible={showMovementModal}
        onClose={() => setShowMovementModal(false)}
        onSave={handleSaveMovement}
        jar={jar}
      />

      {/* Goal modal */}
      <Modal visible={showGoalModal} animationType="fade" transparent>
        <KeyboardAvoidingView
          style={styles.goalModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.goalModalContent}>
            <Text style={styles.goalModalTitle}>Establecer Meta</Text>
            <Text style={styles.goalModalSubtitle}>
              Cuando el saldo alcance esta meta, el frasco se iluminará con una estrella dorada.
            </Text>
            <View style={styles.goalInputRow}>
              <Text style={styles.goalDollar}>$</Text>
              <TextInput
                style={styles.goalInput}
                placeholder="0.00"
                value={goalInput}
                onChangeText={setGoalInput}
                keyboardType="decimal-pad"
                placeholderTextColor="#C7C7CC"
                autoFocus
              />
            </View>
            <View style={styles.goalBtnRow}>
              <TouchableOpacity
                style={styles.goalCancelBtn}
                onPress={() => setShowGoalModal(false)}
              >
                <Text style={styles.goalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.goalSaveBtn} onPress={handleSetGoal}>
                <Text style={styles.goalSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit modal */}
      <Modal visible={showEditModal} animationType="fade" transparent>
        <KeyboardAvoidingView
          style={styles.goalModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.goalModalContent}>
            <Text style={styles.goalModalTitle}>Editar Frasco</Text>
            <Text style={styles.editLabel}>Nombre</Text>
            <TextInput
              style={styles.editInput}
              value={editName}
              onChangeText={setEditName}
              maxLength={30}
              placeholderTextColor="#C7C7CC"
            />
            <Text style={styles.editLabel}>Porcentaje</Text>
            <View style={styles.goalInputRow}>
              <TextInput
                style={[styles.goalInput, { flex: 1 }]}
                value={editPercentage}
                onChangeText={setEditPercentage}
                keyboardType="numeric"
                maxLength={3}
                placeholderTextColor="#C7C7CC"
              />
              <Text style={styles.goalDollar}>%</Text>
            </View>
            <Text style={styles.editLabel}>Presupuesto mensual (gasto)</Text>
            <View style={styles.goalInputRow}>
              <Text style={styles.goalDollar}>$</Text>
              <TextInput
                style={[styles.goalInput, { flex: 1 }]}
                value={editBudget}
                onChangeText={setEditBudget}
                keyboardType="decimal-pad"
                placeholder="0 = sin límite"
                placeholderTextColor="#C7C7CC"
              />
            </View>
            <View style={styles.goalBtnRow}>
              <TouchableOpacity
                style={styles.goalCancelBtn}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.goalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.goalSaveBtn} onPress={handleSaveEdit}>
                <Text style={styles.goalSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    flex: 1,
    textAlign: 'center',
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceCardGoal: {
    backgroundColor: '#FFFDE7',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  balanceIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  starBadgeLarge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  balanceLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 4,
  },
  goalSection: {
    width: '100%',
    marginTop: 14,
  },
  budgetSection: {
    width: '100%',
    marginTop: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 10,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  budgetTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  budgetLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  goalBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
  },
  goalBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  movementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 10,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  movementIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  movementInfo: {
    flex: 1,
  },
  movementTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  movementType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  movementDesc: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 1,
  },
  movementDate: {
    fontSize: 11,
    color: '#C7C7CC',
    marginTop: 2,
  },
  movementAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyListContent: {
    flexGrow: 1,
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
  // Goal modal
  goalModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  goalModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  goalModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 8,
  },
  goalModalSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  goalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  goalDollar: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8E8E93',
  },
  goalInput: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    paddingVertical: 12,
    marginLeft: 6,
  },
  goalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  goalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  goalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8E8E93',
  },
  goalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1A237E',
    alignItems: 'center',
  },
  goalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Edit modal
  editLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  editInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
});
