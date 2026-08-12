import { Request, Response } from "express";
import * as profissionaisService from "./profissionais.services";

export async function listarProfissionaisController(_req: Request, res: Response) {
  const profissionais = await profissionaisService.listarProfissionais();
  res.json(profissionais);
}