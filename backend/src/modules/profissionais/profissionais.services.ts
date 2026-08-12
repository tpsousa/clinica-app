import { prisma } from "../../config/database";

export async function listarProfissionais() {
  const profissionais = await prisma.profissional.findMany({
    include: { usuario: { select: { nome: true } } },
    orderBy: { usuario: { nome: "asc" } },
  });

  // Formato já compatível com o que a tela de Agenda espera: id, name, specialty.
  return profissionais.map((p) => ({
    id: p.id,
    name: p.usuario.nome,
    specialty: p.especialidade,
  }));
}