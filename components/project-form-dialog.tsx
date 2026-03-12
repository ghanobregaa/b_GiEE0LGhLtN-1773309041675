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
import { Plus, Trash2 } from "lucide-react"

interface PhaseInput {
  id?: string
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

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editProject?: Project | null
}

const emptyPhase: PhaseInput = {
  type: "Requisitos",
  name: "",
  technician: "",
  plannedStartDate: "",
  plannedEndDate: "",
  plannedHours: 0,
}

export function ProjectFormDialog({ open, onOpenChange, editProject }: ProjectFormDialogProps) {
  const addProject = useProjectStore((state) => state.addProject)
  const updateProject = useProjectStore((state) => state.updateProject)

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
            technician: p.technician,
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

  const updatePhase = (index: number, field: keyof PhaseInput, value: string | number) => {
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
              <div className="space-y-2">
                <Label htmlFor="plannedStartDate">Data Inicio Prevista</Label>
                <Input
                  id="plannedStartDate"
                  type="date"
                  value={formData.plannedStartDate}
                  onChange={(e) => setFormData({ ...formData, plannedStartDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plannedEndDate">Data Fim Prevista</Label>
                <Input
                  id="plannedEndDate"
                  type="date"
                  value={formData.plannedEndDate}
                  onChange={(e) => setFormData({ ...formData, plannedEndDate: e.target.value })}
                  required
                />
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
                      <Label className="text-xs text-muted-foreground">Tecnico</Label>
                      <Input
                        value={phase.technician}
                        onChange={(e) => updatePhase(index, "technician", e.target.value)}
                        placeholder="Ex: Joao Silva"
                      />
                    </div>
                  </div>

                  {/* Row 2: Dates and Hours */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Data Inicio Prev.</Label>
                      <Input
                        type="date"
                        value={phase.plannedStartDate}
                        onChange={(e) => updatePhase(index, "plannedStartDate", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Data Fim Prev.</Label>
                      <Input
                        type="date"
                        value={phase.plannedEndDate}
                        onChange={(e) => updatePhase(index, "plannedEndDate", e.target.value)}
                        required
                      />
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
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Data Inicio Real</Label>
                        <Input
                          type="date"
                          value={phase.actualStartDate || ""}
                          onChange={(e) =>
                            updatePhase(index, "actualStartDate", e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Data Fim Real</Label>
                        <Input
                          type="date"
                          value={phase.actualEndDate || ""}
                          onChange={(e) =>
                            updatePhase(index, "actualEndDate", e.target.value)
                          }
                        />
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
