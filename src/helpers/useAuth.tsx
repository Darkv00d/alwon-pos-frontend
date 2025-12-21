import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession } from "../endpoints/auth/session_GET.schema";
import { postLogout } from "../endpoints/auth/logout_POST.schema";
import { User } from "./User";

// React Query key for auth session. Make sure to optimistically update user infos using this.
export const AUTH_QUERY_KEY = ["auth", "session"] as const;

// Do not use this state in login/register UI because it's irrelevant. Only use it in UI that requires authentication.
// For pages that requires authentication only in parts of the UI (e.g. typical home page with a user avatar), the loading
// state should not apply to the full page, only to the parts that require authentication.
// Also, global context providers should not be blocked on auth states as it will block the whole page.
type AuthState =
  | {
    // Make sure to display a nice loading state UI when loading authentication state
    type: "loading";
  }
  | {
    type: "authenticated";
    user: User;
  }
  | {
    // Make sure to redirect to login or show auth error UI
    type: "unauthenticated";
    errorMessage?: string;
  };

type AuthContextType = {
  // Use this to display the correct UI based on auth state
  authState: AuthState;
  // Notify the auth provider that we have logged in
  onLogin: (user: User) => void;
  // Clear the auth state and perform the logout request
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Add this to components/_globalContextProviders but not any pageLayout files.
// Make sure it's within the QueryClientProvider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(() => {
    // Check if token exists on mount
    return !!localStorage.getItem('alwon_auth_token');
  });

  const { data, error, status, refetch } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const result = await getSession();
      if ("error" in result) {
        // Clear token if session check fails
        localStorage.removeItem('alwon_auth_token');
        setHasToken(false);
        throw new Error(result.error);
      }
      return result.user;
    },
    retry: 1,
    enabled: hasToken, // Only check session if there's a token
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const authState: AuthState =
    status === "pending" && hasToken
      ? (() => {
        console.log("AuthProvider: Loading state (pending + hasToken)");
        return { type: "loading" };
      })()
      : status === "error" || !hasToken
        ? (() => {
          if (status === "error") console.error("AuthProvider: Error state", error);
          if (!hasToken) console.log("AuthProvider: No token found");
          return {
            type: "unauthenticated",
            errorMessage:
              error instanceof Error ? error.message : "Session check failed",
          };
        })()
        : data
          ? (() => {
            console.log("AuthProvider: Authenticated", data.email);
            return { type: "authenticated", user: data };
          })()
          : { type: "unauthenticated" };

  const logout = useCallback(async () => {
    // Clear token
    localStorage.removeItem('alwon_auth_token');
    setHasToken(false);
    // Optimistically update UI
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
    // Make the actual API call (may fail if backend doesn't have logout endpoint)
    try {
      await postLogout();
    } catch (e) {
      // Ignore logout errors
      console.warn("Logout request failed:", e);
    }
    // Invalidate all queries after logout
    queryClient.resetQueries();
  }, [queryClient]);

  // This should only be used for login. For user profile changes, create separate endpoints and react query hooks
  // and update the data linked to AUTH_QUERY_KEY.
  const onLogin = useCallback(
    (user: User) => {
      // Save token to localStorage if it exists
      const userWithToken = user as User & { token?: string };
      if (userWithToken.token) {
        localStorage.setItem('alwon_auth_token', userWithToken.token);
        setHasToken(true);
      }

      // Save user data to React Query (without token)
      const { token, ...userData } = userWithToken;
      queryClient.setQueryData(AUTH_QUERY_KEY, userData);
    },
    [queryClient]
  );

  return (
    <AuthContext.Provider value={{ authState, logout, onLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

// Prefer using protectedRoutes instead of this hook unless the route doesn't need to be protected (e.g. login/register)
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
};
