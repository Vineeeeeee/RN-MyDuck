import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Animatable from 'react-native-animatable';

import { HomeIcon, SettingsIcon, MoneyIcon, NoteIcon } from './src/icons';
import { HomeScreen, SettingsScreen, MoneyScreen, NoteScreen } from './src/screen';
import LoginScreen from './src/screen/LoginScreen';
import RegisterScreen from './src/screen/RegisterScreen';
import { AuthProvider, useAuth  } from './src/context/AuthContext';  // Import AuthContext
import { CurrencyProvider, useCurrency  } from './src/context/CurrencyContext'; 

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Thiết lập allowFontScaling cho toàn bộ ứng dụng
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

const TabButton = ({ item, onPress, accessibilityState }) => {
  const focused = accessibilityState.selected;
  const viewRef = useRef(null);

  useEffect(() => {
    if (focused) {
      viewRef.current.animate({ 0.4: { scale: 1 }, 1: { scale: 1.2 } });
    }
  }, [focused]);

  return (
    <Animatable.View ref={viewRef} style={[styles.container]} duration={200}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={1}
        style={[styles.touchable, focused ? styles.touchableFocused : styles.touchableNotFocused]}
      >
        <Image source={item.icon} style={[styles.icon, focused && styles.iconFocused]} />
        {focused && <Text style={styles.label}>{item.label}</Text>}
      </TouchableOpacity>
    </Animatable.View>
  );
};

const tabBarItems = [
  { name: 'Home', icon: HomeIcon, label: 'Home' },
  { name: 'Profile', icon: SettingsIcon, label: 'Profile' },
  { name: 'Money', icon: MoneyIcon, label: 'Money' },
  { name: 'Note', icon: NoteIcon, label: 'Note' },
];

const BottomTabNavigator = () => (
  <Tab.Navigator
    initialRouteName="Home"
    screenOptions={({ route }) => {
      const { icon, label } = tabBarItems.find(item => item.name === route.name) || {};
      return {
        tabBarButton: (props) => <TabButton {...props} item={{ icon, label }} />,
        tabBarActiveTintColor: '#e91e63',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: 80,
          position: 'absolute',
          margin: 16,
          borderRadius: 22,
          paddingTop: 15,
          justifyContent: 'center',
          alignItems: 'center',
        },
      };
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Note" component={NoteScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Money" component={MoneyScreen} options={{ headerShown: false }} />
    <Tab.Screen name="Profile" component={SettingsScreen} options={{ headerShown: false }} />
  </Tab.Navigator>
);

const MainNavigator = () => {
  const { isLoggedIn } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isLoggedIn ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <Stack.Screen name="Main" component={BottomTabNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <NavigationContainer>
          <MainNavigator />
       </NavigationContainer>
      </CurrencyProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  touchable: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    width: '100%',
  },
  touchableFocused: {
    backgroundColor: '#E4FDA5',
    borderRadius: 15,
    marginBottom: 10,
    width: "80%",
    height: 50,
    alignSelf: 'center',
    justifyContent: 'center',
    borderWidth: 0.8,
  },
  touchableNotFocused: {
    backgroundColor: 'transparent',
    borderRadius: 15,
    width: '80%',
    height: 50,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  iconFocused: {
    tintColor: '#000000',
  },
  label: {
    marginTop: 5,
    color: '#000',
    fontSize: 12,
  },
});
