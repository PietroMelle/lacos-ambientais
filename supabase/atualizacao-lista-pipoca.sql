-- =====================================================================
--  ATUALIZAÇÃO: lista de quem já resgatou a pipoca (página pipoca.html)
--  Como usar: Supabase > SQL Editor > New query > cole TUDO > Run.
--  Só precisa rodar uma vez. (Rodar o schema.sql inteiro de novo faz o mesmo.)
--
--  A lista mostra apenas o primeiro nome e a inicial do sobrenome
--  ("Ana S.") e o horário do resgate. Nome completo e código não saem.
-- =====================================================================

create or replace function pipocas_resgatadas()
returns table(nome text, resgatado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select exibir_nome(nome), criado_em
  from pipocas
  order by normalizar_nome(nome)
  limit 3000;
$$;

revoke execute on function pipocas_resgatadas() from public;
grant execute on function pipocas_resgatadas() to anon, authenticated;
