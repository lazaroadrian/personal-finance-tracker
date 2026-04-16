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
import DatabaseService from '../services/DatabaseService';

const COLORS = [
  '#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6',
  '#AF52DE', '#FF2D55', '#00C7BE', '#30B0C7', '#A2845E',
];

const ICONS = [
  'home-outline', 'trending-up-outline', 'book-outline',
  'game-controller-outline', 'shield-checkmark-outline', 'heart-outline',
  'car-outline', 'restaurant-outline', 'airplane-outline', 'gift-outline',
  'medkit-outline', 'school-outline', 'cart-outline', 'fitness-outline',
  'musical-notes-outline', 'paw-outline',
];

export default function AddJarModal({ visible, onClose, onSave, groupId }) {
  const [name, setName] = useState('');
  const [percentage, setPercentage] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [goal, setGoal] = useState('');
  const [existingJars, setExistingJars] = useState([]);

  useEffect(() => {
    if (visible && groupId) {
      loadExistingJars();
    }
  }, [visible, groupId]);

  const loadExistingJars = async () => {
    try {
      const jars = await DatabaseService.getJarsByGroup(groupId);
      setExistingJars(jars);
    } catch (error) {
      console.error('Error loading existing jars:', error);
    }
  };

  const usedPercentage = existingJars.reduce((sum, j) => sum + (j.percentage || 0), 0);
  const availablePercentage = 100 - usedPercentage;

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para el frasco');
      return;
    }
    const pct = parseFloat(percentage) || 0;
    if (pct < 0 || pct > 100) {
      Alert.alert('Error', 'El porcentaje debe estar entre 0 y 100');
      return;
    }
    if (groupId && (usedPercentage + pct) > 100) {
      Alert.alert(
        'Error',
        `El grupo ya tiene ${usedPercentage}% asignado. Disponible: ${availablePercentage}%. No puedes asignar ${pct}%.`
      );
      return;
    }
    const goalValue = parseFloat(goal) || 0;
    if (goalValue < 0) {
      Alert.alert('Error', 'La meta no puede ser negativa');
      return;
    }
    onSave({
      name: name.trim(),
      percentage: pct,
      color: selectedColor,
      icon: selectedIcon,
      goal: goalValue,
      groupId: groupId,
    });
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setPercentage('');
    setSelectedColor(COLORS[0]);
    setSelectedIcon(ICONS[0]);
    setGoal('');
    setExistingJars([]);
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
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nuevo Frasco</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Name */}
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Necesidades, Diversión..."
              value={name}
              onChangeText={setName}
              maxLength={30}
              placeholderTextColor="#C7C7CC"
            />

            {/* Percentage */}
            <Text style={styles.label}>Porcentaje de ingresos</Text>
            <View style={styles.percentageRow}>
              <TextInput
                style={[styles.input, styles.percentageInput]}
                placeholder="0"
                value={percentage}
                onChangeText={setPercentage}
                keyboardType="numeric"
                maxLength={3}
                placeholderTextColor="#C7C7CC"
              />
              <Text style={styles.percentSign}>%</Text>
            </View>

            {/* Info de porcentaje del grupo */}
            {groupId && existingJars.length > 0 && (
              <View style={styles.groupPercentInfo}>
                <View style={styles.groupPercentHeader}>
                  <Ionicons name="information-circle-outline" size={16} color="#007AFF" />
                  <Text style={styles.groupPercentTitle}>
                    Asignado: {usedPercentage}% · Disponible: {availablePercentage}%
                  </Text>
                </View>
                <View style={styles.groupPercentBarBg}>
                  <View style={[styles.groupPercentBarFill, { width: `${Math.min(usedPercentage, 100)}%` }]} />
                  {(parseFloat(percentage) || 0) > 0 && (
                    <View
                      style={[
                        styles.groupPercentBarNew,
                        {
                          left: `${Math.min(usedPercentage, 100)}%`,
                          width: `${Math.min(parseFloat(percentage) || 0, availablePercentage)}%`,
                        },
                      ]}
                    />
                  )}
                </View>
                {existingJars.map((jar) => (
                  <View key={jar.id} style={styles.existingJarRow}>
                    <View style={[styles.existingJarDot, { backgroundColor: jar.color }]} />
                    <Text style={styles.existingJarName} numberOfLines={1}>{jar.name}</Text>
                    <Text style={styles.existingJarPct}>{jar.percentage}%</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Goal */}
            <Text style={styles.label}>Meta (opcional)</Text>
            <View style={styles.percentageRow}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={[styles.input, styles.goalInput]}
                placeholder="0.00"
                value={goal}
                onChangeText={setGoal}
                keyboardType="decimal-pad"
                placeholderTextColor="#C7C7CC"
              />
            </View>

            {/* Color */}
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

            {/* Icon */}
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
                  <Ionicons name={selectedIcon} size={22} color="#FFFFFF" />
                </View>
                <Text style={styles.previewName}>{name || 'Nombre del frasco'}</Text>
                <Text style={styles.previewPct}>{percentage || '0'}%</Text>
              </View>
            </View>
          </ScrollView>

          {/* Save button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Crear Frasco</Text>
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
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 16,
  },
  percentageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  percentageInput: {
    flex: 1,
    marginBottom: 0,
  },
  percentSign: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8E8E93',
    marginLeft: 8,
  },
  dollarSign: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8E8E93',
    marginRight: 8,
  },
  goalInput: {
    flex: 1,
    marginBottom: 0,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
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
    borderColor: '#1C1C1E',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  iconOption: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  previewIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  previewPct: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
  },
  saveBtn: {
    backgroundColor: '#1A237E',
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  groupPercentInfo: {
    backgroundColor: '#F0F4FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D0D9F0',
  },
  groupPercentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  groupPercentTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  groupPercentBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E5EA',
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  groupPercentBarFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#007AFF',
  },
  groupPercentBarNew: {
    position: 'absolute',
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#34C759',
  },
  existingJarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  existingJarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  existingJarName: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  existingJarPct: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
});
