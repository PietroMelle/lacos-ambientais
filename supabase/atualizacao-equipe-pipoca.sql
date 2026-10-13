-- =====================================================================
--  ATUALIZAÇÃO: área da equipe para controlar a ENTREGA das pipocas
--  (página entregas.html, com login)
--
--  Como usar: Supabase > SQL Editor > New query > cole TUDO > Run.
--  Pode rodar mais de uma vez sem problema. Não apaga nada.
--
--  Depois de rodar, falta 3 coisas (estão no LEIA-ME, "Área da equipe"):
--    1. Criar o login de cada pessoa da equipe (Authentication > Users)
--    2. Colocar o e-mail de cada uma na lista da equipe (final deste arquivo)
--    3. Desligar o cadastro público (Authentication > Sign In / Providers)
-- =====================================================================

-- ---------- Quem é da equipe ----------
-- Só quem está aqui E fez login consegue ver os nomes completos e marcar entregas.
create table if not exists equipe (
  email text primary key,          -- o mesmo e-mail do login no Supabase
  nome  text not null              -- aparece como "entregue por ..."
);
alter table equipe enable row level security;
revoke all on equipe from anon, authenticated;

-- ---------- Entrega na tabela de pipocas ----------
alter table pipocas add column if not exists entregue_em  timestamptz;
alter table pipocas add column if not exists entregue_por text;

-- Histórico: cada entrega e cada "desfazer" fica registrado para sempre
-- (o site não tem como apagar). Serve para resolver qualquer desentendimento.
create table if not exists pipocas_historico (
  id        bigint generated always as identity primary key,
  pipoca_id bigint not null references pipocas(id) on delete cascade,
  acao      text   not null check (acao in ('entregue', 'desfeito')),
  por       text   not null,
  em        timestamptz not null default now()
);
create index if not exists pipocas_historico_pip_idx on pipocas_historico (pipoca_id, em);
alter table pipocas_historico enable row level security;
revoke all on pipocas_historico from anon, authenticated;

-- ---------- Funções internas ----------

-- Nome de quem está logado, se for da equipe (senão, null)
create or replace function membro_equipe()
returns text language sql stable security definer set search_path = public as $$
  select nome from equipe where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

-- ---------- Funções da equipe (só funcionam com login de alguém da lista) ----------

-- Lista completa: nome inteiro, código, quando resgatou e quem entregou
create or replace function equipe_pipocas()
returns table(id bigint, nome text, codigo text, resgatado_em timestamptz,
              entregue_em timestamptz, entregue_por text, desfeitos int, voce text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare v_eu text := membro_equipe();
begin
  if v_eu is null then raise exception 'SEM_ACESSO'; end if;
  return query
    select p.id, p.nome, p.codigo, p.criado_em, p.entregue_em, p.entregue_por,
           (select count(*)::int from pipocas_historico h where h.pipoca_id = p.id and h.acao = 'desfeito'),
           v_eu
    from pipocas p
    order by normalizar_nome(p.nome);
end;
$$;

-- Marca como entregue. Se outra pessoa da equipe já entregou, avisa quem e quando.
create or replace function equipe_entregar(p_id bigint)
returns json language plpgsql volatile security definer set search_path = public as $$
declare
  v_eu  text := membro_equipe();
  v_reg record;
begin
  if v_eu is null then raise exception 'SEM_ACESSO'; end if;

  update pipocas set entregue_em = now(), entregue_por = v_eu
  where id = p_id and entregue_em is null
  returning entregue_em, entregue_por into v_reg;

  if not found then
    select entregue_em, entregue_por into v_reg from pipocas where id = p_id;
    if not found then raise exception 'NAO_ENCONTRADA'; end if;
    raise exception 'JA_ENTREGUE' using detail = json_build_object('por', v_reg.entregue_por, 'em', v_reg.entregue_em)::text;
  end if;

  insert into pipocas_historico (pipoca_id, acao, por) values (p_id, 'entregue', v_eu);
  return json_build_object('entregue_em', v_reg.entregue_em, 'entregue_por', v_reg.entregue_por);
end;
$$;

-- Desfaz uma entrega marcada por engano (fica registrado no histórico)
create or replace function equipe_desfazer(p_id bigint)
returns void language plpgsql volatile security definer set search_path = public as $$
declare v_eu text := membro_equipe();
begin
  if v_eu is null then raise exception 'SEM_ACESSO'; end if;
  update pipocas set entregue_em = null, entregue_por = null where id = p_id and entregue_em is not null;
  if found then
    insert into pipocas_historico (pipoca_id, acao, por) values (p_id, 'desfeito', v_eu);
  end if;
end;
$$;

-- ---------- Permissões ----------
-- Visitantes (anon) não chamam nenhuma destas. Só quem fez login (authenticated),
-- e mesmo assim as funções conferem se o e-mail está na tabela "equipe".
revoke execute on function membro_equipe() from public, anon, authenticated;
revoke execute on function equipe_pipocas(), equipe_entregar(bigint), equipe_desfazer(bigint) from public, anon;
grant  execute on function equipe_pipocas(), equipe_entregar(bigint), equipe_desfazer(bigint) to authenticated;

-- ---------- Coloque aqui a equipe (troque pelos e-mails e nomes de vocês) ----------
-- Tire os "--" da frente, ajuste e rode só estas linhas. Pode repetir para cada pessoa.
-- insert into equipe (email, nome) values ('pessoa1@exemplo.com', 'Victor')  on conflict (email) do update set nome = excluded.nome;
-- insert into equipe (email, nome) values ('pessoa2@exemplo.com', 'Ana')     on conflict (email) do update set nome = excluded.nome;

-- Para tirar alguém da equipe:
-- delete from equipe where email = 'pessoa1@exemplo.com';
