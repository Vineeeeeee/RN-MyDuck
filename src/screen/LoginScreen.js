import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Pressable, ImageBackground } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Thêm thư viện icon
import duck from '../img/duck.png';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // State để kiểm soát hiển thị mật khẩu
  const { login } = useAuth();

  const handleLogin = async () => {
    if (username === '' || password === '') {
      Alert.alert('Error', 'Please enter all information.');
      return;
    }

    const success = await login(username, password);

    if (!success) {
      Alert.alert('Error', 'Incorrect username or password.');
    } else {
      navigation.navigate('Home');
    }
  };

  return (
    <ImageBackground source={duck} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>Login to MyDuck!</Text>
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
        <TouchableOpacity onPress={handleLogin} style={styles.btn}>
          <Text style={styles.login}>Login</Text>
        </TouchableOpacity>

        <Pressable onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
          <Text style={styles.register}>Don't have an account? Register now</Text>
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
  login: {
    color: '#004378',
    fontSize: 19,
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  register: {
    color: 'blue',
    fontSize: 15,
  },
});

export default LoginScreen;
