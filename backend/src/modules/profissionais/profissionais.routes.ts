import { Router } from "express";
import { authGuard } from "../../middlewares/role-guard";
import { listarProfissionaisController } from "./profissionais.controller";

export const profissionaisRoutes = Router();

profissionaisRoutes.get("/", authGuard, listarProfissionaisController);