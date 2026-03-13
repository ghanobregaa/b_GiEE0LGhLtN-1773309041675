"use client"

import { useState, useEffect } from "react"
import { useProjectStore } from "@/lib/store"
import { getApiUrl } from "@/lib/api-config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, UserPlus, RefreshCw, Pencil, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuthStore } from "@/lib/auth-store"

import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type User, type UserRole } from "@/lib/data"

export default function ConfiguracaoPage() {
  const users = useProjectStore((state) => state.users)
  const fetchUsers = useProjectStore((state) => state.fetchUsers)
  const { user: currentUser, login: updateAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState("#6366f1")
  const [newRole, setNewRole] = useState<UserRole>("técnico")
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${getApiUrl()}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          name: newName,
          color: newColor,
          role: newRole
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "Erro ao criar utilizador")
      }
      
      resetForm()
      fetchUsers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${getApiUrl()}/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          name: newName,
          color: newColor,
          role: newRole,
          ...(newPassword ? { password: newPassword } : {})
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "Erro ao atualizar utilizador")
      }
      
      // Se estivermos a editar o utilizador actual, actualizamos o AuthStore também
      if (editingUser.id === currentUser?.id) {
        updateAuth({
          ...currentUser,
          username: newUsername,
          name: newName,
          color: newColor,
          role: newRole
        })
      }

      resetForm()
      fetchUsers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setNewUsername("")
    setNewPassword("")
    setNewName("")
    setNewColor("#6366f1")
    setNewRole("técnico")
    setEditingUser(null)
    setError(null)
  }

  const startEdit = (user: User) => {
    setEditingUser(user)
    setNewUsername(user.username)
    setNewName(user.name)
    setNewColor(user.color || "#6366f1")
    setNewRole(user.role || "técnico")
    setNewPassword("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Tem a certeza que deseja eliminar este utilizador?")) return
    try {
      setLoading(true)
      const res = await fetch(`${getApiUrl()}/users/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao eliminar utilizador")
      fetchUsers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Configuração de Utilizadores</h2>
        <Button variant="outline" size="icon" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {editingUser ? "Editar Utilizador" : "Adicionar Novo Utilizador"}
            </CardTitle>
            <CardDescription>
              {editingUser 
                ? `A editar perfil de @${editingUser.username}. Deixe a password em branco para não alterar.` 
                : "Crie um novo perfil de acesso ao sistema."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Nome Completo"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Username (ex: jdoe)"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  disabled={editingUser?.username === 'admin'}
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder={editingUser ? "Nova Palavra-passe (opcional)" : "Palavra-passe"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required={!editingUser}
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium mb-1">Perfil / Cargo</p>
                <Select value={newRole} onValueChange={(v: UserRole) => setNewRole(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="técnico">Técnico (Aparece nos selects)</SelectItem>
                    <SelectItem value="visitante">Visitante (Apenas leitura)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
             
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full border-2 border-background shadow-sm" 
                    style={{ backgroundColor: newColor }}
                  />
                  <div className="flex-1">
                    <p className="text-xs font-medium mb-1">Cor de Referência</p>
                    <Input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      className="h-8 p-1 cursor-pointer w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {editingUser && (
                  <Button type="button" variant="outline" className="flex-1" onClick={resetForm} disabled={loading}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                )}
                <Button type="submit" className="flex-[2]" disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : editingUser ? (
                    <Pencil className="h-4 w-4 mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  {editingUser ? "Atualizar Utilizador" : "Criar Utilizador"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Utilizadores</CardTitle>
            <CardDescription>
              Utilizadores com acesso ao sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Cor</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div 
                        className="w-6 h-6 rounded-full border border-background shadow-xs m-auto" 
                        style={{ backgroundColor: user.color || "#ccc" }}
                        title={user.color}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>@{user.username}</TableCell>
                    <TableCell>
                      {user.role === "técnico" ? (
                        <Badge variant="outline" className="text-xs font-bold border-amber-200 text-amber-700 bg-amber-50">
                          DEV
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs font-normal">
                          Visitante
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEdit(user)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.username === 'admin'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
