"use client"

import { create } from "zustand"
import {
  type Project,
  type Task,
  type Phase,
  type ProjectStatus,
  type TaskStatus,
  type PhaseType,
  type Company,
  type User,
  type Meeting,
  type MeetingChecklistItem,
} from "./data"

import { getApiUrl } from "./api-config"
import { io, Socket } from "socket.io-client"

const API_URL = getApiUrl()

// ─── MAPPERS: snake_case (DB) → camelCase (Frontend) ──────────────────────────

const mapUser = (u: any): User => ({
  id: String(u.id),
  username: u.username,
  name: u.name,
  color: u.color,
  role: u.role || "técnico",
  createdAt: u.created_at,
})

const mapPhase = (ph: any): Phase => ({
  id: String(ph.id),
  type: ph.type as PhaseType,
  name: ph.name,
  technicianIds: ph.technician_ids || (ph.technician_id ? [String(ph.technician_id)] : (ph.technician ? [String(ph.technician)] : [])),
  plannedStartDate: ph.planned_start_date,
  plannedEndDate: ph.planned_end_date,
  plannedHours: Number(ph.planned_hours || 0),
  actualStartDate: ph.actual_start_date ?? undefined,
  actualEndDate: ph.actual_end_date ?? undefined,
  actualHours: ph.actual_hours != null ? Number(ph.actual_hours) : undefined,
})

const mapProject = (p: any): Project => ({
  id: String(p.id),
  name: p.name,
  description: p.description ?? "",
  owner: p.owner,
  status: p.status as ProjectStatus,
  company: (p.company || "SAVOY") as Company,
  plannedStartDate: p.planned_start_date,
  plannedEndDate: p.planned_end_date,
  plannedHours: Number(p.planned_hours || 0),
  actualStartDate: p.actual_start_date ?? undefined,
  actualEndDate: p.actual_end_date ?? undefined,
  actualHours: Number(p.actual_hours || 0),
  phases: (p.phases || []).map(mapPhase),
})

const mapTask = (t: any): Task => ({
  id: String(t.id),
  projectId: String(t.project_id),
  phaseId: t.phase_id ? String(t.phase_id) : undefined,
  projectName: t.project_name || "",
  name: t.name,
  ticket: t.ticket ?? undefined,
  technicianId: t.technician_id || t.technician || "", // Fallback para migração
  requester: t.requester,
  plannedStartDate: t.planned_start_date,
  plannedEndDate: t.planned_end_date,
  plannedHours: Number(t.planned_hours || 0),
  status: t.status as TaskStatus,
  actualStartDate: t.actual_start_date ?? undefined,
  actualEndDate: t.actual_end_date ?? undefined,
  actualHours: t.actual_hours != null ? Number(t.actual_hours) : undefined,
})

const mapMeeting = (m: any): Meeting => ({
  id: String(m.id),
  title: m.title,
  projectId: m.project_id ? String(m.project_id) : undefined,
  projectName: m.project_name || "",
  date: m.date,
  startTime: m.start_time || "09:00",
  durationHours: Number(m.duration_hours || 0),
  technicians: m.technicians || [],
  attendees: m.attendees || "",
  notes: m.notes || "",
  checklist: m.checklist || [],
})

// ─── HELPERS: camelCase (Frontend) → snake_case (API) ─────────────────────────

const phaseToApi = (p: Partial<Phase>) => ({
  ...(p.type !== undefined && { type: p.type }),
  ...(p.name !== undefined && { name: p.name }),
  ...(p.technicianIds !== undefined && { technician_ids: p.technicianIds }),
  ...(p.plannedStartDate !== undefined && { planned_start_date: p.plannedStartDate }),
  ...(p.plannedEndDate !== undefined && { planned_end_date: p.plannedEndDate }),
  ...(p.plannedHours !== undefined && { planned_hours: p.plannedHours }),
  ...(p.actualStartDate !== undefined && { actual_start_date: p.actualStartDate }),
  ...(p.actualEndDate !== undefined && { actual_end_date: p.actualEndDate }),
  ...(p.actualHours !== undefined && { actual_hours: p.actualHours }),
})

const projectToApi = (p: Partial<Project>) => ({
  ...(p.name !== undefined && { name: p.name }),
  ...(p.description !== undefined && { description: p.description }),
  ...(p.owner !== undefined && { owner: p.owner }),
  ...(p.status !== undefined && { status: p.status }),
  ...(p.company !== undefined && { company: p.company }),
  ...(p.plannedStartDate !== undefined && { planned_start_date: p.plannedStartDate }),
  ...(p.plannedEndDate !== undefined && { planned_end_date: p.plannedEndDate }),
  ...(p.plannedHours !== undefined && { planned_hours: p.plannedHours }),
  ...(p.actualStartDate !== undefined && { actual_start_date: p.actualStartDate }),
  ...(p.actualEndDate !== undefined && { actual_end_date: p.actualEndDate }),
  ...(p.actualHours !== undefined && { actual_hours: p.actualHours }),
})

const taskToApi = (t: Partial<Task & { projectId?: string }>) => ({
  ...(t.projectId !== undefined && { project_id: t.projectId }),
  ...(t.phaseId !== undefined && { phase_id: t.phaseId || null }),
  ...(t.name !== undefined && { name: t.name }),
  ...(t.ticket !== undefined && { ticket: t.ticket }),
  ...(t.technicianId !== undefined && { technician_id: t.technicianId || null }),
  ...(t.requester !== undefined && { requester: t.requester }),
  ...(t.plannedStartDate !== undefined && { planned_start_date: t.plannedStartDate }),
  ...(t.plannedEndDate !== undefined && { planned_end_date: t.plannedEndDate }),
  ...(t.plannedHours !== undefined && { planned_hours: t.plannedHours }),
  ...(t.actualStartDate !== undefined && { actual_start_date: t.actualStartDate }),
  ...(t.actualEndDate !== undefined && { actual_end_date: t.actualEndDate }),
  ...(t.actualHours !== undefined && { actual_hours: t.actualHours }),
  ...(t.status !== undefined && { status: t.status }),
})

const meetingToApi = (m: Partial<Meeting>) => ({
  ...(m.title !== undefined && { title: m.title }),
  ...(m.projectId !== undefined && { project_id: m.projectId }),
  ...(m.date !== undefined && { date: m.date }),
  ...(m.startTime !== undefined && { start_time: m.startTime }),
  ...(m.durationHours !== undefined && { duration_hours: m.durationHours }),
  ...(m.technicians !== undefined && { technicians: m.technicians }),
  ...(m.attendees !== undefined && { attendees: m.attendees }),
  ...(m.notes !== undefined && { notes: m.notes }),
  ...(m.checklist !== undefined && { checklist: m.checklist }),
})

// lazy socket connection
let socket: Socket | null = null
const getSocket = () => {
  if (socket) return socket
  if (typeof window === "undefined") return null

  try {
    const socketUrl = API_URL.replace("/api", "")
    socket = io(socketUrl, {
      transports: ["polling", "websocket"],
      reconnection: true,
      autoConnect: true,
    })
    return socket
  } catch (err) {
    console.error("Socket initialization error:", err)
    return null
  }
}

// ─── STORE ────────────────────────────────────────────────────────────────────

interface ProjectStore {
  projects: Project[]
  tasks: Task[]
  users: User[]
  meetings: Meeting[]
  isLoading: boolean
  error: string | null

  // Data fetching
  fetchData: () => Promise<void>
  fetchUsers: () => Promise<void>

  // Project actions
  addProject: (project: Omit<Project, "id" | "actualHours">) => Promise<string>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  getProjectById: (id: string) => Project | undefined

  // Phase actions
  addPhase: (projectId: string, phase: Omit<Phase, "id">) => Promise<void>
  updatePhase: (projectId: string, phaseId: string, updates: Partial<Phase>) => Promise<void>
  deletePhase: (projectId: string, phaseId: string) => Promise<void>

  // Task actions
  addTask: (task: Omit<Task, "id" | "projectName">) => Promise<string>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  getTasksByProjectId: (projectId: string) => Task[]

  // Meeting actions
  addMeeting: (meeting: Omit<Meeting, "id" | "projectName">) => Promise<string>
  updateMeeting: (id: string, updates: Partial<Meeting>) => Promise<void>
  deleteMeeting: (id: string) => Promise<void>

  recalculateProjectHours: (projectId: string) => Promise<void>
  recalculatePhaseHours: (phaseId: string) => Promise<void>
  
  initializeRealtime: () => void
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  tasks: [],
  users: [],
  meetings: [],
  isLoading: false,
  error: null,

  // ─── FETCH ────────────────────────────────────────────────────────────────

  fetchData: async () => {
    set({ isLoading: true, error: null })
    try {
      const [projectsRes, tasksRes, usersRes, meetingsRes] = await Promise.all([
        fetch(`${API_URL}/projects`),
        fetch(`${API_URL}/tasks`),
        fetch(`${API_URL}/users`),
        fetch(`${API_URL}/meetings`),
      ])

      if (!projectsRes.ok || !tasksRes.ok || !usersRes.ok || !meetingsRes.ok) {
        throw new Error("Erro ao carregar dados do servidor")
      }

      const rawProjects = await projectsRes.json()
      const rawTasks = await tasksRes.json()
      const rawUsers = await usersRes.json()
      const rawMeetings = await meetingsRes.json()

      const mappedTasks: Task[] = rawTasks.map(mapTask)
      const mappedProjects: Project[] = rawProjects.map(mapProject)
      const mappedUsers: User[] = rawUsers.map(mapUser)
      const mappedMeetings: Meeting[] = rawMeetings.map(mapMeeting)

      // Recalcula as horas reais de cada projecto com base nas suas tarefas e reuniões
      const projectsWithHours = mappedProjects.map((p) => {
        const projectTasks = mappedTasks.filter((t) => t.projectId === p.id)
        const totalActualHours = projectTasks.reduce(
          (sum, t) => sum + (Number(t.actualHours) || 0),
          0
        )
        const projectMeetings = mappedMeetings.filter((m) => m.projectId === p.id)
        const totalMeetingHours = projectMeetings.reduce(
          (sum, m) => sum + (Number(m.durationHours) || 0),
          0
        )
        return { ...p, actualHours: totalActualHours + totalMeetingHours }
      })

      set({
        projects: projectsWithHours,
        tasks: mappedTasks,
        users: mappedUsers,
        meetings: mappedMeetings,
        isLoading: false,
      })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  initializeRealtime: () => {
    const s = getSocket()
    if (!s) return

    s.off('data_changed') // Evita múltiplos listeners
    s.on('data_changed', (payload: any) => {
      console.log('Real-time update received:', payload)
      get().fetchData()
    })

    if (!s.connected) {
      s.on('connect', () => console.log('WebSocket connected to backend'))
      s.on('disconnect', () => console.log('WebSocket disconnected'))
    }
  },

  fetchUsers: async () => {
    try {
      const res = await fetch(`${API_URL}/users`)
      if (res.ok) {
        const raw = await res.json()
        set({ users: raw.map(mapUser) })
      }
    } catch (err) {}
  },

  // ─── PROJECTS ─────────────────────────────────────────────────────────────

  addProject: async (projectData) => {
    // 1. Cria o projecto
    const res = await fetch(`${API_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectToApi(projectData)),
    })
    if (!res.ok) throw new Error("Erro ao criar projecto")
    const newRaw = await res.json()
    const projectId = newRaw.id

    // 2. Cria as fases associadas (em paralelo)
    const phases = projectData.phases || []
    const phaseResults = await Promise.all(
      phases.map((phase) =>
        fetch(`${API_URL}/projects/${projectId}/phases`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(phaseToApi(phase)),
        }).then((r) => r.json())
      )
    )

    const newProject = mapProject({ ...newRaw, phases: phaseResults })
    set((state) => ({ projects: [...state.projects, newProject] }))
    return String(projectId)
  },

  updateProject: async (id, updates) => {
    // Envia apenas os campos de projecto à API (sem phases)
    const { phases, ...projectFields } = updates as any
    await fetch(`${API_URL}/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectToApi(projectFields)),
    })

    // Trata fases actualizadas localmente e na BD
    if (phases !== undefined) {
      const currentProject = get().projects.find((p) => p.id === id)
      const currentPhases = currentProject?.phases || []

      for (const phase of phases as Phase[]) {
        const isNewPhase = !phase.id || phase.id === "__new__"
        if (isNewPhase) {
          // Nova fase — cria na BD
          await fetch(`${API_URL}/projects/${id}/phases`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(phaseToApi(phase)),
          })
        } else if (currentPhases.find((cp) => cp.id === phase.id)) {
          // Fase existente — actualiza
          await fetch(`${API_URL}/phases/${phase.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(phaseToApi(phase)),
          })
        }
      }

      // Elimina fases que foram removidas
      const updatedPhaseIds = phases
        .map((p: Phase) => p.id)
        .filter((pid: string) => pid && pid !== "__new__")
      for (const cp of currentPhases) {
        if (!updatedPhaseIds.includes(cp.id)) {
          await fetch(`${API_URL}/phases/${cp.id}`, { method: "DELETE" })
        }
      }
    }

    // Re-fetch o projecto actualizado da BD para garantir dados consistentes
    const freshRes = await fetch(`${API_URL}/projects/${id}`)
    if (freshRes.ok) {
      const freshRaw = await freshRes.json()
      const freshProject = mapProject(freshRaw)
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? freshProject : p)),
      }))
    }
  },

  deleteProject: async (id) => {
    await fetch(`${API_URL}/projects/${id}`, { method: "DELETE" })
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      tasks: state.tasks.filter((t) => t.projectId !== id),
    }))
  },

  getProjectById: (id) => {
    return get().projects.find((p) => p.id === id)
  },

  // ─── PHASES ───────────────────────────────────────────────────────────────

  addPhase: async (projectId, phaseData) => {
    const res = await fetch(`${API_URL}/projects/${projectId}/phases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(phaseToApi(phaseData)),
    })
    const newRaw = await res.json()
    const newPhase = mapPhase(newRaw)

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              phases: [...p.phases, newPhase],
              plannedHours: p.plannedHours + phaseData.plannedHours,
            }
          : p
      ),
    }))
  },

  updatePhase: async (projectId, phaseId, updates) => {
    await fetch(`${API_URL}/phases/${phaseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(phaseToApi(updates)),
    })

    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p
        const updatedPhases = p.phases.map((ph) =>
          ph.id === phaseId ? { ...ph, ...updates } : ph
        )
        return {
          ...p,
          phases: updatedPhases,
          plannedHours: updatedPhases.reduce((sum, ph) => sum + ph.plannedHours, 0),
        }
      }),
    }))
  },

  deletePhase: async (projectId, phaseId) => {
    await fetch(`${API_URL}/phases/${phaseId}`, { method: "DELETE" })

    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p
        const deletedPhase = p.phases.find((ph) => ph.id === phaseId)
        return {
          ...p,
          phases: p.phases.filter((ph) => ph.id !== phaseId),
          plannedHours: p.plannedHours - (deletedPhase?.plannedHours || 0),
        }
      }),
    }))
  },

  // ─── TASKS ────────────────────────────────────────────────────────────────

  addTask: async (taskData) => {
    const res = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskToApi(taskData)),
    })
    if (!res.ok) throw new Error("Erro ao criar tarefa")
    const newRaw = await res.json()
    const newTask = mapTask(newRaw)

    set((state) => ({ tasks: [...state.tasks, newTask] }))
    if (taskData.phaseId) await get().recalculatePhaseHours(taskData.phaseId)
    await get().recalculateProjectHours(taskData.projectId)
    return newTask.id
  },

  updateTask: async (id, updates) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return

    await fetch(`${API_URL}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskToApi(updates)),
    })

    let projectName = task.projectName
    if (updates.projectId && updates.projectId !== task.projectId) {
      const newProject = get().projects.find((p) => p.id === updates.projectId)
      projectName = newProject?.name || ""
    }

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, projectName } : t
      ),
    }))

    // Recalcula horas da fase (antiga e nova)
    const oldPhaseId = task.phaseId
    const newPhaseId = (updates as Task).phaseId
    if (oldPhaseId) await get().recalculatePhaseHours(oldPhaseId)
    if (newPhaseId && newPhaseId !== oldPhaseId) await get().recalculatePhaseHours(newPhaseId)

    await get().recalculateProjectHours(task.projectId)
    if (updates.projectId && updates.projectId !== task.projectId) {
      await get().recalculateProjectHours(updates.projectId)
    }
  },

  deleteTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return

    await fetch(`${API_URL}/tasks/${id}`, { method: "DELETE" })
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
    if (task.phaseId) await get().recalculatePhaseHours(task.phaseId)
    await get().recalculateProjectHours(task.projectId)
  },

  getTasksByProjectId: (projectId) => {
    return get().tasks.filter((t) => t.projectId === projectId)
  },

  // ─── MEETINGS ─────────────────────────────────────────────────────────────

  addMeeting: async (meetingData) => {
    const res = await fetch(`${API_URL}/meetings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meetingToApi(meetingData)),
    })
    const resData = await res.json()
    if (!res.ok) {
      throw new Error(resData.error || "Erro ao criar reunião")
    }
    const newMeeting = mapMeeting(resData)

    set((state) => ({ meetings: [...state.meetings, newMeeting] }))
    if (meetingData.projectId) {
      await get().recalculateProjectHours(meetingData.projectId)
    }
    return newMeeting.id
  },

  updateMeeting: async (id, updates) => {
    const meeting = get().meetings.find((m) => m.id === id)
    if (!meeting) return

    const res = await fetch(`${API_URL}/meetings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meetingToApi(updates)),
    })
    
    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || "Erro ao atualizar reunião")
    }

    let projectName = meeting.projectName
    if (updates.projectId && updates.projectId !== meeting.projectId) {
      const newProject = get().projects.find((p) => p.id === updates.projectId)
      projectName = newProject?.name || ""
    }

    set((state) => ({
      meetings: state.meetings.map((m) =>
        m.id === id ? { ...m, ...updates, projectName } : m
      ),
    }))

    if (meeting.projectId) await get().recalculateProjectHours(meeting.projectId)
    if (updates.projectId && updates.projectId !== meeting.projectId) {
      await get().recalculateProjectHours(updates.projectId)
    }
  },

  deleteMeeting: async (id) => {
    const meeting = get().meetings.find((m) => m.id === id)
    if (!meeting) return

    await fetch(`${API_URL}/meetings/${id}`, { method: "DELETE" })
    set((state) => ({ meetings: state.meetings.filter((m) => m.id !== id) }))
    
    if (meeting.projectId) {
      await get().recalculateProjectHours(meeting.projectId)
    }
  },

  // ─── UTILS ────────────────────────────────────────────────────────────────

  recalculateProjectHours: async (projectId) => {
    const project = get().projects.find(p => p.id === projectId)
    if (!project) return

    const tasks = get().tasks.filter((t) => t.projectId === projectId)
    const taskActualHours = tasks.reduce(
      (sum, t) => sum + (Number(t.actualHours) || 0),
      0
    )

    const meetings = get().meetings.filter((m) => m.projectId === projectId)
    const meetingActualHours = meetings.reduce(
      (sum, m) => sum + (Number(m.durationHours) || 0),
      0
    )

    const totalActualHours = taskActualHours + meetingActualHours

    // Lógica de datas baseada nas fases
    let actualStartDate: string | undefined = undefined
    let actualEndDate: string | undefined = undefined
    let status = project.status

    const phases = project.phases
    if (phases.length > 0) {
      // Início: a primeira data de início real das fases
      const startDates = phases.map(p => p.actualStartDate).filter(Boolean) as string[]
      if (startDates.length > 0) {
        actualStartDate = startDates.reduce((min, s) => s < min ? s : min)
      }

      // Fim: a última data de fim real, se TODAS as fases estiverem concluídas
      const allPhasesDone = phases.every(p => p.actualEndDate)
      if (allPhasesDone) {
        const endDates = phases.map(p => p.actualEndDate).filter(Boolean) as string[]
        if (endDates.length > 0) {
          actualEndDate = endDates.reduce((max, s) => s > max ? s : max)
          status = "Concluído"
        }
      } else if (actualStartDate) {
        // Se já começou mas nem tudo terminou
        if (status === "Novo") status = "Em curso"
      }
    }

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? {
          ...p,
          actualHours: totalActualHours,
          actualStartDate,
          actualEndDate,
          status
        } : p
      ),
    }))

    await fetch(`${API_URL}/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actualHours: totalActualHours,
        actualStartDate: actualStartDate || null,
        actualEndDate: actualEndDate || null,
        status
      }),
    })
  },

  recalculatePhaseHours: async (phaseId) => {
    const tasks = get().tasks.filter((t) => t.phaseId === phaseId)
    const totalActualHours = tasks.reduce(
      (sum, t) => sum + (Number(t.actualHours) || 0),
      0
    )

    // Lógica de datas automáticas para a fase
    let actualStartDate: string | undefined = undefined
    let actualEndDate: string | undefined = undefined

    if (tasks.length > 0) {
      // Data início: a mais antiga das tarefas
      const startDates = tasks
        .map((t) => t.actualStartDate)
        .filter(Boolean) as string[]
      if (startDates.length > 0) {
        actualStartDate = startDates.reduce((min, s) => (s < min ? s : min))
      }

      // Data fim: só se TODAS as tarefas estiverem concluídas
      const allDone = tasks.every((t) => t.status === "Concluído")
      if (allDone) {
        const endDates = tasks
          .map((t) => t.actualEndDate)
          .filter(Boolean) as string[]
        if (endDates.length > 0) {
          actualEndDate = endDates.reduce((max, s) => (s > max ? s : max))
        } else {
          // Se todas estão concluídas mas não há datas, usamos hoje como fallback
          actualEndDate = new Date().toISOString().split("T")[0]
        }
      }
    }

    // Actualiza a fase localmente
    set((state) => ({
      projects: state.projects.map((p) => ({
        ...p,
        phases: p.phases.map((ph) =>
          ph.id === phaseId
            ? { ...ph, actualHours: totalActualHours, actualStartDate, actualEndDate }
            : ph
        ),
      })),
    }))

    // Persiste na BD
    await fetch(`${API_URL}/phases/${phaseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actualHours: totalActualHours,
        actualStartDate: actualStartDate || null,
        actualEndDate: actualEndDate || null,
      }),
    })
  },
}))

// Re-export types and helper functions
export type { Project, Task, Phase, ProjectStatus, TaskStatus, PhaseType, Company, User, Meeting, MeetingChecklistItem }
export {
  formatDate,
  getStatusColor,
  getPhaseColor,
  calculateProjectProgress,
} from "./data"
