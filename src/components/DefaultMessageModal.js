import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TemplateEditor from './TemplateEditor';
import DatabaseService from '../services/DatabaseService';

const DEFAULT_MSG = 'Hola {name}, te contacto sobre el saldo pendiente de ${balance}.';
const SETTING_KEY = 'default_whatsapp_message';

const DefaultMessageModal = ({ visible, onClose }) => {
  const [message, setMessage] = useState(DEFAULT_MSG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadMessage();
    }
  }, [visible]);

  const loadMessage = async () => {
    setLoading(true);
    const saved = await DatabaseService.getSetting(SETTING_KEY, DEFAULT_MSG);
    setMessage(saved);
    setLoading(false);
  };

  const handleSave = async () => {
    await DatabaseService.setSetting(SETTING_KEY, message);
    Alert.alert('Guardado', 'El mensaje predeterminado se ha actualizado.');
    onClose();
  };

  const handleReset = () => {
    setMessage(DEFAULT_MSG);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Mensaje predeterminado</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Este mensaje se usará automáticamente al agregar nuevos deudores.
          </Text>

          {!loading && (
            <View style={styles.editorWrap}>
              <TemplateEditor value={message} onChange={setMessage} />
            </View>
          )}

          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Ionicons name="refresh" size={16} color="#007AFF" />
            <Text style={styles.resetText}>Restaurar mensaje original</Text>
          </TouchableOpacity>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  description: {
    fontSize: 13,
    color: '#8E8E93',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  editorWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  resetText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default DefaultMessageModal;
