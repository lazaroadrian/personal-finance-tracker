import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DebtorCard = ({debtor, onDelete, onAddMovement, onEdit, movements}) => {
  const [expanded, setExpanded] = useState(false);
  const balance = parseFloat(debtor.balance) || 0;
  const isPositive = balance >= 0;

  const openWhatsApp = () => {
    const phoneNumber = debtor.phone.replace(/[^0-9]/g, '');
    const message = debtor.whatsapp_message
      .replace('{name}', debtor.name)
      .replace('{balance}', Math.abs(balance).toFixed(2));
    
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'WhatsApp no está instalado en este dispositivo');
        }
      })
      .catch(err => console.error('Error opening WhatsApp:', err));
  };

  const handleDelete = () => {
    const movementCount = movements ? movements.length : 0;
    const movementWarning = movementCount > 0
      ? `\n\nSe eliminarán también ${movementCount} movimiento${movementCount > 1 ? 's' : ''} asociado${movementCount > 1 ? 's' : ''}.`
      : '';

    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que deseas eliminar a ${debtor.name}?${movementWarning}\n\nEsta acción no se puede deshacer.`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onDelete(debtor.id),
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      timeZone: 'America/Havana',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{debtor.name}</Text>
          <Text style={styles.phone}>{debtor.phone}</Text>
          {debtor.created_at && (
            <Text style={styles.createdDate}>
              Desde: {formatDate(debtor.created_at)}
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <Text
            style={[
              styles.balance,
              isPositive ? styles.positiveBalance : styles.negativeBalance,
            ]}>
            {isPositive ? '' : '-'}${Math.abs(balance).toFixed(2)}
          </Text>
          <Text style={styles.balanceLabel}>
            {isPositive ? 'Me debe' : 'Le debo'}
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton} onPress={openWhatsApp}>
          <View style={[styles.actionIconCircle, {backgroundColor: '#E8F9EE'}]}>
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
          </View>
          <Text style={styles.actionText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onAddMovement(debtor)}>
          <View style={[styles.actionIconCircle, {backgroundColor: '#E3F2FD'}]}>
            <Ionicons name="add-circle-outline" size={18} color="#007AFF" />
          </View>
          <Text style={styles.actionText}>Mover</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setExpanded(!expanded)}>
          <View style={[styles.actionIconCircle, {backgroundColor: '#F2F2F7'}]}>
            <Ionicons
              name={expanded ? 'chevron-up' : 'time-outline'}
              size={18}
              color="#666"
            />
          </View>
          <Text style={styles.actionText}>Historial</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(debtor)}>
          <View style={[styles.actionIconCircle, {backgroundColor: '#FFF3E0'}]}>
            <Ionicons name="create-outline" size={18} color="#FF9500" />
          </View>
          <Text style={[styles.actionText, {color: '#FF9500'}]}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
          <View style={[styles.actionIconCircle, {backgroundColor: '#FFEBEE'}]}>
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          </View>
          <Text style={[styles.actionText, {color: '#FF3B30'}]}>Borrar</Text>
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Historial de Movimientos</Text>
          {movements && movements.length > 0 ? (
            movements.map((movement, index) => (
              <View key={index} style={styles.movementItem}>
                <View style={styles.movementHeader}>
                  <Text style={[
                    styles.movementType,
                    (movement.type === 'Me prestó' || movement.type === 'Le pagué')
                      ? {color: '#FF3B30'}
                      : {color: '#34C759'}
                  ]}>{movement.type}</Text>
                  <Text style={[
                    styles.movementAmount,
                    (movement.type === 'Me prestó' || movement.type === 'Le pagué')
                      ? {color: '#FF3B30'}
                      : {color: '#34C759'}
                  ]}>
                    {(movement.type === 'Me prestó' || movement.type === 'Le pagué') ? '-' : '+'}${parseFloat(movement.amount).toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.movementDate}>
                  {formatDate(movement.created_at)}
                </Text>
                {movement.description ? (
                  <Text style={styles.movementDescription}>
                    {movement.description}
                  </Text>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.noHistory}>No hay movimientos registrados</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  phone: {
    fontSize: 13,
    color: '#8E8E93',
  },
  createdDate: {
    fontSize: 10,
    color: '#AEAEB2',
    marginTop: 2,
  },
  balance: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  positiveBalance: {
    color: '#34C759',
  },
  negativeBalance: {
    color: '#FF3B30',
  },
  balanceLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  actionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 10,
    color: '#007AFF',
    marginTop: 3,
    textAlign: 'center',
  },
  historySection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  movementItem: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  movementType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  movementAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  movementDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  movementDescription: {
    fontSize: 13,
    color: '#3A3A3C',
    fontStyle: 'italic',
  },
  noHistory: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
});

export default DebtorCard;
