import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../database/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const parsedUser = JSON.parse(user);
        setIsLoggedIn(parsedUser.UserLoggedIn);
      }
    };
    checkLoginStatus();
  }, []);

  const login = async (username, password) => {
    try {
      const { data, error } = await supabase
        .from('account')
        .select('AccID')
        .eq('AccUsername', username)
        .eq('AccPassword', password)
        .single();
  
      if (error || !data) {
        //console.error('Login errooooooooooor:', error);
        return false;
      }
  
      const { AccID } = data;
      const user = {
        UserLoggedIn: true,
        Username: username,
        UserPassword: password,
        AccID, // Save AccID to AsyncStorage
      };
      console.log("User vua login la:")
      console.log(user)
      setIsLoggedIn(true);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      return true;
    } catch (e) {
      console.error('Error during login:', e);
      return false;
    }
  };
  

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
