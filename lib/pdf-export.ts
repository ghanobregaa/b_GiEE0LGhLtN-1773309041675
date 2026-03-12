import jsPDF from "jspdf"
import "jspdf-autotable"
import { Meeting, formatDate } from "./data"

export const exportMeetingToPDF = (meeting: Meeting) => {
  const doc = new jsPDF() as any
  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFontSize(22)
  doc.setTextColor(41, 128, 185)
  doc.text("Project Sync - Acta de Reunião", 20, 20)
  
  doc.setLineWidth(0.5)
  doc.line(20, 25, pageWidth - 20, 25)

  // Meeting Title
  doc.setFontSize(16)
  doc.setTextColor(33, 33, 33)
  doc.text(meeting.title, 20, 35)

  // General Info
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Data: ${formatDate(meeting.date)}`, 20, 45)
  doc.text(`Duração: ${meeting.durationHours}h`, 80, 45)
  doc.text(`Projeto: ${meeting.projectName || "Geral / Não Associado"}`, 20, 50)

  // Technicians & Attendees
  doc.setFontSize(11)
  doc.setTextColor(33, 33, 33)
  doc.text("Participantes:", 20, 65)
  
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  const techsText = meeting.technicians.join(", ")
  doc.text(`Técnicos: ${techsText || "---"}`, 25, 72)
  doc.text(`Outros: ${meeting.attendees || "---"}`, 25, 78)

  let currentY = 90

  // Checklist
  if (meeting.checklist && meeting.checklist.length > 0) {
    doc.setFontSize(11)
    doc.setTextColor(33, 33, 33)
    doc.text("Pontos da Reunião (Checklist):", 20, currentY)
    currentY += 7

    meeting.checklist.forEach((item) => {
      const checkboxText = item.checked ? "[X]" : "[ ]"
      doc.setFontSize(10)
      doc.setTextColor(item.checked ? 100 : 60)
      doc.text(`${checkboxText} ${item.text}`, 25, currentY)
      currentY += 6
      
      if (currentY > 270) {
        doc.addPage()
        currentY = 20
      }
    })
    currentY += 10
  }

  // Notes
  if (meeting.notes) {
    doc.setFontSize(11)
    doc.setTextColor(33, 33, 33)
    doc.text("Notas / Decisões:", 20, currentY)
    currentY += 7

    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const splitNotes = doc.splitTextToSize(meeting.notes, pageWidth - 40)
    doc.text(splitNotes, 20, currentY)
    
    currentY += (splitNotes.length * 6) + 10
  }

  // Footer
  const pageCount = (doc.internal as any).getNumberOfPages()
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Página ${i} de ${pageCount} | Gerado por Project Sync em ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 
      pageWidth / 2, 
      doc.internal.pageSize.getHeight() - 10, 
      { align: "center" }
    )
  }

  doc.save(`meeting_${meeting.title.replace(/\s+/g, '_')}_${meeting.date}.pdf`)
}

// Import format for the footer
import { format } from "date-fns"
