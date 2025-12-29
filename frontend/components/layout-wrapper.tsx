"use client"

import { Sidebar } from "@/components/sidebar"
import { AuthGuard } from "@/components/auth-guard"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </AuthGuard>
  )
}

