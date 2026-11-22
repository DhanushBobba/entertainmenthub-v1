import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import * as authApi from "../api/authApi";

const AuthContext = createContext(null);

const ACCESS_KEY = "entertainhub_access_token";
const REFRESH_KEY = "entertainhub_refresh_token";

function clearSession() {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

function saveSession(data) {
  sessionStorage.setItem(ACCESS_KEY, data.access_token);
  sessionStorage.setItem(REFRESH_KEY, data.refresh_token);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      try {
        const accessToken = sessionStorage.getItem(ACCESS_KEY);
        const refreshToken = sessionStorage.getItem(REFRESH_KEY);

        if (!accessToken && !refreshToken) return;

        try {
          const profile = await authApi.getCurrentUser();
          if (active) setUser(profile);
        } catch (error) {
          if (
            error.response?.status !== 401 ||
            !refreshToken
          ) {
            throw error;
          }

          const session = await authApi.refreshToken(refreshToken);

          saveSession(session);

          if (active) setUser(session.user);
        }
      } catch {
        if (active) {
          clearSession();
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initializeAuth();

    return () => {
      active = false;
    };
  }, []);

  async function login(credentials) {
    const response = await authApi.login(credentials);

    saveSession(response);
    setUser(response.user);

    return response.user;
  }

  async function register(payload) {
    return await authApi.register(payload);
  }

  async function logout() {
    try {
      const refreshToken =
        sessionStorage.getItem(REFRESH_KEY);

      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } finally {
      clearSession();
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: Boolean(user),
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}