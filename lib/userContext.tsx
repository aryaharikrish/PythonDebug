"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  isLoggedIn: boolean;
}

interface UserContextType {
  user: UserProfile;
  login: (name: string, email: string) => void;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
}

const defaultUser: UserProfile = {
  userId: "guest",
  name: "Guest Student",
  email: "guest@pydebug.edu",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest",
  isLoggedIn: false,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(defaultUser);

  useEffect(() => {
    const saved = localStorage.getItem("pydebug_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const login = (name: string, email: string) => {
    const newUser: UserProfile = {
      userId: `user_${Date.now()}`,
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      isLoggedIn: true,
    };
    setUser(newUser);
    localStorage.setItem("pydebug_user", JSON.stringify(newUser));
  };

  const logout = () => {
    const loggedOutUser: UserProfile = {
      userId: "guest",
      name: "Guest Student",
      email: "guest@pydebug.edu",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest",
      isLoggedIn: false,
    };
    setUser(loggedOutUser);
    localStorage.setItem("pydebug_user", JSON.stringify(loggedOutUser));
  };

  const updateUser = (data: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = { ...prev, ...data };
      localStorage.setItem("pydebug_user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <UserContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
