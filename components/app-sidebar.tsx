"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { FolderKanban, ListTodo, LayoutDashboard, Settings, Users } from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Projetos",
    href: "/projetos",
    icon: FolderKanban,
  },
  {
    name: "Tarefas",
    href: "/tarefas",
    icon: ListTodo,
  },
  {
    name: "Reuniões",
    href: "/reunioes",
    icon: Users,
  },
  {
    name: "Configuração",
    href: "/configuracao",
    icon: Settings,
  },
]

import { useAuthStore } from "@/lib/auth-store"
import { LogOut, User } from "lucide-react"

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card flex flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6 shrink-0">
        <FolderKanban className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">Project Sync</span>
      </div>
      <nav className="flex flex-col gap-1 p-4 flex-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col truncate">
            <span className="text-sm font-medium truncate">{user?.name || user?.username}</span>
            <span className="text-xs text-muted-foreground truncate">@{user?.username}</span>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </aside>
  )
}
