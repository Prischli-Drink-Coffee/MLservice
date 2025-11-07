import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import useLocalStorage from "../hooks/useLocalStorage";
import { logoutLocal } from "../API/auth";
import { registerUnauthorizedHandler } from "../API/client";

const AuthContext = createContext({
  isAuthenticated: false,
  setAuthenticated: () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [storedAuth, setStoredAuth] = useLocalStorage("telerag:isAuthenticated", false);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(storedAuth));

  const setAuthenticated = useCallback(
    (state) => {
      setIsAuthenticated(state);
      setStoredAuth(state);
    },
    [setStoredAuth],
  );

  const logout = useCallback(() => {
    logoutLocal();
    Cookies.remove("beautiful_cookie");
    setAuthenticated(false);
  }, [setAuthenticated]);

  useEffect(() => {
    registerUnauthorizedHandler(logout);
  }, [logout]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      setAuthenticated,
      logout,
    }),
    [isAuthenticated, logout, setAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
