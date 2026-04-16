import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  { key: 'comida', label: 'Comida', icon: 'fast-food-outline', color: '#FF9500' },
  { key: 'transporte', label: 'Transporte', icon: 'car-outline', color: '#5856D6' },
  { key: 'hogar', label: 'Hogar', icon: 'home-outline', color: '#007AFF' },
  { key: 'salud', label: 'Salud', icon: 'medkit-outline', color: '#FF2D55' },
  { key: 'educacion', label: 'Educación', icon: 'book-outline', color: '#5856D6' },
  { key: 'entretenimiento', label: 'Diversión', icon: 'game-controller-outline', color: '#FF9500' },
  { key: 'ropa', label: 'Ropa', icon: 'shirt-outline', color: '#30B0C7' },
  { key: 'servicios', label: 'Servicios', icon: 'flash-outline', color: '#FFCC00' },
  { key: 'telefono', label: 'Teléfono', icon: 'phone-portrait-outline', color: '#8E8E93' },
  { key: 'ahorro', label: 'Ahorro', icon: 'shield-checkmark-outline', color: '#34C759' },
  { key: 'regalo', label: 'Regalos', icon: 'gift-outline', color: '#FF2D55' },
  { key: 'mascota', label: 'Mascota', icon: 'paw-outline', color: '#A2845E' },
  { key: 'deuda', label: 'Deudas', icon: 'card-outline', color: '#FF3B30' },
  { key: 'otro', label: 'Otro', icon: 'ellipsis-horizontal-outline', color: '#8E8E93' },
];

export { CATEGORIES };

export default function AddJarMovementModal({ visible, onClose, onSave, jar }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Ingreso');
  const [category, setCategory] = useState('');

  if (!jar) return null;

  const handleSave = () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido mayor a 0');
      return;
    }

    if (type === 'Gasto' && parsedAmount > jar.balance) {
      Alert.alert(
        'Fondos insuficientes',
        `El saldo del frasco "${jar.name}" es $${jar.balance.toFixed(2)}.\nNo puedes gastar $${parsedAmount.toFixed(2)}.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    onSave({
      jarId: jar.id,
      amount: parsedAmount,
      type,
      description: description.trim(),
      category: type === 'Gasto' ? category : '',
    });
    resetForm();
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setType('Ingreso');
    setCategory('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const parsedAmount = parseFloat(amount) || 0;
  const newBalance = type === 'Ingreso'
    ? jar.balance + parsedAmount
    : jar.balance - parsedAmount;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.jarBadge, { backgroundColor: jar.color }]}>
                <Ionicons name={jar.icon || 'wallet-outline'} size={16} color="#FFFFFF" />
              </View>
              <Text style={styles.modalTitle} numberOfLines={1}>{jar.name}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* Type toggle */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'Ingreso' && styles.typeBtnActiveIncome]}
              onPress={() => setType('Ingreso')}
            >
              <Ionicons name="arrow-down-circle" size={18} color={type === 'Ingreso' ? '#FFFFFF' : '#34C759'} />
              <Text style={[styles.typeBtnText, type === 'Ingreso' && styles.typeBtnTextActive]}>Ingreso</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'Gasto' && styles.typeBtnActiveExpense]}
              onPress={() => setType('Gasto')}
            >
              <Ionicons name="arrow-up-circle" size={18} color={type === 'Gasto' ? '#FFFFFF' : '#FF3B30'} />
              <Text style={[styles.typeBtnText, type === 'Gasto' && styles.typeBtnTextActive]}>Gasto</Text>
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <Text style={styles.label}>Monto</Text>
          <View style={styles.amountRow}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholderTextColor="#C7C7CC"
              autoFocus
            />
          </View>

          {/* Balance preview */}
          <View style={styles.balancePreview}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Saldo actual</Text>
              <Text style={styles.balanceValue}>${jar.balance.toFixed(2)}</Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color="#C7C7CC" />
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Nuevo saldo</Text>
              <Text style={[
                styles.balanceValue,
                { color: newBalance < 0 ? '#FF3B30' : '#34C759' },
              ]}>
                ${newBalance.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="¿En qué se usó?"
            value={description}
            onChangeText={setDescription}
            maxLength={100}
            placeholderTextColor="#C7C7CC"
          />

          {/* Category selector - only for expenses */}
          {type === 'Gasto' && (
            <View>
              <Text style={styles.label}>Categoría</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
                contentContainerStyle={styles.categoryScrollContent}
              >
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryChip,
                      category === cat.key && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                    onPress={() => setCategory(category === cat.key ? '' : cat.key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={14}
                      color={category === cat.key ? '#FFF' : cat.color}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        category === cat.key && { color: '#FFF' },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Save button */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: type === 'Ingreso' ? '#34C759' : '#FF3B30' },
            ]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>
              {type === 'Ingreso' ? 'Agregar Ingreso' : 'Registrar Gasto'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  jarBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeToggle: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
  },
  typeBtnActiveIncome: {
    backgroundColor: '#34C759',
  },
  typeBtnActiveExpense: {
    backgroundColor: '#FF3B30',
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  dollarSign: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8E8E93',
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    paddingVertical: 12,
    marginLeft: 6,
  },
  balancePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  balanceRow: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 12,
  },
  categoryScroll: {
    marginBottom: 16,
    flexGrow: 0,
  },
  categoryScrollContent: {
    gap: 6,
    paddingRight: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
