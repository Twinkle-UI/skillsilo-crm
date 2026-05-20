// Auth utilities - localStorage operations centralized

const TOKEN_KEY = "skillsilo_token";
const USER_KEY = "skillsilo_user";

// Token operations
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

// User info operations
export const setUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

// Check if user is logged in
export const isAuthenticated = () => {
  return !!getToken();
};

// Logout - clear everything
export const logout = () => {
  removeToken();
  removeUser();
};



