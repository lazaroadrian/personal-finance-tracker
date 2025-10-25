import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AddMovementModal = ({visible, onClose, onSave, debtor}) => {
  const [amount, setAmount] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState('');

  const isPositiveBalance = debtor ? parseFloat(debtor.balance) >= 0 : true;

  // Tipos de movimiento según si el saldo es positivo (me deben) o negativo (yo debo)
  const movementTypes = isPositiveBalance
    ? [
        {type: 'Me pagó', icon: 'arrow-down-circle', color: '#34C759', description: 'Reduce la deuda'},
        {type: 'Le presté', icon: 'arrow-up-circle', color: '#FF9500', description: 'Aumenta la deuda'},
      ]
    : [
        {type: 'Le pagué', icon: 'arrow-down-circle', color: '#34C759', description: 'Reduce mi deuda'},
        {type: 'Me prestó', icon: 'arrow-up-circle', color: '#FF9500', description: 'Aumenta mi deuda'},
      ];

  const handleSave = () => {
    if (!selectedType) {
      alert('Por favor selecciona el tipo de movimiento');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      alert('Por favor ingresa un monto válido');
      return;
    }

    onSave({
      debtorId: debtor.id,
      amount: parseFloat(amount),
      type: selectedType,
      description: description.trim(),
    });

    // Limpiar formulario
    setAmount('');
    setSelectedType(null);
    setDescription('');
  };

  const handleClose = () => {
    setAmount('');
    setSelectedType(null);
    setDescription('');
    onClose();
  };

  if (!debtor) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Agregar Movimiento</Text>
              <Text style={styles.debtorName}>{debtor.name}</Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de movimiento *</Text>
              <View style={styles.typeButtonsContainer}>
                {movementTypes.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.typeButton,
                      selectedType === item.type && styles.typeButtonSelected,
                      {borderColor: item.color},
                    ]}
                    onPress={() => setSelectedType(item.type)}>
                    <Ionicons
                      name={item.icon}
                      size={32}
                      color={selectedType === item.type ? item.color : '#8E8E93'}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        selectedType === item.type && {color: item.color},
                      ]}>
                      {item.type}
                    </Text>
                    <Text style={styles.typeButtonDescription}>
                      {item.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monto *</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#8E8E93"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ej: Pago parcial, préstamo para..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor="#8E8E93"
              />
            </View>

            {/* Preview del cambio */}
            {amount && selectedType && (
              <View style={styles.previewContainer}>
                <Text style={styles.previewTitle}>Vista previa:</Text>
                <View style={styles.previewContent}>
                  <Text style={styles.previewLabel}>Saldo actual:</Text>
                  <Text
                    style={[
                      styles.previewAmount,
                      parseFloat(debtor.balance) >= 0
                        ? styles.positiveBalance
                        : styles.negativeBalance,
                    ]}>
                    ${Math.abs(parseFloat(debtor.balance)).toFixed(2)}
                  </Text>
                </View>
                <Ionicons name="arrow-down" size={20} color="#8E8E93" style={{alignSelf: 'center'}} />
                <View style={styles.previewContent}>
                  <Text style={styles.previewLabel}>Nuevo saldo:</Text>
                  <Text
                    style={[
                      styles.previewAmount,
                      calculateNewBalance() >= 0
                        ? styles.positiveBalance
                        : styles.negativeBalance,
                    ]}>
                    ${Math.abs(calculateNewBalance()).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}>
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  function calculateNewBalance() {
    const currentBalance = parseFloat(debtor.balance) || 0;
    const amountValue = parseFloat(amount) || 0;

    if (selectedType === 'Me pagó' || selectedType === 'Le pagué') {
      return currentBalance - (selectedType === 'Me pagó' ? amountValue : -amountValue);
    } else {
      return currentBalance + (selectedType === 'Le presté' ? amountValue : -amountValue);
    }
  }
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  debtorName: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  typeButtonSelected: {
    backgroundColor: '#FFFFFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 8,
    textAlign: 'center',
  },
  typeButtonDescription: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 14,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    padding: 14,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  previewContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  previewContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  previewAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  positiveBalance: {
    color: '#34C759',
  },
  negativeBalance: {
    color: '#FF3B30',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AddMovementModal;
