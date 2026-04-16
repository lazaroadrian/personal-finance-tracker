import React, {useState, useMemo} from 'react';
import {View, Text, StyleSheet, SectionList, TouchableOpacity} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const StatsChart = ({debtors, movements, onGoBack}) => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const debtorMap = useMemo(() => {
    const map = {};
    (debtors || []).forEach(d => { map[d.id] = d; });
    return map;
  }, [debtors]);

  // Flatten all movements, filter by month, group by day
  const { sections, monthIncome, monthExpense } = useMemo(() => {
    const allMovements = [];
    Object.entries(movements || {}).forEach(([debtorId, list]) => {
      (list || []).forEach(m => {
        allMovements.push({ ...m, debtor_id: parseInt(debtorId, 10) });
      });
    });

    // Filter by selected month
    const filtered = allMovements.filter(m => {
      const d = new Date(m.created_at);
      return d.getMonth() === month && d.getFullYear() === year;
    });

    // Sort newest first
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Group by day
    const dayMap = {};
    let income = 0;
    let expense = 0;

    filtered.forEach(m => {
      const d = new Date(m.created_at);
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!dayMap[dayKey]) dayMap[dayKey] = { date: d, items: [] };
      dayMap[dayKey].items.push(m);

      const amt = parseFloat(m.amount);
      if (m.type === 'Me pagó' || m.type === 'Le pagué') {
        income += amt;
      } else {
        expense += amt;
      }
    });

    const secs = Object.keys(dayMap)
      .sort((a, b) => b.localeCompare(a))
      .map(key => {
        const { date, items } = dayMap[key];
        const dayTotal = items.reduce((sum, m) => {
          const amt = parseFloat(m.amount);
          if (m.type === 'Me pagó' || m.type === 'Me prestó') return sum - amt;
          return sum + amt;
        }, 0);
        let dayCash = 0;
        let dayTransfer = 0;
        items.forEach(m => {
          const amt = parseFloat(m.amount);
          const isTransfer = m.method === 'Transferencia';
          if (m.type === 'Me pagó' || m.type === 'Me prestó') {
            if (isTransfer) dayTransfer -= amt; else dayCash -= amt;
          } else {
            if (isTransfer) dayTransfer += amt; else dayCash += amt;
          }
        });
        return {
          title: formatDayHeader(date),
          dayTotal,
          dayCash,
          dayTransfer,
          data: items,
        };
      });

    return { sections: secs, monthIncome: income, monthExpense: expense };
  }, [movements, month, year, debtorMap]);

  function formatDayHeader(date) {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return `${days[date.getDay()]} ${date.getDate()}`;
  }

  function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-ES', {
      timeZone: 'America/Havana',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();
    if (isCurrentMonth) return;
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  const renderMovement = ({ item }) => {
    const debtor = debtorMap[item.debtor_id];
    const name = debtor ? debtor.name : 'Desconocido';
    const isNegative = item.type === 'Me pagó' || item.type === 'Me prestó';
    const color = isNegative ? '#FF3B30' : '#34C759';
    const sign = isNegative ? '-' : '+';
    const isTransfer = item.method === 'Transferencia';

    return (
      <View style={styles.movementRow}>
        <View style={[styles.movementIcon, { backgroundColor: isNegative ? '#FFEBEE' : '#E8F5E9' }]}>
          <Ionicons
            name={isNegative ? 'arrow-down' : 'arrow-up'}
            size={16}
            color={color}
          />
        </View>
        <View style={styles.movementInfo}>
          <Text style={styles.movementName} numberOfLines={1}>{name}</Text>
          <View style={styles.movementMeta}>
            <Text style={styles.movementType}>{item.type}</Text>
            <View style={[styles.methodDot, { backgroundColor: isTransfer ? '#5856D6' : '#FF9500' }]} />
            <Text style={[styles.methodText, { color: isTransfer ? '#5856D6' : '#FF9500' }]}>
              {isTransfer ? 'Transf.' : 'Efect.'}
            </Text>
            <Text style={styles.movementTime}>{formatTime(item.created_at)}</Text>
          </View>
          {item.description ? (
            <Text style={styles.movementDesc} numberOfLines={1}>{item.description}</Text>
          ) : null}
        </View>
        <Text style={[styles.movementAmount, { color }]}>
          {sign}${parseFloat(item.amount).toFixed(2)}
        </Text>
      </View>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.dayHeader}>
      <Text style={styles.dayTitle}>{section.title}</Text>
      <View style={styles.dayMethodTotals}>
        {section.dayCash !== 0 && (
          <View style={styles.dayMethodBadge}>
            <View style={[styles.dayMethodDot, { backgroundColor: '#FF9500' }]} />
            <Text style={[styles.dayMethodValue, { color: section.dayCash >= 0 ? '#34C759' : '#FF3B30' }]}>
              {section.dayCash >= 0 ? '+' : '-'}${Math.abs(section.dayCash).toFixed(2)}
            </Text>
          </View>
        )}
        {section.dayTransfer !== 0 && (
          <View style={styles.dayMethodBadge}>
            <View style={[styles.dayMethodDot, { backgroundColor: '#5856D6' }]} />
            <Text style={[styles.dayMethodValue, { color: section.dayTransfer >= 0 ? '#34C759' : '#FF3B30' }]}>
              {section.dayTransfer >= 0 ? '+' : '-'}${Math.abs(section.dayTransfer).toFixed(2)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Back button */}
      {onGoBack && (
        <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
          <Ionicons name="arrow-back" size={20} color="#007AFF" />
          <Text style={styles.backButtonText}>Volver a la lista</Text>
        </TouchableOpacity>
      )}

      {/* Month navigator */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity
          onPress={nextMonth}
          style={[styles.monthArrow, isCurrentMonth && { opacity: 0.3 }]}
          disabled={isCurrentMonth}
        >
          <Ionicons name="chevron-forward" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Month summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Cobros/Pagos</Text>
          <Text style={[styles.summaryValue, { color: '#34C759' }]}>
            ${monthIncome.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Préstamos</Text>
          <Text style={[styles.summaryValue, { color: '#FF3B30' }]}>
            ${monthExpense.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Movimientos</Text>
          <Text style={styles.summaryValue}>
            {sections.reduce((s, sec) => s + sec.data.length, 0)}
          </Text>
        </View>
      </View>

      {/* Daily grouped list */}
      <SectionList
        sections={sections}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        renderItem={renderMovement}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={50} color="#C7C7CC" />
            <Text style={styles.emptyText}>Sin movimientos en {MONTHS[month]}</Text>
          </View>
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
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
    paddingVertical: 10,
  },
  backButtonText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '600',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 16,
  },
  monthArrow: {
    padding: 6,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    minWidth: 160,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 10,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  listContent: {
    paddingBottom: 30,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  dayMethodTotals: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayMethodDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dayMethodValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  movementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  movementIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  movementInfo: {
    flex: 1,
  },
  movementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  movementMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  movementType: {
    fontSize: 11,
    color: '#8E8E93',
  },
  methodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  methodText: {
    fontSize: 10,
    fontWeight: '600',
  },
  movementTime: {
    fontSize: 10,
    color: '#AEAEB2',
  },
  movementDesc: {
    fontSize: 11,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 1,
  },
  movementAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default StatsChart;
