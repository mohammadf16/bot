"use client"

import { ReactNode } from "react"
import { Toaster } from "react-hot-toast"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
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
    </>
  )
}
