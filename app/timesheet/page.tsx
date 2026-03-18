"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useProjectStore, type Task, type TimesheetEntry } from "@/lib/store"
import { useAuthStore } from "@/lib/auth-store"
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isWeekend,
  startOfDay
} from "date-fns"
import { pt } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, Clock, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { calculateBusinessHours, cn } from "@/lib/utils"
import { TaskFormDialog } from "@/components/task-form-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

type ViewMode = "week" | "month"

export default function TimesheetPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [weekStartsOn, setWeekStartsOn] = useState<0 | 1>(1)

  const currentUser = useAuthStore((state) => state.user)
  const [selectedTechId, setSelectedTechId] = useState<string>(currentUser?.id || "")

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedTaskDefaultDates, setSelectedTaskDefaultDates] = useState<{ start: string, end: string }>()

  const todayRef = useRef<HTMLDivElement>(null)

  // Log time dialog state
  const [isLogTimeOpen, setIsLogTimeOpen] = useState(false)
  const [logTimeData, setLogTimeData] = useState<{ task?: Task, date: string, hours: number }>({ date: "", hours: 0 })

  const tasks = useProjectStore(state => state.tasks)
  const users = useProjectStore(state => state.users)
  const meetings = useProjectStore(state => state.meetings)
  const holidays = useProjectStore(state => state.holidays)
  const vacations = useProjectStore(state => state.vacations)
  const updateTask = useProjectStore(state => state.updateTask)

  useEffect(() => {
    const savedMode = localStorage.getItem("timesheetViewMode") as ViewMode | null
    if (savedMode === "week" || savedMode === "month") {
      setViewMode(savedMode)
    }
    const savedWeekStart = localStorage.getItem("timesheetWeekStartsOn")
    if (savedWeekStart === "0" || savedWeekStart === "1") {
      setWeekStartsOn(parseInt(savedWeekStart) as 0 | 1)
    }
  }, [])

  useEffect(() => {
    if (viewMode === "month" && todayRef.current) {
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [currentDate, viewMode, weekStartsOn])

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem("timesheetViewMode", mode)
  }

  const handleWeekStartsOnChange = (startsOn: 0 | 1) => {
    setWeekStartsOn(startsOn)
    localStorage.setItem("timesheetWeekStartsOn", startsOn.toString())
  }

  // Navigate functions
  const next = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1))
    else setCurrentDate(addWeeks(currentDate, 1))
  }

  const prev = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1))
    else setCurrentDate(subWeeks(currentDate, 1))
  }

  const goToToday = () => setCurrentDate(new Date())

  // Generate calendar days
  const days = useMemo(() => {
    if (viewMode === "month") {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn })
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn })
      return eachDayOfInterval({ start, end })
    } else {
      const start = startOfWeek(currentDate, { weekStartsOn })
      const end = endOfWeek(currentDate, { weekStartsOn })
      return eachDayOfInterval({ start, end })
    }
  }, [currentDate, viewMode, weekStartsOn])

  // Process tasks mapped to days
  // Only for the selected technician
  const techTasks = tasks.filter(t => t.technicianId === selectedTechId)
  const techMeetings = meetings.filter(m => m.technicians?.includes(selectedTechId))

  const getDayInfo = (day: Date) => {
    let dayCount = 0
    const dayTasks: (Task & { hoursToday: number, isLogged: boolean })[] = []
    const dayMeetings: (any & { hoursToday: number })[] = []
    const dStr = format(day, "yyyy-MM-dd")

    const holiday = holidays.find(h => h.date === dStr)
    const vacation = vacations.find(v =>
      v.technicianId === selectedTechId &&
      dStr >= v.startDate &&
      dStr <= v.endDate
    )

    techTasks.forEach(task => {
      // 1. Check if there is an explicit timesheet entry for this day
      const entry = task.timesheetEntries?.find(e => e.date === dStr)
      if (entry) {
        dayCount += entry.hours
        dayTasks.push({ ...task, hoursToday: entry.hours, isLogged: true })
        return
      }

      // 2. If no entry, check if the task has actual dates for this day
      if (!task.actualStartDate || !task.actualEndDate) return

      const sDate = new Date(task.actualStartDate)
      const eDate = new Date(task.actualEndDate)
      sDate.setHours(0, 0, 0, 0)
      eDate.setHours(0, 0, 0, 0)
      const cDate = new Date(day)
      cDate.setHours(0, 0, 0, 0)

      if (cDate >= sDate && cDate <= eDate) {
        // Only show tentative on business days
        if (!isWeekend(cDate)) {
          dayTasks.push({ ...task, hoursToday: 0, isLogged: false })
        }
      }
    })

    techMeetings.forEach(meeting => {
      if (meeting.date === dStr) {
        const hours = Number(meeting.durationHours) || 0
        dayCount += hours
        dayMeetings.push({ ...meeting, hoursToday: hours })
      }
    })

    return { totalHours: dayCount, tasks: dayTasks, meetings: dayMeetings, holiday, vacation }
  }

  const openNewTask = (day: Date) => {
    const dStr = format(day, "yyyy-MM-dd")
    setSelectedTaskDefaultDates({ start: dStr, end: dStr })
    setEditingTask(null)
    setIsTaskDialogOpen(true)
  }

  const openEditTaskConfig = (task: Task) => {
    setEditingTask(task)
    setIsTaskDialogOpen(true)
  }

  const openLogTime = (task: Task, day: Date, currentHours: number) => {
    setLogTimeData({
      task,
      date: format(day, "yyyy-MM-dd"),
      hours: currentHours
    })
    setIsLogTimeOpen(true)
  }

  const handleSaveTime = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!logTimeData.task) return

    const task = logTimeData.task
    let newEntries = [...(task.timesheetEntries || [])]
    const existingIndex = newEntries.findIndex(e => e.date === logTimeData.date)

    if (existingIndex >= 0) {
      if (logTimeData.hours > 0) {
        newEntries[existingIndex].hours = logTimeData.hours
      } else {
        newEntries.splice(existingIndex, 1)
      }
    } else if (logTimeData.hours > 0) {
      newEntries.push({ date: logTimeData.date, hours: logTimeData.hours })
    }

    const totalHours = newEntries.reduce((sum, t) => sum + t.hours, 0)

    await updateTask(task.id, { timesheetEntries: newEntries, actualHours: totalHours })
    setIsLogTimeOpen(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timesheet</h1>
          <p className="text-muted-foreground mt-2">
            Registo de tarefas e horas diárias
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">Técnico:</span>
            <Select value={selectedTechId} onValueChange={setSelectedTechId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione um técnico..." />
              </SelectTrigger>
              <SelectContent>
                {users.filter(u => u.role === "técnico").map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} {user.id === currentUser?.id ? "(Tu)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center bg-muted rounded-md p-1 border">
            <Button
              variant={weekStartsOn === 1 ? "default" : "ghost"}
              size="sm"
              onClick={() => handleWeekStartsOnChange(1)}
              className="text-xs"
            >
              Seg.
            </Button>
            <Button
              variant={weekStartsOn === 0 ? "default" : "ghost"}
              size="sm"
              onClick={() => handleWeekStartsOnChange(0)}
              className="text-xs"
            >
              Dom.
            </Button>
          </div>

          <div className="flex items-center bg-muted rounded-md p-1 border">
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("week")}
              className="text-xs"
            >
              Semana
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("month")}
              className="text-xs"
            >
              Mês
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 bg-card p-2 px-4 border rounded-xl shadow-sm">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={next}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-xl font-semibold capitalize">
          {viewMode === "month"
            ? format(currentDate, "MMMM yyyy", { locale: pt })
            : `Semana de ${format(startOfWeek(currentDate, { weekStartsOn }), "d MMM", { locale: pt })} a ${format(endOfWeek(currentDate, { weekStartsOn }), "d MMM, yyyy", { locale: pt })}`
          }
        </h2>
        <Button onClick={() => {
          const dStr = format(new Date(), "yyyy-MM-dd")
          setSelectedTaskDefaultDates({ start: dStr, end: dStr })
          setEditingTask(null)
          setIsTaskDialogOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
        </Button>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border bg-card shadow-sm flex flex-col">
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {(weekStartsOn === 1 ? ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] : ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]).map((d, i) => {
            const isWeekendDay = weekStartsOn === 1 ? i >= 5 : (i === 0 || i === 6)
            return (
              <div key={d} className={cn("p-2 py-3 font-semibold text-center text-sm", isWeekendDay && "text-muted-foreground/60")}>
                {d}
              </div>
            )
          })}
        </div>

        <div className={cn(
          "grid grid-cols-7 flex-1",
          viewMode === "month" ? "auto-rows-fr" : "auto-rows-fr min-h-[400px]"
        )}>
          {days.map((day, idx) => {
            const isDiffMonth = viewMode === "month" && !isSameMonth(day, currentDate)
            const currentIsToday = isToday(day)
            const weekend = isWeekend(day)
            const { totalHours, tasks: dayTasks, meetings: dayMeetings, holiday, vacation } = getDayInfo(day)

            const isOverbooked = totalHours > 8
            const isBlocked = holiday || vacation

            return (
              <div
                key={day.toISOString()}
                ref={currentIsToday ? todayRef : null}
                className={cn(
                  "border-r border-b min-h-[140px] p-2 flex flex-col relative group/cell transition-colors overflow-hidden",
                  weekend ? "bg-muted/60 dark:bg-muted/20" : "bg-background hover:bg-muted/20",
                  isDiffMonth && "opacity-40 grayscale-[30%]",
                  currentIsToday && "bg-primary/5 ring-1 ring-primary/40 ring-inset z-10",
                  isBlocked && "bg-red-50/50 dark:bg-red-950/20"
                )}
              >
                <div className="flex items-center justify-between mb-2 z-10">
                  <button
                    onClick={() => openNewTask(day)}
                    title="Adicionar tarefa neste dia"
                    disabled={!!isBlocked}
                    className={cn(
                      "text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full mt-1 ml-1 transition-colors hover:bg-muted cursor-pointer",
                      currentIsToday ? "bg-primary text-primary-foreground shadow-sm hover:opacity-90 hover:bg-primary" : "",
                      isBlocked ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""
                    )}>
                    {format(day, "d")}
                  </button>

                  {totalHours > 0 && (
                    <Badge variant={isOverbooked ? "destructive" : "secondary"} className="text-xs font-mono mr-1">
                      {totalHours.toFixed(1)}h {isOverbooked && "(!)"}
                    </Badge>
                  )}
                </div>

                {/* Bloco de Feriado/Férias visual */}
                {holiday && (
                  <div className="absolute inset-x-0 top-10 flex justify-center opacity-60 pointer-events-none z-0">
                    <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-red-200 uppercase tracking-wider">
                      Feriado: {holiday.name}
                    </span>
                  </div>
                )}
                {vacation && !holiday && (
                  <div className="absolute inset-x-0 top-10 flex justify-center opacity-60 pointer-events-none z-0">
                    <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ring-orange-200 uppercase tracking-wider">
                      Férias
                    </span>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pb-1 pr-1 z-10 w-full mt-2 max-h-[210px]">
                  {dayMeetings.map((mtg, mtgIdx) => (
                    <div
                      key={`mtg-${mtg.id}-${mtgIdx}`}
                      className="text-[11px] p-2 rounded-md border shadow-sm flex flex-col gap-1 relative overflow-hidden bg-orange-100/50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900 cursor-default"
                      title={`${mtg.title} (${mtg.hoursToday.toFixed(1)}h)`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="font-medium line-clamp-2 leading-tight pr-1 text-orange-800 dark:text-orange-200">
                          <Users className="inline h-3 w-3 mr-1" />
                          {mtg.title}
                        </span>
                        <span className="text-orange-700 dark:text-orange-300 font-mono bg-orange-200/50 dark:bg-orange-900/50 px-1 py-0.5 rounded text-[10px] flex-shrink-0 font-bold border border-orange-300/50">
                          {mtg.hoursToday.toFixed(1)}h
                        </span>
                      </div>
                      <span className="text-orange-600/80 dark:text-orange-400/80 text-[10px] truncate max-w-full block">
                        {mtg.projectName || "Reunião"}
                      </span>
                    </div>
                  ))}

                  {dayTasks.map((task, taskIdx) => (
                    <div
                      key={`${task.id}-${taskIdx}`}
                      onClick={() => openLogTime(task, day, task.hoursToday)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openEditTaskConfig(task);
                      }}
                      className={cn(
                        "text-[11px] p-2 rounded-md border shadow-sm flex flex-col gap-1 transition-all hover:border-primary cursor-pointer relative overflow-hidden",
                        task.isLogged ? "bg-primary/10 border-primary/30" : "bg-background hover:bg-muted/50 border-dashed"
                      )}
                      title={`${task.name} (${task.isLogged ? task.hoursToday + 'h logged' : 'Planned - Click to log time'})`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="font-medium line-clamp-2 leading-tight pr-1">
                          {task.name}
                        </span>
                        {task.isLogged ? (
                          <span className="text-primary font-mono bg-primary/20 px-1 py-0.5 rounded text-[10px] flex-shrink-0 font-bold border border-primary/20">
                            {task.hoursToday.toFixed(1)}h
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-mono bg-muted/50 px-1 py-0.5 rounded text-[10px] flex-shrink-0 border border-transparent">
                            Plan
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground text-[10px] truncate max-w-full block">
                        {task.projectName}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <TaskFormDialog
        open={isTaskDialogOpen}
        onOpenChange={(open) => {
          setIsTaskDialogOpen(open)
          if (!open) {
            setTimeout(() => setEditingTask(null), 200)
          }
        }}
        editTask={editingTask}
        defaultDates={selectedTaskDefaultDates}
        defaultUseActualDates={true}
        defaultProjectId={tasks?.[0]?.projectId}
      />

      {/* Dialog for Logging Time */}
      <Dialog open={isLogTimeOpen} onOpenChange={setIsLogTimeOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveTime}>
            <DialogHeader>
              <DialogTitle>Registar Tempo</DialogTitle>
              <DialogDescription>
                Data: {logTimeData.date ? format(new Date(logTimeData.date), "PPP", { locale: pt }) : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1 bg-muted p-3 rounded-lg border">
                <p className="font-medium text-sm">{logTimeData.task?.name}</p>
                <p className="text-xs text-muted-foreground">{logTimeData.task?.projectName}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Horas trabalhadas neste dia</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={logTimeData.hours || ""}
                    onChange={(e) => setLogTimeData({ ...logTimeData, hours: parseFloat(e.target.value) || 0 })}
                    placeholder="Ex: 4"
                    className="w-[120px]"
                    autoFocus
                  />
                  <span className="text-muted-foreground">horas</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsLogTimeOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Horas</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
