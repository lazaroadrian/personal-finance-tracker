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

export default function DistributeIncomeModal({ visible, onClose, onDistribute, jars }) {
  const [amount, setAmount] = useState('');

  const parsedAmount = parseFloat(amount) || 0;
  const totalPercentage = jars.reduce((sum, j) => sum + (j.percentage || 0), 0);
  const unassigned = totalPercentage < 100 ? 100 - totalPercentage : 0;

  const distribution = jars.map((jar) => ({
    ...jar,
    share: totalPercentage > 0
      ? parseFloat(((jar.percentage / totalPercentage) * parsedAmount).toFixed(2))
      : 0,
  }));

  // Ajustar centavos de redondeo en el primer frasco
  if (parsedAmount > 0 && distribution.length > 0) {
    const totalShares = distribution.reduce((s, d) => s + d.share, 0);
    const diff = parseFloat((parsedAmount - totalShares).toFixed(2));
    if (diff !== 0) {
      distribution[0].share = parseFloat((distribution[0].share + diff).toFixed(2));
    }
  }

  const handleDistribute = () => {
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Error', 'Ingresa un monto válido mayor a 0');
      return;
    }
    if (jars.length === 0) {
      Alert.alert('Sin frascos', 'Crea al menos un frasco antes de distribuir');
      return;
    }
    if (totalPercentage === 0) {
      Alert.alert('Sin porcentajes', 'Asigna porcentajes a tus frascos antes de distribuir');
      return;
    }
    onDistribute(distribution.map((d) => ({ jarId: d.id, amount: d.share })));
    setAmount('');
  };

  const handleClose = () => {
    setAmount('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Distribuir Ingreso</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* Amount input */}
          <Text style={styles.label}>Monto a distribuir</Text>
          <View style={styles.amountRow}>
            <Text style={styles.dollar}>$</Text>
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

          {totalPercentage !== 100 && totalPercentage > 0 && (
            <View style={styles.warningRow}>
              <Ionicons name="warning" size={14} color="#FF9500" />
              <Text style={styles.warningText}>
                Tus porcentajes suman {totalPercentage.toFixed(0)}%. Se distribuirá proporcionalmente.
              </Text>
            </View>
          )}

          {/* Preview */}
          <Text style={styles.label}>Distribución</Text>
          <ScrollView style={styles.previewList} contentContainerStyle={styles.previewListContent}>
            {distribution.map((jar) => (
              <View key={jar.id} style={styles.previewItem}>
                <View style={[styles.jarDot, { backgroundColor: jar.color }]} />
                <Text style={styles.jarName} numberOfLines={1}>{jar.name}</Text>
                <Text style={styles.jarPct}>{jar.percentage}%</Text>
                <Text style={styles.jarShare}>
                  +${jar.share.toFixed(2)}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Total check */}
          {parsedAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${parsedAmount.toFixed(2)}</Text>
            </View>
          )}

          {/* Distribute button */}
          <TouchableOpacity
            style={[styles.distributeBtn, parsedAmount <= 0 && styles.distributeBtnDisabled]}
            onPress={handleDistribute}
            activeOpacity={0.8}
            disabled={parsedAmount <= 0}
          >
            <Ionicons name="git-branch-outline" size={20} color="#FFFFFF" />
            <Text style={styles.distributeBtnText}>Distribuir</Text>
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 6,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  dollar: {
    fontSize: 22,
    fontWeight: '700',
    color: '#8E8E93',
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: '700',
    color: '#1C1C1E',
    paddingVertical: 12,
    marginLeft: 6,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  warningText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
    flex: 1,
  },
  previewList: {
    maxHeight: 220,
  },
  previewListContent: {
    gap: 4,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    gap: 8,
  },
  jarDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  jarName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  jarPct: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    width: 36,
    textAlign: 'right',
  },
  jarShare: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34C759',
    width: 72,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1C1C1E',
  },
  distributeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
  },
  distributeBtnDisabled: {
    backgroundColor: '#C7C7CC',
  },
  distributeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
