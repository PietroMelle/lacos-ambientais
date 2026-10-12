-- =====================================================================
--  CONSULTAS DA EQUIPE — rodar no Supabase > SQL Editor
--  (só quem tem acesso ao painel do Supabase vê os celulares)
-- =====================================================================

-- 1) VENCEDORES DO MÊS ATUAL (com celular para contato)
select 'Mais itens' as premio, p.nome, p.vinculo, p.celular, pl.total_itens, pl.dias
from placar_mes() pl join participantes p on p.id = pl.participante_id
where pl.pos_itens = 1
union all
select 'Mais dias', p.nome, p.vinculo, p.celular, pl.total_itens, pl.dias
from placar_mes() pl join participantes p on p.id = pl.participante_id
where pl.pos_dias = 1;
-- Obs.: se a mesma pessoa vencer as duas, vocês decidem se ela leva os dois
-- ou se o 2º lugar do "Mais dias" leva (veja a consulta 2).

-- 2) TOP 10 COMPLETO DO MÊS (para conferência / desempate)
select pl.pos_itens, pl.pos_dias, p.nome, p.vinculo, p.celular, pl.total_itens, pl.dias
from placar_mes() pl join participantes p on p.id = pl.participante_id
order by pl.pos_itens
limit 10;

-- 3) VENCEDORES DE UM MÊS QUE JÁ PASSOU (troque a data)
with mes as (select date '2026-10-01' as ini),
base as (
  select p.nome, p.vinculo, p.celular,
         sum(d.quantidade) as total_itens, count(distinct d.dia) as dias, min(d.criado_em) as primeiro
  from descartes d join participantes p on p.id = d.participante_id, mes
  where d.dia >= mes.ini and d.dia < (mes.ini + interval '1 month')
  group by p.id
)
select *, row_number() over (order by total_itens desc, dias desc, primeiro) as pos_itens,
          row_number() over (order by dias desc, total_itens desc, primeiro) as pos_dias
from base order by pos_itens;

-- 4) DESCARTES POR TIPO DE LIXO (ótimo para a apresentação do projeto!)
select tipo, sum(quantidade) as itens, count(*) as registros
from descartes group by tipo order by itens desc;

-- 5) PIPOCAS RESGATADAS
select codigo, nome, criado_em at time zone 'America/Sao_Paulo' as quando
from pipocas order by criado_em;

-- 6) ATENDER PEDIDO DE EXCLUSÃO DE UMA PESSOA (LGPD) — troque o celular
-- delete from participantes where celular = '11987654321';   -- apaga a pessoa e todos os descartes dela

-- 7) FIM DA CAMPANHA: APAGAR TUDO (LGPD) — tire os "--" para rodar
-- truncate descartes, participantes, pipocas restart identity;
