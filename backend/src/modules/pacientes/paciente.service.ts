import { prisma } from "../../config/database";

export async function listarPacientes(busca?: string) {
  return prisma.paciente.findMany({
    where: busca ? { nome: { contains: busca, mode: "insensitive" } } : undefined,
    orderBy: { nome: "asc" },
  });
}

export async function criarPaciente(dados: {
  nome: string;
  cpf?: string;
  telefone?: string;
  email?: string;
}) {
  return prisma.paciente.create({ data: dados });
}

// Usado pela Agenda: acha o paciente pelo nome ou cria um novo na hora,
// já que a tela de marcação hoje só pede o nome do paciente.
export async function encontrarOuCriarPorNome(nome: string) {
  const existente = await prisma.paciente.findFirst({ where: { nome } });
  if (existente) return existente;
  return prisma.paciente.create({ data: { nome } });
}