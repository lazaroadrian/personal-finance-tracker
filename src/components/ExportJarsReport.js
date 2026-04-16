import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import DatabaseService from '../services/DatabaseService';

export default function ExportJarsReport({ visible, onClose }) {
  const [exporting, setExporting] = useState(false);

  const generateCSV = async () => {
    setExporting(true);
    try {
      const { jars, movements } = await DatabaseService.getJarsReportData();

      // Resumen de frascos
      let csv = 'RESUMEN DE FRASCOS\n';
      csv += 'Nombre,Porcentaje,Balance,Meta,Presupuesto Mensual,Color,Creado\n';
      for (const jar of jars) {
        csv += `"${jar.name}",${jar.percentage}%,$${jar.balance.toFixed(2)},$${(jar.goal || 0).toFixed(2)},$${(jar.monthly_budget || 0).toFixed(2)},"${jar.color}","${jar.created_at}"\n`;
      }

      const totalBalance = jars.reduce((sum, j) => sum + j.balance, 0);
      csv += `\nBALANCE TOTAL,,$${totalBalance.toFixed(2)}\n`;

      // Movimientos
      csv += '\n\nHISTORIAL DE MOVIMIENTOS\n';
      csv += 'Fecha,Frasco,Tipo,Monto,Categoria,Descripcion\n';
      for (const m of movements) {
        csv += `"${m.created_at}","${m.jar_name}","${m.type}",$${m.amount.toFixed(2)},"${m.category || ''}","${m.description || ''}"\n`;
      }

      const fileName = `frascos_reporte_${new Date().toISOString().slice(0, 10)}.csv`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar reporte de frascos',
        });
      } else {
        Alert.alert('Error', 'Compartir no está disponible en este dispositivo');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      Alert.alert('Error', 'No se pudo exportar el reporte');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Exportar Reporte</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.iconContainer}>
              <Ionicons name="document-text-outline" size={48} color="#007AFF" />
            </View>
            <Text style={styles.description}>
              Exporta un archivo CSV con el resumen de todos tus frascos y el historial completo de movimientos.
            </Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text style={styles.infoText}>Resumen de cada frasco</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text style={styles.infoText}>Balances y porcentajes</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text style={styles.infoText}>Historial de movimientos</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text style={styles.infoText}>Compatible con Excel / Google Sheets</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
            onPress={generateCSV}
            disabled={exporting}
            activeOpacity={0.8}
          >
            {exporting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="share-outline" size={20} color="#FFF" />
                <Text style={styles.exportButtonText}>Exportar CSV</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 380,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A237E',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F0FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#333',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    margin: 20,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
