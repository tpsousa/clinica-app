

import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";

import {prisma} from "../../config/database";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-change-me";

export async function login (email : string , senha : string){

    const usuario = await prisma.usuario.findUnique({where : { email }});

    if (!usuario) throw new Error("Credenciais invalidas");

    const token = jwt.sign({sub : usuario.id , role : usuario.role}, JWT_SECRET , {
        
        expiresIn: "8h"
    });

    return {

        token,
        usuario : {id : usuario.id , nome : usuario.nome , email : usuario.email,role : usuario.role},

    };

}