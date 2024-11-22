// src/screen/MoneyScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MoneyScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the Money Screen!</Text>
      <Text style={styles.subtitle}>This is where you can manage your expenses.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFEFEF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
});

export default DataScreen;
