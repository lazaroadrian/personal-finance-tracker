import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FilterBar = ({selectedFilter, onFilterChange, selectedSort, onSortChange}) => {
  const filters = [
    {key: 'all', label: 'Todos', icon: 'list'},
    {key: 'owed_to_me', label: 'Me deben', icon: 'arrow-down-circle', color: '#34C759'},
    {key: 'i_owe', label: 'Les debo', icon: 'arrow-up-circle', color: '#FF3B30'},
  ];

  const sortOptions = [
    {key: 'recent', label: 'Recientes', icon: 'time'},
    {key: 'amount_desc', label: 'Mayor deuda', icon: 'trending-up'},
    {key: 'amount_asc', label: 'Menor deuda', icon: 'trending-down'},
    {key: 'name', label: 'A-Z', icon: 'text'},
  ];

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Filtrar</Text>
        <View style={styles.buttonsRow}>
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedFilter === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => onFilterChange(filter.key)}>
              <Ionicons
                name={filter.icon}
                size={16}
                color={
                  selectedFilter === filter.key
                    ? filter.color || '#007AFF'
                    : '#8E8E93'
                }
              />
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter.key && {
                    color: filter.color || '#007AFF',
                    fontWeight: '600',
                  },
                ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Ordenamiento */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ordenar</Text>
        <View style={styles.buttonsRow}>
          {sortOptions.map(sort => (
            <TouchableOpacity
              key={sort.key}
              style={[
                styles.sortButton,
                selectedSort === sort.key && styles.sortButtonActive,
              ]}
              onPress={() => onSortChange(sort.key)}>
              <Ionicons
                name={sort.icon}
                size={14}
                color={selectedSort === sort.key ? '#007AFF' : '#8E8E93'}
              />
              <Text
                style={[
                  styles.sortText,
                  selectedSort === sort.key && {
                    color: '#007AFF',
                    fontWeight: '600',
                  },
                ]}>
                {sort.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  buttonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#E3F2FD',
  },
  filterText: {
    fontSize: 13,
    color: '#1C1C1E',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  sortButtonActive: {
    backgroundColor: '#E3F2FD',
  },
  sortText: {
    fontSize: 12,
    color: '#1C1C1E',
  },
});

export default FilterBar;
