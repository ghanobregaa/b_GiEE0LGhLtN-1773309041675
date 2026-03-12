export type ProjectStatus = "Novo" | "Em curso" | "Concluído" | "Suspenso"
export type TaskStatus = "Pendente" | "Em curso" | "Concluído"
export type PhaseType = "Requisitos" | "Desenvolvimento" | "Testes" | "Documentação"

export interface Phase {
  id: string
  type: PhaseType
  name: string
  technician: string
  plannedStartDate: string
  plannedEndDate: string
  plannedHours: number
  actualStartDate?: string
  actualEndDate?: string
  actualHours?: number
}

export interface Task {
  id: string
  projectId: string
  phaseId?: string        // fase à qual a tarefa pertence (opcional)
  projectName: string
  name: string
  ticket?: string
  technician: string
  requester: string
  plannedStartDate: string
  plannedEndDate: string
  plannedHours: number
  actualStartDate?: string
  actualEndDate?: string
  actualHours?: number
  status: TaskStatus
}

export type Company = "SAVOY" | "AFA"

export interface Project {
  id: string
  name: string
  description: string
  owner: string
  status: ProjectStatus
  company: Company
  plannedStartDate: string
  plannedEndDate: string
  plannedHours: number
  actualStartDate?: string
  actualEndDate?: string
  actualHours: number
  phases: Phase[]
}

// Sample data based on the PDFs
export const projects: Project[] = [
  {
    id: "1",
    name: "Audit Desk",
    description: "Sistema de auditoria interna",
    owner: "Mariana Gonçalves",
    status: "Em curso",
    company: "SAVOY",
    plannedStartDate: "2025-09-25",
    plannedEndDate: "2026-05-29",
    plannedHours: 500,
    actualStartDate: "2025-09-25",
    actualHours: 150,
    phases: [
      {
        id: "1-1",
        type: "Requisitos",
        name: "Levantamento de requisitos",
        technician: "MG",
        plannedStartDate: "2025-09-25",
        plannedEndDate: "2025-10-10",
        plannedHours: 40,
        actualStartDate: "2025-09-25",
        actualEndDate: "2025-10-12",
        actualHours: 45,
      },
      {
        id: "1-2",
        type: "Desenvolvimento",
        name: "Desenvolvimento do sistema",
        technician: "MG",
        plannedStartDate: "2025-10-11",
        plannedEndDate: "2026-04-30",
        plannedHours: 400,
        actualStartDate: "2025-10-13",
        actualHours: 100,
      },
      {
        id: "1-3",
        type: "Testes",
        name: "Testes e validação",
        technician: "MG",
        plannedStartDate: "2026-05-01",
        plannedEndDate: "2026-05-29",
        plannedHours: 60,
      },
    ],
  },
  {
    id: "2",
    name: "Comunicações Internas",
    description: "Plataforma de comunicações internas",
    owner: "Silvia Dias / Jéssica Costa",
    status: "Em curso",
    company: "SAVOY",
    plannedStartDate: "2026-01-15",
    plannedEndDate: "2026-06-30",
    plannedHours: 290,
    actualStartDate: "2026-01-15",
    actualHours: 0,
    phases: [
      {
        id: "2-1",
        type: "Requisitos",
        name: "Análise de requisitos",
        technician: "SD",
        plannedStartDate: "2026-01-15",
        plannedEndDate: "2026-02-15",
        plannedHours: 40,
        actualStartDate: "2026-01-15",
        actualHours: 0,
      },
      {
        id: "2-2",
        type: "Desenvolvimento",
        name: "Desenvolvimento da plataforma",
        technician: "JC",
        plannedStartDate: "2026-02-16",
        plannedEndDate: "2026-05-30",
        plannedHours: 200,
      },
      {
        id: "2-3",
        type: "Testes",
        name: "Testes e implementação",
        technician: "SD",
        plannedStartDate: "2026-06-01",
        plannedEndDate: "2026-06-30",
        plannedHours: 50,
      },
    ],
  },
  {
    id: "3",
    name: "Website Rádio Calheta",
    description: "Website para a Rádio Calheta",
    owner: "Miguel Guarda",
    status: "Novo",
    company: "SAVOY",
    plannedStartDate: "2026-04-01",
    plannedEndDate: "2026-05-31",
    plannedHours: 410,
    actualStartDate: "2026-04-01",
    actualHours: 14,
    phases: [
      {
        id: "3-1",
        type: "Requisitos",
        name: "Levantamento de requisitos",
        technician: "MG",
        plannedStartDate: "2026-04-01",
        plannedEndDate: "2026-04-07",
        plannedHours: 20,
        actualStartDate: "2026-04-01",
        actualHours: 14,
      },
      {
        id: "3-2",
        type: "Desenvolvimento",
        name: "Desenvolvimento do website",
        technician: "MG",
        plannedStartDate: "2026-04-08",
        plannedEndDate: "2026-05-20",
        plannedHours: 350,
      },
      {
        id: "3-3",
        type: "Testes",
        name: "Testes e lançamento",
        technician: "MG",
        plannedStartDate: "2026-05-21",
        plannedEndDate: "2026-05-31",
        plannedHours: 40,
      },
    ],
  },
  {
    id: "4",
    name: "ROBOT Dertour",
    description: "Robot para reservas Dertour",
    owner: "Paula Branco",
    status: "Em curso",
    company: "SAVOY",
    plannedStartDate: "2026-02-27",
    plannedEndDate: "2026-03-20",
    plannedHours: 90,
    actualStartDate: "2026-02-27",
    actualHours: 12,
    phases: [
      {
        id: "4-1",
        type: "Requisitos",
        name: "Levantamento de requisitos",
        technician: "GN",
        plannedStartDate: "2026-02-16",
        plannedEndDate: "2026-02-20",
        plannedHours: 10,
        actualStartDate: "2026-02-27",
        actualEndDate: "2026-03-05",
        actualHours: 8,
      },
      {
        id: "4-2",
        type: "Desenvolvimento",
        name: "Desenvolvimento do robot",
        technician: "GN",
        plannedStartDate: "2026-03-09",
        plannedEndDate: "2026-03-13",
        plannedHours: 40,
        actualStartDate: "2026-03-05",
        actualHours: 4,
      },
      {
        id: "4-3",
        type: "Testes",
        name: "Testes",
        technician: "GN",
        plannedStartDate: "2026-03-16",
        plannedEndDate: "2026-03-20",
        plannedHours: 40,
      },
    ],
  },
  {
    id: "5",
    name: "ROBOT Auriko",
    description: "Robot para sistema Auriko",
    owner: "Paula Branco",
    status: "Novo",
    company: "SAVOY",
    plannedStartDate: "2026-02-27",
    plannedEndDate: "2026-03-27",
    plannedHours: 90,
    actualStartDate: "2026-02-27",
    actualHours: 8,
    phases: [
      {
        id: "5-1",
        type: "Requisitos",
        name: "Análise de requisitos",
        technician: "PB",
        plannedStartDate: "2026-02-27",
        plannedEndDate: "2026-03-05",
        plannedHours: 15,
        actualStartDate: "2026-02-27",
        actualHours: 8,
      },
      {
        id: "5-2",
        type: "Desenvolvimento",
        name: "Desenvolvimento",
        technician: "PB",
        plannedStartDate: "2026-03-06",
        plannedEndDate: "2026-03-20",
        plannedHours: 55,
      },
      {
        id: "5-3",
        type: "Testes",
        name: "Testes e validação",
        technician: "PB",
        plannedStartDate: "2026-03-21",
        plannedEndDate: "2026-03-27",
        plannedHours: 20,
      },
    ],
  },
  {
    id: "6",
    name: "ROBOT Jill",
    description: "Robot para sistema Jill",
    owner: "Paula Branco",
    status: "Novo",
    company: "SAVOY",
    plannedStartDate: "2026-02-27",
    plannedEndDate: "2026-04-03",
    plannedHours: 90,
    actualStartDate: "2026-02-27",
    actualHours: 8,
    phases: [
      {
        id: "6-1",
        type: "Requisitos",
        name: "Levantamento de requisitos",
        technician: "PB",
        plannedStartDate: "2026-02-27",
        plannedEndDate: "2026-03-06",
        plannedHours: 15,
        actualStartDate: "2026-02-27",
        actualHours: 8,
      },
      {
        id: "6-2",
        type: "Desenvolvimento",
        name: "Desenvolvimento do robot",
        technician: "PB",
        plannedStartDate: "2026-03-07",
        plannedEndDate: "2026-03-27",
        plannedHours: 55,
      },
      {
        id: "6-3",
        type: "Testes",
        name: "Testes finais",
        technician: "PB",
        plannedStartDate: "2026-03-28",
        plannedEndDate: "2026-04-03",
        plannedHours: 20,
      },
    ],
  },
]

export const tasks: Task[] = [
  // Audit Desk tasks
  {
    id: "t1",
    projectId: "1",
    projectName: "Audit Desk",
    name: "Detalhes da melhoria e mudanças de estado",
    technician: "RN",
    requester: "Mariana Gonçalves",
    plannedStartDate: "2026-02-23",
    plannedEndDate: "2026-02-27",
    plannedHours: 24,
    actualStartDate: "2026-02-23",
    actualEndDate: "2026-02-26",
    actualHours: 21,
    status: "Concluído",
  },
  {
    id: "t2",
    projectId: "1",
    projectName: "Audit Desk",
    name: "Desenvolvimento do Sheet",
    ticket: "GN",
    technician: "MG",
    requester: "Francisco Carneiro",
    plannedStartDate: "2026-02-24",
    plannedEndDate: "2026-02-24",
    plannedHours: 6,
    actualStartDate: "2026-02-24",
    actualEndDate: "2026-02-24",
    actualHours: 6,
    status: "Concluído",
  },
  {
    id: "t3",
    projectId: "1",
    projectName: "Audit Desk",
    name: "Criação, validação e envio do script de testes",
    technician: "RN",
    requester: "Mariana Gonçalves",
    plannedStartDate: "2026-02-24",
    plannedEndDate: "2026-02-24",
    plannedHours: 2,
    actualStartDate: "2026-02-24",
    actualEndDate: "2026-02-24",
    actualHours: 2,
    status: "Concluído",
  },
  {
    id: "t4",
    projectId: "1",
    projectName: "Audit Desk",
    name: "CRUD de oportunidades de melhoria",
    technician: "RN",
    requester: "Mariana Gonçalves",
    plannedStartDate: "2026-02-26",
    plannedEndDate: "2026-02-25",
    plannedHours: 16,
    actualStartDate: "2026-02-26",
    actualEndDate: "2026-02-25",
    actualHours: 10,
    status: "Concluído",
  },
  {
    id: "t5",
    projectId: "1",
    projectName: "Audit Desk",
    name: "Criar templates de email das respostas às oportunidades",
    technician: "RN",
    requester: "Mariana Gonçalves",
    plannedStartDate: "2026-02-26",
    plannedEndDate: "2026-02-27",
    plannedHours: 8,
    actualStartDate: "2026-02-26",
    actualEndDate: "2026-02-27",
    actualHours: 8,
    status: "Concluído",
  },
  {
    id: "t6",
    projectId: "1",
    projectName: "Audit Desk",
    name: "Testes nos endpoints das oportunidades de melhoria",
    technician: "RN",
    requester: "Mariana Gonçalves",
    plannedStartDate: "2026-02-27",
    plannedEndDate: "2026-02-25",
    plannedHours: 16,
    actualStartDate: "2026-02-27",
    actualEndDate: "2026-02-25",
    actualHours: 8,
    status: "Concluído",
  },
  {
    id: "t7",
    projectId: "1",
    projectName: "Audit Desk",
    name: "CRUD das respostas das oportunidades de melhoria",
    technician: "RN",
    requester: "Mariana Gonçalves",
    plannedStartDate: "2026-02-28",
    plannedEndDate: "2026-02-26",
    plannedHours: 16,
    actualStartDate: "2026-02-28",
    actualEndDate: "2026-02-26",
    actualHours: 12,
    status: "Concluído",
  },
  {
    id: "t8",
    projectId: "1",
    projectName: "Audit Desk",
    name: "Fazer lógica para gerir de permissões dos utilizadores",
    technician: "MG",
    requester: "Mariana Gonçalves",
    plannedStartDate: "2026-02-26",
    plannedEndDate: "2026-02-27",
    plannedHours: 12,
    actualStartDate: "2026-02-26",
    actualEndDate: "2026-02-27",
    actualHours: 10,
    status: "Em curso",
  },
  // Comunicações Internas tasks
  {
    id: "t9",
    projectId: "2",
    projectName: "Comunicações Internas",
    name: "Upload de excel com a lista de emails",
    ticket: "GN",
    technician: "SD",
    requester: "Silvia Dias / Jéssica Costa",
    plannedStartDate: "2026-02-26",
    plannedEndDate: "2026-02-26",
    plannedHours: 4,
    actualStartDate: "2026-02-26",
    actualEndDate: "2026-02-26",
    actualHours: 4,
    status: "Concluído",
  },
  // Portal do Colaborador tasks
  {
    id: "t10",
    projectId: "7",
    projectName: "Portal do Colaborador",
    name: "Script para migrar os dados para servidor atualizado",
    ticket: "DG",
    technician: "DG",
    requester: "Tania Correia",
    plannedStartDate: "2026-02-10",
    plannedEndDate: "2026-02-12",
    plannedHours: 16,
    actualStartDate: "2026-02-10",
    actualEndDate: "2026-02-13",
    actualHours: 24,
    status: "Concluído",
  },
  {
    id: "t11",
    projectId: "7",
    projectName: "Portal do Colaborador",
    name: "Testes e validação",
    ticket: "DG",
    technician: "DG",
    requester: "Tania Correia",
    plannedStartDate: "2026-02-12",
    plannedEndDate: "2026-02-25",
    plannedHours: 64,
    actualStartDate: "2026-02-18",
    actualEndDate: "2026-02-20",
    actualHours: 24,
    status: "Concluído",
  },
  // ROBOT tasks
  {
    id: "t12",
    projectId: "4",
    projectName: "ROBOT Dertour",
    name: "Alterações de processos",
    ticket: "GN",
    technician: "GN",
    requester: "Guilherme Nóbrega",
    plannedStartDate: "2026-02-25",
    plannedEndDate: "2026-02-25",
    plannedHours: 4,
    actualStartDate: "2026-02-25",
    actualEndDate: "2026-02-26",
    actualHours: 4,
    status: "Concluído",
  },
  {
    id: "t13",
    projectId: "4",
    projectName: "ROBOT Dertour",
    name: "Verificação do processo de listagens",
    ticket: "#52050",
    technician: "GN",
    requester: "Catarina Gonçalves",
    plannedStartDate: "2026-02-26",
    plannedEndDate: "2026-02-26",
    plannedHours: 1,
    actualStartDate: "2026-02-26",
    actualEndDate: "2026-02-26",
    actualHours: 1,
    status: "Concluído",
  },
  // Templates email tasks
  {
    id: "t14",
    projectId: "8",
    projectName: "Templates email",
    name: "Upload dos templates Royal nas plataformas",
    technician: "JC",
    requester: "Jessica Costa",
    plannedStartDate: "2026-02-23",
    plannedEndDate: "2026-02-23",
    plannedHours: 1,
    actualStartDate: "2026-02-23",
    actualEndDate: "2026-02-23",
    actualHours: 1,
    status: "Concluído",
  },
  {
    id: "t15",
    projectId: "8",
    projectName: "Templates email",
    name: 'Criação e upload de um novo template "Feira Sales" em Salesforce',
    technician: "JC",
    requester: "Silvia Dias / Jéssica Costa",
    plannedStartDate: "2026-02-23",
    plannedEndDate: "2026-02-23",
    plannedHours: 1,
    actualStartDate: "2026-02-23",
    actualEndDate: "2026-02-23",
    actualHours: 1,
    status: "Concluído",
  },
]

// Helper functions
export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id)
}

export function getTasksByProjectId(projectId: string): Task[] {
  return tasks.filter((t) => t.projectId === projectId)
}

export function getTasksByProjectName(projectName: string): Task[] {
  return tasks.filter((t) => t.projectName === projectName)
}

export function calculateProjectProgress(project: Project): number {
  if (project.plannedHours === 0) return 0
  return Math.round((project.actualHours / project.plannedHours) * 100)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function getStatusColor(status: ProjectStatus | TaskStatus): string {
  switch (status) {
    case "Novo":
      return "bg-blue-100 text-blue-800"
    case "Em curso":
      return "bg-amber-100 text-amber-800"
    case "Concluído":
      return "bg-emerald-100 text-emerald-800"
    case "Suspenso":
      return "bg-slate-100 text-slate-800"
    case "Pendente":
      return "bg-slate-100 text-slate-800"
    default:
      return "bg-slate-100 text-slate-800"
  }
}

export function getPhaseColor(type: PhaseType): string {
  switch (type) {
    case "Requisitos":
      return "bg-sky-500"
    case "Desenvolvimento":
      return "bg-amber-500"
    case "Testes":
      return "bg-emerald-500"
    case "Documentação":
      return "bg-violet-500"
    default:
      return "bg-slate-500"
  }
}
