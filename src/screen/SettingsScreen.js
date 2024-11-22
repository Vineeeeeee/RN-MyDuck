const ip = "10.13.128.149";
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { supabase } from "../database/supabase";
import axios from "axios";
import React, { useState, useEffect ,useCallback } from 'react';
import { Text, View, TextInput, TouchableOpacity, FlatList, Modal, Pressable, Button, Keyboard, StyleSheet, Switch,Image,Alert,StatusBar } from 'react-native';
import { FontAwesome, SimpleLineIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from "@react-navigation/native";

import { useCurrency } from "../context/CurrencyContext";
import { Picker } from "@react-native-picker/picker";



Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

const SettingsScreen = ({navigation, setIsLoggedIn}) => {
  const { logout } = useAuth();
  const [user, setUser] = useState();
  const [AccID, setAccID] = useState();
  const [categoryTotals, setCategoryTotals] = useState([]);
  const [userLoading, setUserLoading] = useState(true); // Add loading state for user

  const [modalVisible, setModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [deleteModalVisible, setDeleteModalVisible] = useState(false); // For confirmation modal
  const [categoryToDelete, setCategoryToDelete] = useState(null); // Stores the selected category for deletion
  
  const { currency, exchangeRate, updateCurrency } = useCurrency();

  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);
  const [isUSD, setIsUSD] = useState(currency === "USD"); // Initial state based on current currency


  const getUserData = useCallback(async () => {
    try {
      setUserLoading(true); // Start loading
      const userJson = await AsyncStorage.getItem("user");
      const user = JSON.parse(userJson);

      if (user) {
        setUser(user);
        setAccID(user.AccID);
        console.debug("User data loaded:", user);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setUserLoading(false); // Stop loading
    }
  }, []);

  useEffect(() => {


    const initializeUserData = async () => {
      await getUserData(); // Chỉ gọi khi màn hình được khởi tạo
    };
    initializeUserData();
  }, []); // Chỉ chạy một lần khi component mount
  
  useEffect(() => {
    if (AccID) {
      fetchCategoryTotals(); // Gọi lại khi AccID, currency hoặc exchangeRate thay đổi
    }
  }, [currency, exchangeRate, AccID]);

  useFocusEffect(
    useCallback(() => {
      if (AccID) {
        fetchCategoryTotals();
      }
    }, [AccID])
  );
 

  const fetchCategoryTotals = async () => {
    try {
      // Fetch all categories
      const { data: categories, error: categoryError } = await supabase
        .from("category")
        .select("*")
        .eq("AccID", AccID);
  
      if (categoryError) {
        console.error("Error fetching categories:", categoryError);
        return;
      }
  
      // Fetch all transactions and group by CID
      const { data: transactions, error: transactionError } = await supabase
        .from("transaction")
        .select("CID, TAmount")
        .eq("AccID", AccID);
  
      if (transactionError) {
        console.error("Error fetching transactions:", transactionError);
        return;
      }
  
      // Create a map for category totals
      const categoryMap = {};
      transactions.forEach(({ CID, TAmount }) => {
        if (categoryMap[CID]) {
          categoryMap[CID] += TAmount;
        } else {
          categoryMap[CID] = TAmount;
        }
      });
  
      // Combine categories with transaction totals
      const formattedData = categories.map((category) => ({
        CID: category.CID,
        categoryName: category.CName,
        totalAmount: categoryMap[category.CID] || 0, // Default to 0 if no transactions
        formattedTotal: formatCurrency(categoryMap[category.CID] || 0), // Format total amount
      }));
  
      // Sort the data by total amount (descending)
      const sortedData = formattedData.sort((a, b) => b.totalAmount - a.totalAmount);
  
      setCategoryTotals(sortedData);
    } catch (error) {
      console.error("Error fetching category totals:", error);
      Alert.alert("Error", "Failed to fetch category totals. Please try again.");
    }
  };
  const updateAccountInformation = async () => {
    if (!newUsername || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill out all fields");
      return;
    }
  
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
  
    try {

      const { error } = await supabase
        .from("account")
        .update({
          AccUsername: newUsername,
          AccPassword: newPassword,
        })
        .eq("AccID", AccID);
  
      if (error) {
        console.error("Error updating account information:", error);
        Alert.alert("Error", "Failed to update account information");
        return;
      }
  
      const updatedUser = {
        ...user,
        Username: newUsername,
        UserPassword: newPassword,
      };
  
      setUser(updatedUser);
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      setModalVisible(false);
      Alert.alert("Success", "Account information updated successfully");
    } catch (error) {
      console.error("Unexpected Error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    }
  };
  

  
  const deleteCategory = async () => {
    try {
      const { error: transactionError } = await supabase
        .from('transaction')
        .delete()
        .eq('CID', categoryToDelete?.CID);
  
      if (transactionError) {
        console.error("Error deleting transactions for category:", transactionError);
        Alert.alert("Error", "Failed to delete transactions for this category.");
        return;
      }
  
      const { error: categoryError } = await supabase
        .from('category')
        .delete()
        .eq('CID', categoryToDelete?.CID);
  
      if (categoryError) {
        console.error("Error deleting category:", categoryError);
        Alert.alert("Error", "Failed to delete the category.");
        return;
      }
  
      setDeleteModalVisible(false); // Close confirmation modal
      fetchCategoryTotals(); // Refresh data
      Alert.alert("Success", "Category deleted successfully.");
    } catch (err) {
      console.error("Unexpected Error:", err);
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  const handleLogout = () => {
    logout(); 
    //navigation.replace("Login");  // Điều hướng về màn hình đăng nhập
    Alert.alert("Logged out", "success")
  };

  const handleDeletePress = (category) => {
    setCategoryToDelete(category); // Set selected category for deletion
    setDeleteModalVisible(true); // Show confirmation modal
  };

  const handleCurrencyChange = (newCurrency) => {
    const exchangeRate = newCurrency === "USD" ? 25000 : 1; // Cập nhật tỷ giá phù hợp
    setSelectedCurrency(newCurrency);
    updateCurrency(newCurrency, exchangeRate); // Cập nhật và lưu vào AsyncStorage
  };
  const confirmLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: handleLogout },
      ]
    );
  };
  const handleCurrencySwitch = () => {
    const newCurrency = isUSD ? "VND" : "USD";
    setIsUSD(!isUSD);
    updateCurrency(newCurrency); // Update currency in context and storage
  };

  const formatCurrency = (amount) => {
    if (currency === "VND") {
      return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
    } else if (currency === "USD") {
      return (amount / exchangeRate).toLocaleString("en-US", { style: "currency", currency: "USD" });
    }
    return amount;
  };

  const renderItem = ({ item }) => (
    <View style={styles.categoryItem}>
      <Text style={styles.categoryName}>{item.categoryName}</Text>
      <View style={{ flexDirection: "row" }}>
        <Text style={styles.categoryTotal}>{formatCurrency(item.totalAmount)}</Text>
        <TouchableOpacity style={{ marginLeft: 10 }} onPress={() => handleDeletePress(item)}>
          <FontAwesome name="trash" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
    <StatusBar backgroundColor = {'#EFEFEF'}/>

      <View style={styles.top}>

              <Text style={styles.headerText}>Duckofile</Text>

              <TouchableOpacity style={styles.PlusIcon} onPress={confirmLogout}>
                <Icon name="settings" size={24} color="red" />
                <Text style = {{fontSize:10}}>Logout</Text>
              </TouchableOpacity>

      </View>



      <View style = {styles.middle}>
            <View style = {styles.information}> 
                  <Image 
                  style={styles.avatar}
                  source={require('../img/avt3.png')}/>
                  <View style = {{flexDirection:'column',paddingLeft:20}}>
                  <Text style={{ fontSize: 20, paddingBottom: 5, fontWeight: 'bold' }}>
                  {userLoading ? "Loading..." : user?.Username || "Unknown"} </Text>               
                        <Pressable onPress={() => setModalVisible(true)}>
                            <Text style = {{fontSize:15,color:'blue'}}> Change information </Text>
                        </Pressable>
                  </View>

            </View>
            <View
  style={{
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10, 
    paddingHorizontal: 15, 
    backgroundColor: "#f9f9f9", 
    borderRadius: 10, 
    paddingVertical: 10, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3, 
  }}
>
  <Text style={{ fontSize: 16, fontWeight: "500", color: "#333" }}>
    {isUSD ? "Current: USD" : "Current: VND"}
  </Text>
  <Switch
    style={{ marginLeft: 10 }}
    trackColor={{ false: "#767577", true: "#81b0ff" }}
    thumbColor={isUSD ? "#f5dd4b" : "#f4f3f4"}
    ios_backgroundColor="#3e3e3e"
    onValueChange={handleCurrencySwitch}
    value={isUSD}
  />
</View>
            <View style ={styles.total}>
            <Text style = {{fontSize:25,fontWeight:'bold',paddingTop:15}}>Category's Total</Text>


            {categoryTotals.length === 0 ? (
            <Text style={{ textAlign: "center", color: "#888",paddingTop:15 }}>
              No categories found.
            </Text>
) : (
  <FlatList
    style={styles.categoryList}
    data={categoryTotals}
    renderItem={renderItem}
    keyExtractor={(item) => item.categoryName}
  />
)}
       </View>
      </View>

        <View style = {styles.hidden}>  
          <Text> sssss </Text>
        </View>


      {/* Modal for Changing Information */}
      <Modal visible={modalVisible} animationType="fade" transparent>
  <Pressable
    style={styles.modalOverlay}
    onPress={() => setModalVisible(false)}
  >
    <View
      style={styles.modalView}
      onStartShouldSetResponder={() => true} 
    >
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20 }}>Change Information</Text>

      <TextInput
        placeholder="New Username"
        value={newUsername}
        onChangeText={setNewUsername}
        style={styles.input}
      />

      <TextInput
        placeholder="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        style={styles.input}
      />

      <TextInput
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.saveButton}
        onPress={() => {
          if (newPassword !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match");
            return;
          }
          updateAccountInformation();
        }}
      >
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  </Pressable>
</Modal>

<Modal visible={deleteModalVisible} animationType="fade" transparent>
  <Pressable
    style={styles.modalOverlay}
    onPress={() => setDeleteModalVisible(false)} // Đóng modal khi nhấn bên ngoài
  >
    <View
      style={styles.modalView}
      onStartShouldSetResponder={() => true} // Ngăn sự kiện nhấn ở đây truyền ra ngoài
    >
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20 }}>Confirm Deletion</Text>
      <Text>
        Are you sure you want to delete{" "}
        <Text style={{ fontWeight: "bold" }}>{categoryToDelete?.categoryName}</Text>?
      </Text>
      <Text>This action cannot be undone.</Text>
      <View style={{ flexDirection: "column", marginTop: 20, alignItems: "center" }}>
        <TouchableOpacity style={styles.saveButton} onPress={deleteCategory}>
          <Text style={styles.saveButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Pressable>
</Modal>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  hidden : {
    justifyContent: "center",
    alignItems: "center",
    flex:0.11,
  },
  top: {
    justifyContent: "space-between",
    flexDirection: "row",
    flex:0.14,  
  },
  headerText: {
    alignSelf: "center",
    paddingTop: 5,
    paddingLeft: 10,
    color: "#000000",
    fontSize: 39,
    fontWeight: "bold",
    backgroundColor: "#fed97a",
    borderRadius: 20,
    width: 200,
    height: 70,
  },
  PlusIcon: {
    backgroundColor: '#FFEBCC',
    height: 50,
    width: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFC300',
    position: 'absolute',
    bottom: 30,
    right: 0,
  },
  middle:{
    flex:0.75,
   // backgroundColor:"#9cff40",
    },
    information:{
      alignItems:"center",
      flexDirection:"row",
      paddingLeft: 10,
      flex:0.2,
      //backgroundColor:"#9cff40",
    },
    total:{
      flex:0.8,
      //backgroundColor:"#9cff40",
    },
    avatar:{
      width: 100,
      height: 100,
      marginVertical: 20,
      borderRadius: 1000,
      borderWidth:1,
      borderColor: 'grey',
      backgroundColor: 'rgba(255, 234, 218, 0.9)',
    },
    categoryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderColor: '#ddd',
    },
    categoryName: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    categoryTotal: {
      fontSize: 18,

    },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalView: {
      width: 300,
      padding: 20,
      backgroundColor: "white",
      borderRadius: 10,
      alignItems: "center",
    },
    input: {
      width: "100%",
      padding: 10,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 10,
      marginBottom: 15,
    },
    saveButton: {
      alignSelf: "center",
      backgroundColor: "#FEDB81",
      marginTop: 16,
      borderRadius: 35,
      width: 120,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
    },
    saveButtonText: {
      color: "black",
      fontWeight: "bold",
      fontSize: 16,
    },
    cancelButton: {
      marginTop: 10,
    },
    cancelButtonText: {
      color: "#f44336",
    },

});

export default SettingsScreen;
