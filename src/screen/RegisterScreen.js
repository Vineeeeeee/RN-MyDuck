import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ImageBackground, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Thêm thư viện icon
import duck from '../img/duck.png';
import { supabase } from '../database/supabase';
import { useAuth } from '../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // Hiển thị/ẩn mật khẩu
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false); // Hiển thị/ẩn xác nhận mật khẩu
  const { login } = useAuth();

  const handleRegister = async () => {
    if (username === '' || password === '' || confirmPassword === '') {
      Alert.alert('Error', 'Please enter all information.');
      return;
    }
    const specialCharRegex = /[^a-zA-Z0-9]/;
    if (username.length < 6 || password.length < 6 || specialCharRegex.test(username) || specialCharRegex.test(password)) {
      Alert.alert('Lỗi', 'Username and password must have at least 6 characters and no special characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Confirm passwords do not match.');
      return;
    }

    try {
      const { data: existingUsers, error } = await supabase
        .from('account')
        .select()
        .eq('AccUsername', username);

      if (error) throw error;

      if (existingUsers && existingUsers.length > 0) {
        Alert.alert('Error', 'User already exists, try another username.');
      } else {
        const { error: insertError } = await supabase
          .from('account')
          .insert([{ AccUsername: username, AccPassword: password }]);

        if (insertError) throw insertError;

        await login(username, password);
      }
    } catch (error) {
      console.error('Error:', error.message);
      Alert.alert('Error', 'Unexpected error.');
    }
  };

  return (
    <ImageBackground source={duck} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>Register for MyDuck!</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.inputPassword}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Icon
              name={isPasswordVisible ? 'eye' : 'eye-off'}
              size={24}
              color="gray"
            />
          </TouchableOpacity>
        </View>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.inputPassword}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!isConfirmPasswordVisible}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
          >
            <Icon
              name={isConfirmPasswordVisible ? 'eye' : 'eye-off'}
              size={24}
              color="gray"
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleRegister} style={styles.btn}>
          <Text style={styles.registerText}>Register</Text>
        </TouchableOpacity>

        <Pressable onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>Already have an account? Login now</Text>
        </Pressable>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 234, 218, 0.9)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(254, 217, 122, 0.7)',
    height: 50,
    width: 300,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    width: 300,
    marginBottom: 15,
  },
  inputPassword: {
    backgroundColor: 'rgba(254, 217, 122, 0.7)',
    height: 50,
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  iconContainer: {
    position: 'absolute',
    right: 10,
  },
  btn: {
    width: 300,
    height: 50,
    backgroundColor: '#ffdf65',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginTop: 15,
  },
  registerText: {
    color: '#004378',
    fontSize: 19,
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    color: 'blue',
    fontSize: 15,
  },
});

export default RegisterScreen;
