"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Calendar as CalendarIcon, 
  Clock, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Download,
  ExternalLink
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useProjectStore } from "@/lib/store"
import { Meeting, formatDate } from "@/lib/data"
import { MeetingFormDialog } from "./meeting-form-dialog"
import { exportMeetingToPDF } from "@/lib/pdf-export"
import { useAuthStore } from "@/lib/auth-store"

export function MeetingsList() {
  const { meetings, projects, deleteMeeting, users } = useProjectStore()
  const currentUser = useAuthStore((state) => state.user)
  const isVisitor = currentUser?.role === "visitante"
  const [searchTerm, setSearchTerm] = useState("")
  const [projectFilter, setProjectFilter] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | undefined>(undefined)

  const filteredMeetings = useMemo(() => {
    return meetings.filter((meeting) => {
      const matchesSearch = 
        meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.attendees.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meeting.technicians.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesProject = projectFilter === "all" || meeting.projectId === projectFilter

      return matchesSearch && matchesProject
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [meetings, searchTerm, projectFilter])

  const stats = useMemo(() => {
    const totalMeetings = filteredMeetings.length
    const totalHours = filteredMeetings.reduce((sum, m) => sum + m.durationHours, 0)
    return { totalMeetings, totalHours }
  }, [filteredMeetings])

  const handleCreateNew = () => {
    setSelectedMeeting(undefined)
    setIsDialogOpen(true)
  }

  const handleEdit = (meeting: Meeting) => {
    setSelectedMeeting(meeting)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem a certeza que deseja eliminar esta reunião?")) {
      await deleteMeeting(id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Total de Reuniões</CardDescription>
            <CardTitle className="text-2xl">{stats.totalMeetings}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              Filtradas
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold">Horas Consumidas</CardDescription>
            <CardTitle className="text-2xl">{stats.totalHours.toFixed(1)}h</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Tempo em reunião
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar reuniões..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4 opacity-50" />
              <SelectValue placeholder="Projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Projetos</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!isVisitor && (
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Reunião
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Técnicos</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeetings.length > 0 ? (
                filteredMeetings.map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell className="font-medium">
                      <Link 
                        href={`/reunioes/${meeting.id}`}
                        className="hover:text-primary hover:underline transition-colors"
                      >
                        {meeting.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {meeting.projectId ? (
                        <Badge variant="outline">{meeting.projectName}</Badge>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Geral</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <CalendarIcon className="h-3 w-3 opacity-50" />
                          {formatDate(meeting.date)}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground ml-4">
                          <Clock className="h-3 w-3 opacity-50" />
                          {meeting.startTime}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{meeting.durationHours}h</TableCell>
                    <TableCell>
                      <div className="flex -space-x-2 overflow-hidden">
                        {meeting.technicians.slice(0, 3).map((tech, i) => {
                          const user = users.find(u => u.name === tech);
                          return (
                            <div
                              key={i}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-background text-[10px] font-medium text-white"
                              style={{ backgroundColor: user?.color || "#ccc" }}
                              title={tech}
                            >
                              {tech.charAt(0)}
                            </div>
                          );
                        })}
                        {meeting.technicians.length > 3 && (
                          <div className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground text-[10px] font-medium">
                            +{meeting.technicians.length - 3}
                          </div>
                        )}
                        {meeting.technicians.length === 0 && <span className="text-xs text-muted-foreground">---</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary"
                          title="Exportar PDF"
                          onClick={() => exportMeetingToPDF(meeting)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(meeting)} className="gap-2">
                              <Pencil className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            {!isVisitor && (
                              <DropdownMenuItem 
                                onClick={() => handleDelete(meeting.id)} 
                                className="gap-2 text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhuma reunião encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MeetingFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        meeting={selectedMeeting} 
      />
    </div>
  )
}
