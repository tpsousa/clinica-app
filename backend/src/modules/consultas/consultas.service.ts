import { prisma } from "../../config/database";
import { encontrarOuCriarPorNome } from "../pacientes/paciente.service";

const STATUS_VALIDOS = ["AGENDADA", "CONFIRMADA", "REALIZADA", "CANCELADA", "FALTA"];

interface CriarConsultaInput {
  patientName: string;
  professionalId: string;
  time: string; // "HH:MM"
  data: string; // "YYYY-MM-DD"
  duration: number;
  status?: string;
}

function montarDataHora(data: string, time: string): Date {
  return new Date(`${data}T${time}:00`);
}

export async function listarConsultasPorDia(data: string) {
  const inicio = new Date(`${data}T00:00:00`);
  const fim = new Date(`${data}T23:59:59`);

  const consultas = await prisma.consulta.findMany({
    where: { dataHora: { gte: inicio, lte: fim } },
    include: { paciente: true },
    orderBy: { dataHora: "asc" },
  });

  // Formato já compatível com o que a tela de Agenda espera.
  return consultas.map((c) => ({
    id: c.id,
    professionalId: c.profissionalId,
    patientName: c.paciente.nome,
    time: c.dataHora.toTimeString().slice(0, 5),
    duration: c.duracaoMinutos,
    status: c.status,
  }));
}

export async function criarConsulta(input: CriarConsultaInput) {
  const paciente = await encontrarOuCriarPorNome(input.patientName);

  return prisma.consulta.create({
    data: {
      pacienteId: paciente.id,
      profissionalId: input.professionalId,
      dataHora: montarDataHora(input.data, input.time),
      duracaoMinutos: input.duration,
      status: (input.status as any) ?? "AGENDADA",
    },
  });
}

export async function atualizarConsulta(id: string, input: Partial<CriarConsultaInput>) {
  const dataAtual: any = {};

  if (input.professionalId) dataAtual.profissionalId = input.professionalId;
  if (input.duration) dataAtual.duracaoMinutos = input.duration;
  if (input.status && STATUS_VALIDOS.includes(input.status)) {
    dataAtual.status = input.status;
  }
  if (input.data && input.time) {
    dataAtual.dataHora = montarDataHora(input.data, input.time);
  }
  if (input.patientName) {
    const paciente = await encontrarOuCriarPorNome(input.patientName);
    dataAtual.pacienteId = paciente.id;
  }

  return prisma.consulta.update({ where: { id }, data: dataAtual });
}

export async function excluirConsulta(id: string) {
  return prisma.consulta.delete({ where: { id } });
}