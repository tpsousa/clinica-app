import { Router } from "express";
import { authGuard } from "../../middlewares/role-guard";
import { listarPacientesController, criarPacienteController } from "./paciente.controller";

export const pacientesRoutes = Router();

pacientesRoutes.get("/", authGuard, listarPacientesController);
pacientesRoutes.post("/", authGuard, criarPacienteController);