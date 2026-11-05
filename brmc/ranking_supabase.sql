-- Black Rock MC - The Game | ranking online (Supabase)
-- 1) Crie um projeto grátis em https://supabase.com
-- 2) Abra "SQL Editor", cole este arquivo inteiro e clique em RUN
-- 3) Em Project Settings > API copie a "Project URL" e a chave "anon public"
-- 4) Cole as duas em jogo.js, na linha:  const RANKING_ONLINE = { url: '...', chave: '...' };

create table if not exists public.ranking (
  id bigint generated always as identity primary key,
  criado timestamptz not null default now(),
  modo text not null check (modo in ('viagem', 'cafe', 'relogio')),
  nome text not null check (char_length(nome) between 1 and 10),
  piloto text not null check (piloto in ('jellison', 'leosao', 'jefao', 'lucas', 'fabinho', 'pescoco')),
  tempo real not null check (tempo > 25 and tempo < 1200),
  multas int not null default 0 check (multas between 0 and 50)
);
create index if not exists ranking_modo_tempo on public.ranking (modo, tempo);

alter table public.ranking enable row level security;
-- qualquer um pode ver o ranking e enviar tempo; ninguém pode apagar ou editar pelo jogo
create policy "ranking_ler" on public.ranking for select using (true);
create policy "ranking_enviar" on public.ranking for insert with check (true);
