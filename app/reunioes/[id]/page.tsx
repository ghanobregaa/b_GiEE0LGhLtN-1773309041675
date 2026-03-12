"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  FileText, 
  CheckCircle2, 
  Circle, 
  Download,
  Pencil,
  Trash2,
  Loader2
} from "lucide-react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { useProjectStore } from "@/lib/store"
import { Meeting, formatDate } from "@/lib/data"
import { exportMeetingToPDF } from "@/lib/pdf-export"
import { cn } from "@/lib/utils"
import { MeetingFormDialog } from "@/components/meeting-form-dialog"

export default function MeetingDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { meetings, deleteMeeting, updateMeeting } = useProjectStore()
  const [meeting, setMeeting] = useState<Meeting | undefined>(undefined)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const found = meetings.find(m => m.id === id)
    setMeeting(found)
  }, [id, meetings])

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">A carregar detalhes da reunião...</p>
      </div>
    )
  }

  const handleDelete = async () => {
    if (confirm("Tem a certeza que deseja eliminar esta reunião?")) {
      setIsDeleting(true)
      try {
        await deleteMeeting(meeting.id)
        router.push("/reunioes")
      } catch (error) {
        console.error(error)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const toggleChecklistItem = async (itemId: string) => {
    const updatedChecklist = meeting.checklist.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    )
    
    await updateMeeting(meeting.id, { checklist: updatedChecklist })
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => exportMeetingToPDF(meeting)}>
            <Download className="h-4 w-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsEditDialogOpen(true)}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <Button variant="destructive" size="sm" className="gap-2" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-t-4 border-t-primary">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-3xl font-bold">{meeting.title}</CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="h-4 w-4" />
                    {formatDate(meeting.date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {meeting.durationHours}h de duração
                  </span>
                </CardDescription>
              </div>
              {meeting.projectId ? (
                <Badge variant="secondary" className="px-3 py-1 text-sm">
                  Projeto: {meeting.projectName}
                </Badge>
              ) : (
                <Badge variant="outline" className="px-3 py-1 text-sm">Reunião Geral</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Participantes Internos
                </h4>
                <div className="flex flex-wrap gap-2">
                  {meeting.technicians.map((tech, i) => (
                    <Badge key={i} variant="outline" className="bg-primary/5 border-primary/20">
                      {tech}
                    </Badge>
                  ))}
                  {meeting.technicians.length === 0 && <span className="text-sm text-muted-foreground italic">Nenhum técnico registado</span>}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Outros Participantes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {meeting.attendees.split(",").map((a, i) => a.trim()).filter(Boolean).map((attendee, i) => (
                    <Badge key={i} variant="outline">
                      {attendee}
                    </Badge>
                  ))}
                  {!meeting.attendees && <span className="text-sm text-muted-foreground italic">Nenhum outro participante registado</span>}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                Checklist e Pontos Decididos
              </h4>
              <div className="grid gap-3">
                {meeting.checklist.length > 0 ? (
                  meeting.checklist.map((item) => (
                    <div 
                      key={item.id} 
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-muted/50",
                        item.checked ? "bg-muted/30 border-muted" : "bg-card border-border"
                      )}
                      onClick={() => toggleChecklistItem(item.id)}
                    >
                      <Checkbox 
                        checked={item.checked} 
                        onCheckedChange={() => toggleChecklistItem(item.id)}
                      />
                      <span className={cn(
                        "text-sm font-medium",
                        item.checked && "line-through text-muted-foreground"
                      )}>
                        {item.text}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-4 bg-muted/20 rounded-lg">
                    Nenhum ponto de checklist adicionado.
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                Notas e Atas
              </h4>
              <div className="bg-muted/30 p-4 rounded-lg border border-dashed text-sm whitespace-pre-wrap leading-relaxed">
                {meeting.notes || "Sem notas registadas para esta reunião."}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <MeetingFormDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
        meeting={meeting} 
      />
    </div>
  )
}
