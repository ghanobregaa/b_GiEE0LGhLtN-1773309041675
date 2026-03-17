"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { FolderKanban, ListTodo, LayoutDashboard, Settings, Users, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuthStore } from "@/lib/auth-store"
import { useUIStore } from "@/lib/ui-store"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

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
    name: "Timesheet",
    href: "/timesheet",
    icon: Calendar,
  },
  {
    name: "Configuração",
    href: "/configuracao",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { isSidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 border-r border-border bg-card flex flex-col transition-all duration-300",
        isSidebarCollapsed ? "w-16" : "w-64"
      )}>
        <div className={cn("flex h-16 items-center border-b border-border shrink-0 transition-all duration-300", isSidebarCollapsed ? "justify-center px-0" : "px-6 gap-2")}>
          {isSidebarCollapsed ? (
            <FolderKanban className="h-6 w-6 text-primary shrink-0" />
          ) : (
            <>
              <FolderKanban className="h-6 w-6 text-primary shrink-0" />
              <span className="text-lg font-semibold overflow-hidden whitespace-nowrap">AFADev</span>
            </>
          )}
        </div>
        <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto overflow-x-hidden">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href))

          const linkContent = (
            <Link
              href={item.href}
              className={cn(
                "flex items-center rounded-lg py-2 transition-colors",
                isSidebarCollapsed ? "justify-center px-0" : "px-3 gap-3",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("shrink-0", isSidebarCollapsed ? "h-6 w-6" : "h-5 w-5")} />
              {!isSidebarCollapsed && <span className="text-sm font-medium overflow-hidden whitespace-nowrap">{item.name}</span>}
            </Link>
          )

          if (isSidebarCollapsed) {
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2 font-semibold">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            )
          }

          return <div key={item.name}>{linkContent}</div>
        })}
      </nav>

      <div className="p-3 border-t border-border shrink-0">
        <Button 
          variant="ghost" 
          size={isSidebarCollapsed ? "icon" : "default"} 
          onClick={toggleSidebar}
          className={cn("w-full text-muted-foreground", isSidebarCollapsed ? "justify-center" : "justify-start gap-3")}
        >
          {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {!isSidebarCollapsed && <span>Recolher</span>}
        </Button>
      </div>

    </aside>
  </TooltipProvider>
  )
}
