"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useProjectStore, type Project, getPhaseColor, formatDate } from "@/lib/store"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface GanttChartProps {
  projects: Project[]
  isReadOnly?: boolean
}

// Returns start of month (day 1, 00:00:00)
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

// Returns end of month (last day, 23:59:59)
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

export function GanttChart({ projects, isReadOnly = false }: GanttChartProps) {
  const { users } = useProjectStore()
  const today = useMemo(() => new Date(), [])
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({})

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }))
  }

  // Fixed window: previous month → next month
  const { startDate, endDate, totalDays, months, todayOffset } = useMemo(() => {
    const prevMonth  = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const nextMonthEnd = endOfMonth(new Date(today.getFullYear(), today.getMonth() + 1, 1))

    const startDate = startOfMonth(prevMonth)      // 1st of previous month
    const endDate   = nextMonthEnd                  // last day of next month

    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1

    // Build 3-month header
    const months: { label: string; startOffset: number; days: number }[] = []
    for (let m = -1; m <= 1; m++) {
      const ms = new Date(today.getFullYear(), today.getMonth() + m, 1)
      const me = endOfMonth(ms)
      const startOffset = Math.round(
        (ms.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      const days = Math.round(
        (me.getTime() - ms.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1

      months.push({
        label: ms.toLocaleDateString("pt-PT", { month: "long", year: "numeric" }),
        startOffset,
        days,
      })
    }

    // Today's offset from start
    const todayOffset = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)

    return { startDate, endDate, totalDays, months, todayOffset }
  }, [today])

  // Returns left/width % for a bar, clamped to the visible window
  const getBarPosition = (startStr: string, endStr: string) => {
    const s = new Date(startStr)
    const e = new Date(endStr)

    // Clamp to window
    const clampedStart = s < startDate ? startDate : s
    const clampedEnd   = e > endDate   ? endDate   : e

    if (clampedStart > endDate || clampedEnd < startDate) {
      return null // completely outside visible window
    }

    const startOffset = Math.round(
      (clampedStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const duration = Math.round(
      (clampedEnd.getTime() - clampedStart.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1

    return {
      left:  `${(startOffset / totalDays) * 100}%`,
      width: `${Math.max((duration / totalDays) * 100, 0.5)}%`,
    }
  }

  const getDateOffset = (dateStr: string) => {
    const d = new Date(dateStr)
    const offset = (d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    return (offset / totalDays) * 100
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">

        {/* ── Month Header ─────────────────────────────────────────── */}
        <div className="flex border-b border-border mb-1">
          <div className="w-52 shrink-0 px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Projeto / Fase
          </div>
          <div className="flex-1 relative h-8">
            {months.map((month, idx) => (
              <div
                key={idx}
                className={`absolute top-0 h-full flex items-center pl-2 text-xs font-semibold border-l ${
                  idx === 1
                    ? "text-primary border-primary/40 bg-primary/5"
                    : "text-muted-foreground border-border"
                }`}
                style={{
                  left:  `${(month.startOffset / totalDays) * 100}%`,
                  width: `${(month.days / totalDays) * 100}%`,
                }}
              >
                {month.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Project Rows ─────────────────────────────────────────── */}
        <TooltipProvider>
          <div className="relative">

            {/* Today line — container mirroring row layout to ensure chart area alignment */}
            <div className="absolute inset-0 flex pointer-events-none z-20">
              <div className="w-52 shrink-0" />
              <div className="flex-1 relative">
                <div
                  className="absolute top-0 bottom-0"
                  style={{ left: `${(todayOffset / totalDays) * 100}%` }}
                >
                  {/* Red vertical line */}
                  <div className="absolute inset-y-0 w-[2px] bg-red-500/80" />
                  {/* Top label */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-red-500 whitespace-nowrap bg-background border border-red-200 px-1.5 py-0.5 rounded shadow-sm">
                    Hoje
                  </div>
                </div>
              </div>
            </div>

            {projects.map((project) => {
              const projectBar = getBarPosition(
                project.plannedStartDate,
                project.plannedEndDate
              )

              return (
                <div key={project.id} className="mb-3">
                  {/* Project Row */}
                  <div className="flex items-center hover:bg-muted/30 rounded h-8">
                    <div className="w-52 shrink-0 px-2 flex items-center gap-1">
                      <button 
                        onClick={() => toggleProject(project.id)}
                        className="p-0.5 hover:bg-muted rounded transition-colors"
                      >
                        {expandedProjects[project.id] ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      {isReadOnly ? (
                        <span className="font-semibold text-sm truncate block flex-1">
                          {project.name}
                        </span>
                      ) : (
                        <Link
                          href={`/projetos/${project.id}`}
                          className="font-semibold text-sm hover:text-primary hover:underline truncate block flex-1"
                        >
                          {project.name}
                        </Link>
                      )}
                    </div>
                    <div className="flex-1 relative h-6">
                      {/* Month background bands */}
                      {months.map((m, i) => (
                        <div
                          key={i}
                          className={`absolute inset-y-0 ${i === 1 ? "bg-primary/5" : ""}`}
                          style={{
                            left:  `${(m.startOffset / totalDays) * 100}%`,
                            width: `${(m.days / totalDays) * 100}%`,
                          }}
                        />
                      ))}

                      {/* Project span bar */}
                      {projectBar && (
                        <div
                          className="absolute h-full rounded-md bg-indigo-200/60 border border-indigo-300/50"
                          style={projectBar}
                        />
                      )}
                    </div>
                  </div>

                  {/* Phase Rows (only if expanded) */}
                  {expandedProjects[project.id] && project.phases
                    .filter((phase) => {
                      const plannedBar = getBarPosition(phase.plannedStartDate, phase.plannedEndDate)
                      const actualBar = phase.actualStartDate
                        ? getBarPosition(
                            phase.actualStartDate,
                            phase.actualEndDate || new Date().toISOString().split("T")[0]
                          )
                        : null
                      return plannedBar || actualBar
                    })
                    .map((phase) => {
                    const plannedBar = getBarPosition(
                      phase.plannedStartDate,
                      phase.plannedEndDate
                    )
                    const actualBar = phase.actualStartDate
                      ? getBarPosition(
                          phase.actualStartDate,
                          phase.actualEndDate || new Date().toISOString().split("T")[0]
                        )
                      : null

                    return (
                      <div
                        key={phase.id}
                        className="flex items-center hover:bg-muted/30 rounded h-12 border-b border-border/10 last:border-0"
                      >
                        <div className="w-52 shrink-0 px-2 pl-7 flex items-center">
                          <span className="text-[11px] font-semibold text-muted-foreground truncate block">
                            {phase.name}
                          </span>
                        </div>
                        <div className="flex-1 relative h-10 flex items-center">
                          {/* Month bands background */}
                          {months.map((m, i) => (
                            <div
                              key={i}
                              className={`absolute inset-y-0 ${i === 1 ? "bg-primary/5" : "border-l border-border/10"}`}
                              style={{
                                left:  `${(m.startOffset / totalDays) * 100}%`,
                                width: `${(m.days / totalDays) * 100}%`,
                              }}
                            />
                          ))}

                          {/* ── Unified Progress Bar ────────────────── */}
                          <div className="relative w-full h-6 flex items-center">
                            
                            {/* 1. Planned Interval (The "Goal" or Container) */}
                            {plannedBar && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div 
                                    className={cn(
                                      "absolute h-5 rounded-md opacity-20 border border-current z-0",
                                      getPhaseColor(phase.type).replace("bg-", "text-").replace("border-", "border-")
                                    )}
                                    style={{
                                      ...plannedBar,
                                      backgroundColor: 'currentColor'
                                    }}
                                  />
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <div className="text-xs p-1">
                                    <p className="font-bold">{phase.name} (Planeado)</p>
                                    <p>{formatDate(phase.plannedStartDate)} → {formatDate(phase.plannedEndDate)}</p>
                                    <p className="pt-1 text-primary font-bold">Esforço: {phase.plannedHours}h</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* 2. Actual Progress (The "Fill") */}
                            {actualBar && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={cn(
                                      "absolute h-5 rounded-md shadow-sm z-10 border border-white/20 flex items-center overflow-hidden",
                                      getPhaseColor(phase.type)
                                    )}
                                    style={actualBar}
                                  >
                                    {/* Glass reflection effect */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                                    {/* Progress "pulse" if in progress */}
                                    {(!phase.actualEndDate) && (
                                      <div className="absolute inset-0 bg-white/10 animate-pulse duration-[2000ms]" />
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  <div className="text-xs p-1">
                                    <p className="font-bold text-sm">{phase.name} (Real)</p>
                                    <p>Horas: <span className="font-bold">{phase.actualHours || 0}h</span></p>
                                    <p className="text-[10px] opacity-70">
                                      {formatDate(phase.actualStartDate)}
                                      {phase.actualEndDate ? ` → ${formatDate(phase.actualEndDate)}` : " (Em curso)"}
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* 3. Delayed Indicator (Red Line) */}
                            {phase.actualStartDate && phase.actualStartDate > phase.plannedEndDate && (() => {
                              const plannedEndOffset = getDateOffset(phase.plannedEndDate);
                              const actualStartOffset = getDateOffset(phase.actualStartDate);
                              if (plannedEndOffset < 100 && actualStartOffset > 0) {
                                return (
                                  <div 
                                    className="absolute h-[2px] border-t-2 border-dashed border-red-500/80 z-0"
                                    style={{
                                      left: `${Math.max(0, plannedEndOffset)}%`,
                                      width: `${Math.min(100, actualStartOffset) - Math.max(0, plannedEndOffset)}%`
                                    }}
                                  />
                                );
                              }
                              return null;
                            })()}

                            {/* 4. Early Indicator (Green Line) */}
                            {phase.actualEndDate && phase.actualEndDate < phase.plannedEndDate && (() => {
                              const actualEndOffset = getDateOffset(phase.actualEndDate);
                              const plannedEndOffset = getDateOffset(phase.plannedEndDate);
                              if (actualEndOffset < 100 && plannedEndOffset > 0) {
                                return (
                                  <div 
                                    className="absolute h-[2px] border-t-2 border-dashed border-emerald-500/80 z-0"
                                    style={{
                                      left: `${Math.max(0, actualEndOffset)}%`,
                                      width: `${Math.min(100, plannedEndOffset) - Math.max(0, actualEndOffset)}%`
                                    }}
                                  />
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </TooltipProvider>

        {/* ── Legend ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-5 mt-6 pt-4 border-t border-border">
          <span className="text-xs text-muted-foreground font-semibold">Legenda:</span>
          <LegendItem color="bg-sky-500"     label="Requisitos" />
          <LegendItem color="bg-amber-500"   label="Desenvolvimento" />
          <LegendItem color="bg-emerald-500" label="Testes" />
          <LegendItem color="bg-violet-500"  label="Documentação" />
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
            <div className="w-px h-4 bg-red-500" />
            <span className="text-xs text-muted-foreground">Hoje</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded-sm bg-indigo-200/60 border border-indigo-300/50" />
            <span className="text-xs text-muted-foreground">Duração do projeto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 border-t border-dashed border-red-400 h-px" />
            <span className="text-xs text-muted-foreground">Atraso no início</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-4 h-3 rounded-sm ${color}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
