"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  useProjectStore,
  formatDate,
  getStatusColor,
  calculateProjectProgress,
} from "@/lib/store"
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
} from "lucide-react"
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

  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  })

  const hasDateFilter = dateRange.start || dateRange.end

  // Filter projects and tasks based on date range
  const { filteredProjects, filteredTasks } = useMemo(() => {
    let filteredProjects = projects
    let filteredTasks = tasks

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
        const taskStart = new Date(t.plannedStartDate)
        const taskEnd = new Date(t.plannedEndDate)

        if (startDate && endDate) {
          return taskStart <= endDate && taskEnd >= startDate
        } else if (startDate) {
          return taskEnd >= startDate
        } else if (endDate) {
          return taskStart <= endDate
        }
        return true
      })
    }

    return { filteredProjects, filteredTasks }
  }, [projects, tasks, dateRange])

  const stats = useMemo(() => {
    const totalProjects = filteredProjects.length
    const projectsInProgress = filteredProjects.filter((p) => p.status === "Em curso").length
    const totalTasks = filteredTasks.length
    const tasksCompleted = filteredTasks.filter((t) => t.status === "Concluído").length
    const totalPlannedHours = filteredProjects.reduce((acc, p) => acc + p.plannedHours, 0)
    const totalActualHours = filteredProjects.reduce((acc, p) => acc + p.actualHours, 0)

    // Technician performance data
    const techniciansMap: Record<string, { name: string; tasks: number; hours: number }> = {}
    filteredTasks.forEach(task => {
      const tech = task.technician || "Sem Técnico"
      if (!techniciansMap[tech]) {
        techniciansMap[tech] = { name: tech, tasks: 0, hours: 0 }
      }
      techniciansMap[tech].tasks += 1
      techniciansMap[tech].hours += (task.actualHours || 0)
    })
    const techData = Object.values(techniciansMap).sort((a, b) => b.hours - a.hours)

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
      totalPlannedHours, 
      totalActualHours,
      techData,
      statusData
    }
  }, [filteredProjects, filteredTasks])

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
                  <div className="space-y-1">
                    <Label htmlFor="start-date" className="text-xs">
                      Data Início
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={dateRange.start}
                      onChange={(e) =>
                        setDateRange((prev) => ({ ...prev, start: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="end-date" className="text-xs">
                      Data Fim
                    </Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={dateRange.end}
                      onChange={(e) =>
                        setDateRange((prev) => ({ ...prev, end: e.target.value }))
                      }
                    />
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
              Horas Realizadas
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActualHours}h</div>
            <p className="text-xs text-muted-foreground">
              de {stats.totalPlannedHours}h previstas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conclusão
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalTasks > 0
                ? Math.round((stats.tasksCompleted / stats.totalTasks) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">tarefas concluídas</p>
          </CardContent>
        </Card>
      </div>

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
                  cursor={{fill: 'hsl(var(--muted)/0.5)'}}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="hours" name="Horas Reais" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
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
                  <div>
                    <p className="font-medium">{tech.name}</p>
                    <p className="text-xs text-muted-foreground">{tech.tasks} tarefas atribuídas</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{tech.hours}h</p>
                    <p className="text-xs text-muted-foreground">total horas reais</p>
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
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{project.company}</span>
                        <span>{project.actualHours}/{project.plannedHours}h</span>
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
