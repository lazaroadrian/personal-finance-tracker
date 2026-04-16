import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
const StorageAccessFramework = FileSystem.StorageAccessFramework;
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import DatabaseService from '../services/DatabaseService';

const BackupRestore = ({visible, onClose, onRestoreComplete}) => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleBackupLocal = async () => {
    try {
      setLoading(true);
      setStatusMessage('Exportando datos...');

      const data = await DatabaseService.exportData();
      const jsonString = JSON.stringify(data, null, 2);
      const fileName = `gestor_cuentas_backup_${Date.now()}.json`;

      // Guardar usando SAF (selector de carpeta)
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        setLoading(false);
        setStatusMessage('');
        return;
      }

      const fileUri = await StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        'application/json'
      );
      await FileSystem.writeAsStringAsync(fileUri, jsonString);

      setLoading(false);
      setStatusMessage('');
      Alert.alert(
        'Backup exitoso',
        `Se exportaron ${data.debtors.length} deudores, ${data.movements.length} movimientos, ${(data.jar_groups || []).length} grupos y ${(data.jars || []).length} frascos.\n\nArchivo guardado en la carpeta seleccionada.`
      );
    } catch (error) {
      setLoading(false);
      setStatusMessage('');
      console.error('Error creating backup:', error);
      Alert.alert('Error', 'No se pudo crear el backup: ' + error.message);
    }
  };

  const shareBackup = async (filePath) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Compartir backup de Gestor de Cuentas',
        });
      } else {
        Alert.alert('Error', 'La función de compartir no está disponible en este dispositivo');
      }
    } catch (error) {
      console.error('Error sharing backup:', error);
    }
  };

  const handleRestore = async () => {
    Alert.alert(
      'Restaurar backup',
      '⚠️ Esto reemplazará TODOS los datos actuales con los del backup. ¿Estás seguro?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Continuar',
          style: 'destructive',
          onPress: pickAndRestore,
        },
      ]
    );
  };

  const pickAndRestore = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setLoading(true);
      setStatusMessage('Restaurando datos...');

      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri);
      let data;
      
      try {
        data = JSON.parse(content);
      } catch {
        setLoading(false);
        Alert.alert('Error', 'El archivo no es un backup válido (JSON inválido)');
        return;
      }

      if (!data.app || data.app !== 'Gestor de Cuentas') {
        setLoading(false);
        Alert.alert('Error', 'El archivo no es un backup de Gestor de Cuentas');
        return;
      }

      await DatabaseService.importData(data);

      setLoading(false);
      setStatusMessage('');

      Alert.alert(
        'Restauración exitosa',
        `Se restauraron ${data.debtors.length} deudores, ${data.movements.length} movimientos${data.jar_groups ? `, ${data.jar_groups.length} grupos` : ''}${data.jars ? ` y ${data.jars.length} frascos` : ''}.`
      );

      if (onRestoreComplete) onRestoreComplete();
      onClose();
    } catch (error) {
      setLoading(false);
      console.error('Error restoring backup:', error);
      Alert.alert('Error', 'No se pudo restaurar el backup: ' + error.message);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Backup y Restauración</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>{statusMessage}</Text>
            </View>
          ) : (
            <View style={styles.optionsContainer}>
              {/* Backup */}
              <TouchableOpacity
                style={styles.optionCard}
                onPress={handleBackupLocal}>
                <View style={[styles.iconCircle, {backgroundColor: '#E8F5E9'}]}>
                  <Ionicons name="cloud-upload-outline" size={26} color="#34C759" />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>Crear Backup</Text>
                  <Text style={styles.optionDescription}>
                    Exporta todos tus deudores y movimientos a un archivo JSON. Puedes guardarlo o compartirlo.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>

              {/* Restore */}
              <TouchableOpacity
                style={styles.optionCard}
                onPress={handleRestore}>
                <View style={[styles.iconCircle, {backgroundColor: '#FFF3E0'}]}>
                  <Ionicons name="cloud-download-outline" size={26} color="#FF9500" />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>Restaurar Backup</Text>
                  <Text style={styles.optionDescription}>
                    Selecciona un archivo de backup para restaurar tus datos. Esto reemplazará los datos actuales.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>

              {/* Info */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
                <Text style={styles.infoText}>
                  Recomendamos hacer backups periódicos para evitar pérdida de datos si desinstalas la app.
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
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
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  optionsContainer: {
    padding: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F0FE',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    alignItems: 'flex-start',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#3C3C43',
    lineHeight: 16,
  },
});

export default BackupRestore;
