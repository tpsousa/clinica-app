import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../services/api";
import "./Login.css";

interface AppointmentSlot {
  time: string;
  patient: string;
  specialty: string;
}

// Dado de exemplo apenas para animar o painel — pode trocar depois por
// uma chamada real (ex: GET /api/consultas) se quiser dados de verdade aqui.
const UPCOMING_SLOTS: AppointmentSlot[] = [
  { time: "08:30", patient: "Dra. Ana Ramos", specialty: "Cardiologia" },
  { time: "09:00", patient: "Dr. Bruno Costa", specialty: "Ortopedia" },
  { time: "09:15", patient: "Dra. Carla Nunes", specialty: "Pediatria" },
  { time: "09:45", patient: "Dr. Diego Alves", specialty: "Clínica Geral" },
  { time: "10:00", patient: "Dra. Elis Farias", specialty: "Dermatologia" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const tickerId = setInterval(() => {
      setTickerIndex((i) => (i + 1) % UPCOMING_SLOTS.length);
    }, 2800);
    return () => clearInterval(tickerId);
  }, []);

  useEffect(() => {
    const clockId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clockId);
  }, []);

  const visibleSlots = [0, 1, 2, 3].map(
    (offset) => UPCOMING_SLOTS[(tickerIndex + offset) % UPCOMING_SLOTS.length]
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Informe e-mail e senha para continuar.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.login(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
      window.location.href = "/agenda";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível entrar. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  const formattedTime = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const formattedDate = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <div className="login-screen">
      <aside className="login-board" aria-hidden="true">
        <div className="board-top">
          <span className="board-mark">Consultório</span>
          <span className="board-eyebrow">Painel da equipe</span>
        </div>

        <div className="board-ticker">
          <span className="board-ticker-label">Próximos horários</span>
          <ul className="board-rows">
            {visibleSlots.map((slot, idx) => (
              <li
                className="board-row"
                key={`${slot.time}-${idx}-${tickerIndex}`}
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <span className="row-time">{slot.time}</span>
                <span className="row-patient">{slot.patient}</span>
                <span className="row-specialty">{slot.specialty}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="board-clock">
          <span className="clock-time">{formattedTime}</span>
          <span className="clock-date">{formattedDate}</span>
        </div>
      </aside>

      <main className="login-panel">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <span className="form-eyebrow">Bem-vindo de volta</span>
          <h1 className="form-title">Entrar</h1>
          <p className="form-subtitle">
            Acesse a agenda, os pacientes e os atendimentos da clínica.
          </p>

          <label className="field" htmlFor="email">
            <span className="field-label">E-mail</span>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@clinica.com"
            />
          </label>

          <label className="field" htmlFor="password">
            <span className="field-label">Senha</span>
            <div className="password-row">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button className="submit-button" type="submit" disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </button>

          <a className="forgot-link" href="/esqueci-senha">
            Esqueci minha senha
          </a>
        </form>

        <footer className="login-footer">
          <span>Sistema interno · uso restrito à equipe</span>
        </footer>
      </main>
    </div>
  );
}