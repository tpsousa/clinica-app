import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../services/api";
import type { Profissional, ConsultaApi, BackendStatus } from "../services/api";
import "./Agenda.css";

type Status = "agendada" | "confirmada" | "realizada" | "cancelada" | "falta";

interface Appointment {
  id: string;
  professionalId: string;
  patientName: string;
  time: string;
  duration: number;
  status: Status;
}

interface FormState {
  patientName: string;
  professionalId: string;
  time: string;
  duration: number;
  status: Status;
}

const START_HOUR = 8;
const END_HOUR = 19;
const SLOT_MINUTES = 30;
const TOTAL_SLOTS = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;

const STATUS_LABEL: Record<Status, string> = {
  agendada: "Agendada",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  falta: "Falta",
};

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function slotIndexToTime(index: number): string {
  const totalMinutes = START_HOUR * 60 + index * SLOT_MINUTES;
  return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
}

function timeToSlotIndex(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return ((hour - START_HOUR) * 60 + minute) / SLOT_MINUTES;
}

function formatDateISO(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toFrontStatus(status: BackendStatus): Status {
  return status.toLowerCase() as Status;
}

function toBackendStatus(status: Status): BackendStatus {
  return status.toUpperCase() as BackendStatus;
}

const TIME_SLOTS = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
  const label = slotIndexToTime(i);
  return { index: i, label, isHour: label.endsWith(":00") };
});

const DURATION_OPTIONS = [15, 30, 45, 60];

const EMPTY_FORM: FormState = {
  patientName: "",
  professionalId: "",
  time: "08:00",
  duration: 30,
  status: "agendada",
};

export default function Agenda() {
  const [professionals, setProfessionals] = useState<Profissional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [loadingProfessionals, setLoadingProfessionals] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // Busca a lista de profissionais uma única vez.
  useEffect(() => {
    api
      .listarProfissionais()
      .then((data) => {
        setProfessionals(data);
        setVisibleIds(new Set(data.map((p) => p.id)));
      })
      .catch((err) => setPageError(err instanceof Error ? err.message : "Erro ao carregar profissionais."))
      .finally(() => setLoadingProfessionals(false));
  }, []);

  // Busca as consultas sempre que o dia selecionado muda.
  useEffect(() => {
    const dataISO = formatDateISO(selectedDate);
    setLoadingAppointments(true);
    api
      .listarConsultas(dataISO)
      .then((data: ConsultaApi[]) =>
        setAppointments(data.map((a) => ({ ...a, status: toFrontStatus(a.status) })))
      )
      .catch((err) => setPageError(err instanceof Error ? err.message : "Erro ao carregar consultas."))
      .finally(() => setLoadingAppointments(false));
  }, [selectedDate]);

  async function refetchAppointments() {
    const dataISO = formatDateISO(selectedDate);
    const data = await api.listarConsultas(dataISO);
    setAppointments(data.map((a) => ({ ...a, status: toFrontStatus(a.status) })));
  }

  const visibleProfessionals = professionals.filter((p) => visibleIds.has(p.id));

  const occupied = useMemo(() => {
    const map = new Map<string, Set<number>>();
    for (const appt of appointments) {
      if (appt.status === "cancelada") continue;
      const start = timeToSlotIndex(appt.time);
      const span = Math.max(1, appt.duration / SLOT_MINUTES);
      const set = map.get(appt.professionalId) ?? new Set<number>();
      for (let i = 0; i < span; i++) set.add(start + i);
      map.set(appt.professionalId, set);
    }
    return map;
  }, [appointments]);

  function toggleProfessional(id: string) {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id) && next.size > 1) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openCreateModal(professionalId?: string, time?: string) {
    setEditingId(null);
    setModalError(null);
    setForm({
      ...EMPTY_FORM,
      professionalId: professionalId ?? professionals[0]?.id ?? "",
      time: time ?? "08:00",
    });
    setModalOpen(true);
  }

  function openEditModal(appt: Appointment) {
    setEditingId(appt.id);
    setModalError(null);
    setForm({
      patientName: appt.patientName,
      professionalId: appt.professionalId,
      time: appt.time,
      duration: appt.duration,
      status: appt.status,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setModalError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.patientName.trim() || !form.professionalId) return;

    setSaving(true);
    setModalError(null);

    const payload = {
      patientName: form.patientName,
      professionalId: form.professionalId,
      time: form.time,
      data: formatDateISO(selectedDate),
      duration: form.duration,
      status: toBackendStatus(form.status),
    };

    try {
      if (editingId) {
        await api.atualizarConsulta(editingId, payload);
      } else {
        await api.criarConsulta(payload);
      }
      await refetchAppointments();
      closeModal();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingId) return;
    setSaving(true);
    try {
      await api.excluirConsulta(editingId);
      await refetchAppointments();
      closeModal();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Não foi possível excluir.");
    } finally {
      setSaving(false);
    }
  }

  function shiftDate(days: number) {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + days);
      return next;
    });
  }

  const dateLabel = selectedDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const searchTerm = search.trim().toLowerCase();
  const isLoading = loadingProfessionals || loadingAppointments;

  return (
    <div className="agenda-screen">
      <header className="agenda-header">
        <div className="agenda-title-row">
          <h1 className="agenda-title">Agenda</h1>
          <button
            className="new-appointment-button"
            onClick={() => openCreateModal()}
            disabled={professionals.length === 0}
          >
            Nova consulta
          </button>
        </div>

        <div className="agenda-controls">
          <div className="date-nav">
            <button className="date-nav-arrow" onClick={() => shiftDate(-1)} aria-label="Dia anterior">
              ‹
            </button>
            <span className="date-nav-label">{dateLabel}</span>
            <button className="date-nav-arrow" onClick={() => shiftDate(1)} aria-label="Próximo dia">
              ›
            </button>
            <button className="date-nav-today" onClick={() => setSelectedDate(new Date())}>
              Hoje
            </button>
          </div>

          <input
            className="patient-search"
            type="text"
            placeholder="Buscar paciente"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="professional-filters">
          {professionals.map((p) => (
            <button
              key={p.id}
              className={`professional-chip ${visibleIds.has(p.id) ? "is-active" : ""}`}
              onClick={() => toggleProfessional(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="status-legend">
          {(Object.keys(STATUS_LABEL) as Status[]).map((status) => (
            <span key={status} className="legend-item">
              <span className={`legend-dot legend-dot--${status}`} />
              {STATUS_LABEL[status]}
            </span>
          ))}
        </div>
      </header>

      {pageError && <p className="form-error">{pageError}</p>}

      {isLoading ? (
        <p className="agenda-loading">Carregando agenda…</p>
      ) : (
        <div className="agenda-grid-wrapper">
          <div
            className="agenda-grid"
            style={{
              gridTemplateColumns: `64px repeat(${visibleProfessionals.length}, minmax(180px, 1fr))`,
            }}
          >
            <div className="grid-corner" style={{ gridColumn: 1, gridRow: 1 }} />

            {visibleProfessionals.map((p, colIdx) => (
              <div className="column-header" key={p.id} style={{ gridColumn: colIdx + 2, gridRow: 1 }}>
                <span className="column-header-name">{p.name}</span>
                <span className="column-header-specialty">{p.specialty}</span>
              </div>
            ))}

            {TIME_SLOTS.map((slot) => (
              <div
                key={slot.index}
                className={`time-label ${slot.isHour ? "is-hour" : ""}`}
                style={{ gridColumn: 1, gridRow: slot.index + 2 }}
              >
                {slot.isHour ? slot.label : ""}
              </div>
            ))}

            {visibleProfessionals.map((p, colIdx) =>
              TIME_SLOTS.map((slot) => {
                const isOccupied = occupied.get(p.id)?.has(slot.index);
                if (isOccupied) return null;
                return (
                  <button
                    key={`${p.id}-${slot.index}`}
                    className="empty-slot"
                    style={{ gridColumn: colIdx + 2, gridRow: slot.index + 2 }}
                    onClick={() => openCreateModal(p.id, slot.label)}
                    aria-label={`Agendar consulta às ${slot.label} com ${p.name}`}
                  />
                );
              })
            )}

            {appointments.map((appt) => {
              const colIdx = visibleProfessionals.findIndex((p) => p.id === appt.professionalId);
              if (colIdx === -1) return null;
              const start = timeToSlotIndex(appt.time);
              const span = Math.max(1, appt.duration / SLOT_MINUTES);
              const dimmed =
                searchTerm.length > 0 && !appt.patientName.toLowerCase().includes(searchTerm);

              return (
                <button
                  key={appt.id}
                  className={`appointment-card status--${appt.status} ${dimmed ? "is-dimmed" : ""}`}
                  style={{
                    gridColumn: colIdx + 2,
                    gridRow: `${start + 2} / span ${span}`,
                  }}
                  onClick={() => openEditModal(appt)}
                >
                  <span className="card-time">{appt.time}</span>
                  <span className="card-patient">{appt.patientName}</span>
                  <span className="card-status">{STATUS_LABEL[appt.status]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editingId ? "Editar consulta" : "Nova consulta"}</h2>

            <form onSubmit={handleSubmit}>
              <label className="modal-field" htmlFor="patientName">
                <span>Paciente</span>
                <input
                  id="patientName"
                  type="text"
                  value={form.patientName}
                  onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                  placeholder="Nome do paciente"
                  autoFocus
                />
              </label>

              <label className="modal-field" htmlFor="professionalId">
                <span>Profissional</span>
                <select
                  id="professionalId"
                  value={form.professionalId}
                  onChange={(e) => setForm({ ...form, professionalId: e.target.value })}
                >
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.specialty}
                    </option>
                  ))}
                </select>
              </label>

              <div className="modal-field-row">
                <label className="modal-field" htmlFor="time">
                  <span>Horário</span>
                  <select
                    id="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot.index} value={slot.label}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="modal-field" htmlFor="duration">
                  <span>Duração</span>
                  <select
                    id="duration"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d} min
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {editingId && (
                <label className="modal-field" htmlFor="status">
                  <span>Status</span>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                  >
                    {(Object.keys(STATUS_LABEL) as Status[]).map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABEL[status]}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {modalError && (
                <p className="form-error" role="alert">
                  {modalError}
                </p>
              )}

              <div className="modal-actions">
                {editingId && (
                  <button type="button" className="modal-delete" onClick={handleDelete} disabled={saving}>
                    Excluir
                  </button>
                )}
                <div className="modal-actions-right">
                  <button type="button" className="modal-cancel" onClick={closeModal} disabled={saving}>
                    Cancelar
                  </button>
                  <button type="submit" className="modal-save" disabled={saving}>
                    {saving ? "Salvando…" : "Salvar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}