import React from 'react';
import {View, TextInput, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const SearchBar = ({searchQuery, onSearchChange, onClear}) => {
  return (
    <View style={styles.container}>
      <Icon name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
      <TextInput
        style={styles.input}
        placeholder="Buscar por nombre o teléfono..."
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholderTextColor="#8E8E93"
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <Icon name="close-circle" size={20} color="#8E8E93" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  clearButton: {
    padding: 4,
  },
});

export default SearchBar;
