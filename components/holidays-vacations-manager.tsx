"use client"

import { useState } from "react"
import { useProjectStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Trash2, CalendarDays, Plus, CalendarRange } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from "date-fns"
import { pt } from "date-fns/locale"

export function HolidaysVacationsManager() {
  const users = useProjectStore((state) => state.users)
  const holidays = useProjectStore((state) => state.holidays)
  const vacations = useProjectStore((state) => state.vacations)
  
  const addHoliday = useProjectStore((state) => state.addHoliday)
  const deleteHoliday = useProjectStore((state) => state.deleteHoliday)
  const addVacation = useProjectStore((state) => state.addVacation)
  const deleteVacation = useProjectStore((state) => state.deleteVacation)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Holiday states
  const [newHolidayName, setNewHolidayName] = useState("")
  const [newHolidayDate, setNewHolidayDate] = useState("")

  // Vacation states
  const [vacationUserId, setVacationUserId] = useState("")
  const [vacationStartDate, setVacationStartDate] = useState("")
  const [vacationEndDate, setVacationEndDate] = useState("")

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHolidayName || !newHolidayDate) return
    setLoading(true)
    setError(null)
    try {
      await addHoliday({
        name: newHolidayName,
        date: newHolidayDate,
      })
      setNewHolidayName("")
      setNewHolidayDate("")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar este feriado?")) return
    setLoading(true)
    setError(null)
    try {
      await deleteHoliday(id)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddVacation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vacationUserId || !vacationStartDate || !vacationEndDate) return
    if (vacationStartDate > vacationEndDate) {
      setError("A data de fim deve ser posterior ou igual à data de início.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      await addVacation({
        technicianId: vacationUserId,
        startDate: vacationStartDate,
        endDate: vacationEndDate,
      })
      setVacationUserId("")
      setVacationStartDate("")
      setVacationEndDate("")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVacation = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar estas férias?")) return
    setLoading(true)
    setError(null)
    try {
      await deleteVacation(id)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getTechName = (id: string) => {
    return users.find(u => u.id === id)?.name || id
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 mt-6">
      {/* ─── FERIADOS ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Feriados
          </CardTitle>
          <CardDescription>
            Defina os feriados nacionais ou municipais que bloqueiam a todos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddHoliday} className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  placeholder="Nome do Feriado"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <Plus className="h-4 w-4 mr-2" /> Adicionar Feriado
            </Button>
          </form>

          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}

          <div className="max-h-[300px] overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                      Nenhum feriado definido.
                    </TableCell>
                  </TableRow>
                )}
                {holidays.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-mono text-sm whitespace-nowrap">
                      {format(new Date(h.date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{h.name}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteHoliday(h.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ─── FÉRIAS ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5" />
            Férias
          </CardTitle>
          <CardDescription>
            Defina os períodos de férias por utilizador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddVacation} className="space-y-4 mb-6">
            <div className="space-y-2">
              <Select value={vacationUserId} onValueChange={setVacationUserId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um utilizador" />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.role === "técnico").map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Início</p>
                <Input
                  type="date"
                  value={vacationStartDate}
                  onChange={(e) => setVacationStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Fim</p>
                <Input
                  type="date"
                  value={vacationEndDate}
                  onChange={(e) => setVacationEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <Plus className="h-4 w-4 mr-2" /> Registar Férias
            </Button>
          </form>

          <div className="max-h-[300px] overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilizador</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vacations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                      Nenhuma férias registada.
                    </TableCell>
                  </TableRow>
                )}
                {vacations.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">
                      {getTechName(v.technicianId)}
                    </TableCell>
                    <TableCell className="text-sm font-mono whitespace-nowrap">
                      {format(new Date(v.startDate), "dd/MM/yy")} - {format(new Date(v.endDate), "dd/MM/yy")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteVacation(v.id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
