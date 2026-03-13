"use client"

import { usePathname } from "next/navigation"

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/projetos": "Projetos",
  "/tarefas": "Tarefas",
}

import { useAuthStore } from "@/lib/auth-store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { LogOut, Moon, Sun, Monitor, User as UserIcon, ChevronDown } from "lucide-react"
import { useTheme } from "next-themes"

export function AppHeader() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { setTheme } = useTheme()

  const getTitle = () => {
    if (pathname.startsWith("/projetos/")) {
      return "Detalhes do Projeto"
    }
    return pageTitles[pathname] || "Gestão de Projetos"
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <h1 className="text-xl font-semibold">{getTitle()}</h1>
      
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 p-1 px-2 rounded-lg hover:bg-muted transition-colors outline-none group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1 capitalize">{user?.role}</p>
              </div>
              <div className="relative">
                <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                  <AvatarFallback 
                    className="text-xs text-white font-bold" 
                    style={{ backgroundColor: user?.color || "#6366f1" }}
                  >
                    {user?.name?.substring(0, 2).toUpperCase() || "US"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 border border-border">
                  <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground truncate italic">
                  @{user?.username}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer">
                <Sun className="mr-2 h-4 w-4 dark:hidden" />
                <Moon className="mr-2 h-4 w-4 hidden dark:flex" />
                <span>Mudar Tema</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Claro</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Escuro</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
                    <Monitor className="mr-2 h-4 w-4" />
                    <span>Sistema</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => logout()} 
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Terminar Sessão</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
