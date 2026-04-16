import React, {useState, useEffect} from 'react';
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
import TemplateEditor from './TemplateEditor';
import DatabaseService from '../services/DatabaseService';

const DEFAULT_MSG = 'Hola {name}, te contacto sobre el saldo pendiente de ${balance}.';

const AddDebtorModal = ({visible, onClose, onSave}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [balance, setBalance] = useState('0');
  const [whatsappMessage, setWhatsappMessage] = useState(DEFAULT_MSG);
  const [defaultMsg, setDefaultMsg] = useState(DEFAULT_MSG);

  // Load saved default message when modal opens
  useEffect(() => {
    if (visible) {
      DatabaseService.getSetting('default_whatsapp_message', DEFAULT_MSG).then(msg => {
        setDefaultMsg(msg);
        setWhatsappMessage(msg);
      });
    }
  }, [visible]);

  const validatePhone = (phone) => {
    const digits = phone.replace(/[^0-9]/g, '');
    return digits.length >= 7;
  };

  const formatAmount = (text) => {
    // Permitir solo números, punto decimal y signo negativo
    let cleaned = text.replace(/[^0-9.-]/g, '');
    // Limitar a 2 decimales
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts[1];
    if (parts[1] && parts[1].length > 2) cleaned = parts[0] + '.' + parts[1].slice(0, 2);
    return cleaned;
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Por favor ingresa un nombre');
      return;
    }
    if (phone.trim() && !validatePhone(phone)) {
      alert('Número de teléfono inválido. Debe tener al menos 7 dígitos.');
      return;
    }

    const balanceNumber = parseFloat(balance) || 0;
    
    onSave({
      name: name.trim(),
      phone: phone.trim(),
      balance: balanceNumber,
      whatsappMessage: whatsappMessage.trim(),
    });

    // Limpiar formulario
    setName('');
    setPhone('');
    setBalance('0');
    setWhatsappMessage(defaultMsg);
  };

  const handleClose = () => {
    setName('');
    setPhone('');
    setBalance('0');
    setWhatsappMessage(defaultMsg);
    onClose();
  };

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
            <Text style={styles.modalTitle}>Agregar Deudor</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Juan Pérez"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: +52 1234567890"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Saldo inicial</Text>
              <Text style={styles.helperText}>
                Positivo = Te debe | Negativo = Tú debes
              </Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={balance}
                onChangeText={(text) => setBalance(formatAmount(text))}
                onFocus={() => { if (balance === '0') setBalance(''); }}
                keyboardType="numeric"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mensaje de WhatsApp</Text>
              <TemplateEditor value={whatsappMessage} onChange={setWhatsappMessage} />
            </View>
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
    paddingTop: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 6,
  },
  helperText: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  button: {
    flex: 1,
    padding: 14,
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

export default AddDebtorModal;
