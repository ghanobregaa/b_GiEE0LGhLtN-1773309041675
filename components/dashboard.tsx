"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  useProjectStore,
  formatDate,
  getStatusColor,
  calculateProjectProgress,
} from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  FolderKanban,
  ListTodo,
  Clock,
  TrendingUp,
  ArrowRight,
  CalendarDays,
  X,
  Users,
  CalendarIcon,
  FileDown,
  Loader2,
} from "lucide-react"
import { getApiUrl } from "@/lib/api-config"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

export function Dashboard() {
  const projects = useProjectStore((state) => state.projects)
  const tasks = useProjectStore((state) => state.tasks)
  const meetings = useProjectStore((state) => state.meetings)
  const users = useProjectStore((state) => state.users)
  const currentUser = useAuthStore((state) => state.user)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  })
  const [isExporting, setIsExporting] = useState(false)
  const API_URL = getApiUrl()

  const handleMonthlyExport = async () => {
    setIsExporting(true)
    try {
      const queryParams = new URLSearchParams()
      if (dateRange.start) queryParams.append("start", dateRange.start)
      if (dateRange.end) queryParams.append("end", dateRange.end)
      
      const response = await fetch(`${API_URL}/reports/monthly/export?${queryParams.toString()}`)
      if (!response.ok) throw new Error("Falha na exportação")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const date = new Date()
      date.setMonth(date.getMonth() - 1)
      const fileName = `Relatorio_Mensal_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date.getFullYear()}.pdf`
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Erro ao exportar:", error)
      alert("Erro ao exportar o relatório mensal.")
    } finally {
      setIsExporting(false)
    }
  }

  const hasDateFilter = dateRange.start || dateRange.end

  // Filter projects, tasks and meetings based on date range
  const { filteredProjects, filteredTasks, filteredMeetings } = useMemo(() => {
    let filteredProjects = projects
    let filteredTasks = tasks
    let filteredMeetings = meetings

    if (dateRange.start || dateRange.end) {
      const startDate = dateRange.start ? new Date(dateRange.start) : null
      const endDate = dateRange.end ? new Date(dateRange.end) : null

      filteredProjects = projects.filter((p) => {
        const projectStart = new Date(p.plannedStartDate)
        const projectEnd = new Date(p.plannedEndDate)

        if (startDate && endDate) {
          return projectStart <= endDate && projectEnd >= startDate
        } else if (startDate) {
          return projectEnd >= startDate
        } else if (endDate) {
          return projectStart <= endDate
        }
        return true
      })

      filteredTasks = tasks.filter((t) => {
        const taskStart = new Date(t.plannedStartDate || "")
        const taskEnd = new Date(t.plannedEndDate || "")

        if (startDate && endDate) {
          return taskStart <= endDate && taskEnd >= startDate
        } else if (startDate) {
          return taskEnd >= startDate
        } else if (endDate) {
          return taskStart <= endDate
        }
        return true
      })

      filteredMeetings = meetings.filter((m) => {
        const meetingDate = new Date(m.date)
        if (startDate && endDate) {
          return meetingDate >= startDate && meetingDate <= endDate
        } else if (startDate) {
          return meetingDate >= startDate
        } else if (endDate) {
          return meetingDate <= endDate
        }
        return true
      })
    }

    return { filteredProjects, filteredTasks, filteredMeetings }
  }, [projects, tasks, meetings, dateRange])

  const stats = useMemo(() => {
    const totalProjects = filteredProjects.length
    const projectsInProgress = filteredProjects.filter((p) => p.status === "Em curso").length
    const totalTasks = filteredTasks.length
    const tasksCompleted = filteredTasks.filter((t) => t.status === "Concluído").length
    const totalMeetings = filteredMeetings.length
    const totalMeetingHours = filteredMeetings.reduce((acc, m) => acc + m.durationHours, 0)
    
    // Recalcula as horas reais totais considerando tarefas + reuniões (para os projetos filtrados)
    const totalActualHours = filteredProjects.reduce((acc, p) => acc + p.actualHours, 0)
    const totalPlannedHours = filteredProjects.reduce((acc, p) => acc + p.plannedHours, 0)    // Technician performance data
    const techniciansMap: Record<string, { name: string; tasks: number; meetings: number; hours: number; color?: string }> = {}
    
    // Altura de tarefas
    filteredTasks.forEach(task => {
      const techId = task.technicianId
      const techNameStr = (task as any).technician // Suporte para dados antigos
      
      const user = techId ? users.find(u => u.id === techId) : users.find(u => u.name === techNameStr)
      const techName = user?.name || techNameStr || "Sem Técnico"
      const key = user?.id || techName

      if (!techniciansMap[key]) {
        techniciansMap[key] = { name: techName, tasks: 0, meetings: 0, hours: 0, color: user?.color }
      }
      techniciansMap[key].tasks += 1
      techniciansMap[key].hours += (task.actualHours || 0)
    })

    // Altura de reuniões
    filteredMeetings.forEach(meeting => {
      meeting.technicians.forEach(tRef => {
        // tRef pode ser ID ou Nome
        const user = users.find(u => u.id === tRef || u.name === tRef)
        const techName = user?.name || tRef || "Sem Técnico"
        const key = user?.id || techName

        if (!techniciansMap[key]) {
          techniciansMap[key] = { name: techName, tasks: 0, meetings: 0, hours: 0, color: user?.color }
        }
        techniciansMap[key].meetings += 1
        techniciansMap[key].hours += meeting.durationHours
      })
    })

    const techData = Object.entries(techniciansMap)
      .filter(([key, data]) => {
        const user = users.find(u => u.id === key || u.name === data.name)
        return user?.role === "técnico"
      })
      .map(([_, data]) => data)
      .sort((a, b) => b.hours - a.hours)

    // Task status distribution
    const statusData = [
      { name: "Pendente", value: filteredTasks.filter(t => t.status === "Pendente").length, color: "#94a3b8" },
      { name: "Em Curso", value: filteredTasks.filter(t => t.status === "Em curso").length, color: "#f59e0b" },
      { name: "Concluído", value: filteredTasks.filter(t => t.status === "Concluído").length, color: "#10b981" },
    ].filter(s => s.value > 0)

    return { 
      totalProjects, 
      projectsInProgress, 
      totalTasks, 
      tasksCompleted, 
      totalMeetings,
      totalMeetingHours,
      totalPlannedHours, 
      totalActualHours,
      techData,
      statusData,
      myTasks: filteredTasks.filter(t => t.technicianId === currentUser?.id),
    }
  }, [filteredProjects, filteredTasks, filteredMeetings, users, currentUser])

  const recentProjects = filteredProjects.slice(0, 5)
  const activeTasks = filteredTasks.filter((t) => t.status !== "Concluído").slice(0, 5)

  const clearDateFilter = () => {
    setDateRange({ start: "", end: "" })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Painel de Controlo (KPIs)</h2>
          <p className="text-muted-foreground">
            Acompanhamento em tempo real de técnicos, tarefas e horas.
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="gap-2 bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary"
            onClick={handleMonthlyExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Exportar Relatório Mensal
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                {hasDateFilter ? "Filtro Ativo" : "Filtrar por Data"}
                {hasDateFilter && (
                  <Badge variant="secondary" className="ml-1">
                    1
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Filtrar por Período</h4>
                  <p className="text-sm text-muted-foreground">
                    Selecione o intervalo de datas para filtrar os dados.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="space-y-1 flex flex-col">
                    <Label htmlFor="start-date" className="text-xs mb-1">
                      Data Início
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal h-9",
                            !dateRange.start && "text-muted-foreground"
                          )}
                        >
                          {dateRange.start ? (
                            format(new Date(dateRange.start), "PPP", { locale: pt })
                          ) : (
                            <span>Escolher data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.start ? new Date(dateRange.start) : undefined}
                          onSelect={(date) =>
                            setDateRange((prev) => ({ ...prev, start: date ? format(date, "yyyy-MM-dd") : "" }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1 flex flex-col">
                    <Label htmlFor="end-date" className="text-xs mb-1">
                      Data Fim
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal h-9",
                            !dateRange.end && "text-muted-foreground"
                          )}
                        >
                          {dateRange.end ? (
                            format(new Date(dateRange.end), "PPP", { locale: pt })
                          ) : (
                            <span>Escolher data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.end ? new Date(dateRange.end) : undefined}
                          onSelect={(date) =>
                            setDateRange((prev) => ({ ...prev, end: date ? format(date, "yyyy-MM-dd") : "" }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                {hasDateFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={clearDateFilter}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar Filtro
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {hasDateFilter && (
            <Button variant="ghost" size="icon" onClick={clearDateFilter}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Projetos
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.projectsInProgress} em curso
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tarefas
            </CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.tasksCompleted} concluídas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Horas Reais
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActualHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalMeetingHours.toFixed(1)}h em reuniões
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reuniões Realizadas
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMeetings}</div>
            <p className="text-xs text-muted-foreground">
              neste período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Specific Section */}
      {currentUser && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-1 border-primary/20 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-primary">
                Minhas Tarefas
              </CardTitle>
              <ListTodo className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.myTasks.filter(t => t.status !== "Concluído").length} / {stats.myTasks.length}
              </div>
              <p className="text-xs text-primary/70">
                Tarefas pendentes / totais
              </p>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle className="text-sm font-medium">As Minhas Tarefas Recentes</CardTitle>
              <Link href="/tarefas">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                  Ver todas
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="py-0">
              <div className="space-y-1 pb-3">
                {stats.myTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0 hover:bg-muted/30 px-2 rounded-md transition-colors">
                    <div className="flex flex-col">
                      <span className="font-medium truncate max-w-[200px]">{task.name}</span>
                      <span className="text-[10px] text-muted-foreground">{task.projectName}</span>
                    </div>
                    <Badge variant="secondary" className={cn("text-[10px] h-5", getStatusColor(task.status))}>
                      {task.status}
                    </Badge>
                  </div>
                ))}
                {stats.myTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Não tens tarefas atribuídas neste período.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* KPI Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Horas por Técnico</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.techData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)', radius: 4 }}
                  contentStyle={{ 
                    backgroundColor: 'var(--background)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)'
                  }}
                  itemStyle={{ color: 'var(--foreground)' }}
                  labelStyle={{ color: 'var(--foreground)' }}
                />
                <Bar 
                  dataKey="hours" 
                  name="Horas Reais" 
                  fill="var(--primary)" 
                  radius={[4, 4, 0, 0]}
                  activeBar={{ opacity: 0.8 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado das Tarefas</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  activeShape={{ opacity: 0.8 }}
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--background)', 
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--foreground)'
                  }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Desempenho de Equipa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.techData.map((tech) => (
                <div key={tech.name} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const color = tech.color || "#6366f1";
                      return (
                        <div 
                          className="w-1.5 h-8 rounded-full" 
                          style={{ backgroundColor: color }}
                        />
                      );
                    })()}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{tech.name}</p>
                        {tech.name !== "Sem Técnico" && (
                          <Badge variant="outline" className="text-[10px] font-bold border-amber-200 text-amber-700 bg-amber-50 h-4 px-1">
                            DEV
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {tech.tasks} tarefas | {tech.meetings} reuniões
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{tech.hours.toFixed(1)}h</p>
                    <p className="text-xs text-muted-foreground">total acumulado</p>
                  </div>
                </div>
              ))}
              {stats.techData.length === 0 && (
                <p className="text-center text-muted-foreground py-4">Sem dados de técnicos disponíveis.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Progress Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Progresso dos Projetos</CardTitle>
            <Link href="/projetos">
              <Button variant="ghost" size="sm" className="gap-1">
                Ver todos
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => {
                  const progress = calculateProjectProgress(project)
                  return (
                    <div key={project.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <Link
                          href={`/projetos/${project.id}`}
                          className="font-medium hover:text-primary hover:underline truncate max-w-[200px]"
                        >
                          {project.name}
                        </Link>
                        <span className="font-medium text-xs">{project.actualHours}h / {project.plannedHours}h</span>
                      </div>
                      <Progress 
                        value={progress} 
                        className="h-2" 
                        indicatorClassName={project.status === "Concluído" ? "bg-emerald-500" : undefined}
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                        <span>{project.company}</span>
                        <span>{progress}%</span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum projeto encontrado.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
