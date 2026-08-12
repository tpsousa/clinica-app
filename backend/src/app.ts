
import express from "express";

import cors from "cors";

import { authRoutes } from "./modules/auth/auth.routes";
import { profissionaisRoutes } from "./modules/profissionais/profissionais.routes";
import { pacientesRoutes } from "./modules/pacientes/paciente.routes";
import { consultasRoutes } from "./modules/consultas/consultas.routes";

export const app = express();

app.use(cors());

app.use(express.json());

app.get("/health", (_req_,res) => res.json({status : "ok"}));

app.use("/api/auth", authRoutes);

app.use("/api/profissionais", profissionaisRoutes);

app.use("/api/pacientes", pacientesRoutes);

app.use("/api/consultas", consultasRoutes);