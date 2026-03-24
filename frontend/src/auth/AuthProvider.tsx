import React, {
  useMemo,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { setAuthTokenGetter, setIdTokenGetter } from "../lib/auth";
import { AuthContext } from "./auth-context";
import type { User } from "./types";
import { createUser } from "@/api/user";

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContextProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const {
    isAuthenticated,
    isLoading,
    user,
    getAccessTokenSilently,
    getIdTokenClaims,
    loginWithRedirect,
    logout: auth0Logout,
    error,
  } = useAuth0();

  useEffect(() => {
    if (!isAuthenticated || !user?.sub) return;
    setAuthTokenGetter(getAccessTokenSilently);
    setIdTokenGetter(async () => {
      await getAccessTokenSilently();
      const claims = await getIdTokenClaims();
      if (claims?.__raw) {
        sessionStorage.setItem("id_token", claims.__raw);
        return claims.__raw;
      }
      return null;
    });
    const userData = {
      id: user?.sub,
      email: user?.email || "",
      username: user?.nickname || "",
      picture: user?.picture || "",
    };
    createUser(userData as User);

    const storeIdToken = async () => {
      try {
        const idTokenClaims = await getIdTokenClaims();
        if (idTokenClaims?.__raw) {
          sessionStorage.setItem("id_token", idTokenClaims.__raw);
        }
      } catch (err) {
        console.error("Error storing ID token:", err);
      }
    };
    storeIdToken();
  }, [isAuthenticated, user, getAccessTokenSilently, getIdTokenClaims]);

  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await getAccessTokenSilently();
      if (token) {
        localStorage.setItem("auth_token", token);
        localStorage.setItem("access_token", token);
      }
      return token;
    } catch (err) {
      console.error("Error getting Auth0 token:", err);
      return null;
    }
  }, [getAccessTokenSilently]);

  const login = useCallback(async () => {
    return loginWithRedirect({
      authorizationParams: {
        redirect_uri: `${window.location.origin}/callback`,
      },
    });
  }, [loginWithRedirect]);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("access_token");
    sessionStorage.removeItem("id_token");
    auth0Logout({
      logoutParams: {
        returnTo: `${import.meta.env.VITE_WORKSPACE_URL}/logout`,
      },
    });
  }, [auth0Logout]);

  const contextValue = useMemo(() => {
    const currentUser: User | null = user
      ? {
        id: user.sub || "",
        email: user.email || "",
        name: user.name,
        picture: user.picture,
      }
      : null;

    return {
      isAuthenticated,
      isLoading,
      currentUser,
      login,
      logout,
      getToken,
      error: error?.message || null,
    };
  }, [isAuthenticated, isLoading, user, login, logout, getToken, error]);

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const redirectUri =
    import.meta.env.VITE_AUTH0_REDIRECT_URI ||
    `${window.location.origin}/callback`;

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: redirectUri,
        scope: "openid profile email",
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      }}
      useRefreshTokens={true}
      useRefreshTokensFallback={true}
      cacheLocation="localstorage"
    >
      <AuthContextProvider>{children}</AuthContextProvider>
    </Auth0Provider>
  );
};

export default AuthProvider;
