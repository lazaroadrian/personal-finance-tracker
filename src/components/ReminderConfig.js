import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import DatabaseService from '../services/DatabaseService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const FREQUENCIES = [
  { key: 'daily', label: 'Diario', icon: 'today-outline', description: 'Cada día a la hora elegida' },
  { key: 'weekly', label: 'Semanal', icon: 'calendar-outline', description: 'Una vez por semana' },
  { key: 'monthly', label: 'Mensual', icon: 'calendar-number-outline', description: 'El día 1 de cada mes' },
];

const HOURS_LIST = Array.from({ length: 24 }, (_, i) => i);
const MINUTES_LIST = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export default function ReminderConfig({ visible, onClose }) {
  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState('weekly');
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) loadSettings();
  }, [visible]);

  const loadSettings = async () => {
    try {
      const savedEnabled = await DatabaseService.getSetting('reminder_enabled', 'false');
      const savedFreq = await DatabaseService.getSetting('reminder_frequency', 'weekly');
      const savedHour = await DatabaseService.getSetting('reminder_hour', '9');
      const savedMinute = await DatabaseService.getSetting('reminder_minute', '0');
      setEnabled(savedEnabled === 'true');
      setFrequency(savedFreq);
      setHour(parseInt(savedHour));
      setMinute(parseInt(savedMinute));
    } catch (error) {
      console.error('Error loading reminder settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  };

  const scheduleNotification = async (freq, h, m) => {
    // Cancelar todas las notificaciones previas
    await Notifications.cancelAllScheduledNotificationsAsync();

    let trigger;
    if (freq === 'daily') {
      trigger = { type: 'daily', hour: h, minute: m };
    } else if (freq === 'weekly') {
      trigger = { type: 'weekly', weekday: 1, hour: h, minute: m }; // Lunes
    } else {
      // monthly - usar weekly como fallback
      trigger = { type: 'weekly', weekday: 1, hour: h, minute: m };
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💰 Recordatorio de Frascos',
        body: freq === 'daily'
          ? '¿Ya revisaste tus frascos hoy? Distribuye tus ingresos.'
          : freq === 'weekly'
          ? 'Es momento de revisar tus frascos y distribuir ingresos de la semana.'
          : 'Inicio de mes: revisa tus frascos, establece presupuestos y distribuye.',
        sound: true,
      },
      trigger,
    });
  };

  const handleToggle = async (value) => {
    if (value) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permisos requeridos',
          'Necesitas permitir las notificaciones para activar los recordatorios.',
        );
        return;
      }
      await scheduleNotification(frequency, hour, minute);
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    setEnabled(value);
    await DatabaseService.setSetting('reminder_enabled', value.toString());
  };

  const handleFreqChange = async (freq) => {
    setFrequency(freq);
    await DatabaseService.setSetting('reminder_frequency', freq);
    if (enabled) {
      await scheduleNotification(freq, hour, minute);
    }
  };

  const handleHourChange = async (h) => {
    setHour(h);
    await DatabaseService.setSetting('reminder_hour', h.toString());
    if (enabled) {
      await scheduleNotification(frequency, h, minute);
    }
  };

  const handleMinuteChange = async (m) => {
    setMinute(m);
    await DatabaseService.setSetting('reminder_minute', m.toString());
    if (enabled) {
      await scheduleNotification(frequency, hour, m);
    }
  };

  const formatTime = (h, m) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Recordatorios</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {/* Toggle principal */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Ionicons name="notifications-outline" size={22} color="#1A237E" />
                <Text style={styles.toggleLabel}>Activar recordatorios</Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={handleToggle}
                trackColor={{ false: '#DDD', true: '#007AFF' }}
                thumbColor={Platform.OS === 'android' ? '#FFF' : undefined}
              />
            </View>

            {/* Frecuencia */}
            <Text style={[styles.sectionLabel, !enabled && styles.disabled]}>Frecuencia</Text>
            <View style={styles.frequencyContainer}>
              {FREQUENCIES.map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.freqCard,
                    frequency === f.key && styles.freqCardActive,
                    !enabled && styles.disabled,
                  ]}
                  onPress={() => handleFreqChange(f.key)}
                  disabled={!enabled}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={f.icon}
                    size={20}
                    color={frequency === f.key ? '#007AFF' : '#999'}
                  />
                  <Text style={[
                    styles.freqLabel,
                    frequency === f.key && styles.freqLabelActive,
                  ]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Hora */}
            <Text style={[styles.sectionLabel, !enabled && styles.disabled]}>Hora</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.timeScrollContainer, !enabled && styles.disabled]}
            >
              {HOURS_LIST.map(h => (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.hourChip,
                    hour === h && styles.hourChipActive,
                  ]}
                  onPress={() => handleHourChange(h)}
                  disabled={!enabled}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.hourText,
                    hour === h && styles.hourTextActive,
                  ]}>
                    {h}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Minuto */}
            <Text style={[styles.sectionLabel, !enabled && styles.disabled]}>Minuto</Text>
            <View style={styles.hoursContainer}>
              {MINUTES_LIST.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.hourChip,
                    minute === m && styles.hourChipActive,
                  ]}
                  onPress={() => handleMinuteChange(m)}
                  disabled={!enabled}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.hourText,
                    minute === m && styles.hourTextActive,
                  ]}>
                    :{String(m).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {enabled && (
              <View style={styles.summaryCard}>
                <Ionicons name="alarm-outline" size={18} color="#007AFF" />
                <Text style={styles.summaryText}>
                  Recibirás un recordatorio{' '}
                  {frequency === 'daily' ? 'cada día' : frequency === 'weekly' ? 'cada lunes' : 'cada semana (inicio de mes)'}
                  {' '}a las {formatTime(hour, minute)}.
                </Text>
              </View>
            )}
          </View>
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
    paddingBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  disabled: {
    opacity: 0.4,
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  freqCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 4,
  },
  freqCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F0FE',
  },
  freqLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  freqLabelActive: {
    color: '#007AFF',
  },
  hoursContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  timeScrollContainer: {
    marginBottom: 20,
  },
  hourChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 6,
  },
  hourChipActive: {
    backgroundColor: '#007AFF',
  },
  hourText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  hourTextActive: {
    color: '#FFF',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  summaryText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
});
