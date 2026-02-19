"use client";

import { createContext, useContext } from "react";
import type { Profile } from "@/types";

interface AuthContextValue {
  user: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
