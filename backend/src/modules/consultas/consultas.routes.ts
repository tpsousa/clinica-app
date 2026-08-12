import { Router } from "express";
import { authGuard } from "../../middlewares/role-guard";
import {
  listarConsultasController,
  criarConsultaController,
  atualizarConsultaController,
  excluirConsultaController,
} from "./consultas.controller";

export const consultasRoutes = Router();

consultasRoutes.get("/", authGuard, listarConsultasController);
consultasRoutes.post("/", authGuard, criarConsultaController);
consultasRoutes.put("/:id", authGuard, atualizarConsultaController);
consultasRoutes.delete("/:id", authGuard, excluirConsultaController);