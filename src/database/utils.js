import AsyncStorage from '@react-native-async-storage/async-storage';

// Dữ liệu mặc định cho các mục chi tiêu
const defaultCategories = ['Food', 'Drink', 'Shopping'];
const defaultExpenses = [];
const defaultBalance = null; 
const defaultTotalExpenses = null; 

// Hàm lưu dữ liệu vào AsyncStorage
const saveData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.log(`Error saving ${key}:`, e);
  }
};

// Hàm tải dữ liệu từ AsyncStorage
 const loadData = async (key, defaultValue) => {
  try {
    const storedData = await AsyncStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : defaultValue;
  } catch (e) {
    console.log(`Error loading ${key}:`, e);
    return defaultValue;
  }
};

// Hàm lưu chi tiêu 
export const saveExpenses = async (newExpenses) => {
  await saveData('expenses', newExpenses);
  await calculateTotalExpenses(newExpenses);
};

// Hàm lưu danh mục
export const saveCategories = async (newCategories) => {
  await saveData('categories', newCategories);
};

// Hàm tải chi tiêu
export const loadExpenses = async () => {
  return await loadData('expenses', defaultExpenses);
};

// Hàm tải danh mục
export const loadCategories = async () => {
  return await loadData('categories', defaultCategories);
};

// Hàm tải tổng chi tiêu
export const loadTotalExpenses = async () => {
  return await loadData('totalExpenses', defaultTotalExpenses);
};

// Hàm tính tổng chi tiêu
const calculateTotalExpenses = async (expenses) => {
  try {
    const total = expenses.reduce((acc, expense) => acc + expense.amount, 0);
    await saveData('totalExpenses', total);
  } catch (e) {
    console.log('Error calculating total expenses:', e);
  }
};


// hàm đặt lại dữ liệu
export const resetExpenses = async () => {
  try {
    await saveData('expenses', defaultExpenses); 
    await saveData('categories', defaultCategories); 
    await saveData('balance', defaultBalance); 
    await saveData('totalExpenses', defaultTotalExpenses);
    return true;
  } catch (e) {
    console.error('Error resetting expenses:', e);
    return false;
  }
};


// Hàm xóa toàn bộ dữ liệu
export const clearDatabase = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (e) {
    console.error('Error clearing database:', e);
    return false;
  }
};
