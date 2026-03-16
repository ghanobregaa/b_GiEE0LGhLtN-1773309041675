"use client"

import { useState, useEffect } from "react"
import { useProjectStore, type Phase, type PhaseType } from "@/lib/store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { CalendarIcon, Loader2, Check, ChevronsUpDown } from "lucide-react"
import { cn, calculateBusinessHours } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface PhaseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  editPhase?: Phase | null
}

export function PhaseFormDialog({
  open,
  onOpenChange,
  projectId,
  editPhase,
}: PhaseFormDialogProps) {
  const users = useProjectStore((state) => state.users)
  const addPhase = useProjectStore((state) => state.addPhase)
  const updatePhase = useProjectStore((state) => state.updatePhase)

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: "Desenvolvimento" as PhaseType,
    name: "",
    technicianIds: [] as string[],
    plannedStartDate: "",
    plannedEndDate: "",
    plannedHours: 0,
    actualStartDate: "",
    actualEndDate: "",
    actualHours: 0,
    hasActualDates: false,
  })

  useEffect(() => {
    if (open) {
      if (editPhase) {
        setFormData({
          type: editPhase.type,
          name: editPhase.name,
          technicianIds: editPhase.technicianIds || [],
          plannedStartDate: editPhase.plannedStartDate,
          plannedEndDate: editPhase.plannedEndDate,
          plannedHours: editPhase.plannedHours,
          actualStartDate: editPhase.actualStartDate || "",
          actualEndDate: editPhase.actualEndDate || "",
          actualHours: editPhase.actualHours || 0,
          hasActualDates: !!(editPhase.actualStartDate || editPhase.actualEndDate),
        })
      } else {
        setFormData({
          type: "Desenvolvimento",
          name: "",
          technicianIds: [],
          plannedStartDate: format(new Date(), "yyyy-MM-dd"),
          plannedEndDate: format(new Date(), "yyyy-MM-dd"),
          plannedHours: 0,
          actualStartDate: "",
          actualEndDate: "",
          actualHours: 0,
          hasActualDates: false,
        })
      }
    }
  }, [open, editPhase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const phaseData = {
        type: formData.type,
        name: formData.name,
        technicianIds: formData.technicianIds,
        plannedStartDate: formData.plannedStartDate,
        plannedEndDate: formData.plannedEndDate,
        plannedHours: formData.plannedHours,
        actualStartDate: formData.hasActualDates && formData.actualStartDate ? formData.actualStartDate : undefined,
        actualEndDate: formData.hasActualDates && formData.actualEndDate ? formData.actualEndDate : undefined,
        actualHours: formData.hasActualDates ? formData.actualHours : undefined,
      }

      if (editPhase) {
        await updatePhase(projectId, editPhase.id, phaseData)
      } else {
        await addPhase(projectId, phaseData)
      }
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao salvar fase:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTechnician = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      technicianIds: prev.technicianIds.includes(userId)
        ? prev.technicianIds.filter((id) => id !== userId)
        : [...prev.technicianIds, userId],
    }))
  }

  const isValid = formData.name && (formData.type === "Pós-produção" || (formData.plannedStartDate && formData.plannedEndDate)) && formData.plannedHours >= 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[65vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editPhase ? "Editar Fase" : "Nova Fase"}</DialogTitle>
          <DialogDescription>
            Defina os detalhes da fase do projeto, técnicos e cronograma.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Fase</Label>
              <Select
                value={formData.type}
                onValueChange={(val: PhaseType) => {
                  const updates = val === "Pós-produção" 
                    ? { type: val, plannedStartDate: "", plannedEndDate: "", plannedHours: 0 }
                    : { type: val };
                  setFormData({ ...formData, ...updates });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Requisitos">Requisitos</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                  <SelectItem value="Testes">Testes</SelectItem>
                  <SelectItem value="Pós-produção">Pós-produção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome da Fase</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Backend Development"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Técnicos Atribuídos</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal min-h-[40px] h-auto py-2"
                >
                  <div className="flex flex-wrap gap-1">
                    {formData.technicianIds.length > 0 ? (
                      formData.technicianIds.map((tid) => {
                        const user = users.find((u) => u.id === tid)
                        return (
                          <Badge key={tid} variant="secondary" className="text-[10px] px-1 h-5">
                            {user?.name || tid}
                          </Badge>
                        )
                      })
                    ) : (
                      <span className="text-muted-foreground">Selecionar técnicos</span>
                    )}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-2" align="start">
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {users.filter(u => u.role === "técnico").map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-2 p-1 hover:bg-muted rounded-md cursor-pointer"
                      onClick={() => toggleTechnician(user.id)}
                    >
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={formData.technicianIds.includes(user.id)}
                        onCheckedChange={() => toggleTechnician(user.id)}
                      />
                      <Label
                        htmlFor={`user-${user.id}`}
                        className="flex-1 cursor-pointer flex items-center gap-2"
                      >
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: user.color }}
                        />
                        {user.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {formData.type !== "Pós-produção" && (
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 flex flex-col">
                <Label>Data Início Prevista</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !formData.plannedStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.plannedStartDate ? (
                        format(new Date(formData.plannedStartDate), "PPP", { locale: pt })
                      ) : (
                        <span>Data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.plannedStartDate ? new Date(formData.plannedStartDate) : undefined}
                      onSelect={(date) => {
                        const newStart = date ? format(date, "yyyy-MM-dd") : ""
                        const hours = calculateBusinessHours(newStart, formData.plannedEndDate)
                        setFormData({
                          ...formData,
                          plannedStartDate: newStart,
                          plannedHours: hours > 0 ? hours : formData.plannedHours
                        })
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2 flex flex-col">
                <Label>Data Fim Prevista</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !formData.plannedEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.plannedEndDate ? (
                        format(new Date(formData.plannedEndDate), "PPP", { locale: pt })
                      ) : (
                        <span>Data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.plannedEndDate ? new Date(formData.plannedEndDate) : undefined}
                      onSelect={(date) => {
                        const newEnd = date ? format(date, "yyyy-MM-dd") : ""
                        const hours = calculateBusinessHours(formData.plannedStartDate, newEnd)
                        setFormData({
                          ...formData,
                          plannedEndDate: newEnd,
                          plannedHours: hours > 0 ? hours : formData.plannedHours
                        })
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plannedHours">Horas Previstas</Label>
                <Input
                  id="plannedHours"
                  type="number"
                  value={formData.plannedHours}
                  onChange={(e) => setFormData({ ...formData, plannedHours: Number(e.target.value) })}
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasActual"
                checked={formData.hasActualDates}
                onCheckedChange={(checked) => setFormData({ ...formData, hasActualDates: !!checked })}
              />
              <Label htmlFor="hasActual">Registar dados reais</Label>
            </div>

            {formData.hasActualDates && (
              <div className="space-y-4">
                {formData.type !== "Pós-produção" ? (
                  <div className="grid grid-cols-3 gap-4 p-4 border rounded-md bg-muted/20">
                    <div className="space-y-2 flex flex-col">
                      <Label>Início Real</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.actualStartDate ? (
                              format(new Date(formData.actualStartDate), "dd/MM/yyyy")
                            ) : (
                              <span>Data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.actualStartDate ? new Date(formData.actualStartDate) : undefined}
                            onSelect={(date) =>
                              setFormData({
                                ...formData,
                                actualStartDate: date ? format(date, "yyyy-MM-dd") : "",
                              })
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2 flex flex-col">
                      <Label>Fim Real</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.actualEndDate ? (
                              format(new Date(formData.actualEndDate), "dd/MM/yyyy")
                            ) : (
                              <span>Data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.actualEndDate ? new Date(formData.actualEndDate) : undefined}
                            onSelect={(date) =>
                              setFormData({
                                ...formData,
                                actualEndDate: date ? format(date, "yyyy-MM-dd") : "",
                              })
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="actualHours">Horas Reais</Label>
                        <span className="text-[10px] text-muted-foreground">(Calculado das tarefas)</span>
                      </div>
                      <Input
                        id="actualHours"
                        type="number"
                        value={formData.actualHours}
                        disabled
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 p-4 border rounded-md bg-muted/20">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="actualHours">Horas Reais (Calculadas de tarefas)</Label>
                      </div>
                      <Input
                        id="actualHours"
                        type="number"
                        value={formData.actualHours}
                        disabled
                        className="bg-muted/50"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editPhase ? "Guardar Alterações" : "Criar Fase"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
