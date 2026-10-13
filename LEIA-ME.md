# ♻ Site Laços Ambientais — Guia de Publicação

Site da empresa **Laços Ambientais** (Jovem Aprendiz) com:

| Página | Para que serve | Quem acessa |
|---|---|---|
| `index.html` | Página inicial: apresenta a empresa e as 5 lixeiras | Todo mundo |
| `lixeira.html?tipo=...` | O que vai em cada lixeira + **registro na competição** | QR Code colado em cada caixa |
| `ranking.html` | Top 10 do mês: **Mais itens** e **Mais dias** | Todo mundo |
| `pipoca.html` | Resgate da pipoca da gincana (1 por nome) | QR Code no fim das estações |
| `privacidade.html` | Política de privacidade (LGPD) | Link no formulário |
| `qrcodes.html` | Gera as 6 folhas A4 com QR Code para imprimir | Só a equipe |
| `entregas.html` | Controle de **entrega das pipocas** (com login) | Só a equipe |

Lixeiras no padrão CONAMA 275: **Azul** (papel), **Vermelha** (plástico), **Verde** (vidro), **Amarela** (metal) e **Marrom** (orgânico).

---

## Passo 1 — Testar no computador (opcional, 2 minutos)

O site já funciona em **modo demonstração**: os dados ficam só no navegador de quem testa.
Abra a pasta no VS Code com a extensão *Live Server*, ou rode `python -m http.server` dentro da pasta e acesse `http://localhost:8000`.

## Passo 2 — Criar o banco no Supabase (10 minutos)

1. Crie uma conta gratuita em **supabase.com** e clique em **New project**.
   - Nome: `lacos-ambientais` · Região: **South America (São Paulo)** · anote a senha do banco.
2. No menu lateral, abra **SQL Editor → New query**.
3. Cole **todo** o conteúdo de `supabase/schema.sql` e clique em **Run**. Deve aparecer *Success*.
4. Vá em **Project Settings → API** (ou **API Keys**) e copie:
   - a **Project URL** (algo como `https://abcdefgh.supabase.co`);
   - a chave **publishable** (ou **anon public**, nos projetos mais antigos).
   - ⚠️ **Nunca** use a chave *secret* / *service_role* no site.
5. Abra `assets/js/config.js` e preencha:
   ```js
   SUPABASE_URL: "https://abcdefgh.supabase.co",
   SUPABASE_KEY: "sb_publishable_xxxxx",
   CONTATO: "e-mail ou contato real da turma/instrutora",
   FIM_CAMPANHA: "30/11/2026",
   ```

> **"Mas a chave fica visível no site?"** Fica, e tudo bem: ela é pública por natureza.
> As tabelas estão trancadas e a chave só consegue chamar 4 funções (registrar, ver o ranking, resgatar pipoca e ver a lista de quem resgatou).
> A lista da pipoca mostra só "Ana S." e o horário. Ninguém consegue listar nomes completos ou celulares por ela.
>
> **Já tinha rodado o `schema.sql` antes desta versão?** Rode também o `supabase/atualizacao-lista-pipoca.sql` (uma vez), senão a lista de quem resgatou a pipoca não carrega. Isso foi testado.

## Passo 3 — Publicar no GitHub Pages (10 minutos)

1. Crie uma conta em **github.com** e um repositório **público** chamado `lacos-ambientais`.
2. Clique em **Add file → Upload files** e arraste **todo o conteúdo** desta pasta (não a pasta em si: o `index.html` precisa ficar na raiz). Clique em **Commit changes**.
3. Vá em **Settings → Pages**, em *Branch* escolha **main** e **/ (root)** e clique em **Save**.
4. Em 1 ou 2 minutos o site estará em `https://SEU-USUARIO.github.io/lacos-ambientais/`.

*Prefere a Vercel?* Em **vercel.com → Add New → Project**, importe o mesmo repositório e clique em **Deploy** (não precisa configurar nada).

## Passo 4 — Imprimir os QR Codes

1. Acesse `https://SEU-USUARIO.github.io/lacos-ambientais/qrcodes.html`.
2. Confira o endereço no campo (ele já vem preenchido) e clique em **Imprimir / salvar PDF**.
3. Saem 6 folhas A4: uma por lixeira e uma da pipoca.
4. **Teste cada QR com o celular antes de colar na caixa.** Para durar mais, cubra a folha com fita larga ou plástico adesivo.

> Se trocarem de endereço depois (ex.: GitHub → Vercel), os QR Codes impressos param de funcionar.
> Decidam o endereço final **antes** de imprimir.

## Passo 5 — Durante a campanha

Todas as consultas estão em `supabase/consultas-equipe.sql` (rode no SQL Editor):

| Consulta | Quando usar |
|---|---|
| 1 — Vencedores do mês | No último dia do mês, para pegar nome e celular dos 2 ganhadores |
| 3 — Mês passado | Se a apuração for feita depois da virada do mês |
| 4 — Descartes por tipo | Para a apresentação final ("coletamos X latinhas!") |
| 5 — Pipocas resgatadas | Para conferir os códigos na gincana |
| 6 — Exclusão de uma pessoa | Se alguém pedir para apagar seus dados (LGPD) |
| 7 — Apagar tudo | **No fim da campanha** (data em `FIM_CAMPANHA`) |

## Regras da competição (já embutidas no banco)

- De 1 a **10 itens** por registro.
- No máximo **5 registros por pessoa por dia**.
- Intervalo mínimo de **1 minuto** entre registros.
- A pessoa é identificada pelo **celular**. No segundo registro, o site lembra dela e só pergunta a quantidade.
- **Mais itens**: soma das quantidades do mês. **Mais dias**: dias diferentes com registro no mês.
- Empate: vence quem teve mais dias (ou mais itens) e, persistindo, quem registrou primeiro.
- O ranking zera sozinho na virada do mês (horário de Brasília).

Para mudar os limites, edite os números `10`, `5` e `1 minute` na função `registrar_descarte` do `schema.sql`, rode o script de novo e ajuste o texto da página `lixeira.html`.

## Pipoca

- Exige **nome e sobrenome**, e cada nome resgata só uma vez. "João Silva", "joao silva" e "JOÃO  SILVA" contam como o mesmo nome.
- A tela do código mostra um **relógio ao vivo piscando**. Se o relógio estiver parado, é print. 😉
- Homônimos (dois "Ana Souza" de verdade) acontecem raramente. Nesse caso, a segunda pessoa pode usar o nome do meio.
- Embaixo do formulário fica a lista **Quem já resgatou**, direto do banco: busca por nome e ordem A–Z (padrão), Z–A ou mais recentes. Mostra só "Ana S." e o horário.
- Para colar na parede da sala: em `qrcodes.html`, clique em **Só a da pipoca** e imprima.

## Área da equipe: entregas da pipoca (`entregas.html`)

Na hora de entregar, a equipe procura a pessoa pelo **nome ou pelo código** (ex.: `0427`) e toca em **Entregar**. Fica gravado no banco **quem entregou e quando**. Se alguém voltar dizendo que não recebeu, é só procurar o nome: aparece "Entregue por Ana · 12/10 · 14:32".

- Duas pessoas da equipe não conseguem entregar a mesma pipoca: a segunda recebe o aviso "Já tinha sido entregue por…". A lista também se atualiza sozinha a cada 20 segundos.
- Marcou errado? Toque em **Desfazer** duas vezes. O "desfazer" também fica registrado: a consulta **8** do `consultas-equipe.sql` mostra o histórico completo, que o site não consegue apagar.
- **Baixar planilha (CSV)** gera um arquivo que abre no Excel ou no Google Planilhas.

### Como ligar (uma vez só, uns 10 minutos)

1. **Rode o SQL:** Supabase → SQL Editor → New query → cole todo o `supabase/atualizacao-equipe-pipoca.sql` → **Run**.
2. **Crie o login de cada pessoa da equipe:** Supabase → **Authentication → Users → Add user → Create new user**. Coloque o e-mail e uma senha forte e marque **Auto Confirm User**.
3. **Diga ao banco quem é da equipe:** no SQL Editor, rode uma linha por pessoa (com o mesmo e-mail do passo 2):
   ```sql
   insert into equipe (email, nome) values ('email.da.pessoa@exemplo.com', 'Victor');
   ```
   O nome é o que aparece em "Entregue por…".
4. **Feche o cadastro público:** Supabase → **Authentication → Sign In / Providers** → desligue **Allow new users to sign up**. Assim, ninguém de fora consegue criar um login sozinho.
5. Abra `entregas.html` no site publicado e entre.

> **Por que é seguro, mesmo a página sendo pública?** O arquivo `entregas.html` pode ser aberto por qualquer um que souber o endereço (no GitHub Pages todo arquivo é público), mas ele é só uma "casca" vazia. Os nomes completos, códigos e entregas só saem do banco para quem **fez login** e **está na tabela `equipe`**. Quem confere a senha é o Supabase e quem confere a equipe é o banco, então não adianta mexer no código da página. Nenhuma senha fica guardada no site.
>
> O login vale só para aquela aba: fechou a aba, saiu. Num computador compartilhado, clique em **Sair** do mesmo jeito.
>
> Para tirar alguém da equipe: `delete from equipe where email = '...';` e apague o usuário em Authentication → Users.

## LGPD — checklist da turma

- [ ] Preencher `CONTATO` e `FIM_CAMPANHA` no `config.js`
- [ ] Pedir autorização da faculdade para as lixeiras e a coleta de dados
- [ ] Combinar com a instrutora como tratar participantes menores de 18 anos
- [ ] Rodar a consulta 7 (apagar tudo) na data prometida
- [ ] Limitar o acesso ao painel do Supabase a 1 ou 2 pessoas da equipe

## Estrutura de pastas

```
├── index.html, lixeira.html, ranking.html, pipoca.html, privacidade.html, qrcodes.html, entregas.html
├── assets/
│   ├── css/style.css          → visual (cores, fontes, layout)
│   ├── fonts/                 → Funnel Display e Funnel Sans (licença OFL, já inclusas no site)
│   └── js/
│       ├── config.js          → ⭐ ÚNICO arquivo a editar
│       ├── lacos.js           → textos das lixeiras (pode/não pode/dicas) e cores de cada uma
│       ├── cordao.js          → o cordão de cinco fios (desenho e animações do site)
│       ├── equipe.js          → login da equipe e funções da área de entregas
│       ├── api.js             → conexão com o banco (+ modo demonstração)
│       └── qrcode.js          → biblioteca de QR Code (licença MIT)
└── supabase/
    ├── schema.sql             → cria o banco (rodar 1 vez)
    ├── consultas-equipe.sql   → vencedores, relatórios, histórico de entregas e limpeza LGPD
    ├── atualizacao-lista-pipoca.sql   → lista pública "Quem já resgatou" (rodar 1 vez)
    └── atualizacao-equipe-pipoca.sql  → área da equipe / entregas (rodar 1 vez)
```

Para mudar os textos de cada lixeira, edite o bloco `LIXOS` em `assets/js/lacos.js`.
