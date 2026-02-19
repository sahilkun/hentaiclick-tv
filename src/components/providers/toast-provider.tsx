"use client";

import { ToastProvider as ToastProviderBase } from "@/components/ui/toast";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <ToastProviderBase>{children}</ToastProviderBase>;
}
