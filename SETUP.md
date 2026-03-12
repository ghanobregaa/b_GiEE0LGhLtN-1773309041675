# 🚀 Setup: Ligação à Base de Dados (Supabase)

## Arquitectura

```
Next.js (frontend) → Flask API (backend) → Supabase (PostgreSQL)
```

---

## 1. Criar a Base de Dados no Supabase

1. Entra em [supabase.com](https://supabase.com) e cria (ou usa) um projeto
2. Vai a **SQL Editor** e executa o conteúdo do ficheiro `database.sql`
   - Cria os tipos ENUM: `project_status`, `task_status`, `phase_type`
   - Cria as tabelas: `projects`, `phases`, `tasks`

---

## 2. Configurar as credenciais do Backend

1. Na tua dashboard do Supabase: **Project Settings → Database → Connection string → URI**
2. Copia a connection string (algo do tipo: `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`)
3. Dentro da pasta `backend/`, cria um ficheiro `.env`:

```bash
cp backend/.env.example backend/.env
```

4. Edita o `.env` e substitui pela tua connection string real:

```
DATABASE_URL=postgresql://postgres:TUA_PASSWORD@db.TEUREF.supabase.co:5432/postgres
```

---

## 3. Arrancar o Backend Flask

Abre um **novo terminal** e corre:

```bash
cd /Users/gnobrega/Downloads/b_GiEE0LGhLtN-1773309041675/backend
python3 app.py
```

O servidor Flask arranca em: **http://localhost:5000**

Podes testar: `curl http://localhost:5000/health`

---

## 4. Arrancar o Frontend Next.js

No terminal original (ou noutro), já está a correr:

```bash
npm run dev
```

O frontend está em: **http://localhost:3000**

---

## 5. Estrutura de Ficheiros

```
b_GiEE0LGhLtN-1773309041675/
├── database.sql              ← Script SQL para criar as tabelas no Supabase
├── SETUP.md                  ← Este ficheiro
├── backend/
│   ├── app.py                ← Servidor Flask com todas as rotas API
│   ├── requirements.txt      ← Dependências Python
│   ├── .env.example          ← Template das variáveis de ambiente
│   └── .env                  ← ⚠️ CRIAR este ficheiro com as tuas credenciais
├── lib/
│   └── store.ts              ← Store Zustand → agora faz chamadas à API
├── components/
│   ├── app-layout.tsx        ← Carrega dados da API ao iniciar
│   └── ...
```

---

## 6. Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/projects` | Listar todos os projetos (com fases) |
| POST | `/api/projects` | Criar projeto |
| GET | `/api/projects/:id` | Ver projeto |
| PUT | `/api/projects/:id` | Atualizar projeto |
| DELETE | `/api/projects/:id` | Eliminar projeto (e fases) |
| POST | `/api/projects/:id/phases` | Adicionar fase |
| PUT | `/api/phases/:id` | Atualizar fase |
| DELETE | `/api/phases/:id` | Eliminar fase |
| GET | `/api/tasks` | Listar todas as tarefas |
| POST | `/api/tasks` | Criar tarefa |
| PUT | `/api/tasks/:id` | Atualizar tarefa |
| DELETE | `/api/tasks/:id` | Eliminar tarefa |

---

## ⚠️ Notas Importantes

- Se o Flask não estiver a correr, o frontend mostra uma mensagem de erro com instruções
- O ficheiro `.env` **nunca** deve ser commitado para o git (já está no `.gitignore`)
- As dependências Python já estão instaladas (`python3 -m pip install -r backend/requirements.txt`)
