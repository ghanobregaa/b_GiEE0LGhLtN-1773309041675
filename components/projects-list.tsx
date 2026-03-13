"use client"

import { useState } from "react"
import Link from "next/link"
import {
  useProjectStore,
  formatDate,
  getStatusColor,
  calculateProjectProgress,
  type Project,
} from "@/lib/store"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GanttChart } from "@/components/gantt-chart"
import { ProjectFormDialog } from "@/components/project-form-dialog"
import {
  FolderKanban,
  BarChart3,
  Users,
  Clock,
  Plus,
  Lock,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Download,
  FileDown,
  Search,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { getApiUrl } from "@/lib/api-config"
import { useAuthStore } from "@/lib/auth-store"
import { useRouter } from "next/navigation"

export function ProjectsList() {
  const projects = useProjectStore((state) => state.projects)
  const deleteProject = useProjectStore((state) => state.deleteProject)
  const user = useAuthStore((state) => state.user)
  const isVisitor = user?.role === "visitante"
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedCompany, setSelectedCompany] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      const response = await fetch(`${getApiUrl()}/projects/export/excel`)
      if (!response.ok) throw new Error("Erro ao exportar ficheiro")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `projetos_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsExporting(false)
    }
  }

  const filteredProjects = projects.filter((p) => {
    const statusMatch = selectedStatus === "all" || p.status === selectedStatus
    const companyMatch = selectedCompany === "all" || p.company === selectedCompany
    
    const searchLower = searchQuery.toLowerCase()
    const searchMatch = searchQuery === "" || 
      p.name.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower) ||
      p.owner.toLowerCase().includes(searchLower)

    return statusMatch && companyMatch && searchMatch
  })

  const stats = {
    total: projects.length,
    emCurso: projects.filter((p) => p.status === "Em curso").length,
    novos: projects.filter((p) => p.status === "Novo").length,
    concluidos: projects.filter((p) => p.status === "Concluído").length,
    totalHoras: projects.reduce((acc, p) => acc + p.plannedHours, 0),
    horasRealizadas: projects.reduce((acc, p) => acc + p.actualHours, 0),
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setIsDialogOpen(true)
  }

  const handleDelete = async (projectId: string) => {
    if (confirm("Tem certeza que deseja eliminar este projeto? Todas as tarefas associadas também serão eliminadas.")) {
      await deleteProject(projectId)
    }
  }

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingProject(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projetos</h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe todos os seus projetos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportExcel} disabled={isExporting}>
            <FileDown className="h-4 w-4 mr-2" />
            {isExporting ? "A exportar..." : "Exportar Excel"}
          </Button>
          <div className="w-[1px] h-8 bg-border mx-2" />
          {!isVisitor && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Projetos
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.novos} novos, {stats.emCurso} em curso
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Curso
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emCurso}</div>
            <p className="text-xs text-muted-foreground">projetos ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Donos Distintos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(projects.map((p) => p.owner)).size}
            </div>
            <p className="text-xs text-muted-foreground">gestores de projeto</p>
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
              {stats.horasRealizadas}/{stats.totalHoras}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalHoras > 0
                ? Math.round((stats.horasRealizadas / stats.totalHoras) * 100)
                : 0}
              % realizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for List/Gantt View */}
      <Tabs defaultValue="list" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Empresa:</span>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-1 text-sm h-9"
              >
                <option value="all">Todas</option>
                <option value="SAVOY">SAVOY</option>
                <option value="AFA">AFA</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Estado:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-1 text-sm h-9"
              >
                <option value="all">Todos</option>
                <option value="Novo">Novo</option>
                <option value="Em curso">Em curso</option>
                <option value="Concluído">Concluído</option>
                <option value="Suspenso">Suspenso</option>
              </select>
            </div>

            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar projetos..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Dono do Projeto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-center">Previsto</TableHead>
                    <TableHead className="text-center">Real</TableHead>
                    <TableHead className="w-[120px]">Progresso</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      isVisitor={isVisitor}
                    />
                  ))}
                  {filteredProjects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum projeto encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gantt" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Timeline de Projetos</CardTitle>
            </CardHeader>
            <CardContent>
              <GanttChart projects={filteredProjects} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Project Form Dialog */}
      <ProjectFormDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        editProject={editingProject}
      />
    </div>
  )
}

interface ProjectRowProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (projectId: string) => void
  isVisitor?: boolean
}

function ProjectRow({ project, onEdit, onDelete, isVisitor }: ProjectRowProps) {
  const progress = calculateProjectProgress(project)
  const router = useRouter()

  return (
    <TableRow 
      className="hover:bg-muted/50 cursor-pointer select-none"
      onDoubleClick={() => router.push(`/projetos/${project.id}`)}
    >
      <TableCell>
        <div className="flex flex-col">
          <Link
            href={`/projetos/${project.id}`}
            className="font-medium text-foreground hover:text-primary hover:underline"
          >
            {project.name}
          </Link>
          <span className="text-[10px] text-muted-foreground line-clamp-1">{project.description}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={project.company === "SAVOY" ? "border-blue-200 text-blue-700 bg-blue-50/50" : "border-amber-200 text-amber-700 bg-amber-50/50"}>
          {project.company}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{project.owner}</TableCell>
      <TableCell>
        <Badge variant="secondary" className={getStatusColor(project.status)}>
          {project.status}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex flex-col items-center text-sm">
          <span>{formatDate(project.plannedStartDate)}</span>
          <span className="text-muted-foreground">
            {formatDate(project.plannedEndDate)}
          </span>
          <span className="text-xs text-muted-foreground">
            {project.plannedHours}h
          </span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex flex-col items-center text-sm">
          <span>
            {project.actualStartDate ? formatDate(project.actualStartDate) : "-"}
          </span>
          <span className="text-muted-foreground">
            {project.actualEndDate ? formatDate(project.actualEndDate) : "-"}
          </span>
          <span className="text-xs text-muted-foreground">{project.actualHours}h</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Progress value={progress} className="h-2" />
          <span className="text-xs text-muted-foreground text-right">
            {progress.toFixed(2)}%
          </span>
        </div>
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
            <DropdownMenuItem asChild>
              <Link href={`/projetos/${project.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalhes
              </Link>
            </DropdownMenuItem>
            {!isVisitor && (
              <>
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(project.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
