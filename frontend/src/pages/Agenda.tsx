import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import "./Agenda.css";

type Status = "agendada" | "confirmada" | "realizada" | "cancelada" | "falta";

interface Professional {
  id: string;
  name: string;
  specialty: string;
}

interface Appointment {
  id: string;
  professionalId: string;
  patientName: string;
  time: string; // "HH:MM"
  duration: number; // minutos
  status: Status;
}

interface FormState {
  patientName: string;
  professionalId: string;
  time: string;
  duration: number;
  status: Status;
}

// Troque por uma chamada real (ex: GET /api/profissionais) quando a API estiver pronta.
const PROFESSIONALS: Professional[] = [
  { id: "p1", name: "Dra. Ana Ramos", specialty: "Cardiologia" },
  { id: "p2", name: "Dr. Bruno Costa", specialty: "Ortopedia" },
  { id: "p3", name: "Dra. Carla Nunes", specialty: "Pediatria" },
];

// Troque por uma chamada real (ex: GET /api/consultas?data=...) quando a API estiver pronta.
const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: "a1", professionalId: "p1", patientName: "Marcos Vieira", time: "08:30", duration: 30, status: "confirmada" },
  { id: "a2", professionalId: "p1", patientName: "Sueli Amaral", time: "09:30", duration: 30, status: "agendada" },
  { id: "a3", professionalId: "p2", patientName: "Renato Lima", time: "09:00", duration: 60, status: "confirmada" },
  { id: "a4", professionalId: "p2", patientName: "Ivone Prado", time: "11:00", duration: 30, status: "falta" },
  { id: "a5", professionalId: "p3", patientName: "Beatriz Sales", time: "10:00", duration: 30, status: "realizada" },
  { id: "a6", professionalId: "p3", patientName: "João Pedro", time: "14:00", duration: 30, status: "cancelada" },
];

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

const TIME_SLOTS = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
  const label = slotIndexToTime(i);
  return { index: i, label, isHour: label.endsWith(":00") };
});

const DURATION_OPTIONS = [15, 30, 45, 60];

function createId(): string {
  return `a${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

const EMPTY_FORM: FormState = {
  patientName: "",
  professionalId: PROFESSIONALS[0].id,
  time: "08:00",
  duration: 30,
  status: "agendada",
};

export default function Agenda() {
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set(PROFESSIONALS.map((p) => p.id)));
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const visibleProfessionals = PROFESSIONALS.filter((p) => visibleIds.has(p.id));

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
    setForm({
      ...EMPTY_FORM,
      professionalId: professionalId ?? PROFESSIONALS[0].id,
      time: time ?? "08:00",
    });
    setModalOpen(true);
  }

  function openEditModal(appt: Appointment) {
    setEditingId(appt.id);
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
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.patientName.trim()) return;

    if (editingId) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === editingId ? { ...a, ...form } : a))
      );
    } else {
      setAppointments((prev) => [...prev, { id: createId(), ...form }]);
    }
    closeModal();
  }

  function handleDelete() {
    if (!editingId) return;
    setAppointments((prev) => prev.filter((a) => a.id !== editingId));
    closeModal();
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

  return (
    <div className="agenda-screen">
      <header className="agenda-header">
        <div className="agenda-title-row">
          <h1 className="agenda-title">Agenda</h1>
          <button className="new-appointment-button" onClick={() => openCreateModal()}>
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
          {PROFESSIONALS.map((p) => (
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
                  {PROFESSIONALS.map((p) => (
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

              <div className="modal-actions">
                {editingId && (
                  <button type="button" className="modal-delete" onClick={handleDelete}>
                    Excluir
                  </button>
                )}
                <div className="modal-actions-right">
                  <button type="button" className="modal-cancel" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="modal-save">
                    Salvar
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