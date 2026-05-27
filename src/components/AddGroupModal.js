import React, { useState, useEffect } from 'react';
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

const COLORS = [
  '#1A237E', '#007AFF', '#34C759', '#FF9500', '#FF3B30',
  '#5856D6', '#AF52DE', '#FF2D55', '#00C7BE', '#A2845E',
];

const ICONS = [
  'flask-outline', 'briefcase-outline', 'home-outline', 'cart-outline',
  'car-outline', 'airplane-outline', 'school-outline', 'heart-outline',
  'fitness-outline', 'game-controller-outline', 'musical-notes-outline',
  'restaurant-outline', 'gift-outline', 'construct-outline',
  'wallet-outline', 'cash-outline',
];

export default function AddGroupModal({ visible, onClose, onSave, initialData = null, title = 'Nuevo Grupo', saveLabel = 'Crear Grupo' }) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);

  useEffect(() => {
    if (!visible) return;
    if (initialData) {
      setName(initialData.name || '');
      setSelectedColor(initialData.color || COLORS[0]);
      setSelectedIcon(initialData.icon || ICONS[0]);
    } else {
      resetForm();
    }
  }, [visible, initialData]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para el grupo');
      return;
    }
    onSave({
      name: name.trim(),
      color: selectedColor,
      icon: selectedIcon,
    });
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setSelectedColor(COLORS[0]);
    setSelectedIcon(ICONS[0]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Nombre del grupo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Negocio, Personal, Inversiones..."
              value={name}
              onChangeText={setName}
              maxLength={30}
              placeholderTextColor="#C7C7CC"
              autoFocus
            />

            <Text style={styles.label}>Color</Text>
            <View style={styles.colorGrid}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Icono</Text>
            <View style={styles.iconGrid}>
              {ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    selectedIcon === icon && { backgroundColor: selectedColor },
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Ionicons
                    name={icon}
                    size={20}
                    color={selectedIcon === icon ? '#FFFFFF' : '#8E8E93'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Preview */}
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Vista previa</Text>
              <View style={styles.previewCard}>
                <View style={[styles.previewIcon, { backgroundColor: selectedColor }]}>
                  <Ionicons name={selectedIcon} size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.previewName}>{name || 'Nombre del grupo'}</Text>
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>{saveLabel}</Text>
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
    maxHeight: '80%',
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
  modalTitle: {
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
  formScroll: {
    maxHeight: 400,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  previewContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  previewIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  saveBtn: {
    backgroundColor: '#1A237E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
