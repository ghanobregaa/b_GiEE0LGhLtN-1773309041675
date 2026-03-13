"use client"

import { useShallow } from "zustand/react/shallow"
import {
  useProjectStore,
  formatDate,
  getStatusColor,
  getPhaseColor,
  calculateProjectProgress,
  type Project,
} from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle2,
  Circle,
  Timer,
  LayoutGrid,
  ListTodo,
  MessagesSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { GanttChart } from "@/components/gantt-chart"

interface PublicProjectDetailProps {
  project: Project
}

export function PublicProjectDetail({ project }: PublicProjectDetailProps) {
  const users = useProjectStore((state) => state.users)
  
  const tasks = useProjectStore(
    useShallow((state) => state.tasks.filter((t) => t.projectId === project.id))
  )
  const meetings = useProjectStore(
    useShallow((state) => state.meetings.filter((m) => m.projectId === project.id))
  )
  
  const progress = calculateProjectProgress(project)

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      {/* Public Header */}
      <div className="flex flex-col gap-4 border-b pb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <LayoutGrid className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">{project.name}</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className={cn(
            "text-sm px-3 py-1",
            project.company === "SAVOY" ? "border-blue-500/30 text-blue-500 bg-blue-500/10" : "border-amber-500/30 text-amber-500 bg-amber-500/10"
          )}>
            {project.company}
          </Badge>
          <Badge variant="secondary" className={cn("text-sm px-3 py-1 font-semibold", getStatusColor(project.status))}>
            {project.status}
          </Badge>
        </div>
        
        <p className="text-lg text-muted-foreground leading-relaxed">
          {project.description}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-md bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Responsável
            </CardTitle>
            <User className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{project.owner}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Início Previsto
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatDate(project.plannedStartDate)}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Fim Previsto
            </CardTitle>
            <Calendar className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatDate(project.plannedEndDate)}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Progresso Geral
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-primary">{progress}%</span>
              <Progress value={progress} className="h-3 flex-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gantt Chart Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          Cronograma do Projeto
        </h2>
        <Card className="overflow-hidden border-none shadow-lg">
          <CardContent className="p-0">
            <GanttChart projects={[project]} isReadOnly />
          </CardContent>
        </Card>
      </div>

      {/* Phases Table */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Fases e Estados
        </h2>
        <Card className="border-none shadow-lg">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold py-4">Fase</TableHead>
                  <TableHead className="font-bold">Técnicos</TableHead>
                  <TableHead className="text-center font-bold">Início</TableHead>
                  <TableHead className="text-center font-bold">Fim</TableHead>
                  <TableHead className="text-center font-bold">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.phases.map((phase) => {
                  const isComplete = phase.actualEndDate !== undefined
                  const isInProgress = phase.actualStartDate !== undefined && !isComplete

                  return (
                    <TableRow key={phase.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3 py-1">
                          <div className={cn("w-2 h-8 rounded-full", getPhaseColor(phase.type))} />
                          <div>
                            <div className="font-bold text-sm uppercase tracking-tight text-muted-foreground">{phase.type}</div>
                            <div className="font-semibold">{phase.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {phase.technicianIds?.map((tid) => {
                            const user = users.find((u) => u.id === tid)
                            return (
                              <Badge key={tid} variant="outline" className="text-[10px] font-medium" style={user ? { borderColor: user.color, color: user.color, backgroundColor: `${user.color}10` } : {}}>
                                {user?.name || tid}
                              </Badge>
                            )
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {formatDate(phase.plannedStartDate)}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {formatDate(phase.plannedEndDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {isComplete ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Concluído
                            </Badge>
                          ) : isInProgress ? (
                            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/10">
                              <Timer className="h-3 w-3 mr-1" /> Em curso
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              <Circle className="h-3 w-3 mr-1" /> Pendente
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tasks */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-primary" />
            Tarefas Ativas
          </h2>
          <Card className="border-none shadow-lg max-h-[500px] overflow-hidden flex flex-col">
            <div className="overflow-y-auto">
              {tasks.length > 0 ? (
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead>Tarefa</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn("text-[10px]", getStatusColor(task.status))}>
                            {task.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground italic">Nenhuma tarefa registada.</div>
              )}
            </div>
          </Card>
        </div>

        {/* Meetings */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessagesSquare className="h-6 w-6 text-primary" />
            Reuniões Realizadas
          </h2>
          <Card className="border-none shadow-lg max-h-[500px] overflow-hidden flex flex-col">
            <div className="overflow-y-auto">
              {meetings.length > 0 ? (
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead>Assunto</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meetings.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.title}</TableCell>
                        <TableCell className="text-sm">{formatDate(m.date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground italic">Nenhuma reunião registada.</div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <footer className="pt-12 pb-8 text-center text-muted-foreground text-sm border-t">
        <p>© {new Date().getFullYear()} Gestão de Projetos - Relatório Público para Clientes</p>
      </footer>
    </div>
  )
}
