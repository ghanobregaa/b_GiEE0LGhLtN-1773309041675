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
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  X,
} from "lucide-react"

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

  const stats = {
    totalProjects: filteredProjects.length,
    projectsInProgress: filteredProjects.filter((p) => p.status === "Em curso").length,
    totalTasks: filteredTasks.length,
    tasksCompleted: filteredTasks.filter((t) => t.status === "Concluído").length,
    totalPlannedHours: filteredProjects.reduce((acc, p) => acc + p.plannedHours, 0),
    totalActualHours: filteredProjects.reduce((acc, p) => acc + p.actualHours, 0),
  }

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
          <h2 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h2>
          <p className="text-muted-foreground">
            Aqui está um resumo dos seus projetos e tarefas.
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

      {/* Date Filter Active Indicator */}
      {hasDateFilter && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
          <CalendarDays className="h-4 w-4" />
          <span>
            Período:{" "}
            {dateRange.start ? formatDate(dateRange.start) : "Início"} até{" "}
            {dateRange.end ? formatDate(dateRange.end) : "Fim"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 ml-auto"
            onClick={clearDateFilter}
          >
            Limpar
          </Button>
        </div>
      )}

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
            <div className="text-2xl font-bold">{stats.totalActualHours}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.totalPlannedHours} previstas
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

      {/* Projects and Tasks */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Projetos Recentes</CardTitle>
            <Link href="/projetos">
              <Button variant="ghost" size="sm" className="gap-1">
                Ver todos
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => {
                  const progress = calculateProjectProgress(project)
                  return (
                    <Link
                      key={project.id}
                      href={`/projetos/${project.id}`}
                      className="block"
                    >
                      <div className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {project.name}
                            </span>
                            <Badge
                              variant="secondary"
                              className={`${getStatusColor(project.status)} shrink-0`}
                            >
                              {project.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {project.owner}
                          </p>
                        </div>
                        <div className="w-24 shrink-0">
                          <Progress value={progress} className="h-2" />
                          <span className="text-xs text-muted-foreground">
                            {progress}%
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum projeto encontrado no período selecionado.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tarefas Ativas</CardTitle>
            <Link href="/tarefas">
              <Button variant="ghost" size="sm" className="gap-1">
                Ver todas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeTasks.length > 0 ? (
                activeTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    {task.status === "Em curso" ? (
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{task.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.projectName} - {task.technician}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Prazo: {formatDate(task.plannedEndDate)}
                        </span>
                        <Badge
                          variant="secondary"
                          className={getStatusColor(task.status)}
                        >
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  {hasDateFilter
                    ? "Nenhuma tarefa ativa no período selecionado."
                    : "Todas as tarefas estão concluídas!"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso dos Projetos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project) => {
                const progress = calculateProjectProgress(project)
                return (
                  <div key={project.id} className="flex items-center gap-4">
                    <div className="w-48 shrink-0">
                      <Link
                        href={`/projetos/${project.id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {project.name}
                      </Link>
                    </div>
                    <div className="flex-1">
                      <Progress value={progress} className="h-3" />
                    </div>
                    <div className="w-20 text-right text-sm">
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="w-24 text-right text-sm text-muted-foreground">
                      {project.actualHours}/{project.plannedHours}h
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Nenhum projeto encontrado no período selecionado.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
