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
import Icon from 'react-native-vector-icons/Ionicons';

const DebtorCard = ({debtor, onDelete, onAddMovement, onViewHistory, movements}) => {
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
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que deseas eliminar a ${debtor.name}? Esta acción no se puede deshacer.`,
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
    return date.toLocaleDateString('es-ES', {
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
        </View>
        <View style={styles.headerRight}>
          <Text
            style={[
              styles.balance,
              isPositive ? styles.positiveBalance : styles.negativeBalance,
            ]}>
            ${Math.abs(balance).toFixed(2)}
          </Text>
          <Text style={styles.balanceLabel}>
            {isPositive ? 'Me debe' : 'Le debo'}
          </Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton} onPress={openWhatsApp}>
          <Icon name="logo-whatsapp" size={20} color="#25D366" />
          <Text style={styles.actionText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onAddMovement(debtor)}>
          <Icon name="add-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Movimiento</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setExpanded(!expanded)}>
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#666"
          />
          <Text style={styles.actionText}>Historial</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
          <Icon name="trash-outline" size={20} color="#FF3B30" />
          <Text style={[styles.actionText, {color: '#FF3B30'}]}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Historial de Movimientos</Text>
          {movements && movements.length > 0 ? (
            movements.map((movement, index) => (
              <View key={index} style={styles.movementItem}>
                <View style={styles.movementHeader}>
                  <Text style={styles.movementType}>{movement.type}</Text>
                  <Text style={styles.movementAmount}>
                    ${parseFloat(movement.amount).toFixed(2)}
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
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: '#8E8E93',
  },
  balance: {
    fontSize: 24,
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
    fontSize: 12,
    color: '#8E8E93',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
  },
  actionButton: {
    alignItems: 'center',
    padding: 4,
  },
  actionText: {
    fontSize: 11,
    color: '#007AFF',
    marginTop: 4,
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
