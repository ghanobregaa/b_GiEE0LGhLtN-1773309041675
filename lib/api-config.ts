export const getApiUrl = () => {
  // Se estivermos em produção no Vercel, a API estará no mesmo domínio
  if (process.env.NODE_ENV === "production") {
    return "/api"
  }
  // Em desenvolvimento
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"
}
