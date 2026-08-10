
import express from "express";

import cors from "cors";

import { authRoutes } from "./modules/auth/auth.routes";

export const app = express();

app.use(cors());

app.use(express.json());

app.get("/health", (_req_,res) => res.json({status : "ok"}));

app.use("api/auth", authRoutes);
