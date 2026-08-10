

import {NextFunction, Request , Response } from "express";

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

export interface TokenPayload {

    sub : string;

    role : "ADMIN" | "RECEPCAO" | "MEDICO";

}

declare global {

    namespace Express {

        interface Request {

            user?: TokenPayload;
        }
    }
}

export function authGuard (req : Request, res  : Response , next : NextFunction){

    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer")) {

        return res.status(401).json({ message : "Token nao informado"});
    }

    try {

         req.user = jwt.verify(header.replace("Bearer ", ""), JWT_SECRET) as TokenPayload;
         next();

    }catch {

        return res.status(401).json({message : "Token invalido ou expirado"});
    }

}

export function roleGuard (...roles : TokenPayload["role"][]){

    return (req : Request , res : Response , next : NextFunction)=>{

        if (!req.user || !roles.includes(req.user.role)){

           return res.status(403).json({message : "Sem permissao para esta ação."});
        }

        next ();
    
    
    };

}