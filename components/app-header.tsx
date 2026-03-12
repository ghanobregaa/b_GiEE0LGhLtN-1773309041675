"use client"

import { usePathname } from "next/navigation"

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/projetos": "Projetos",
  "/tarefas": "Tarefas",
}

export function AppHeader() {
  const pathname = usePathname()

  const getTitle = () => {
    if (pathname.startsWith("/projetos/")) {
      return "Detalhes do Projeto"
    }
    return pageTitles[pathname] || "Gestão de Projetos"
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b border-border bg-background px-6">
      <h1 className="text-xl font-semibold">{getTitle()}</h1>
    </header>
  )
}
