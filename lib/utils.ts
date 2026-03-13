import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateBusinessHours(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  if (start > end) return 0;
  
  let count = 0;
  const current = new Date(start);
  
  // Normalizar datas para evitar problemas com fuso horário/horas
  current.setHours(0, 0, 0, 0);
  const finalEnd = new Date(end);
  finalEnd.setHours(0, 0, 0, 0);
  
  while (current <= finalEnd) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Domingo, 6 = Sábado
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count * 8;
}
