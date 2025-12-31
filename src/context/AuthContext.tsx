import React, { createContext, useContext, useState, useEffect } from "react";

interface AuthContextType {
  isOwnerLoggedIn: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const OWNER_CREDENTIALS = {
  username: "w8jl",
  password: "dnhd1100",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOwnerLoggedIn, setIsOwnerLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem("walker-owner-auth");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("walker-owner-auth", String(isOwnerLoggedIn));
  }, [isOwnerLoggedIn]);

  const login = (username: string, password: string): boolean => {
    if (username === OWNER_CREDENTIALS.username && password === OWNER_CREDENTIALS.password) {
      setIsOwnerLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsOwnerLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isOwnerLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
