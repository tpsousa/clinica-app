import { Request, Response } from "express";
import * as pacientesService from "./paciente.service";

export async function listarPacientesController(req: Request, res: Response) {
  const busca = typeof req.query.busca === "string" ? req.query.busca : undefined;
  const pacientes = await pacientesService.listarPacientes(busca);
  res.json(pacientes);
}

export async function criarPacienteController(req: Request, res: Response) {
  const { nome, cpf, telefone, email } = req.body;

  if (!nome) {
    return res.status(400).json({ message: "Nome é obrigatório." });
  }

  const paciente = await pacientesService.criarPaciente({ nome, cpf, telefone, email });
  res.status(201).json(paciente);
}