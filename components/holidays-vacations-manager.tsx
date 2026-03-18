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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker"
import { useAuthStore } from "@/lib/auth-store"

export function HolidaysVacationsManager() {
  const users = useProjectStore((state) => state.users)
  const holidays = useProjectStore((state) => state.holidays)
  const vacations = useProjectStore((state) => state.vacations)
  
  const addHoliday = useProjectStore((state) => state.addHoliday)
  const deleteHoliday = useProjectStore((state) => state.deleteHoliday)
  const addVacation = useProjectStore((state) => state.addVacation)
  const deleteVacation = useProjectStore((state) => state.deleteVacation)

  const { user: currentUser } = useAuthStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Holiday states
  const [newHolidayName, setNewHolidayName] = useState("")
  const [newHolidayDate, setNewHolidayDate] = useState<Date | undefined>()

  // Vacation states
  const [vacationDateRange, setVacationDateRange] = useState<DateRange | undefined>()

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHolidayName || !newHolidayDate) return
    setLoading(true)
    setError(null)
    try {
      await addHoliday({
        name: newHolidayName,
        date: format(newHolidayDate, "yyyy-MM-dd"),
      })
      setNewHolidayName("")
      setNewHolidayDate(undefined)
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
    if (!currentUser || !vacationDateRange?.from || !vacationDateRange?.to) return
    setLoading(true)
    setError(null)
    try {
      await addVacation({
        technicianId: currentUser.id,
        startDate: format(vacationDateRange.from, "yyyy-MM-dd"),
        endDate: format(vacationDateRange.to, "yyyy-MM-dd"),
      })
      setVacationDateRange(undefined)
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newHolidayDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newHolidayDate ? format(newHolidayDate, "PPP", { locale: pt }) : <span>Selecione a data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newHolidayDate}
                      onSelect={setNewHolidayDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
              <p className="text-sm font-medium">Período de Férias</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !vacationDateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {vacationDateRange?.from ? (
                      vacationDateRange.to ? (
                        <>
                          {format(vacationDateRange.from, "LLL dd, y", { locale: pt })} -{" "}
                          {format(vacationDateRange.to, "LLL dd, y", { locale: pt })}
                        </>
                      ) : (
                        format(vacationDateRange.from, "LLL dd, y", { locale: pt })
                      )
                    ) : (
                      <span>Selecione o período das suas férias</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={vacationDateRange?.from}
                    selected={vacationDateRange}
                    onSelect={setVacationDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !vacationDateRange?.from || !vacationDateRange?.to}>
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
                {vacations
                  .filter((v) => v.technicianId === currentUser?.id)
                  .map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">
                      {(currentUser?.name || "") + " (Tu)"}
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
