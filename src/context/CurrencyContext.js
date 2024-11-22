import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState("VND");
  const [exchangeRate, setExchangeRate] = useState(25000); 

  const saveCurrencyData = async (selectedCurrency, rate) => {
    try {
      const data = { currency: 
                              selectedCurrency,
                              exchangeRate: rate };
      await AsyncStorage.setItem("currencyData", JSON.stringify(data));
    } catch (error) {
     // console.error("Error saving currency data:", error);
    }
  };

  // Load currency and exchangeRate from AsyncStorage
  const loadCurrencyData = async () => {
    try {
      const savedData = await AsyncStorage.getItem("currencyData");
      if (savedData) {
        const { currency, exchangeRate } = JSON.parse(savedData);
        setCurrency(currency);
        setExchangeRate(exchangeRate);
      }
    } catch (error) {
     // console.error("Error loading currency data:", error);
    }
  };

  const updateCurrency = (newCurrency) => {
    const rate = newCurrency === "USD" ? 25000 : 1;
    setCurrency(newCurrency);
    setExchangeRate(rate);
    saveCurrencyData(newCurrency, rate);
  };

  useEffect(() => {
    loadCurrencyData();
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, exchangeRate, updateCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
