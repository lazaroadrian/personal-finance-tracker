import React from 'react';
import {View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity} from 'react-native';
import {BarChart, PieChart} from 'react-native-chart-kit';
import {Ionicons} from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width - 64;

const StatsChart = ({debtors, movements, onGoBack}) => {
  if (!debtors || debtors.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Agrega deudores para ver las estadísticas
        </Text>
      </View>
    );
  }

  // Datos para gráfico de barras: Top 5 deudores por monto
  const topDebtors = [...debtors]
    .sort((a, b) => Math.abs(parseFloat(b.balance)) - Math.abs(parseFloat(a.balance)))
    .slice(0, 5);

  const barData = {
    labels: topDebtors.map(d => d.name.length > 8 ? d.name.slice(0, 8) + '…' : d.name),
    datasets: [
      {
        data: topDebtors.map(d => Math.abs(parseFloat(d.balance)) || 0.01),
      },
    ],
  };

  // Datos para gráfico circular: distribución me deben vs les debo
  const totalOwedToMe = debtors
    .filter(d => parseFloat(d.balance) > 0)
    .reduce((sum, d) => sum + parseFloat(d.balance), 0);

  const totalIOwe = debtors
    .filter(d => parseFloat(d.balance) < 0)
    .reduce((sum, d) => sum + Math.abs(parseFloat(d.balance)), 0);

  const pieData = [];
  if (totalOwedToMe > 0) {
    pieData.push({
      name: `Me deben: $${totalOwedToMe.toFixed(2)}`,
      amount: totalOwedToMe,
      color: '#34C759',
      legendFontColor: '#333',
      legendFontSize: 11,
    });
  }
  if (totalIOwe > 0) {
    pieData.push({
      name: `Les debo: -$${totalIOwe.toFixed(2)}`,
      amount: totalIOwe,
      color: '#FF3B30',
      legendFontColor: '#333',
      legendFontSize: 11,
    });
  }

  // Resumen de movimientos del mes actual
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  let monthlyIncome = 0;  // pagos recibidos
  let monthlyExpense = 0; // pagos realizados
  let monthlyMovements = 0;

  Object.values(movements).forEach(debtorMovements => {
    debtorMovements.forEach(m => {
      const mDate = new Date(m.created_at);
      if (mDate.getMonth() === currentMonth && mDate.getFullYear() === currentYear) {
        monthlyMovements++;
        const amt = parseFloat(m.amount);
        if (m.type === 'Me pagó' || m.type === 'Le pagué') {
          monthlyIncome += amt;
        } else {
          monthlyExpense += amt;
        }
      }
    });
  });

  const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(60, 60, 67, ${opacity})`,
    barPercentage: 0.6,
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#E5E5EA',
    },
  };

  return (
    <ScrollView style={styles.container}>
      {/* Botón de regresar */}
      {onGoBack && (
        <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
          <Ionicons name="arrow-back" size={20} color="#007AFF" />
          <Text style={styles.backButtonText}>Volver a la lista</Text>
        </TouchableOpacity>
      )}

      {/* Resumen del mes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resumen del mes</Text>
        <View style={styles.monthlyStats}>
          <View style={styles.monthlyStat}>
            <Text style={styles.monthlyLabel}>Cobros/Pagos</Text>
            <Text style={[styles.monthlyValue, {color: '#34C759'}]}>
              ${monthlyIncome.toFixed(2)}
            </Text>
          </View>
          <View style={styles.monthlyStat}>
            <Text style={styles.monthlyLabel}>Préstamos</Text>
            <Text style={[styles.monthlyValue, {color: '#FF3B30'}]}>
              ${monthlyExpense.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Gráfico circular */}
      {pieData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribución</Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={pieData}
              width={screenWidth}
              height={180}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="0"
              hasLegend={false}
            />
          </View>
          <View style={styles.legendContainer}>
            {pieData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: item.color}]} />
                <Text style={styles.legendText} numberOfLines={1}>{item.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Gráfico de barras */}
      {topDebtors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top deudores por monto</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={barData}
              width={screenWidth}
              height={220}
              chartConfig={chartConfig}
              fromZero
              showValuesOnTopOfBars
              withInnerLines={false}
              style={styles.chart}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  legendContainer: {
    marginTop: 8,
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 10,
  },
  chartContainer: {
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 8,
  },
  chart: {
    borderRadius: 8,
  },
  monthlyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthlyStat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  monthlyLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  monthlyValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
});

export default StatsChart;
