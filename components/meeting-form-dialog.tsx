"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Loader2, Plus, Trash2, X } from "lucide-react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useProjectStore } from "@/lib/store"
import { Meeting, MeetingChecklistItem } from "@/lib/data"
import { Checkbox } from "@/components/ui/checkbox"

const formSchema = z.object({
  title: z.string().min(2, "O título deve ter pelo menos 2 caracteres"),
  projectId: z.string().default("none"),
  date: z.string().min(1, "A data é obrigatória"),
  startTime: z.string().min(1, "A hora de início é obrigatória"),
  durationHours: z.coerce.number().min(0.1, "A duração deve ser superior a 0"),
  attendees: z.string().default(""),
  notes: z.string().default(""),
})

interface MeetingFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  meeting?: Meeting
  defaultProjectId?: string
}

export function MeetingFormDialog({ open, onOpenChange, meeting, defaultProjectId }: MeetingFormDialogProps) {
  const { projects, users, addMeeting, updateMeeting } = useProjectStore()
  const [isLoading, setIsLoading] = useState(false)
  const [errorStatus, setErrorStatus] = useState<string | null>(null)
  const [selectedTechs, setSelectedTechs] = useState<string[]>([])
  const [checklist, setChecklist] = useState<MeetingChecklistItem[]>([])
  const [newChecklistItem, setNewChecklistItem] = useState("")
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
  const [attendeeInput, setAttendeeInput] = useState("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      projectId: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: format(new Date(), "HH:mm"),
      durationHours: 1,
      attendees: "",
      notes: "",
    },
  })

  useEffect(() => {
    if (meeting) {
      form.reset({
        title: meeting.title,
        projectId: meeting.projectId || "none",
        date: meeting.date,
        startTime: meeting.startTime,
        durationHours: meeting.durationHours,
        attendees: meeting.attendees,
        notes: meeting.notes,
      })
      setSelectedTechs(meeting.technicians)
      setChecklist(meeting.checklist)
      setSelectedAttendees(meeting.attendees ? meeting.attendees.split(",").map(a => a.trim()).filter(Boolean) : [])
    } else {
      form.reset({
        title: "",
        projectId: defaultProjectId || "none",
        date: format(new Date(), "yyyy-MM-dd"),
        startTime: format(new Date(), "HH:mm"),
        durationHours: 1,
        attendees: "",
        notes: "",
      })
      setSelectedTechs([])
      setChecklist([])
      setSelectedAttendees([])
      setErrorStatus(null)
    }
  }, [meeting, form, open])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setErrorStatus(null)
    try {
      const meetingData = {
        title: values.title,
        projectId: values.projectId === "none" ? undefined : values.projectId,
        date: values.date,
        startTime: values.startTime,
        durationHours: values.durationHours,
        attendees: selectedAttendees.join(", "),
        notes: values.notes || "",
        technicians: selectedTechs,
        checklist: checklist,
      }

      if (meeting) {
        await updateMeeting(meeting.id, meetingData)
      } else {
        await addMeeting(meetingData)
      }
      onOpenChange(false)
    } catch (error: any) {
      console.error(error)
      setErrorStatus(error.message || "Ocorreu um erro ao guardar a reunião.")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTech = (userId: string) => {
    setSelectedTechs((prev) =>
      prev.includes(userId)
        ? prev.filter((t) => t !== userId)
        : [...prev, userId]
    )
  }

  const handleAttendeeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" || e.key === "Enter") {
      if (attendeeInput.trim()) {
        e.preventDefault()
        if (!selectedAttendees.includes(attendeeInput.trim())) {
          setSelectedAttendees([...selectedAttendees, attendeeInput.trim()])
        }
        setAttendeeInput("")
      }
    }
  }

  const removeAttendee = (name: string) => {
    setSelectedAttendees(selectedAttendees.filter((a) => a !== name))
  }

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return
    const newItem: MeetingChecklistItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: newChecklistItem,
      checked: false,
    }
    setChecklist([...checklist, newItem])
    setNewChecklistItem("")
  }

  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id))
  }

  const toggleChecklistItem = (id: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meeting ? "Editar Reunião" : "Nova Reunião"}</DialogTitle>
          <DialogDescription>
            Registe os detalhes da reunião, participantes e pontos decididos.
          </DialogDescription>
        </DialogHeader>


        {errorStatus && (
          <Alert variant="destructive" className="py-2 mb-4">
            <AlertDescription className="text-xs">{errorStatus}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Título da Reunião</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Reunião de Alinhamento Semanal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projeto Associado (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um projeto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum (Geral)</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="durationHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (Horas)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4 col-span-2">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Início</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP", { locale: pt })
                              ) : (
                                <span>Escolher data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) =>
                              field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                            }
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de Início</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <FormLabel>Técnicos Presentes</FormLabel>
              <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/20">
                {users.filter(u => u.role === "técnico").map((user) => (
                  <div
                    key={user.id}
                    onClick={() => toggleTech(user.id)}
                    className={cn(
                      "cursor-pointer px-3 py-1 rounded-full text-xs font-medium transition-colors border",
                      selectedTechs.includes(user.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {user.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pb-2">
              <FormLabel>Outros Participantes</FormLabel>
              <div className="flex flex-wrap gap-2 min-h-[1.5rem]">
                {selectedAttendees.map((attendee, index) => (
                  <Badge key={index} variant="secondary" className="gap-1 px-2 py-0.5 text-[11px] hover:bg-secondary">
                    {attendee}
                    <button
                      type="button"
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeAttendee(attendee);
                      }}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive transition-colors" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Escreva o nome e pressione TAB ou ENTER"
                value={attendeeInput}
                onChange={(e) => setAttendeeInput(e.target.value)}
                onKeyDown={handleAttendeeKeyDown}
              />
              <FormDescription className="text-[10px]">Pressione TAB ou Enter para adicionar cada participante.</FormDescription>
            </div>

            <div className="space-y-3">
              <FormLabel>Checklist / Pontos da Reunião</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Novo ponto..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addChecklistItem()
                    }
                  }}
                />
                <Button type="button" onClick={addChecklistItem} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                    />
                    <span className={cn("text-sm flex-1", item.checked && "line-through text-muted-foreground")}>
                      {item.text}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeChecklistItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                {checklist.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Nenhum ponto adicionado à checklist.
                  </p>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas / Atas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Resumo, decisões, próximos passos..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {meeting ? "Guardar Alterações" : "Criar Reunião"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
