import { MeetingsList } from "@/components/meetings-list"

export default function ReunioesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reuniões</h1>
        <p className="text-muted-foreground mt-2">
          Registe e gira as suas reuniões. As horas associadas a um projecto serão contabilizadas.
        </p>
      </div>
      <MeetingsList />
    </div>
  )
}
