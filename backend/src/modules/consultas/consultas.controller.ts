import { Request, Response } from "express";
import * as consultasService from "./consultas.service";

export async function listarConsultasController(req: Request, res: Response) {
  const data = typeof req.query.data === "string" ? req.query.data : undefined;

  if (!data) {
    return res.status(400).json({ message: "Informe o parâmetro 'data' (YYYY-MM-DD)." });
  }

  const consultas = await consultasService.listarConsultasPorDia(data);
  res.json(consultas);
}

export async function criarConsultaController(req: Request, res: Response) {
  const { patientName, professionalId, time, data, duration, status } = req.body;

  if (!patientName || !professionalId || !time || !data || !duration) {
    return res.status(400).json({ message: "Dados incompletos para criar a consulta." });
  }

  const consulta = await consultasService.criarConsulta({
    patientName, professionalId, time, data, duration, status,
  });
  res.status(201).json(consulta);
}

export async function atualizarConsultaController(req: Request, res: Response) {
  const { id } = req.params;
  const consulta = await consultasService.atualizarConsulta(id, req.body);
  res.json(consulta);
}

export async function excluirConsultaController(req: Request, res: Response) {
  const { id } = req.params;
  await consultasService.excluirConsulta(id);
  res.status(204).send();
}