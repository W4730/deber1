# Bounce a' bol

Minijuego web: crea pelotas con nombre y color RGB, agárralas con el mouse, lánzalas y míralas rebotar contra los bordes de la pantalla. Las pelotas se guardan en Supabase. Música ambiental relajante generada en el navegador con Web Audio API.

**Stack:** React + TypeScript + Vite · Supabase (PostgreSQL) · Vercel

MattMurdock26032004

## Flujo

1. **Menú** — título, botones *Empezar* y *Créditos*, slider de volumen.
2. **Personalización** — nombre, selector de color + sliders R/G/B, botón *Listo* (y *Borrar* al editar).
3. **Juego** — las pelotas caen y rebotan; arrástralas y suéltalas para lanzarlas. Abajo, el nombre de cada pelota (clic = editar) y un **+** para agregar otra.

## Instalación local

Requisitos: Node 20+ y una cuenta de [Supabase](https://supabase.com).

1. Crea un proyecto en Supabase y ejecuta en **SQL Editor**:

   ```sql
   create table balls (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz not null default now(),
     name text not null check (char_length(name) between 1 and 20),
     r int2 not null check (r between 0 and 255),
     g int2 not null check (g between 0 and 255),
     b int2 not null check (b between 0 and 255)
   );
   alter table balls enable row level security;
   create policy "public access" on balls for all using (true) with check (true);
   ```

2. Clona e instala:

   ```bash
   git clone <url-del-repo>
   cd <nombre-del-repo>
   npm install
   cp .env.example .env
   ```

3. Llena `.env` con los datos de *Project Settings → API Keys* de Supabase:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
   ```

4. `npm run dev` y abre http://localhost:5173

## API (Supabase)

`src/api.ts` expone las operaciones CRUD tipadas sobre la tabla `balls`:

| Función       | Operación | Supabase                      |
|---------------|-----------|-------------------------------|
| `listBalls`   | GET       | `select()`                    |
| `createBall`  | POST      | `insert({ name, r, g, b })`   |
| `updateBall`  | PUT       | `update(...).eq('id', id)`    |
| `deleteBall`  | DELETE    | `delete().eq('id', id)`       |

Cada pelota se guarda como `{ "name": "Bolita", "r": 255, "g": 120, "b": 80 }`.

## Despliegue en Vercel

1. Sube el repo a GitHub e impórtalo en [vercel.com/new](https://vercel.com/new) (Vercel detecta Vite solo).
2. En *Environment Variables* agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Deploy.

## Flujo de ramas

- `main` protegida (GitHub → Settings → Branches → *Require a pull request before merging*).
- Cada feature en su rama `feature/<nombre>` y se integra por Pull Request.
