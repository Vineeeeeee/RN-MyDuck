import React, { useState, useEffect, useCallback } from "react";
import { FontAwesome } from '@expo/vector-icons';

import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "../database/supabase"; // Đảm bảo bạn đã cấu hình Supabase
import AsyncStorage from "@react-native-async-storage/async-storage";

import PieChart from "react-native-pie-chart";

import { Dimensions } from "react-native";
import { useFocusEffect, useNavigationState } from "@react-navigation/native";
import { useCurrency } from "../context/CurrencyContext";

// Thiết lập allowFontScaling cho toàn bộ ứng dụng
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;

// hàm lấy 2 số cóp trên mạng : D
function take_decimal_number(num, n) {
  let base = 10 ** n;
  let result = Math.round(num * base) / base;
  return result;
}

const HomeScreen = () => {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState(["Food", "Drink", "Shopping"]);
  const [newCategory, setNewCategory] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [user, setUser] = useState();
  const [AccID, setAccID] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState([]); // Khởi tạo state cho chartData
  const [transactions, setTransactions] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [expandedTransactionId, setExpandedTransactionId] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTransactionId, setEditTransactionId] = useState(null);
  const [updatedAmount, setUpdatedAmount] = useState("");
  const [updatedCategory, setUpdatedCategory] = useState("");
  const { currency, exchangeRate } = useCurrency();

  const openEditModal = (transaction) => {
    setEditTransactionId(transaction.TID);
    setUpdatedAmount(currency == "VND" ? transaction.TAmount.toString() : (transaction.TAmount/exchangeRate).toString());
    setUpdatedCategory(transaction.CID);
    setEditModalVisible(true);
  };
  
  const getUserData = useCallback(async () => { 
    try {
      const userJson = await AsyncStorage.getItem("user");
      const user = JSON.parse(userJson);

      if (user) {
        setUser(user);
        setAccID(user.AccID);
        console.debug("User data loaded:", user);
        return user;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Đã xảy ra lỗi khi tải thông tin người dùng");
    }
  }, []);

  const fetchCategories = useCallback(
    async (user) => {
      // const user = await getUserData();
      console.log("user o fetchcategories la ", user);
      try {
        // Truy vấn danh mục từ Supabase với điều kiện AccID đã được lưu trong state
        const { data, error } = await supabase
          .from("category")
          .select("*")
          .eq("AccID", user.AccID);

        if (error) throw new Error(error.message);

        setCategories(data);
        setSelectedCategory(data[0]?.CID || ""); // Chọn category đầu tiên nếu có
      } catch (error) {
        console.error("Error fetching categories:", error);
        Alert.alert("Error", "Đã xảy ra lỗi khi tải danh mục");
      } finally {
        setIsLoading(false);
      }
    },
    [AccID]
  ); // Thêm AccID vào dependency của fetchCategories

  const fetchExpensesData = async (user) => {
    try {
      if (!user) {
        console.log("User not logged in.");
        return [];
      }
  
      console.log("accID o fetchexpense la " + user.AccID);
  
      const getRandomColor = () =>
        `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
  
      // Danh sách màu cố định
      const predefinedColors = [
        "#FEDB81", // Warm Sand
        "#FDCB6E", // Peach
        "#00CEC9", // Teal
        "#FAB1A0", // Pink Coral
        "#74B9FF", // Sky Blue
        "#55EFC4", // Mint
        "#636E72", // Charcoal Gray
        "#FFEAA7", // Light Yellow
        "#D63031", // Bright Red
        "#0984E3", // Royal Blue
        "#6C5CE7", // Purple
        "#81ECEC", // Soft Cyan
      ];
  
      // Fetch transactions và categories song song
      const [transactionsResponse, categoriesResponse] = await Promise.all([
        supabase.from("transaction").select("CID, TAmount").eq("AccID", user.AccID),
        supabase.from("category").select("CID, CName"),
      ]);
  
      if (transactionsResponse.error) {
        throw new Error(`Error fetching transactions: ${transactionsResponse.error.message}`);
      }
      if (categoriesResponse.error) {
        throw new Error(`Error fetching categories: ${categoriesResponse.error.message}`);
      }
  
      const transactions = transactionsResponse.data;
      const categories = categoriesResponse.data;
  
      const categoryNames = categories.reduce((acc, { CID, CName }) => {
        acc[CID] = CName;
        return acc;
      }, {});
  
      const categoryTotals = transactions.reduce((acc, { CID, TAmount }) => {
        const amount = parseFloat(TAmount);
        if (!isNaN(amount)) {
          acc[CID] = (acc[CID] || 0) + amount;
        }
        return acc;
      }, {});
  
      const totalExpenses = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  
      const chartData = categories
        .map((cat, index) => {
          const amount = categoryTotals[cat.CID];
          if (amount > 0) {
            const percentage = (amount / totalExpenses) * 100;
            return {
              name: categoryNames[cat.CID] || `Category ${cat.CID}`,
              amount: amount,
              percentage: take_decimal_number(percentage, 2),
              color: predefinedColors[index % predefinedColors.length] || getRandomColor(), // Sử dụng màu cố định hoặc ngẫu nhiên
            };
          }
          return null;
        })
        .filter(Boolean); // Loại bỏ các giá trị null
  
      return chartData;
    } catch (error) {
      console.error("Error loading data:", error.message || error);
      return [];
    }
  };
  
  const fetchTransactions = async (user) => {
    console.log("USERRRRRRRRRRR", user);
    const { data, error } = await supabase
      .from("transaction")
      .select("TID, CID, TAmount, TDate, category!inner(CName)") 
      .eq("AccID", user.AccID) 
      .order("TDate", { ascending: true });  

    if (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
    setTransactions(data);
    return data;
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  function arraysAreEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((item, index) => {
      return (
        item.name === arr2[index].name &&
        item.amount === arr2[index].amount &&
        item.percentage === arr2[index].percentage
      );
    });
  }
  

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true); // Bắt đầu trạng thái loading
        const user = await getUserData();
        if (user) {
          await fetchCategories(user);
          const data = await fetchExpensesData(user);
          setChartData(data);
  
          // Ẩn PieChart và hiển thị lại sau 0.5 giây
          setShowChart(false);
          setTimeout(() => {
            setShowChart(true);
          }, 500);
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Error", error.message);
      } finally {
        setIsLoading(false); // Kết thúc trạng thái loading
      }
    };
  
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        // setIsLoading(true);
      //  setShowChart(false); // Ẩn PieChart khi bắt đầu tải dữ liệu
        try {          
          const user = await getUserData();
          if (user) {

          const data = await fetchExpensesData(user);
          await setChartData(data);
            await fetchCategories(user);
  
            const expensedata = await fetchTransactions(user);
            setTransactions(expensedata);

            
          }
          else console.log("user null")
        } catch (error) {
          console.error(error);
          Alert.alert("Error", error.message);
        } finally {

          // setTimeout(() => {
          //   setShowChart(true); // Hiển thị PieChart sau khi dữ liệu được tải xong
          // }, 100); // Trễ 0.5 giây để đảm bảo mượt mà
          // setIsLoading(false);
        }
      };
  
      loadData();
    },[] ) 
  );
  

  // Hàm thêm chi tiêu mới
  const addTransaction = async () => {
    if (!amount || !selectedCategory) {
      Alert.alert("Warning", "Please enter an amount and select a category");
      return;
    }
    if (amount < 1 || isNaN(parseFloat(amount))) {
      Alert.alert("Warning", "Please enter a valid amount");
      return;
    }
  
    try {
      const convertedAmount = currency === "USD" ? parseFloat(amount) * exchangeRate : parseFloat(amount);
  
      const { data, error } = await supabase.from("transaction").insert([
        {
          AccID: user?.AccID,
          CID: selectedCategory,
          TAmount: convertedAmount,
          TDate: new Date().toISOString(),
        },
      ]);
  
      if (error) {
        throw new Error(error.message);
      }
  
      Alert.alert("Success", "Transaction added successfully");
      setAmount("");
      setTransactionModalVisible(false);
  
      const updatedChartData = await fetchExpensesData(user);
      setChartData(updatedChartData);
  
      const updatedtransactiondata = await fetchTransactions(user);
      setTransactions(updatedtransactiondata);
  
    } catch (error) {
      console.error("Error adding expense:", error);
      Alert.alert("Error", "Failed to add expense");
    }
  };
  

  const deleteTransaction = async (TID) => {
   // console.debug(TID)
    try {
      const { error } = await supabase
        .from('transaction')
        .delete()
        .eq('TID', TID);
  
      if (error) {
        console.error('Error deleting transaction:', error.message);
      } else {
        setTransactions((prevTransactions) => prevTransactions.filter(item => item.TID !== TID));
        const updatedChartData = await fetchExpensesData(user);
        setChartData(updatedChartData);
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  };
  // Hàm thêm danh mục mới
  const addNewCategory = async () => {
    if (!newCategory) {
      //Alert.alert('Warning', 'Please enter a category name');
      return;
    }

    if (!user || !user.AccID) {
      Alert.alert("Error", "User not found");
      return;
    }

    try {
      // Kiểm tra xem danh mục với AccID và CName đã tồn tại chưa
      const { data: existingCategory, error: selectError } = await supabase
        .from("category")
        .select("*")
        .eq("AccID", user.AccID)
        .eq("CName", newCategory);

      if (selectError) {
        throw new Error(selectError.message);
      }

      if (existingCategory && existingCategory.length > 0) {
        setSelectedCategory(existingCategory[0].CID);
        setNewCategory("");
        setModalVisible(false);
        return;
      }
      const { data, error } = await supabase
        .from("category")
        .insert([{ CName: newCategory, AccID: user?.AccID }])
        .select();

      if (error) {
        throw new Error(error.message);
      }

      if (!data || data.length === 0) {
        throw new Error("Không có dữ liệu trả về sau khi thêm danh mục");
      }

      //Alert.alert('Success', 'Category added successfully');
      setCategories((prevCategories) => [...prevCategories, data[0]]);
      setNewCategory("");
      setSelectedCategory(data[0].CID); 
      setModalVisible(false);
    } catch (error) {
      console.error("Error adding category:", error);
      Alert.alert("Error", error.message || "Đã xảy ra lỗi khi thêm danh mục");
    }
  };

  const editTransaction = async (transactionId, updatedAmount, updatedCategory) => {
    if (!updatedAmount || !updatedCategory) {
      Alert.alert("Warning", "Vui lòng nhập số tiền và chọn danh mục");
      return;
    }
  
    try {
      const { error } = await supabase
        .from("transaction")
        .update({
          TAmount: parseFloat(updatedAmount*exchangeRate),
          CID: updatedCategory,
        })
        .eq("TID", transactionId); 
  
      if (error) {
        console.error("Error editing transaction:", error.message);
        Alert.alert("Error", "Error editing transaction");
        return;
      }
  
      Alert.alert("Success", "Transaction edited successfully");
      
      const updatedTransactions = await fetchTransactions(user);
      setTransactions(updatedTransactions);
  

      const updatedChartData = await fetchExpensesData(user);
      setChartData(updatedChartData);
    } catch (error) {
      console.error("Error editing transaction:", error.message);
      Alert.alert("Error", "Error editing transaction");
    }
  };
  

  const handleTransactionPress = (TID) => {
    setExpandedTransactionId((prevId) => (prevId === TID ? null : TID));
  };

  const confirmDeleteTransaction = (transactionId) => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTransaction(transactionId),
        },
      ]
    );
  };
  
  const formatCurrency = (amount) => {
    if (currency === "VND") {
      return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
    } else if (currency === "USD") {
      return (amount / exchangeRate).toLocaleString("en-US", { style: "currency", currency: "USD" });
    }
    return amount;
  };




  if (isLoading || chartLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFC300" />
        <Text style = {{fontSize: 20,}} >Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}> 
      <View style={styles.top}>
        <Text style={styles.headerText}>Duckonomy</Text>

        <TouchableOpacity
          style={styles.PlusIcon}
          onPress={
            () => setTransactionModalVisible(true)}
        >
          <Icon name="add" size={24} color="black" />
        </TouchableOpacity>
      </View>
       {/* // đóng view top */}
      

      <Modal
        animationType="fade"
        transparent={true}
        visible={transactionModalVisible}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setTransactionModalVisible(false);
          }}
        >
          <View style={styles.modalView}>
            <Pressable onPress={() => {}} style={styles.modalContent}>
              <Text style={{ fontSize: 18, padding: 20, fontWeight: "bold" }}>
                Add Transaction
              </Text>

              <TextInput
                placeholder="Enter amount"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={{
                  width: "80%",
                  height: 55,
                  borderWidth: 1,
                  borderColor: "#bdc3c7",
                  padding: 10,
                  borderRadius: 10,
                  marginBottom: 20,
                }}
              />
              <View
                style={{
                  borderBottomWidth: 3,
                  borderLeftWidth: 2,
                  borderRightWidth: 1,
                  borderRadius: 5,
                }}
              >
                <Picker
                  selectedValue={selectedCategory}
                  style={{ height: 50, width: 200, backgroundColor: "#eeeeee" }}
                  onValueChange={(itemValue) => {
                    if (itemValue === "addNew") {
                      setModalVisible(true); // Mở modal khi chọn "Add New Category"
                      // setTransactionModalVisible(false);
                    } else {
                      setSelectedCategory(itemValue); // Cập nhật danh mục khi chọn
                    }
                  }}
                >
                  {categories.map((category, index) =>
                    category.CID ? (
                      <Picker.Item
                        key={category.CID.toString()}
                        label={category.CName}
                        value={category.CID}
                      />
                    ) : (
                      <Picker.Item
                        key={index.toString()}
                        label={category.CName}
                        value={category.CID}
                      />
                    )
                  )}
                  <Picker.Item
                    key="addNew"
                    label="Add New Category"
                    value="addNew"
                  />
                </Picker>
              </View>

              <TouchableOpacity
                style={styles.AddButton}
                onPress={addTransaction}
              >
                <Text style={styles.ButtonText}>Save</Text>
              </TouchableOpacity>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/*  modal thêm danh mục */}
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setModalVisible(false);
            setTransactionModalVisible(true);
          }}
        >
          <View style={styles.modalView2}>
            <Pressable onPress={() => {}} style={styles.modalContent2}>
              <Text style={{ fontSize: 18, padding: 20, fontWeight: "bold" }}>
                Add New Category
              </Text>
              <TextInput
                placeholder="Category name"
                value={newCategory}
                onChangeText={setNewCategory}
                style={{
                  width: "80%",
                  borderWidth: 1,
                  borderColor: "#bdc3c7",
                  padding: 10,
                  borderRadius: 10,
                  marginBottom: 10,
                }}
              />
              <TouchableOpacity
                style={styles.AddButton}
                onPress={addNewCategory}
              >
                <Text style={styles.ButtonText}>Save</Text>
              </TouchableOpacity>
              {/* Bỏ nút Cancel */}
            </Pressable>
          </View>
        </Pressable>
      </Modal>

{/* view  của  piechart và scrollview */}
      <View style={{ flexDirection: "row",flex: 0.3 }}>
      {
  showChart && chartData.length > 0 ? (
    <PieChart
      widthAndHeight={210}
      series={chartData.map((item) => item.amount)}
      sliceColor={chartData.map((item) => item.color)}
      coverRadius={0.45}
      coverFill={"#ffeab2"}
    />
  ) : (
    <View style={{ justifyContent: "center", alignItems: "center", flex: 1 }}>
      <Text style={{ color: "#636e72", fontSize: 16 }}></Text>
    </View>
  )
}
      
  {/* hiển thị % danh mục */}
          <ScrollView
            style={{
              flexDirection: "column",
              alignSelf:'center',
              paddingLeft: 10,
              marginVertical: 20,
            }}
          >
            {chartData
              .sort((a, b) => b.percentage - a.percentage) // Sắp xếp theo % từ cao đến thấp
               .map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 5,
                }}
              >
                <View
                  style={{
                    width: 15,
                    height: 15,
                    borderRadius: 7.5,
                    backgroundColor: item.color,
                    marginRight: 10,
                  }}
                />
                <Text style={{ fontSize: 16, fontWeight: "", color: "#000" }}>
                  {item.name}: {item.percentage}%
                </Text>
              </View>
            ))}
          </ScrollView>
      </View>


            {/* view của mục lịch sử */}
      <View style = {{flex:0.45}}>


      {transactions.length === 0 ? (
  <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center' }}>
    <Text style={{ fontSize: 21, color: '#636e72' ,marginTop:37}}>Seem you don't have any transaction.</Text>
    <Text style={{ fontSize: 21, color: '#636e72' }}>Let's start by clicking on "+".</Text>
  </View>
) : (

  <FlatList
  data={[...transactions].reverse()}
  keyExtractor={(item) => item.TID ? item.TID.toString() : String(Math.random())}
  renderItem={({ item }) => (
    <View
      style={{
        flexDirection: "column",
        padding: 10,
        borderBottomWidth: 2,
        borderColor: "#c2c2c2",
      }}
    >
      {/* Nội dung giao dịch */}
      <TouchableOpacity onPress={() => handleTransactionPress(item.TID)}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "column" }}>
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>
            {item.category.CName}
          </Text>
          <Text style={{ fontSize: 13, color: "#888" }}>
            {item.TDate
              ? new Date(item.TDate).toLocaleDateString("vi-VN")
              : "Không có ngày"}{" "}
            -{" "}
            {item.TDate
              ? new Date(item.TDate).toLocaleTimeString("vi-VN")
              : ""}
          </Text>
        </View>

        <Text style={{ fontSize: 16 }}>
          {item.TAmount ? formatCurrency(item.TAmount) : "0"}
        </Text>
      </View>
    </TouchableOpacity>

      {/* Hiển thị các biểu tượng nếu mục được mở rộng */}
      {expandedTransactionId === item.TID && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            marginTop: 0,
          }}
        >
          <TouchableOpacity onPress={() => openEditModal(item)}>
            <FontAwesome name="edit" size={20} color="#4CAF50" style = {{paddingRight:15}}/>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => confirmDeleteTransaction(item.TID)}>
            <FontAwesome name="trash" size={20} color="red" />
            </TouchableOpacity>
        </View>
      )}
    </View>
  )}
/>
 )}
            
      </View>

            <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setEditModalVisible(false)}
        >
          <View style={styles.modalView}>
            <Pressable onPress={() => {}} style={styles.modalContent}>
              <Text style={{ fontSize: 18, padding: 20, fontWeight: "bold" }}>
                Edit Transaction
              </Text>

              {/* TextInput để nhập số tiền */}
              <TextInput
                placeholder="Enter new amount"
                value={updatedAmount}
                onChangeText={setUpdatedAmount}
                keyboardType="numeric"
                style={{
                  width: "80%",
                  height: 55,
                  borderWidth: 1,
                  borderColor: "#bdc3c7",
                  padding: 10,
                  borderRadius: 10,
                  marginBottom: 20,
                }}
              />

              {/* Picker để chọn danh mục */}
              <View
                style={{
                  borderBottomWidth: 3,
                  borderLeftWidth: 2,
                  borderRightWidth: 1,
                  borderRadius: 5,
                }}
              >
                <Picker
                  selectedValue={updatedCategory}
                  style={{ height: 50, width: 200, backgroundColor: "#eeeeee" }}
                  onValueChange={(itemValue) => setUpdatedCategory(itemValue)}
                >
                  {categories.map((category) => (
                    <Picker.Item
                      key={category.CID}
                      label={category.CName}
                      value={category.CID}
                    />
                  ))}
                </Picker>
              </View>

              {/* Nút Save Changes */}
              <TouchableOpacity
                style={styles.AddButton}
                onPress={() => {
                  editTransaction(editTransactionId, updatedAmount, updatedCategory);
                  setEditModalVisible(false);
                }}
              >
                <Text style={styles.ButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </Pressable>
          </View>
        </Pressable>
      </Modal>


      <View style={styles.hidden}>
        <Text> Text này bị ẩn phía sau thanh bottom bar </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  hidden: {
    flex:0.11,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer:{
    flex: 1,
    backgroundColor: "#faff75",
    justifyContent: 'center',
    alignItems:'center',
  },
  PlusIcon: {
    backgroundColor: "#FFEBCC",
    height: 50,
    width: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFC300",
    position: "absolute",
    bottom: 30,
    right: 0,
  },
  top: {
    justifyContent: "space-between",
    flexDirection: "row",
    flex:0.14,
  },
  TitleContainer: {
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    width: 230,
    height: 70,
  },
  modalView: {
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 200,
    margin: 20,
    height: 300,
    width: 300,
    borderWidth: 1,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalView2: {
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 200,
    margin: 20,
    height: 250,
    width: 300,
    borderWidth: 1,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContent: {
    width: "80%",
    padding: 20,
    height: 300,
    width: 300,
    borderRadius: 10,
    alignItems: "center",
  },
  modalContent2: {
    width: "80%",
    padding: 20,
    height: 250,
    width: 300,
    borderRadius: 10,
    alignItems: "center",
  },
  AddButton: {
    alignSelf: "center",
    backgroundColor: "#FEDB81",
    marginTop: 16,
    borderRadius: 35,
    width: 150,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  CancelButton: {
    alignSelf: "center",
    backgroundColor: "#e74c3c",
    marginTop: 16,
    padding: 10,
    borderRadius: 35,
    width: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  ButtonText: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 18,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default HomeScreen;
