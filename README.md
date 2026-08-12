# clinica-app

Sistema de gestão de clínica médica — agenda, pacientes, profissionais e consultas.

## Stack

- **Back-end:** Node.js + TypeScript + Express
- **ORM / Banco:** Prisma + PostgreSQL
- **Front-end:** React + TypeScript + Vite
- **Auth:** JWT + bcrypt
- **Infra:** Docker + Docker Compose

## Estrutura

```
clinica-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # modelo de dados
│   │   └── seed.ts             # dados de teste
│   ├── src/
│   │   ├── modules/            # auth, profissionais, pacientes, consultas
│   │   ├── middlewares/        # auth-guard, error-handler
│   │   ├── config/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/               # Login, Agenda, ...
│   │   └── App.tsx
│   └── package.json
└── docker-compose.yml
```

## Modelo de dados

```
Usuario  (login, role: ADMIN | RECEPCAO | MEDICO)
  └── Profissional  (especialidade, registro)
        └── Consulta  (data/hora, duração, status)
                └── Paciente  (nome, cpf, contato)
```

Status de consulta: `AGENDADA` · `CONFIRMADA` · `REALIZADA` · `CANCELADA` · `FALTA`

## Rodando local (sem Docker)

**Back-end**

```bash
cd backend
cp .env.example .env        # ajuste DATABASE_URL e JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run seed                # cria admin + 3 profissionais de teste
npm run dev                 # http://localhost:3000
```

**Front-end**

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

## Rodando com Docker

```bash
docker-compose up --build
```

Sobe Postgres + back-end + front-end juntos. Depois, rode a migration e o seed dentro do container do back-end (ou local, apontando pro banco do compose):

```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run seed
```

## Login de teste

```
email: admin@clinica.com
senha: 123456
```

## Rotas da API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/auth/login` | não | login, retorna JWT |
| GET | `/api/profissionais` | sim | lista profissionais |
| GET | `/api/pacientes?busca=` | sim | busca pacientes |
| POST | `/api/pacientes` | sim | cria paciente |
| GET | `/api/consultas?data=YYYY-MM-DD` | sim | consultas do dia |
| POST | `/api/consultas` | sim | cria consulta |
| PUT | `/api/consultas/:id` | sim | edita consulta |
| DELETE | `/api/consultas/:id` | sim | exclui consulta |

Rotas protegidas exigem header `Authorization: Bearer <token>`.

## Feito

- [x] Tela de login (React + TS)
- [x] Tela de agenda — grade por profissional, criar/editar/excluir consulta
- [x] Back-end: auth, profissionais, pacientes, consultas
- [x] Banco modelado (Prisma + Postgres)
- [x] Docker

## Próximos passos

- [ ] Conectar front-end às rotas reais (hoje Login e Agenda usam dados mock)
- [ ] Tela de pacientes (CRUD)
- [ ] Dashboard (indicadores do dia/mês)
- [ ] Controle de permissão por role no front (admin / recepção / médico)
- [ ] Deploy

