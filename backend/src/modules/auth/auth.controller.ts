

import { Request , Response } from "express";

import * as authService from "./auth.service";

export async function loginController(req : Request , res : Response) {
    
    //pega do corpo da requisicao

    const { email , password} = req.body;

    if (!email || !password){

        return res.status(400).json({message : "Email e senha sao obrigatorios"});
    }

    try {

        //chama a funcao do service
        const result = await authService.login(email, password);

        return res.json(result);


    }catch{

        return res.status(401).json({message : "Credenciais invalidas."});
        
    }
}