export const getApiUrl = () => {
  if (typeof window !== "undefined") {
    // Se estivermos no browser, podemos usar caminhos relativos ou variáveis de ambiente
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL
    
    // Fallback para desenvolvimento ou build local
    const host = window.location.hostname
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:5001/api"
    }
  }

  return process.env.NEXT_PUBLIC_API_URL || "/api"
}
