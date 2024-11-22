import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Dimensions, Modal, TouchableOpacity } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { supabase } from "../database/supabase";
import { FontAwesome } from '@expo/vector-icons';
import Icon from 'react-native-vector-icons/Ionicons';

import DateTimePicker from '@react-native-community/datetimepicker';  // Import DateTimePicker
import { useCurrency } from "../context/CurrencyContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { useFocusEffect } from "@react-navigation/native";
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const MoneyScreen = () => {
  const [user, setUser] = useState();
  const [AccID, setAccID] = useState();
  const [selectedData, setSelectedData] = useState(null);
  const [dailyTransactionDetails, setDailyTransactionDetails] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [monthlyTransactionDetails, setMonthlyTransactionDetails] = useState({});
  const [monthlyTotals, setMonthlyTotals] = useState([]);

  const [selectedMonthlyData, setSelectedMonthlyData] = useState(null);
  const [isMonthlyModalVisible, setIsMonthlyModalVisible] = useState(false);

  const [datePickerVisible, setDatePickerVisible] = useState(false); // State for date picker visibility
  const [selectedDate, setSelectedDate] = useState(new Date()); // State for selected date
  
  const [allTransactions,setAllTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { currency, exchangeRate } = useCurrency();


  const getUserData = useCallback(async () => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      const user = JSON.parse(userJson);

      if (user) {
        setUser(user);
        setAccID(user.AccID);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, []);

  useEffect(() => {
    getUserData();
  }, [getUserData]);

  useFocusEffect(
    useCallback(() => {
      if (AccID) {
        const fetchData = async () => {
          try {
            await fetchMonthlyTransactions(AccID);
            await fetchRecentTransactions(AccID);
           // console.log("fetchMonthlyTransactions và fetchRecentTransactions đã hoàn thành");
          } catch (error) {
            console.error("Lỗi khi fetch dữ liệu:", error);
          }
        };
  
        fetchData();
      }
    }, [AccID])
  );
  const fetchMonthlyTransactions = async (accID) => {
    try {
      const { data: transactions, error: transactionError } = await supabase
        .from("transaction")
        .select("TAmount, TDate")
        .eq("AccID", accID)
        .order("TDate", { ascending: true });
  
      if (transactionError) throw transactionError;
  
      const dailyTotalsMap = {};
      const monthlyDetailsMap = {};
  
      transactions.forEach((transaction) => {
        const dateLabel = dayjs(transaction.TDate).format("DD/MM");
        const monthLabel = dayjs(transaction.TDate).format("MMM");
  
        // Tổng tiền theo ngày
        if (dailyTotalsMap[dateLabel]) {
          dailyTotalsMap[dateLabel] += transaction.TAmount;
        } else {
          dailyTotalsMap[dateLabel] = transaction.TAmount;
        }
  
        // Chi tiết ngày theo tháng
        if (monthlyDetailsMap[monthLabel]) {
          if (monthlyDetailsMap[monthLabel][dateLabel]) {
            monthlyDetailsMap[monthLabel][dateLabel] += transaction.TAmount;
          } else {
            monthlyDetailsMap[monthLabel][dateLabel] = transaction.TAmount;
          }
        } else {
          monthlyDetailsMap[monthLabel] = { [dateLabel]: transaction.TAmount };
        }
      });
  
      // Định dạng dữ liệu cho biểu đồ và modal
      const monthlyTotalsArray = Object.keys(monthlyDetailsMap).map((month) => ({
        month,
        total: Object.values(monthlyDetailsMap[month]).reduce(
          (acc, value) => acc + value,
          0
        ),
      }));
  
      setMonthlyTransactionDetails(monthlyDetailsMap); // Lưu chi tiết từng ngày theo tháng
      setMonthlyTotals(monthlyTotalsArray); // Lưu tổng tiền theo tháng
    } catch (error) {
      console.error("Error fetching monthly transactions:", error);
    }
  };
  
  
  
  const fetchRecentTransactions = async (accID) => {
    try {

      const { data: allTransactions, error: transactionError } = await supabase
        .from("transaction")
        .select("TAmount, TDate, CID")
        .eq("AccID", accID)
        .order("TDate", { ascending: false });
  
      if (transactionError) throw transactionError;
  

      const { data: categories, error: categoryError } = await supabase
        .from("category")
        .select("CID, CName");
  
      if (categoryError) throw categoryError;
  

      const categoryMap = categories.reduce((acc, category) => {
        acc[category.CID] = category.CName;
        return acc;
      }, {});
  

      const allTransactionDetails = allTransactions.map((transaction) => ({
        ...transaction,
        categoryName: categoryMap[transaction.CID], 
      }));
  

      const today = dayjs();
      const sevenDaysAgo = today.subtract(7, "days");
      const filteredTransactions = allTransactionDetails.filter((transaction) => {
        const transactionDate = dayjs(transaction.TDate);
        return transactionDate.isAfter(sevenDaysAgo);
      });
  

      const dailyTotals = [];
      const dailyDetails = {};
  
      filteredTransactions.forEach((transaction) => {
        const date = dayjs(transaction.TDate).format("DD/MM"); 
  

        if (dailyDetails[date]) {
          dailyDetails[date].push(transaction);
        } else {
          dailyDetails[date] = [transaction];
        }
  
        const existing = dailyTotals.find((item) => item.date === date);
        if (existing) {
          existing.total += transaction.TAmount;
        } else {
          dailyTotals.push({ date, total: transaction.TAmount });
        }
      });

      setAllTransactions(allTransactionDetails); 
      setTransactions(dailyTotals.reverse());
      setDailyTransactionDetails(dailyDetails);  

  
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };
  
  const fetchTransactionsByDate = async (formattedDate) => {
    try {
      const { data, error } = await supabase
        .from("transaction")
        .select("*")
        .eq("TDate", formattedDate); 
  
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };
  
  

  

  function handleDataPointClick(data) {
    const dateLabel = transactions[data.index]?.date;
    const details = dailyTransactionDetails[dateLabel] || [];
    setSelectedData({ dateLabel, details, value: data.value });
  }
  function handleMonthlyDataPointClick(data) {
    const monthLabel = monthlyTotals[data.index]?.month;
    setSelectedMonthlyData({ monthLabel });
  }
  
  

  function getTransactionsForSelectedDate(selectedDate) {
    try {
      const startOfDay = dayjs(selectedDate).startOf('day'); // 00:00
      const endOfDay = dayjs(selectedDate).endOf('day'); // 23:59
  
      const transactionsForSelectedDate = allTransactions.filter(transaction => {
        const transactionDate = dayjs(transaction.TDate);
  
        if (!transactionDate.isValid()) {
          console.error(`Invalid date for transaction: ${transaction.TDate}`);
          return false;
        }
  
        return transactionDate.isBetween(startOfDay, endOfDay, null, '[]'); 
      });
  
      return transactionsForSelectedDate;
    } catch (error) {
      console.error("Error fetching transactions for selected date:", error);
      return [];
    }
  }



  function handleDailyDetailClick(date) {
    const transactionsForSelectedDay = allTransactions.filter(transaction => {
      const transactionDate = dayjs(transaction.TDate).format("DD/MM");
      return transactionDate === date;
    });
  
    setSelectedData({
      dateLabel: date,
      details: transactionsForSelectedDay,
      value: transactionsForSelectedDay.reduce((sum, transaction) => sum + transaction.TAmount, 0),
    });
  }


  const handleDatePickerChange = (event, date) => {
    try {
      if (event.type === 'set') {
        setDatePickerVisible(false);
        setSelectedDate(date || selectedDate);
  
        const transactionsForSelectedDate = getTransactionsForSelectedDate(date || selectedDate);
        const details = transactionsForSelectedDate.map(transaction => ({
          TDate: transaction.TDate,
          categoryName: transaction.categoryName,
          TAmount: transaction.TAmount
        }));
  
        setSelectedData({
          dateLabel: dayjs(date || selectedDate).format('YYYY-MM-DD'),
          details: details,
          value: transactionsForSelectedDate.reduce((sum, transaction) => sum + transaction.TAmount, 0)
        });
  
        console.debug("Selected Date Data: ", selectedDate);
      } else {
        console.debug("dismissed");
        setDatePickerVisible(false);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };
  


  function getTimeFromTransactionDate(transactionDate) {
    const date = new Date(transactionDate);
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }
  
  const formatCurrency = (amount) => {
    if (currency === "VND") {
      return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
    } else if (currency === "USD") {
      return (amount / exchangeRate).toLocaleString("en-US", { style: "currency", currency: "USD" });
    }
    return amount;
  };



  if (!transactions.length) {
    return (
      <View style={styles.loadingContainer}>
        {/* <ActivityIndicator size="large" color="#FFC300" /> */}
        <Text style = {{fontSize: 20,}} >Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.top}>

        <Text style={styles.headerText}>Duck Totals</Text>
        <TouchableOpacity style={styles.PlusIcon} onPress={() => setDatePickerVisible(true)}>
          <Icon name="time" size={24} color="black" />
        </TouchableOpacity>

      </View>

      <View style={styles.chartview}>
        <Text style={styles.dailymonthlytext}>Daily total's spending</Text>
        { currency === "VND" ? (
          <LineChart
          data={{
            labels: transactions.map((item) => item.date), 
            datasets: [{ data: transactions.map((item) => item.total), strokeWidth: 2 }],
          }}
          width={Dimensions.get("window").width - 40}
          height={220}
          chartConfig={{
            backgroundColor: "#fed97a", // Background of the chart
            backgroundGradientFrom: "#fed97a", // Gradient start color
            backgroundGradientTo: "#ffd86b", // Gradient end color
            decimalPlaces: 0, // No decimals
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Line color (dark for contrast)
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Label color
            style: { borderRadius: 15, marginLeft: 20 },
            propsForDots: {
              r: "8",
              strokeWidth: "2",
              stroke: "#222222", // Dot border color
              fill: "#ffd07e", // Dot fill color (slightly lighter shade)
            },
          }}
          fromZero={true}
          onDataPointClick={handleDataPointClick}
          bezier
          yAxisSuffix={" ₫"}
          formatYLabel={(yValue) => {
            const value = parseInt(yValue);
            if (value >= 1000000000) return `${Math.round(value / 1000000000)}B`;
            if (value >= 1000000) return `${Math.round(value / 1000000)}M`;
            if (value >= 1000) return `${Math.round(value / 1000)}K`;
            return value.toLocaleString();
          }}
          style={{ marginVertical: 8, borderRadius: 10 }}
        />
        ) : (
          <LineChart
          data={{
            labels: transactions.map((item) => item.date), 
            datasets: [{ data: transactions.map((item) => item.total), strokeWidth: 2 }],
          }}
          width={Dimensions.get("window").width - 40}
          height={220}
          chartConfig={{
            backgroundColor: "#fed97a", // Background of the chart
            backgroundGradientFrom: "#fed97a", // Gradient start color
            backgroundGradientTo: "#ffd86b", // Gradient end color
            decimalPlaces: 0, // No decimals
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Line color (dark for contrast)
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Label color
            style: { borderRadius: 15, marginLeft: 20 },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#222222", // Dot border color
              fill: "#ffd07e", // Dot fill color (slightly lighter shade)
            },
          }}
          fromZero={true}
          onDataPointClick={handleDataPointClick}
          bezier
          yAxisLabel="$"
          formatYLabel={(yValue) => {
            const value = parseInt(yValue);
            if (value >= 1000000000*exchangeRate) return `${Math.round(value / (1000000000*exchangeRate))} B`;
            if (value >= 1000000*exchangeRate) return `${Math.round(value / (1000000*exchangeRate))} M`;
            if (value >= 1000*exchangeRate) return `${Math.round(value / (1000*exchangeRate))} K `;
            return value/exchangeRate;
          }}
          style={{ marginVertical: 8, borderRadius: 10 }}
        />
        ) }
      </View>


      <View style={styles.chartview}>

        <Text style={styles.dailymonthlytext}>Monthly total's spending</Text>


        { currency === "VND" ? (
          <LineChart
          data={{
            labels: monthlyTotals.map((item) => item.month), // Sử dụng nhãn là các tháng
            datasets: [{ data: monthlyTotals.map((item) => item.total), strokeWidth: 2 }], // Dữ liệu là tổng chi tiêu của từng tháng
          }}

          width={Dimensions.get("window").width - 40}
          height={220}
          chartConfig={{
            backgroundColor: "#fed97a",
            backgroundGradientFrom: "#ffd86b",
            backgroundGradientTo: "#fed97a",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Line color (dark for contrast)
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Label color
            style: { borderRadius: 15, marginLeft: 20 },
            propsForDots: { r: "6", strokeWidth: "2", stroke: "#ffa726" },
          }}
          fromZero={true}
          onDataPointClick={handleMonthlyDataPointClick}
          bezier
          yAxisSuffix={" ₫"}
          formatYLabel={(yValue) => {
            const value = parseInt(yValue);
            if (value >= 1000000000) return `${Math.round(value / 1000000000)}B`;
            if (value >= 1000000) return `${Math.round(value / 1000000)}M`;
            if (value >= 1000) return `${Math.round(value / 1000)}K`;
            return value.toLocaleString();
          }}
          style={{ marginVertical: 8, borderRadius:10 }}
        /> 
        ) : (

        <LineChart
          data={{
            labels: monthlyTotals.map((item) => item.month), // Sử dụng nhãn là các tháng
            datasets: [{ data: monthlyTotals.map((item) => item.total), strokeWidth: 2 }], // Dữ liệu là tổng chi tiêu của từng tháng
          }}

          width={Dimensions.get("window").width - 40}
          height={220}
          chartConfig={{
            backgroundColor: "#fed97a",
            backgroundGradientFrom: "#ffd86b",
            backgroundGradientTo: "#fed97a",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Line color (dark for contrast)
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Label color
            style: { borderRadius: 15, marginLeft: 20 },
            propsForDots: { r: "6", strokeWidth: "2", stroke: "#ffa726" },
          }}
          fromZero={true}
          onDataPointClick={handleMonthlyDataPointClick}
          bezier
          yAxisLabel="$"
          formatYLabel={(yValue) => {
            const value = parseInt(yValue);
            if (value >= 1000000000*exchangeRate) return `${Math.round(value / (1000000000*exchangeRate))} B`;
            if (value >= 1000000*exchangeRate) return `${Math.round(value / (1000000*exchangeRate))} M`;
            if (value >= 1000*exchangeRate) return `${Math.round(value / (1000*exchangeRate))} K `;
            return value/exchangeRate;
          }}
          style={{ marginVertical: 8, borderRadius:10 }}
        /> 
        )
        }

      </View>

      <View style = {styles.hidden}>
        <Text>Hidden Text</Text>
      </View>




    {/* Modal hiển thị chi tiết chi tiêu hàng ngày trong 7 ngày */}
    {selectedData && (
  <Modal transparent={true} visible={true} animationType="fade">
    <TouchableOpacity
      style={styles.modalContainer}
      activeOpacity={1}
      onPressOut={() => setSelectedData(null)} // Đóng modal khi bấm ra ngoài
    >
      <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
        <Text style={styles.modalTitle}>Details for {selectedData.dateLabel}</Text>
        
        {/* Hiển thị tổng chi tiêu của ngày */}
        <Text style={styles.modalTotalText}>
          Total Spending: {formatCurrency(selectedData.value)}
        </Text>

        {/* Hiển thị chi tiết từng giao dịch */}
        {selectedData.details.map((transaction, index) => (
          <Text key={index}>
            {getTimeFromTransactionDate(transaction.TDate)} - {transaction.categoryName} - {formatCurrency(transaction.TAmount)}
          </Text>
        ))}
      </View>
    </TouchableOpacity>
  </Modal>
)}

{selectedMonthlyData && (
  <Modal transparent={true} visible={true} animationType="fade">
    <TouchableOpacity
      style={styles.modalContainer}
      activeOpacity={1}
      onPress={() => setSelectedMonthlyData(null)} // Đóng modal khi bấm bên ngoài
    >
      <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
        <Text style={styles.modalTitle}>
          Details for {selectedMonthlyData.monthLabel}
        </Text>

        {/* Hiển thị tổng chi tiêu của tháng */}
        <Text style={styles.modalTotalText}>
          Total Spending:{" "}
          {formatCurrency(
            Object.values(
              monthlyTransactionDetails[selectedMonthlyData.monthLabel] || {}
            ).reduce((sum, total) => sum + total, 0)
          )}
        </Text>

        {/* Hiển thị chi tiết chi tiêu từng ngày trong tháng */}
        {Object.entries(
          monthlyTransactionDetails[selectedMonthlyData.monthLabel] || {}
        ).map(([date, total], index) => (
          <View key={index} style={styles.modalRow}>
            <TouchableOpacity onPress={() => handleDailyDetailClick(date)}>
              <FontAwesome
                name="exclamation-circle"
                size={15}
                color="black"
                style={{ marginRight: 8, width: 20 }}
              />
            </TouchableOpacity>
            <Text style={styles.modalText}>
              {date} - Total: {formatCurrency(total)}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  </Modal>
)}


       {datePickerVisible && (
      <DateTimePicker
        value={selectedDate}
        onChange={handleDatePickerChange}
        mode="date"
        display="default"
      />)}

    
    </View> //view tổng
    
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
  headerText: {
    alignSelf: 'center',
    marginTop: 15,
    color: '#000000',
    fontSize: 39,
    fontWeight: 'bold',
    backgroundColor: '#fed97a',
    borderRadius: 20,
    width: 215,
    height: 70,
    textAlign: "center",
    textAlignVertical: "center",
  },
  top: {
    justifyContent: "space-between",
    flexDirection: "row",
    flex:0.14,
  },
  chartview: {
    marginBottom: 0,
    flex:0.375 ,
  },
  dailymonthlytext: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  loadingContainer:{
    flex: 1,
    backgroundColor: "#faff75",
    justifyContent: 'center',
    alignItems:'center',
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", 
    marginBottom: 10,
    width: "100%", 
    paddingHorizontal: 10, 
  },
  modalText: {
    fontSize: 16,
    //fontWeight: "bold",
  },
  modalTotalText: {
    fontSize: 16,
    fontWeight: "bold",
    paddingBottom: 10,
  },
  
});

export default MoneyScreen;
