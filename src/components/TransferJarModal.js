import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TransferJarModal({ visible, onClose, onTransfer, jars }) {
  const [fromJarId, setFromJarId] = useState(null);
  const [toJarId, setToJarId] = useState(null);
  const [amount, setAmount] = useState('');

  const fromJar = jars.find((j) => j.id === fromJarId);
  const toJar = jars.find((j) => j.id === toJarId);
  const parsedAmount = parseFloat(amount) || 0;

  const handleTransfer = () => {
    if (!fromJarId || !toJarId) {
      Alert.alert('Error', 'Selecciona un frasco origen y uno destino');
      return;
    }
    if (fromJarId === toJarId) {
      Alert.alert('Error', 'El origen y destino deben ser diferentes');
      return;
    }
    if (parsedAmount <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido mayor a 0');
      return;
    }
    if (fromJar && parsedAmount > fromJar.balance) {
      Alert.alert(
        'Fondos insuficientes',
        `"${fromJar.name}" tiene $${fromJar.balance.toFixed(2)} disponible.`
      );
      return;
    }
    onTransfer({ fromJarId, toJarId, amount: parsedAmount });
    resetForm();
  };

  const resetForm = () => {
    setFromJarId(null);
    setToJarId(null);
    setAmount('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const swapJars = () => {
    const temp = fromJarId;
    setFromJarId(toJarId);
    setToJarId(temp);
  };

  const renderJarSelector = (label, selectedId, onSelect, excludeId) => (
    <View style={styles.selectorSection}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.jarScroll}>
        <View style={styles.jarRow}>
          {jars
            .filter((j) => j.id !== excludeId)
            .map((jar) => {
              const isSelected = jar.id === selectedId;
              return (
                <TouchableOpacity
                  key={jar.id}
                  style={[styles.jarChip, isSelected && { backgroundColor: jar.color }]}
                  onPress={() => onSelect(jar.id)}
                >
                  <Ionicons
                    name={jar.icon || 'wallet-outline'}
                    size={16}
                    color={isSelected ? '#FFFFFF' : jar.color}
                  />
                  <Text
                    style={[styles.jarChipText, isSelected && { color: '#FFFFFF' }]}
                    numberOfLines={1}
                  >
                    {jar.name}
                  </Text>
                  {isSelected && (
                    <Text style={styles.jarChipBalance}>${jar.balance.toFixed(2)}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Transferir entre frascos</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* From */}
            {renderJarSelector('Desde', fromJarId, setFromJarId, toJarId)}

            {/* Swap button */}
            <TouchableOpacity style={styles.swapBtn} onPress={swapJars}>
              <Ionicons name="swap-vertical" size={22} color="#5856D6" />
            </TouchableOpacity>

            {/* To */}
            {renderJarSelector('Hacia', toJarId, setToJarId, fromJarId)}

            {/* Amount */}
            <Text style={styles.label}>Monto</Text>
            <View style={styles.amountRow}>
              <Text style={styles.dollar}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholderTextColor="#C7C7CC"
              />
            </View>

            {/* Preview */}
            {fromJar && toJar && parsedAmount > 0 && (
              <View style={styles.previewCard}>
                <View style={styles.previewRow}>
                  <View style={[styles.previewDot, { backgroundColor: fromJar.color }]} />
                  <Text style={styles.previewName}>{fromJar.name}</Text>
                  <Text style={[styles.previewAmount, { color: '#FF3B30' }]}>
                    -${parsedAmount.toFixed(2)}
                  </Text>
                </View>
                <Ionicons name="arrow-down" size={16} color="#C7C7CC" style={{ alignSelf: 'center' }} />
                <View style={styles.previewRow}>
                  <View style={[styles.previewDot, { backgroundColor: toJar.color }]} />
                  <Text style={styles.previewName}>{toJar.name}</Text>
                  <Text style={[styles.previewAmount, { color: '#34C759' }]}>
                    +${parsedAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Transfer button */}
          <TouchableOpacity
            style={[styles.transferBtn, (!fromJarId || !toJarId || parsedAmount <= 0) && styles.btnDisabled]}
            onPress={handleTransfer}
            activeOpacity={0.8}
            disabled={!fromJarId || !toJarId || parsedAmount <= 0}
          >
            <Ionicons name="swap-horizontal" size={20} color="#FFFFFF" />
            <Text style={styles.transferBtnText}>Transferir</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorSection: {
    marginTop: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  jarScroll: {
    flexGrow: 0,
  },
  jarRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  jarChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  jarChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    maxWidth: 100,
  },
  jarChipBalance: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  swapBtn: {
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  dollar: {
    fontSize: 22,
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
  previewCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  previewName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  previewAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  transferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#5856D6',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  btnDisabled: {
    backgroundColor: '#C7C7CC',
  },
  transferBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
