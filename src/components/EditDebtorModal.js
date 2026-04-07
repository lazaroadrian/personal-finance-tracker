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
  Alert,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';

const EditDebtorModal = ({visible, onClose, onSave, debtor}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');

  useEffect(() => {
    if (debtor) {
      setName(debtor.name);
      setPhone(debtor.phone);
      setWhatsappMessage(debtor.whatsapp_message || '');
    }
  }, [debtor]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Error', 'Por favor ingresa un teléfono');
      return;
    }

    onSave({
      id: debtor.id,
      name: name.trim(),
      phone: phone.trim(),
      whatsappMessage: whatsappMessage.trim(),
    });
  };

  const handleClose = () => {
    onClose();
  };

  const importFromContacts = async () => {
    try {
      // Solicitar permisos
      const {status} = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permisos necesarios',
          'Necesitamos acceso a tus contactos para importar información'
        );
        return;
      }

      // Obtener contactos
      const {data} = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      if (data.length === 0) {
        Alert.alert('Sin contactos', 'No se encontraron contactos');
        return;
      }

      // Crear lista de opciones simple (en una app real usarías un picker)
      // Por ahora, mostrar el primer contacto como ejemplo
      // Aquí deberías implementar un selector de contactos
      Alert.alert(
        'Importar contacto',
        `¿Deseas importar el primer contacto?\n${data[0].name}`,
        [
          {text: 'Cancelar', style: 'cancel'},
          {
            text: 'Importar',
            onPress: () => {
              const contact = data[0];
              setName(contact.name || '');
              if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
                setPhone(contact.phoneNumbers[0].number || '');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error importing contacts:', error);
      Alert.alert('Error', 'No se pudo acceder a los contactos');
    }
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
            <Text style={styles.modalTitle}>Editar Deudor</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre del deudor"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono *</Text>
              <View style={styles.phoneContainer}>
                <TextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder="+54 11 1234-5678"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#8E8E93"
                />
                <TouchableOpacity
                  style={styles.importButton}
                  onPress={importFromContacts}>
                  <Ionicons name="person-add" size={24} color="#007AFF" />
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>
                Toca el icono para importar desde contactos
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mensaje de WhatsApp (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Hola {name}, te contacto sobre..."
                value={whatsappMessage}
                onChangeText={setWhatsappMessage}
                multiline
                numberOfLines={4}
                placeholderTextColor="#8E8E93"
              />
              <Text style={styles.hint}>
                Usa {'{name}'} y {'{balance}'} para reemplazar automáticamente
              </Text>
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
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  phoneInput: {
    flex: 1,
  },
  importButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    width: 48,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
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

export default EditDebtorModal;
