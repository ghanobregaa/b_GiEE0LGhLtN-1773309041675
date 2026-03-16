"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { useEffect } from "react"
import { useProjectStore } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
import { useRouter, usePathname } from "next/navigation"
import { getApiUrl } from "@/lib/api-config"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const fetchData = useProjectStore((state) => state.fetchData)
  const initializeRealtime = useProjectStore((state) => state.initializeRealtime)
  const isLoading = useProjectStore((state) => state.isLoading)
  const error = useProjectStore((state) => state.error)
  const { isAuthenticated, _hasHydrated } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  const isLoginPage = pathname === "/login"
  const isPublicPage = pathname?.startsWith("/public")

  useEffect(() => {
    // Only redirect after the store has hydrated
    if (_hasHydrated) {
      if (!isAuthenticated && !isLoginPage && !isPublicPage) {
        router.push("/login")
      } else if ((isAuthenticated || isPublicPage) && !isLoginPage) {
        fetchData()
        initializeRealtime()
      }
    }
  }, [isAuthenticated, isLoginPage, isPublicPage, _hasHydrated, router, fetchData, initializeRealtime])

  // If store hasn't hydrated yet, show a loading placeholder
  if (!_hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground animate-pulse font-medium">A inicializar...</p>
      </div>
    )
  }

  // If it's the login page or a public page, just show the children
  if (isLoginPage || isPublicPage) {
    return <>{children}</>
  }

  // If not authenticated (and not login or public), show nothing while redirecting
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppSidebar />
      <div className="pl-64 flex flex-col min-h-screen">
        <AppHeader />
        <main className="p-6 flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-[60vh]">
              <p className="text-muted-foreground animate-pulse font-medium">A carregar dados...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[60vh] text-center border-2 border-dashed rounded-xl m-4 border-destructive/20 bg-destructive/5">
              <div className="p-8">
                <div className="mb-4 inline-flex p-3 rounded-full bg-destructive/10">
                  <span className="text-2xl font-bold text-destructive">!</span>
                </div>
                <p className="text-destructive font-bold text-lg">Erro de Ligação</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">{error}</p>
                <div className="mt-6 flex flex-col items-center gap-2">
                  <p className="text-xs font-mono bg-muted p-2 rounded border">API: {getApiUrl()}</p>
                  <p className="text-xs text-muted-foreground italic">Certifica-te que o servidor backend está ativo na porta correta (5001).</p>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  )
}
