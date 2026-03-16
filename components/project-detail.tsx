"use client"

import { useState } from "react"
import Link from "next/link"
import { useShallow } from "zustand/react/shallow"
import {
  useProjectStore,
  formatDate,
  getStatusColor,
  getPhaseColor,
  calculateProjectProgress,
  type Project,
  type Task,
  type Meeting,
  type Phase,
} from "@/lib/store"
import { PhaseFormDialog } from "@/components/phase-form-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TaskFormDialog } from "@/components/task-form-dialog"
import { MeetingFormDialog } from "@/components/meeting-form-dialog"
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle2,
  Circle,
  Timer,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  Share2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/auth-store"

interface ProjectDetailProps {
  project: Project
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const users = useProjectStore((state) => state.users)
  const currentUser = useAuthStore((state) => state.user)
  const isVisitor = currentUser?.role === "visitante"

  // useShallow garante comparação estável — evita o loop infinito
  const tasks = useProjectStore(
    useShallow((state) => state.tasks.filter((t) => t.projectId === project.id))
  )
  const meetings = useProjectStore(
    useShallow((state) => state.meetings.filter((m) => m.projectId === project.id))
  )
  const deleteTask = useProjectStore((state) => state.deleteTask)
  const deleteMeeting = useProjectStore((state) => state.deleteMeeting)
  const deletePhase = useProjectStore((state) => state.deletePhase)

  const [isPhaseDialogOpen, setIsPhaseDialogOpen] = useState(false)
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null)

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const [isMeetingDialogOpen, setIsMeetingDialogOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const progress = calculateProjectProgress(project)

  // Calculate hours from tasks
  const taskHours = {
    planned: tasks.reduce((sum, t) => sum + t.plannedHours, 0),
    actual: tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsTaskDialogOpen(true)
  }

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Tem certeza que deseja eliminar esta tarefa?")) {
      await deleteTask(taskId)
    }
  }

  const handleTaskDialogClose = (open: boolean) => {
    setIsTaskDialogOpen(open)
    if (!open) {
      setEditingTask(null)
    }
  }

  const handleEditMeeting = (m: Meeting) => {
    setEditingMeeting(m)
    setIsMeetingDialogOpen(true)
  }

  const handleDeleteMeeting = async (meetingId: string) => {
    if (confirm("Tem certeza que deseja eliminar esta reunião?")) {
      await deleteMeeting(meetingId)
    }
  }

  const handleMeetingDialogClose = (open: boolean) => {
    setIsMeetingDialogOpen(open)
    if (!open) {
      setEditingMeeting(null)
    }
  }

  const handleEditPhase = (phase: Phase) => {
    setEditingPhase(phase)
    setIsPhaseDialogOpen(true)
  }

  const handleDeletePhase = async (phaseId: string) => {
    if (confirm("Tem certeza que deseja eliminar esta fase?")) {
      await deletePhase(project.id, phaseId)
    }
  }

  const handlePhaseDialogClose = (open: boolean) => {
    setIsPhaseDialogOpen(open)
    if (!open) {
      setEditingPhase(null)
    }
  }

  const handleOpenPublicPage = () => {
    const url = `${window.location.origin}/public/projeto/${project.id}`
    window.open(url, "_blank")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Link href="/projetos">
            <Button variant="ghost" size="sm" className="gap-2 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar aos Projetos
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant="outline" className={project.company === "SAVOY" ? "border-blue-500/30 text-blue-500 bg-blue-500/10" : "border-amber-500/30 text-amber-500 bg-amber-500/10"}>
              {project.company}
            </Badge>
            <Badge variant="secondary" className={cn("font-semibold", getStatusColor(project.status))}>
              {project.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleOpenPublicPage}>
          <Share2 className="h-4 w-4" />
          Abrir Página do Cliente
        </Button>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dono do Projeto
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{project.owner}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Datas Previstas
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">{formatDate(project.plannedStartDate)}</div>
            <div className="text-sm text-muted-foreground">
              {formatDate(project.plannedEndDate)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Datas Reais
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">
              {project.actualStartDate ? formatDate(project.actualStartDate) : "-"}
            </div>
            <div className="text-sm text-muted-foreground">
              {project.actualEndDate ? formatDate(project.actualEndDate) : "-"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Horas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {project.actualHours} / {project.plannedHours}h
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Progress 
                value={progress} 
                className="h-2 flex-1" 
                indicatorClassName={project.status === "Concluído" ? "bg-emerald-500" : undefined}
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {project.actualHours}h / {project.plannedHours}h
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phases Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Fases do Projeto
            </div>
            {!isVisitor && (
              <Button size="sm" onClick={() => setIsPhaseDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Fase
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead className="text-center">Data Início</TableHead>
                <TableHead className="text-center">Data Fim</TableHead>
                <TableHead className="text-center">Horas</TableHead>
                <TableHead className="text-center">Data Início</TableHead>
                <TableHead className="text-center">Data Fim</TableHead>
                <TableHead className="text-center">Horas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
              <TableRow className="bg-muted/50">
                <TableHead colSpan={3}></TableHead>
                <TableHead colSpan={3} className="text-center text-xs font-normal">
                  Previsto
                </TableHead>
                <TableHead colSpan={3} className="text-center text-xs font-normal">
                  Real
                </TableHead>
                <TableHead></TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.phases.map((phase) => {
                const isComplete = phase.actualEndDate !== undefined
                const isInProgress = phase.actualStartDate !== undefined && !isComplete

                return (
                  <TableRow key={phase.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${getPhaseColor(phase.type)}`} />
                        <span className="text-xs font-medium">{phase.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{phase.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {phase.technicianIds && phase.technicianIds.length > 0 ? (
                          phase.technicianIds.map((tid) => {
                            const user = users.find((u) => u.id === tid)
                            return (
                              <Badge
                                key={tid}
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 font-normal"
                                style={user ? {
                                  borderColor: user.color,
                                  backgroundColor: `${user.color}15`,
                                  color: user.color
                                } : {}}
                              >
                                {user?.name || tid}
                              </Badge>
                            )
                          })
                        ) : (
                          <span className="text-muted-foreground text-xs italic">Sem técnicos</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {formatDate(phase.plannedStartDate)}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {formatDate(phase.plannedEndDate)}
                    </TableCell>
                    <TableCell className="text-center text-sm">{phase.plannedHours}</TableCell>
                    <TableCell className="text-center text-sm">
                      {phase.actualStartDate ? formatDate(phase.actualStartDate) : "-"}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {phase.actualEndDate ? formatDate(phase.actualEndDate) : "-"}
                    </TableCell>
                    <TableCell className="text-center text-sm">{phase.actualHours ?? "-"}</TableCell>
                    <TableCell>
                      {isComplete ? (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs">Concluído</span>
                        </div>
                      ) : isInProgress ? (
                        <div className="flex items-center gap-1 text-amber-600">
                          <Timer className="h-4 w-4" />
                          <span className="text-xs">Em curso</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Circle className="h-4 w-4" />
                          <span className="text-xs">Pendente</span>
                        </div>
                      )}
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
                          <DropdownMenuItem onClick={() => handleEditPhase(phase)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {!isVisitor && (
                            <DropdownMenuItem
                              onClick={() => handleDeletePhase(phase.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Visual Phase Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Visual das Fases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {project.phases.map((phase) => {
              const phaseProgress = phase.actualHours
                ? Math.min((phase.actualHours / phase.plannedHours) * 100, 100)
                : 0

              return (
                <div key={phase.id} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-40 shrink-0">
                    <div className={`w-3 h-3 rounded-full ${getPhaseColor(phase.type)}`} />
                    <span className="text-sm font-medium truncate">{phase.type}</span>
                  </div>
                  <div className="flex-1">
                    <div className="relative h-8 bg-muted rounded overflow-hidden">
                      <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700" />
                      <div
                        className={`absolute inset-y-0 left-0 ${getPhaseColor(phase.type)} transition-all duration-500`}
                        style={{ width: `${phaseProgress}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-3">
                        <span className="text-xs font-medium text-white mix-blend-difference">
                          {phase.name}
                        </span>
                        <span className="text-xs font-medium text-white mix-blend-difference">
                          {phase.actualHours ?? 0}/{phase.plannedHours}h
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm text-muted-foreground">
                    {phaseProgress.toFixed(0)}%
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Tarefas do Projeto</span>
              <Badge variant="secondary">{tasks.length} tarefas</Badge>
            </div>
            {!isVisitor && (
              <Button size="sm" onClick={() => setIsTaskDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 ? (
            <>
              <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Total de horas das tarefas: <span className="font-semibold text-foreground">{taskHours.actual}h realizadas</span> / <span className="font-semibold text-foreground">{taskHours.planned}h previstas</span>
                </span>
                <span className="text-muted-foreground">
                  Estas horas contam para o progresso do projeto
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarefa</TableHead>
                    <TableHead>Técnico</TableHead>
                    <TableHead>Requisitante</TableHead>
                    <TableHead className="text-center">Horas Prev.</TableHead>
                    <TableHead className="text-center">Horas Reais</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.name}</TableCell>
                      <TableCell>
                        {(() => {
                          const user = users.find(u => u.id === task.technicianId);
                          const techName = user?.name || task.technicianId || "Sem Técnico";
                          return (
                            <Badge 
                              variant="outline" 
                              className="text-[10px] px-1.5 py-0 font-normal"
                              style={{ 
                                borderColor: user?.color,
                                backgroundColor: user?.color ? `${user.color}15` : undefined,
                                color: user?.color
                              }}
                            >
                              {techName}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                     <TableCell className="text-muted-foreground">{task.requester}</TableCell>
                      <TableCell className="text-center">{task.plannedHours}h</TableCell>
                      <TableCell className="text-center">{task.actualHours ?? "-"}h</TableCell>
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
                            {!isVisitor && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                Este projeto ainda não tem tarefas associadas.
              </p>
              {!isVisitor && (
                <Button onClick={() => setIsTaskDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Tarefa
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={isTaskDialogOpen}
        onOpenChange={handleTaskDialogClose}
        editTask={editingTask}
        defaultProjectId={project.id}
      />

      {/* Meetings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>Reuniões do Projeto</span>
              <Badge variant="secondary">{meetings.length} reuniões</Badge>
            </div>
            {!isVisitor && (
              <Button size="sm" onClick={() => setIsMeetingDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Reunião
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {meetings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead className="text-center">Duração</TableHead>
                  <TableHead>Técnicos</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      <Link href={`/reunioes/${m.id}`} className="hover:underline hover:text-primary">
                        {m.title}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(m.date)}</TableCell>
                    <TableCell>{m.startTime}</TableCell>
                    <TableCell className="text-center">{m.durationHours}h</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {m.technicians.map(tId => {
                          const user = users.find(u => u.id === tId);
                          return (
                            <Badge
                              key={tId}
                              variant="outline"
                              className="text-[10px] font-normal px-1"
                              style={user ? { borderColor: user.color, color: user.color } : {}}
                            >
                              {user?.name || tId}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                   <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditMeeting(m)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {!isVisitor && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteMeeting(m.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>Este projeto ainda não tem reuniões associadas.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <MeetingFormDialog
        open={isMeetingDialogOpen}
        onOpenChange={handleMeetingDialogClose}
        meeting={editingMeeting || undefined}
        defaultProjectId={project.id}
      />

      <PhaseFormDialog
        open={isPhaseDialogOpen}
        onOpenChange={handlePhaseDialogClose}
        projectId={project.id}
        editPhase={editingPhase}
      />
    </div>
  )
}
