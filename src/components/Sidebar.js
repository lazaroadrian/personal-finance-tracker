import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.78;

export default function Sidebar({
  visible,
  onClose,
  jarGroups,
  onSelectGroup,
  onAddGroup,
  onDeleteGroup,
  onTransfer,
  onDashboard,
  onHistory,
  onEvolution,
  onReminder,
  onLoadTemplate,
}) {
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -SIDEBAR_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const totalBalance = jarGroups.reduce((sum, g) => sum + (g.total_balance || 0), 0);
  const totalJars = jarGroups.reduce((sum, g) => sum + (g.jar_count || 0), 0);

  const handleDeleteGroup = (group) => {
    Alert.alert(
      'Eliminar grupo',
      `¿Eliminar "${group.name}" y todos sus frascos? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onDeleteGroup(group.id),
        },
      ]
    );
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sidebar,
          {
            width: SIDEBAR_WIDTH,
            transform: [{ translateX }],
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="flask-outline" size={22} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Mis Frascos</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{totalJars} frascos en {jarGroups.length} grupos</Text>
            <Text style={styles.summaryBalance}>${totalBalance.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={onDashboard} activeOpacity={0.7}>
            <Ionicons name="pie-chart-outline" size={18} color="#1A237E" />
            <Text style={styles.quickActionText}>Resumen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={onHistory} activeOpacity={0.7}>
            <Ionicons name="time-outline" size={18} color="#1A237E" />
            <Text style={styles.quickActionText}>Historial</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={onTransfer} activeOpacity={0.7}>
            <Ionicons name="swap-horizontal-outline" size={18} color="#1A237E" />
            <Text style={styles.quickActionText}>Transferir</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={onEvolution} activeOpacity={0.7}>
            <Ionicons name="trending-up-outline" size={18} color="#5856D6" />
            <Text style={styles.quickActionText}>Evolución</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={onReminder} activeOpacity={0.7}>
            <Ionicons name="alarm-outline" size={18} color="#FF9500" />
            <Text style={styles.quickActionText}>Alertas</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.groupList} contentContainerStyle={styles.groupListContent}>
          <Text style={styles.sectionLabel}>GRUPOS</Text>
          {jarGroups.map((group) => (
            <TouchableOpacity
              key={group.id}
              style={styles.groupItem}
              activeOpacity={0.7}
              onPress={() => onSelectGroup(group)}
              onLongPress={() => handleDeleteGroup(group)}
            >
              <View style={[styles.groupIcon, { backgroundColor: group.color || '#1A237E' }]}>
                <Ionicons name={group.icon || 'flask-outline'} size={20} color="#FFFFFF" />
              </View>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
                <Text style={styles.groupMeta}>
                  {group.jar_count || 0} {group.jar_count === 1 ? 'frasco' : 'frascos'} · ${(group.total_balance || 0).toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteGroup(group)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.deleteGroupBtn}
              >
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          {jarGroups.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="flask-outline" size={40} color="#C7C7CC" />
              <Text style={styles.emptyText}>No hay grupos creados</Text>
              <Text style={styles.emptySubtext}>Crea un grupo o carga la plantilla</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomBtns}>
          <TouchableOpacity style={styles.addGroupBtn} onPress={onAddGroup} activeOpacity={0.8}>
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <Text style={styles.addGroupText}>Crear Grupo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.templateBtn} onPress={onLoadTemplate} activeOpacity={0.8}>
            <Ionicons name="flask" size={18} color="#1A237E" />
            <Text style={styles.templateBtnText}>6 Frascos</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    backgroundColor: '#1A237E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summarySection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  summaryBalance: {
    fontSize: 16,
    fontWeight: '800',
    color: '#34C759',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  quickActionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1A237E',
  },
  groupList: {
    flex: 1,
  },
  groupListContent: {
    paddingVertical: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingBottom: 8,
    letterSpacing: 0.5,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    gap: 12,
  },
  groupIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  groupMeta: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  deleteGroupBtn: {
    padding: 6,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#C7C7CC',
  },
  bottomBtns: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexDirection: 'row',
  },
  addGroupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1A237E',
    paddingVertical: 12,
    borderRadius: 12,
  },
  addGroupText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  templateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1A237E',
  },
  templateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A237E',
  },
});
