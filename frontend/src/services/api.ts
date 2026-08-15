// Base URL do back-end. Crie um arquivo .env na raiz de frontend/ com:
// VITE_API_URL=http://localhost:3000
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? "Erro na requisição.");
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---------- Tipos que espelham o retorno do back-end ----------

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: "ADMIN" | "RECEPCAO" | "MEDICO";
}

export interface Profissional {
  id: string;
  name: string;
  specialty: string;
}

export type BackendStatus = "AGENDADA" | "CONFIRMADA" | "REALIZADA" | "CANCELADA" | "FALTA";

export interface ConsultaApi {
  id: string;
  professionalId: string;
  patientName: string;
  time: string;
  duration: number;
  status: BackendStatus;
}

export interface ConsultaPayload {
  patientName: string;
  professionalId: string;
  time: string;
  data: string; // "YYYY-MM-DD"
  duration: number;
  status?: BackendStatus;
}

// ---------- Chamadas ----------

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; usuario: Usuario }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  listarProfissionais: () => request<Profissional[]>("/api/profissionais"),

  listarConsultas: (data: string) =>
    request<ConsultaApi[]>(`/api/consultas?data=${data}`),

  criarConsulta: (payload: ConsultaPayload) =>
    request<ConsultaApi>("/api/consultas", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  atualizarConsulta: (id: string, payload: Partial<ConsultaPayload>) =>
    request<ConsultaApi>(`/api/consultas/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  excluirConsulta: (id: string) =>
    request<void>(`/api/consultas/${id}`, { method: "DELETE" }),
};