"use client"

import { ReactNode } from "react"
import { Toaster } from "react-hot-toast"
import { AuthProvider } from "@/lib/auth-context"
import { SiteSettingsProvider } from "@/lib/site-settings-context"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SiteSettingsProvider>
    <AuthProvider>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "hsl(var(--dark-surface))",
            color: "hsl(var(--dark-text))",
            border: "1px solid hsl(var(--dark-border))",
          },
        }}
      />
    </AuthProvider>
    </SiteSettingsProvider>
  )
}
