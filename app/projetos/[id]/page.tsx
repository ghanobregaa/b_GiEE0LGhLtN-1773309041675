"use client"

import { use } from "react"
import { useProjectStore } from "@/lib/store"
import { ProjectDetail } from "@/components/project-detail"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertCircle } from "lucide-react"

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id } = use(params)
  const project = useProjectStore((state) => state.getProjectById(id))
  const isLoading = useProjectStore((state) => state.isLoading)

  // Still loading from API — don't show 404 yet
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground animate-pulse">A carregar projeto...</p>
      </div>
    )
  }

  // Data loaded but project not found
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-xl font-semibold">Projeto não encontrado</h2>
          <p className="text-muted-foreground mt-1">
            O projeto que procuras não existe ou foi eliminado.
          </p>
        </div>
        <Link href="/projetos">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar aos Projetos
          </Button>
        </Link>
      </div>
    )
  }

  return <ProjectDetail project={project} />
}
