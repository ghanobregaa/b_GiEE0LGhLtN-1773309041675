"use client"

import { useState, useEffect } from "react"
import { useProjectStore, type ProjectStatus, type PhaseType, type Phase, type Project, type Company } from "@/lib/store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

interface PhaseInput {
  id?: string
  type: PhaseType
  name: string
  technicianIds: string[]
  plannedStartDate: string
  plannedEndDate: string
  plannedHours: number
  actualStartDate?: string
  actualEndDate?: string
  actualHours?: number
}

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editProject?: Project | null
}

const emptyPhase: PhaseInput = {
  type: "Requisitos",
  name: "",
  technicianIds: [],
  plannedStartDate: "",
  plannedEndDate: "",
  plannedHours: 0,
}

export function ProjectFormDialog({ open, onOpenChange, editProject }: ProjectFormDialogProps) {
  const { addProject, updateProject, users } = useProjectStore()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    owner: "",
    status: "Novo" as ProjectStatus,
    company: "SAVOY" as Company,
    plannedStartDate: "",
    plannedEndDate: "",
  })

  const [phases, setPhases] = useState<PhaseInput[]>([{ ...emptyPhase }])

  useEffect(() => {
    if (open) {
      if (editProject) {
        setFormData({
          name: editProject.name,
          description: editProject.description || "",
          owner: editProject.owner,
          status: editProject.status,
          company: editProject.company,
          plannedStartDate: editProject.plannedStartDate,
          plannedEndDate: editProject.plannedEndDate,
        })
        setPhases(
          editProject.phases.map((p) => ({
            id: p.id,
            type: p.type,
            name: p.name,
            technicianIds: p.technicianIds || [],
            plannedStartDate: p.plannedStartDate,
            plannedEndDate: p.plannedEndDate,
            plannedHours: p.plannedHours,
            actualStartDate: p.actualStartDate,
            actualEndDate: p.actualEndDate,
            actualHours: p.actualHours,
          }))
        )
      } else {
        setFormData({
          name: "",
          description: "",
          owner: "",
          status: "Novo",
          company: "SAVOY",
          plannedStartDate: "",
          plannedEndDate: "",
        })
        setPhases([{ ...emptyPhase }])
      }
    }
  }, [open, editProject])

  const addPhase = () => {
    setPhases([...phases, { ...emptyPhase, type: "Desenvolvimento" }])
  }

  const removePhase = (index: number) => {
    setPhases(phases.filter((_, i) => i !== index))
  }

  const updatePhase = (index: number, field: keyof PhaseInput, value: any) => {
    setPhases(
      phases.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const totalPlannedHours = phases.reduce((sum, p) => sum + p.plannedHours, 0)

    const projectData = {
      ...formData,
      plannedHours: totalPlannedHours,
      // Fases existentes mantêm o id; fases novas não têm id (a BD gera o UUID)
      phases: phases.map((p) => ({
        ...p,
        id: p.id || ("__new__" as string),
      })) as Phase[],
    }

    if (editProject) {
      await updateProject(editProject.id, projectData)
    } else {
      await addProject(projectData)
    }

    onOpenChange(false)
  }

  const isValid =
    formData.name &&
    formData.owner &&
    formData.plannedStartDate &&
    formData.plannedEndDate &&
    phases.length > 0 &&
    phases.every((p) => p.name && p.plannedStartDate && p.plannedEndDate && p.plannedHours > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editProject ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
          <DialogDescription>
            {editProject
              ? "Atualize os dados do projeto e as suas fases."
              : "Crie um novo projeto definindo as suas fases e datas."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Project Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Projeto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Website Institucional"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descricao</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descricao breve do projeto..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner">Dono do Projeto</Label>
                <Input
                  id="owner"
                  value={formData.owner}
                  onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  placeholder="Ex: Joao Silva"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Select
                  value={formData.company}
                  onValueChange={(value: Company) =>
                    setFormData({ ...formData, company: value })
                  }
                >
                  <SelectTrigger id="company" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAVOY">SAVOY</SelectItem>
                    <SelectItem value="AFA">AFA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: ProjectStatus) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Novo">Novo</SelectItem>
                    <SelectItem value="Em curso">Em curso</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Suspenso">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 flex flex-col">
                <Label htmlFor="plannedStartDate">Data Inicio Prevista</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !formData.plannedStartDate && "text-muted-foreground"
                      )}
                    >
                      {formData.plannedStartDate ? (
                        format(new Date(formData.plannedStartDate), "PPP", { locale: pt })
                      ) : (
                        <span>Escolher data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.plannedStartDate ? new Date(formData.plannedStartDate) : undefined}
                      onSelect={(date) =>
                        setFormData({ ...formData, plannedStartDate: date ? format(date, "yyyy-MM-dd") : "" })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2 flex flex-col">
                <Label htmlFor="plannedEndDate">Data Fim Prevista</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !formData.plannedEndDate && "text-muted-foreground"
                      )}
                    >
                      {formData.plannedEndDate ? (
                        format(new Date(formData.plannedEndDate), "PPP", { locale: pt })
                      ) : (
                        <span>Escolher data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.plannedEndDate ? new Date(formData.plannedEndDate) : undefined}
                      onSelect={(date) =>
                        setFormData({ ...formData, plannedEndDate: date ? format(date, "yyyy-MM-dd") : "" })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Phases */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Fases do Projeto</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPhase}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Fase
              </Button>
            </div>

            <div className="space-y-4">
              {phases.map((phase, index) => (
                <div
                  key={index}
                  className="rounded-lg border bg-muted/30 p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Fase {index + 1}
                    </span>
                    {phases.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-destructive hover:text-destructive"
                        onClick={() => removePhase(index)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>

                  {/* Row 1: Tipo, Nome, Tecnico */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Tipo</Label>
                      <Select
                        value={phase.type}
                        onValueChange={(value: PhaseType) => updatePhase(index, "type", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Requisitos">Requisitos</SelectItem>
                          <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                          <SelectItem value="Testes">Testes</SelectItem>
                          <SelectItem value="Documentação">Documentação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Nome da Fase</Label>
                      <Input
                        value={phase.name}
                        onChange={(e) => updatePhase(index, "name", e.target.value)}
                        placeholder="Ex: Levantamento de requisitos"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Tecnicos</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal min-h-[40px] h-auto py-2"
                          >
                            <div className="flex flex-wrap gap-1">
                              {phase.technicianIds.length > 0 ? (
                                phase.technicianIds.map((tid) => {
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
                        <PopoverContent className="w-[250px] p-2" align="start">
                          <div className="space-y-1 max-h-[300px] overflow-y-auto">
                            {users.filter(u => u.role === "técnico").map((user) => (
                              <div
                                key={user.id}
                                className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                                onClick={() => {
                                  const newIds = phase.technicianIds.includes(user.id)
                                    ? phase.technicianIds.filter(id => id !== user.id)
                                    : [...phase.technicianIds, user.id]
                                  updatePhase(index, "technicianIds", newIds)
                                }}
                              >
                                <Checkbox 
                                  checked={phase.technicianIds.includes(user.id)}
                                  onCheckedChange={() => {}} // Handle via parent click
                                />
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-2.5 h-2.5 rounded-full" 
                                    style={{ backgroundColor: user.color || "#ccc" }}
                                  />
                                  <span className="text-sm">{user.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Row 2: Dates and Hours */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2 flex flex-col">
                      <Label className="text-xs text-muted-foreground">Data Inicio Prev.</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            size="sm"
                            className={cn(
                              "w-full pl-3 text-left font-normal h-9",
                              !phase.plannedStartDate && "text-muted-foreground"
                            )}
                          >
                            {phase.plannedStartDate ? (
                              format(new Date(phase.plannedStartDate), "dd/MM/yy")
                            ) : (
                              <span>Data</span>
                            )}
                            <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={phase.plannedStartDate ? new Date(phase.plannedStartDate) : undefined}
                            onSelect={(date) => updatePhase(index, "plannedStartDate", date ? format(date, "yyyy-MM-dd") : "")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2 flex flex-col">
                      <Label className="text-xs text-muted-foreground">Data Fim Prev.</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            size="sm"
                            className={cn(
                              "w-full pl-3 text-left font-normal h-9",
                              !phase.plannedEndDate && "text-muted-foreground"
                            )}
                          >
                            {phase.plannedEndDate ? (
                              format(new Date(phase.plannedEndDate), "dd/MM/yy")
                            ) : (
                              <span>Data</span>
                            )}
                            <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={phase.plannedEndDate ? new Date(phase.plannedEndDate) : undefined}
                            onSelect={(date) => updatePhase(index, "plannedEndDate", date ? format(date, "yyyy-MM-dd") : "")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Horas Previstas</Label>
                      <Input
                        type="number"
                        min="0"
                        value={phase.plannedHours || ""}
                        onChange={(e) =>
                          updatePhase(index, "plannedHours", parseInt(e.target.value) || 0)
                        }
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 3: Actual values (only when editing) */}
                  {editProject && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-dashed">
                      <div className="space-y-2 flex flex-col">
                        <Label className="text-xs text-muted-foreground">Data Inicio Real</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              size="sm"
                              className={cn(
                                "w-full pl-3 text-left font-normal h-9",
                                !phase.actualStartDate && "text-muted-foreground"
                              )}
                            >
                              {phase.actualStartDate ? (
                                format(new Date(phase.actualStartDate), "dd/MM/yy")
                              ) : (
                                <span>Data</span>
                              )}
                              <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={phase.actualStartDate ? new Date(phase.actualStartDate) : undefined}
                              onSelect={(date) => updatePhase(index, "actualStartDate", date ? format(date, "yyyy-MM-dd") : "")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2 flex flex-col">
                        <Label className="text-xs text-muted-foreground">Data Fim Real</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              size="sm"
                              className={cn(
                                "w-full pl-3 text-left font-normal h-9",
                                !phase.actualEndDate && "text-muted-foreground"
                              )}
                            >
                              {phase.actualEndDate ? (
                                format(new Date(phase.actualEndDate), "dd/MM/yy")
                              ) : (
                                <span>Data</span>
                              )}
                              <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={phase.actualEndDate ? new Date(phase.actualEndDate) : undefined}
                              onSelect={(date) => updatePhase(index, "actualEndDate", date ? format(date, "yyyy-MM-dd") : "")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Horas Reais</Label>
                        <Input
                          type="number"
                          min="0"
                          value={phase.actualHours || ""}
                          onChange={(e) =>
                            updatePhase(index, "actualHours", parseInt(e.target.value) || 0)
                          }
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end text-sm text-muted-foreground">
              Total de horas previstas:{" "}
              <span className="font-semibold text-foreground ml-1">
                {phases.reduce((sum, p) => sum + p.plannedHours, 0)}h
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid}>
              {editProject ? "Guardar Alteracoes" : "Criar Projeto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
