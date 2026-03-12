"use client"

import { useState, useEffect } from "react"
import { useProjectStore, type TaskStatus, type Task } from "@/lib/store"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

import { useAuthStore } from "@/lib/auth-store"

interface TaskFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTask?: Task | null
  defaultProjectId?: string
}

export function TaskFormDialog({ open, onOpenChange, editTask, defaultProjectId }: TaskFormDialogProps) {
  const projects = useProjectStore((state) => state.projects)
  const users = useProjectStore((state) => state.users)
  const addTask = useProjectStore((state) => state.addTask)
  const updateTask = useProjectStore((state) => state.updateTask)
  const currentUser = useAuthStore((state) => state.user)

  const [formData, setFormData] = useState({
    projectId: defaultProjectId || "",
    phaseId: "",
    name: "",
    ticket: "",
    technician: currentUser?.name || "",
    requester: "",
    plannedStartDate: "",
    plannedEndDate: "",
    plannedHours: 0,
    actualStartDate: "",
    actualEndDate: "",
    actualHours: 0,
    status: "Pendente" as TaskStatus,
    hasActualDates: false,
  })

  // Reset form when opening or when editTask changes
  useEffect(() => {
    if (open) {
      if (editTask) {
        setFormData({
          projectId: editTask.projectId,
          phaseId: editTask.phaseId || "",
          name: editTask.name,
          ticket: editTask.ticket || "",
          technician: editTask.technician,
          requester: editTask.requester,
          plannedStartDate: editTask.plannedStartDate,
          plannedEndDate: editTask.plannedEndDate,
          plannedHours: editTask.plannedHours,
          actualStartDate: editTask.actualStartDate || "",
          actualEndDate: editTask.actualEndDate || "",
          actualHours: editTask.actualHours || 0,
          status: editTask.status,
          hasActualDates: !!(editTask.actualStartDate || editTask.actualEndDate || editTask.actualHours),
        })
      } else {
        setFormData({
          projectId: defaultProjectId || "",
          phaseId: "",
          name: "",
          ticket: "",
          technician: "",
          requester: "",
          plannedStartDate: "",
          plannedEndDate: "",
          plannedHours: 0,
          actualStartDate: "",
          actualEndDate: "",
          actualHours: 0,
          status: "Pendente",
          hasActualDates: false,
        })
      }
    }
  }, [open, editTask, defaultProjectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const taskData = {
      projectId: formData.projectId,
      phaseId: formData.phaseId === "none" ? undefined : (formData.phaseId || undefined),
      name: formData.name,
      ticket: formData.ticket || undefined,
      technician: formData.technician,
      requester: formData.requester,
      plannedStartDate: formData.plannedStartDate,
      plannedEndDate: formData.plannedEndDate,
      plannedHours: formData.plannedHours,
      actualStartDate: formData.hasActualDates && formData.actualStartDate ? formData.actualStartDate : undefined,
      actualEndDate: formData.hasActualDates && formData.actualEndDate ? formData.actualEndDate : undefined,
      actualHours: formData.hasActualDates && formData.actualHours ? formData.actualHours : undefined,
      status: formData.status,
    }

    if (editTask) {
      await updateTask(editTask.id, taskData)
    } else {
      await addTask(taskData)
    }

    onOpenChange(false)
  }

  const selectedProject = projects.find((p) => p.id === formData.projectId)
  const phases = selectedProject?.phases || []

  const isValid =
    formData.projectId &&
    formData.name &&
    formData.technician &&
    formData.requester &&
    formData.plannedStartDate &&
    formData.plannedEndDate &&
    formData.plannedHours > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
          <DialogDescription>
            {editTask
              ? "Atualize os detalhes da tarefa."
              : "Crie uma nova tarefa associada a um projeto e fase. As horas serão automaticamente contabilizadas."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label htmlFor="projectId">Projeto</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData({ ...formData, projectId: value, phaseId: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phase Selection */}
            <div className="space-y-2">
              <Label htmlFor="phaseId">Fase (opcional)</Label>
              <Select
                value={formData.phaseId}
                onValueChange={(value) => setFormData({ ...formData, phaseId: value })}
                disabled={!formData.projectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.projectId ? "Selecione uma fase" : "Selecione um projeto primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma fase</SelectItem>
                  {phases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.name} ({phase.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Task Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Nome da Tarefa</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Desenvolvimento do módulo de login"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket">Ticket (opcional)</Label>
              <Input
                id="ticket"
                value={formData.ticket}
                onChange={(e) => setFormData({ ...formData, ticket: e.target.value })}
                placeholder="Ex: #12345"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: TaskStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em curso">Em curso</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="technician">Técnico</Label>
              <Select
                value={formData.technician}
                onValueChange={(value) => setFormData({ ...formData, technician: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um técnico" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.name}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requester">Requisitante</Label>
              <Input
                id="requester"
                value={formData.requester}
                onChange={(e) => setFormData({ ...formData, requester: e.target.value })}
                placeholder="Ex: João Silva"
                required
              />
            </div>
          </div>

          {/* Planned Dates */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Datas Previstas</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plannedStartDate">Data Início</Label>
                <Input
                  id="plannedStartDate"
                  type="date"
                  value={formData.plannedStartDate}
                  onChange={(e) => setFormData({ ...formData, plannedStartDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plannedEndDate">Data Fim</Label>
                <Input
                  id="plannedEndDate"
                  type="date"
                  value={formData.plannedEndDate}
                  onChange={(e) => setFormData({ ...formData, plannedEndDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plannedHours">Horas Previstas</Label>
                <Input
                  id="plannedHours"
                  type="number"
                  min="0"
                  value={formData.plannedHours || ""}
                  onChange={(e) => setFormData({ ...formData, plannedHours: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Actual Dates */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="hasActualDates"
                checked={formData.hasActualDates}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, hasActualDates: checked === true })
                }
              />
              <Label htmlFor="hasActualDates" className="text-sm font-medium cursor-pointer">
                Registar datas reais
              </Label>
            </div>

            {formData.hasActualDates && (
              <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="actualStartDate">Data Início Real</Label>
                  <Input
                    id="actualStartDate"
                    type="date"
                    value={formData.actualStartDate}
                    onChange={(e) => setFormData({ ...formData, actualStartDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actualEndDate">Data Fim Real</Label>
                  <Input
                    id="actualEndDate"
                    type="date"
                    value={formData.actualEndDate}
                    onChange={(e) => setFormData({ ...formData, actualEndDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="actualHours">Horas Reais</Label>
                  <Input
                    id="actualHours"
                    type="number"
                    min="0"
                    value={formData.actualHours || ""}
                    onChange={(e) => setFormData({ ...formData, actualHours: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid}>
              {editTask ? "Guardar Alterações" : "Criar Tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
