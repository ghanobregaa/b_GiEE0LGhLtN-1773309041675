"use client"

import { useState, useMemo } from "react"
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
  isWeekend
} from "date-fns"
import { pt } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, Clock } from "lucide-react"

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
  
  const currentUser = useAuthStore((state) => state.user)
  const [selectedTechId, setSelectedTechId] = useState<string>(currentUser?.id || "")
  
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [selectedTaskDefaultDates, setSelectedTaskDefaultDates] = useState<{start: string, end: string}>()

  // Log time dialog state
  const [isLogTimeOpen, setIsLogTimeOpen] = useState(false)
  const [logTimeData, setLogTimeData] = useState<{ task?: Task, date: string, hours: number }>({ date: "", hours: 0 })

  const tasks = useProjectStore(state => state.tasks)
  const users = useProjectStore(state => state.users)
  const updateTask = useProjectStore(state => state.updateTask)

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
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
      return eachDayOfInterval({ start, end })
    } else {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      return eachDayOfInterval({ start, end })
    }
  }, [currentDate, viewMode])

  // Process tasks mapped to days
  // Only for the selected technician
  const techTasks = tasks.filter(t => t.technicianId === selectedTechId)

  const getDayInfo = (day: Date) => {
    let dayCount = 0
    const dayTasks: (Task & { hoursToday: number, isLogged: boolean })[] = []
    const dStr = format(day, "yyyy-MM-dd")

    techTasks.forEach(task => {
      // 1. Check if there is an explicit timesheet entry for this day
      const entry = task.timesheetEntries?.find(e => e.date === dStr)
      if (entry) {
        dayCount += entry.hours
        dayTasks.push({ ...task, hoursToday: entry.hours, isLogged: true })
        return
      }

      // 2. If no entry, check if the task is planned for this day
      if (!task.plannedStartDate || !task.plannedEndDate) return
      
      const sDate = new Date(task.plannedStartDate)
      const eDate = new Date(task.plannedEndDate)
      sDate.setHours(0,0,0,0)
      eDate.setHours(0,0,0,0)
      const cDate = new Date(day)
      cDate.setHours(0,0,0,0)

      if (cDate >= sDate && cDate <= eDate) {
        // Only show tentative on business days
        if (!isWeekend(cDate)) {
          dayTasks.push({ ...task, hoursToday: 0, isLogged: false })
        }
      }
    })

    return { totalHours: dayCount, tasks: dayTasks }
  }

  const openNewTask = (day: Date) => {
    const dStr = format(day, "yyyy-MM-dd")
    setSelectedTaskDefaultDates({ start: dStr, end: dStr })
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
              variant={viewMode === "week" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setViewMode("week")}
              className="text-xs"
            >
              Semana
            </Button>
            <Button 
              variant={viewMode === "month" ? "default" : "ghost"} 
              size="sm"
              onClick={() => setViewMode("month")}
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
            : `Semana de ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "d MMM", { locale: pt })} a ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "d MMM, yyyy", { locale: pt })}`
          }
        </h2>
        <Button onClick={() => {
          const dStr = format(new Date(), "yyyy-MM-dd")
          setSelectedTaskDefaultDates({ start: dStr, end: dStr })
          setIsTaskDialogOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
        </Button>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border bg-card shadow-sm flex flex-col">
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d, i) => (
            <div key={d} className={cn("p-2 py-3 font-semibold text-center text-sm", i >= 5 && "text-muted-foreground/60")}>
              {d}
            </div>
          ))}
        </div>
        
        <div className={cn(
          "grid grid-cols-7 flex-1",
          viewMode === "month" ? "auto-rows-fr" : "auto-rows-fr min-h-[400px]"
        )}>
          {days.map((day, idx) => {
            const isDiffMonth = viewMode === "month" && !isSameMonth(day, currentDate)
            const currentIsToday = isToday(day)
            const weekend = isWeekend(day)
            const { totalHours, tasks: dayTasks } = getDayInfo(day)
            
            const isOverbooked = totalHours > 8

            return (
              <div 
                key={day.toISOString()} 
                className={cn(
                  "border-r border-b min-h-[140px] p-2 flex flex-col relative group/cell transition-colors overflow-hidden",
                  isDiffMonth && "bg-muted/30 opacity-60",
                  currentIsToday && "bg-primary/5",
                  weekend && "bg-muted/10",
                  !weekend && "hover:bg-muted/20"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full mt-1 ml-1",
                    currentIsToday ? "bg-primary text-primary-foreground shadow-sm" : ""
                  )}>
                    {format(day, "d")}
                  </span>
                  
                  {totalHours > 0 && (
                    <Badge variant={isOverbooked ? "destructive" : "secondary"} className="text-xs font-mono mr-1">
                      {totalHours.toFixed(1)}h {isOverbooked && "(!)"}
                    </Badge>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 hide-scrollbar pb-8 z-10 w-full">
                  {dayTasks.map((task, taskIdx) => (
                    <div 
                      key={`${task.id}-${taskIdx}`} 
                      onClick={() => openLogTime(task, day, task.hoursToday)}
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

                {!weekend && (
                  <button 
                    onClick={() => openNewTask(day)}
                    title="Adicionar tarefa neste dia"
                    className="absolute inset-0 w-full h-full opacity-0 group-hover/cell:opacity-100 bg-black/0 flex flex-col justify-end transition-all cursor-pointer z-0 pointer-events-auto"
                  >
                    <div className="flex justify-center pb-2 translate-y-4 group-hover/cell:translate-y-0 transition-transform duration-200">
                      <div className="bg-primary text-primary-foreground shadow-md rounded-full p-2 hover:scale-110 transition-transform">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <TaskFormDialog 
        open={isTaskDialogOpen} 
        onOpenChange={setIsTaskDialogOpen}
        defaultDates={selectedTaskDefaultDates}
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
