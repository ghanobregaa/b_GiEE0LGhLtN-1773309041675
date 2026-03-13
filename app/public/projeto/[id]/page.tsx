"use client"

import { useParams } from "next/navigation"
import { useProjectStore } from "@/lib/store"
import { PublicProjectDetail } from "@/components/public-project-detail"
import { Loader2 } from "lucide-react"

export default function PublicProjectPage() {
  const { id } = useParams()
  const projects = useProjectStore((state) => state.projects)
  const isLoading = useProjectStore((state) => state.isLoading)
  
  const project = projects.find((p) => p.id === id)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">A carregar detalhes do projeto...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center p-4">
        <div className="p-4 bg-destructive/10 rounded-full">
          <span className="text-4xl font-bold text-destructive">!</span>
        </div>
        <h1 className="text-2xl font-bold">Projeto Não Encontrado</h1>
        <p className="text-muted-foreground max-w-md">
          Não foi possível encontrar o projeto solicitado ou o link pode ter expirado.
        </p>
      </div>
    )
  }

  return <PublicProjectDetail project={project} />
}
