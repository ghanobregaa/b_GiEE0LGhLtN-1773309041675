"use client"

import { useState, useMemo } from "react"
import { useProjectStore, formatDate, getStatusColor, type Task } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { TaskFormDialog } from "@/components/task-form-dialog"
import {
  ChevronDown,
  ChevronRight,
  Search,
  ListTodo,
  Clock,
  CheckCircle,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  CalendarDays,
  X,
} from "lucide-react"

export function TasksList() {
  const tasks = useProjectStore((state) => state.tasks)
  const deleteTask = useProjectStore((state) => state.deleteTask)

  const [searchQuery, setSearchQuery] = useState("")
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  })

  const hasDateFilter = dateRange.start || dateRange.end

  // Group tasks by project
  const groupedTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const matchesSearch =
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.technician.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.requester.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || task.status === statusFilter

      // Date filter
      let matchesDate = true
      if (dateRange.start || dateRange.end) {
        const taskStart = new Date(task.plannedStartDate)
        const taskEnd = new Date(task.plannedEndDate)
        const startDate = dateRange.start ? new Date(dateRange.start) : null
        const endDate = dateRange.end ? new Date(dateRange.end) : null

        if (startDate && endDate) {
          matchesDate = taskStart <= endDate && taskEnd >= startDate
        } else if (startDate) {
          matchesDate = taskEnd >= startDate
        } else if (endDate) {
          matchesDate = taskStart <= endDate
        }
      }

      return matchesSearch && matchesStatus && matchesDate
    })

    const grouped = filtered.reduce(
      (acc, task) => {
        if (!acc[task.projectName]) {
          acc[task.projectName] = []
        }
        acc[task.projectName].push(task)
        return acc
      },
      {} as Record<string, Task[]>
    )

    return grouped
  }, [tasks, searchQuery, statusFilter, dateRange])

  const toggleProject = (projectName: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev)
      if (next.has(projectName)) {
        next.delete(projectName)
      } else {
        next.add(projectName)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedProjects(new Set(Object.keys(groupedTasks)))
  }

  const collapseAll = () => {
    setExpandedProjects(new Set())
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsDialogOpen(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Tem certeza que deseja eliminar esta tarefa?")) {
      await deleteTask(taskId)
    }
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingTask(null)
    }
  }

  const clearDateFilter = () => {
    setDateRange({ start: "", end: "" })
  }

  // Stats - based on filtered tasks
  const filteredTasksList = Object.values(groupedTasks).flat()
  const stats = useMemo(() => {
    const total = filteredTasksList.length
    const concluidas = filteredTasksList.filter((t) => t.status === "Concluído").length
    const emCurso = filteredTasksList.filter((t) => t.status === "Em curso").length
    const totalHorasPrev = filteredTasksList.reduce((acc, t) => acc + t.plannedHours, 0)
    const totalHorasReais = filteredTasksList.reduce((acc, t) => acc + (t.actualHours || 0), 0)

    return { total, concluidas, emCurso, totalHorasPrev, totalHorasReais }
  }, [filteredTasksList])

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tarefas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as tarefas dos seus projetos
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tarefas
            </CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              em {Object.keys(groupedTasks).length} projetos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concluídas
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.concluidas}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.concluidas / stats.total) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Curso
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emCurso}</div>
            <p className="text-xs text-muted-foreground">tarefas ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Horas
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalHorasReais}/{stats.totalHorasPrev}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalHorasPrev > 0
                ? Math.round((stats.totalHorasReais / stats.totalHorasPrev) * 100)
                : 0}
              % realizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar tarefas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                {hasDateFilter ? "Filtro Ativo" : "Período"}
                {hasDateFilter && (
                  <Badge variant="secondary" className="ml-1">
                    1
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Filtrar por Período</h4>
                  <p className="text-sm text-muted-foreground">
                    Selecione o intervalo de datas.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="task-start-date" className="text-xs">
                      Data Início
                    </Label>
                    <Input
                      id="task-start-date"
                      type="date"
                      value={dateRange.start}
                      onChange={(e) =>
                        setDateRange((prev) => ({ ...prev, start: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="task-end-date" className="text-xs">
                      Data Fim
                    </Label>
                    <Input
                      id="task-end-date"
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
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearDateFilter}>
              <X className="h-4 w-4" />
            </Button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              <option value="all">Todos</option>
              <option value="Pendente">Pendente</option>
              <option value="Em curso">Em curso</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={expandAll} className="text-sm text-primary hover:underline">
              Expandir
            </button>
            <span className="text-muted-foreground">/</span>
            <button onClick={collapseAll} className="text-sm text-primary hover:underline">
              Colapsar
            </button>
          </div>
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

      {/* Tasks grouped by Project */}
      <div className="space-y-4">
        {Object.entries(groupedTasks).map(([projectName, projectTasks]) => {
          const isExpanded = expandedProjects.has(projectName)
          const totalHoras = projectTasks.reduce((acc, t) => acc + t.plannedHours, 0)
          const horasReais = projectTasks.reduce((acc, t) => acc + (t.actualHours || 0), 0)

          return (
            <Card key={projectName}>
              <Collapsible open={isExpanded} onOpenChange={() => toggleProject(projectName)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <CardTitle className="text-lg">Projeto: {projectName}</CardTitle>
                        <Badge variant="outline">{projectTasks.length}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Horas: {horasReais}/{totalHoras}
                        </span>
                        <span>
                          Concluídas:{" "}
                          {projectTasks.filter((t) => t.status === "Concluído").length}/
                          {projectTasks.length}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tarefa</TableHead>
                          <TableHead>Ticket</TableHead>
                          <TableHead>Técnico</TableHead>
                          <TableHead>Requisitante</TableHead>
                          <TableHead className="text-center">Data Início Prev.</TableHead>
                          <TableHead className="text-center">Data Fim Prev.</TableHead>
                          <TableHead className="text-center">Horas Prev.</TableHead>
                          <TableHead className="text-center">Data Início Real</TableHead>
                          <TableHead className="text-center">Data Fim Real</TableHead>
                          <TableHead className="text-center">Horas Reais</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectTasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {task.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {task.ticket || "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {task.technician}
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-[120px] truncate">
                              {task.requester}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {formatDate(task.plannedStartDate)}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {formatDate(task.plannedEndDate)}
                            </TableCell>
                            <TableCell className="text-center">{task.plannedHours}</TableCell>
                            <TableCell className="text-center text-sm">
                              {task.actualStartDate ? formatDate(task.actualStartDate) : "-"}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {task.actualEndDate ? formatDate(task.actualEndDate) : "-"}
                            </TableCell>
                            <TableCell className="text-center">{task.actualHours ?? "-"}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={getStatusColor(task.status)}>
                                {task.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Ações</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditTask(task)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )
        })}

        {Object.keys(groupedTasks).length === 0 && (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                Nenhuma tarefa encontrada com os filtros selecionados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Task Form Dialog */}
      <TaskFormDialog open={isDialogOpen} onOpenChange={handleDialogClose} editTask={editingTask} />
    </div>
  )
}
