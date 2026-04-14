import axios from "axios";
import { createContext, useState, useCallback } from "react";
import server from "../environment";
export const AuthContext = createContext();

const client = axios.create({
  baseURL: `${server}/api/v1/users`,
});

// Add a request interceptor to attach the JWT token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);

  const handleRegister = useCallback(async (name, username, password) => {
    try {
      const response = await client.post("/register", { name, username, password });
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  const handleLogin = useCallback(async (username, password) => {
    try {
      const response = await client.post("/login", { username, password });
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  const getHistoryOfUser = useCallback(async () => {
    try {
      const response = await client.get("/get_all_activity");
      return response.data; 
    } catch (err) {
      throw err;
    }
  }, []);

  const addToUserHistory = useCallback(async (meetingCode) => {
    try {
      const response = await client.post("/add_to_activity", { meetingCode });
      return response.data;
    } catch (e) {
      throw e;
    }
  }, []);

  const clearHistoryOfUser = useCallback(async () => {
    try {
      const response = await client.post("/clear_activity");
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  const data = {
    userData,
    setUserData,
    addToUserHistory,
    getHistoryOfUser,
    clearHistoryOfUser,
    handleRegister,
    handleLogin,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
