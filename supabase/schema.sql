-- =====================================================================
--  LAÇOS AMBIENTAIS — Banco de dados (Supabase / PostgreSQL)
--  Como usar: Supabase > SQL Editor > New query > cole TUDO > Run.
--  Pode rodar de novo sem medo: o script recria as funções.
--  Depois, rode também atualizacao-equipe-pipoca.sql (área da equipe com login).
--
--  Segurança: as tabelas ficam TRANCADAS (RLS sem nenhuma política).
--  O site só consegue chamar 4 funções públicas:
--    registrar_descarte, ranking_mes, resgatar_pipoca e pipocas_resgatadas.
--  Ninguém de fora consegue listar nomes completos ou celulares.
-- =====================================================================

-- ---------- Tabelas ----------
create table if not exists participantes (
  id               bigint generated always as identity primary key,
  celular          text not null unique,          -- só dígitos, ex.: 11987654321
  nome             text not null,
  vinculo          text not null,
  consentimento_em timestamptz not null default now(),
  criado_em        timestamptz not null default now()
);

create table if not exists descartes (
  id              bigint generated always as identity primary key,
  participante_id bigint not null references participantes(id) on delete cascade,
  tipo            text not null check (tipo in ('papel','plastico','vidro','metal','organico')),
  quantidade      int  not null check (quantidade between 1 and 10),
  dia             date not null default (now() at time zone 'America/Sao_Paulo')::date,
  criado_em       timestamptz not null default now()
);
create index if not exists descartes_dia_idx  on descartes (dia);
create index if not exists descartes_part_idx on descartes (participante_id, criado_em);

create table if not exists pipocas (
  id               bigint generated always as identity primary key,
  nome             text not null,
  nome_normalizado text not null unique,          -- garante 1 pipoca por nome
  codigo           text not null unique,
  criado_em        timestamptz not null default now()
);

-- Tranca as tabelas: RLS ligado e nenhuma política = acesso direto negado
alter table participantes enable row level security;
alter table descartes     enable row level security;
alter table pipocas       enable row level security;
revoke all on participantes, descartes, pipocas from anon, authenticated;

-- ---------- Funções auxiliares (internas) ----------

-- "  JOÃO   da Silva " -> "joao da silva"
create or replace function normalizar_nome(t text)
returns text language sql immutable as $$
  select regexp_replace(
           lower(translate(trim(coalesce(t,'')),
             'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ',
             'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn')),
           '\s+', ' ', 'g');
$$;

-- "ana paula souza" -> "Ana S."  (o que aparece no ranking público)
create or replace function exibir_nome(t text)
returns text language sql immutable as $$
  select case
    when array_length(p, 1) > 1
      then initcap(p[1]) || ' ' || upper(left(p[array_length(p, 1)], 1)) || '.'
    else initcap(p[1])
  end
  from (select regexp_split_to_array(trim(regexp_replace(coalesce(t,''), '\s+', ' ', 'g')), ' ') as p) s;
$$;

-- Primeiro dia do mês corrente (horário de Brasília)
create or replace function inicio_do_mes()
returns date language sql stable as $$
  select date_trunc('month', now() at time zone 'America/Sao_Paulo')::date;
$$;

-- Placar do mês de todo mundo + posição nos dois rankings
create or replace function placar_mes()
returns table(participante_id bigint, nome text, vinculo text,
              total_itens int, dias int, pos_itens int, pos_dias int)
language sql stable security definer set search_path = public as $$
  with base as (
    select p.id, p.nome, p.vinculo,
           sum(d.quantidade)::int          as total_itens,
           count(distinct d.dia)::int      as dias,
           min(d.criado_em)                as primeiro
    from descartes d
    join participantes p on p.id = d.participante_id
    where d.dia >= inicio_do_mes()
    group by p.id
  )
  select id, nome, vinculo, total_itens, dias,
         (row_number() over (order by total_itens desc, dias desc, primeiro))::int,
         (row_number() over (order by dias desc, total_itens desc, primeiro))::int
  from base;
$$;

-- ---------- Funções públicas (as únicas que o site enxerga) ----------

-- Registra um descarte. Regras anti-trapaça:
--   * 1 a 10 itens por registro
--   * no máximo 5 registros por pessoa por dia
--   * intervalo mínimo de 1 minuto entre registros
create or replace function registrar_descarte(
  p_nome text, p_vinculo text, p_celular text,
  p_tipo text, p_quantidade int, p_consentimento boolean)
returns json language plpgsql volatile security definer set search_path = public as $$
declare
  v_cel   text := regexp_replace(coalesce(p_celular,''), '\D', '', 'g');
  v_nome  text := trim(regexp_replace(coalesce(p_nome,''), '\s+', ' ', 'g'));
  v_id    bigint;
  v_hoje  date := (now() at time zone 'America/Sao_Paulo')::date;
  v_ult   timestamptz;
  v_res   record;
begin
  if p_consentimento is not true then raise exception 'SEM_CONSENTIMENTO'; end if;
  if length(v_nome) < 3 or length(v_nome) > 80 then raise exception 'NOME_INVALIDO'; end if;
  if length(v_cel) not in (10, 11) then raise exception 'CELULAR_INVALIDO'; end if;
  if p_vinculo not in ('Aluno Anhanguera','Aprendiz Espro','Aprendiz CIEE',
                       'Professor(a)','Funcionário(a)','Visitante','Outro')
    then raise exception 'VINCULO_INVALIDO'; end if;
  if p_tipo not in ('papel','plastico','vidro','metal','organico')
    then raise exception 'TIPO_INVALIDO'; end if;
  if p_quantidade is null or p_quantidade < 1 or p_quantidade > 10
    then raise exception 'QUANTIDADE_INVALIDA'; end if;

  insert into participantes (celular, nome, vinculo)
  values (v_cel, v_nome, p_vinculo)
  on conflict (celular) do update
     set nome = excluded.nome, vinculo = excluded.vinculo, consentimento_em = now()
  returning id into v_id;

  if (select count(*) from descartes where participante_id = v_id and dia = v_hoje) >= 5
    then raise exception 'LIMITE_DIARIO'; end if;

  select max(criado_em) into v_ult from descartes where participante_id = v_id;
  if v_ult is not null and v_ult > now() - interval '1 minute'
    then raise exception 'AGUARDE'; end if;

  insert into descartes (participante_id, tipo, quantidade)
  values (v_id, p_tipo, p_quantidade);

  select * into v_res from placar_mes() where participante_id = v_id;
  return json_build_object(
    'nome',        exibir_nome(v_nome),
    'total_itens', v_res.total_itens,
    'dias',        v_res.dias,
    'pos_itens',   v_res.pos_itens,
    'pos_dias',    v_res.pos_dias);
end;
$$;

-- Top 10 do mês. p_criterio = 'itens' (quem mais jogou) ou 'dias' (mais dias jogando)
create or replace function ranking_mes(p_criterio text default 'itens')
returns table(posicao int, nome text, vinculo text, total_itens int, dias int)
language sql stable security definer set search_path = public as $$
  select case when p_criterio = 'dias' then pos_dias else pos_itens end,
         exibir_nome(nome), vinculo, total_itens, dias
  from placar_mes()
  order by 1
  limit 10;
$$;

-- Resgate da pipoca: exige nome e sobrenome, 1 pipoca por nome
create or replace function resgatar_pipoca(p_nome text)
returns json language plpgsql volatile security definer set search_path = public as $$
declare
  v_nome text := trim(regexp_replace(coalesce(p_nome,''), '\s+', ' ', 'g'));
  v_norm text := normalizar_nome(p_nome);
  v_cod  text;
begin
  if length(v_norm) < 5 or position(' ' in v_norm) = 0 or length(v_nome) > 80
    then raise exception 'NOME_INVALIDO'; end if;
  if exists (select 1 from pipocas where nome_normalizado = v_norm)
    then raise exception 'NOME_JA_USADO'; end if;

  loop
    v_cod := 'PIP-' || lpad(floor(random() * 10000)::int::text, 4, '0');
    exit when not exists (select 1 from pipocas where codigo = v_cod);
  end loop;

  insert into pipocas (nome, nome_normalizado, codigo) values (v_nome, v_norm, v_cod);
  return json_build_object('codigo', v_cod, 'nome', initcap(split_part(v_nome, ' ', 1)));
exception when unique_violation then
  raise exception 'NOME_JA_USADO';
end;
$$;

-- Lista pública de quem já resgatou: só "Ana S." e o horário (nada de nome completo ou código)
create or replace function pipocas_resgatadas()
returns table(nome text, resgatado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select exibir_nome(nome), criado_em
  from pipocas
  order by normalizar_nome(nome)
  limit 3000;
$$;

-- ---------- Permissões ----------
-- Funções internas: ninguém de fora chama
revoke execute on function normalizar_nome(text), exibir_nome(text),
                           inicio_do_mes(), placar_mes()
  from public, anon, authenticated;
-- Funções públicas: liberadas para o site
revoke execute on function registrar_descarte(text,text,text,text,int,boolean),
                           ranking_mes(text), resgatar_pipoca(text), pipocas_resgatadas()
  from public;
grant execute on function registrar_descarte(text,text,text,text,int,boolean),
                          ranking_mes(text), resgatar_pipoca(text), pipocas_resgatadas()
  to anon, authenticated;
