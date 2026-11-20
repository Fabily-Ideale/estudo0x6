# Boilerplate de Site Estático

Site institucional estático (HTML, CSS e JS puros, sem build) servido por nginx em Docker. Ponto de partida para sites de empresas, profissionais ou projetos que precisam de:

- 3 páginas (Home, Quem Somos, Serviços) e uma 404, já com SEO (Open Graph, JSON-LD, sitemap) e acessibilidade (skip link, landmarks, `aria-*`, `prefers-reduced-motion`, alvos de toque de 44px);
- menu mobile acessível, animação de fundo em canvas e fontes auto-hospedadas;
- nginx endurecido: CSP restritivo, headers de segurança, rate limit, cache de assets, container `read_only` sem privilégios;
- 3 módulos opcionais: **catálogo dinâmico** via backend, **chat Chatwoot** e **túnel Cloudflare**.

## Estrutura

```
.
├── index.html, sobre.html, servicos.html, 404.html
├── css/main.css              folha única: fontes, tokens (:root), componentes, media queries
├── js/
│   ├── core.js               menu, link ativo, ano do copyright, animação do canvas
│   ├── categorias.js         mapa de categorias + fetch de /servicos.json (módulo catálogo)
│   ├── pilares.js            home: esconde pilares sem serviços ativos (módulo catálogo)
│   ├── servicos.js           catálogo: renderiza cards e JSON-LD hasOfferCatalog (módulo catálogo)
│   └── chatwoot.js           carregamento sob demanda do Chatwoot (módulo chat)
├── assets/fonts/             Inter e Outfit (WOFF2, subsets latin e latin-ext) + OFL.txt
├── assets/images/            logo.svg, favicons, ícones do manifest e og_imagem.jpg
├── nginx.conf                servidor, cache, proxy do catálogo
├── headers_seguranca.conf    headers de segurança e CSP
├── Dockerfile, docker-compose.yml, .env.example
├── robots.txt, sitemap.xml, site.webmanifest
└── .htmlhintrc, .stylelintrc.json, eslint.config.mjs
```

## Início rápido

1. Abra `index.html` direto no navegador (`file://`). Tudo funciona, exceto o fetch de `/servicos.json`, que exige o nginx (as páginas mantêm o conteúdo estático).
2. Substitua os placeholders (tabela abaixo).
3. Troque a identidade visual (paleta e imagens).
4. Suba com Docker.

## Personalização

### Placeholders

Faça busca e substituição global no projeto:

| Placeholder | O que é | Onde aparece |
|---|---|---|
| `Nome da Empresa` | nome exibido | HTML (título, logo, rodapé, mockups, JSON-LD), `site.webmanifest` |
| `https://www.example.com` | domínio de produção | canonical, `og:*`, JSON-LD, `sitemap.xml`, `robots.txt` |
| `5500000000000` | WhatsApp (DDI + DDD + número, só dígitos) | links `wa.me` |
| `+55-00-00000-0000` | telefone no JSON-LD | `index.html` |
| `seu_perfil` | usuário no Instagram e na OLX | links sociais e mockups |
| `SEU_ID_GOOGLE` | ID da ficha no Google (`g.page/r/...`) | links de avaliação |
| `Sua Cidade`, `UF` | localidade | JSON-LD, rodapé, mockup da OLX |
| `ANO` | ano de fundação / cadastro | `sobre.html` |
| `Ramo de Atuação`, `Slogan ou Ramo de Atuação` | descrição curta | `<title>`, manifest, JSON-LD |

Também revise:
- `<meta name="description">` e `og:description` de cada página (até 160 caracteres);
- o `@type` do JSON-LD da home (`LocalBusiness` serve para negócio local; use `Organization` ou outro tipo do schema.org se fizer mais sentido);
- os textos de exemplo de todas as seções;
- o `lastmod` em `sitemap.xml`.

### Identidade visual

- **Cores:** edite apenas o `:root` de `css/main.css`. Cada cor tem uma versão `-rgb` (ex.: `--color-primary-rgb: 47, 91, 211`) usada nas transparências via `rgba(var(--color-primary-rgb), x)`; mantenha as duas em sincronia. A animação do canvas lê `--color-accent-rgb` automaticamente.
- **Cor da barra do navegador:** `theme-color` nos HTML e `background_color`/`theme_color` no `site.webmanifest`.
- **Imagens:** substitua os arquivos de `assets/images/` mantendo nomes e dimensões:

| Arquivo | Dimensão | Uso |
|---|---|---|
| `logo.svg` | vetorial | header, rodapé, hero, mockups, favicon SVG |
| `favicon_32.png` | 32x32 | favicon |
| `apple_touch_icon.png` | 180x180 | iOS |
| `icone_192.png`, `icone_512.png` | 192x192, 512x512 | manifest e JSON-LD |
| `og_imagem.jpg` | 1200x630 | pré-visualização em redes sociais |

  Se o logo for raster, use `<picture>` com AVIF/WebP e fallback JPG (o CSS já trata `picture { display: contents; }`).
- **Fontes:** para trocar, substitua os WOFF2 e os `@font-face` do CSS, e ajuste os `<link rel="preload">` dos HTML. Não use Google Fonts sem liberar os domínios no CSP.

### Páginas

Header, menu e rodapé são repetidos nas 3 páginas principais: qualquer mudança neles deve ser replicada em `index.html`, `sobre.html` e `servicos.html`. Ao criar uma página nova:
1. copie uma página existente;
2. adicione-a ao menu e ao rodapé de todas as páginas, ao `sitemap.xml` e ao `COPY` do `Dockerfile`.

Os mockups de Instagram, Google e OLX em `sobre.html` são HTML/CSS puros, com dados ilustrativos. Remova as seções que não usar (e, se quiser, o CSS `.ig-*`, `.google-*` ou `.olx-*`).

## Módulos opcionais

### Catálogo dinâmico (`/servicos.json`)

As páginas trazem cards estáticos de fallback. Quando o backend responde, `servicos.html` troca os cards pela lista real, renumera as seções, anuncia a atualização para leitores de tela e injeta o catálogo no JSON-LD (`hasOfferCatalog`); a home esconde os pilares sem serviços ativos. Se o backend falhar ou não existir, nada muda.

**Contrato do backend:** `GET` retornando um array JSON:

```json
[
  { "nome": "Diagnóstico Inicial", "descricao": "Texto do serviço.", "categoria": "Consultoria" }
]
```

**Configuração:**
1. Em `nginx.conf`, ajuste `set $upstream_servicos` e `proxy_set_header Host` para o host do backend (padrão: `http://backend:3001/servicos.json`). O backend precisa estar na mesma rede Docker (`rede_site`). Se ele estiver em outro projeto compose, mantenha `name: rede_site` neste projeto e declare a rede como `external: true` (com `name: rede_site`) no projeto do backend; ou crie a rede antes com `docker network create rede_site` e use `external: true` nos dois.
2. Em `js/categorias.js`, o `mapa_categorias` liga o nome da categoria vindo do backend ao slug usado no HTML. As chaves são o nome normalizado: sem acento, minúsculas, `&` vira `e`, demais símbolos viram espaço (ex.: `"Suporte & Manutenção"` → `'suporte e manutencao'`).
3. Cada slug (valor do mapa) precisa existir como `data-categoria` em uma `<section class="servicos-cat-sec">` de `servicos.html` e em um `.pillar-card` de `index.html`. O `id` da seção é o alvo do link "Ver mais" do pilar. Cards sem `data-categoria` (como "Novas Soluções") nunca são removidos.

**Remover:** apague `js/categorias.js`, `js/pilares.js` e `js/servicos.js` e suas tags `<script>`, o `<p id="servicos-status">` de `servicos.html` e, no `nginx.conf`, o `location = /servicos.json`, o `proxy_cache_path`, o `limit_req_zone` e o `resolver`.

### Chat (Chatwoot)

Desativado por padrão. O SDK só é baixado na primeira interação do usuário ou quando o navegador fica ocioso, para não pesar no carregamento.

**Ativar:**
1. Em `js/chatwoot.js`, preencha `url_base` (ex.: `https://chat.example.com`) e `token_site` (o *website token* da inbox, que é público).
2. Em `headers_seguranca.conf`, libere o host no CSP: `script-src`, `img-src` e `frame-src` com `https://chat.example.com`; `connect-src` com `https://chat.example.com wss://chat.example.com`; e `style-src 'self' 'unsafe-inline'`, porque o SDK injeta estilos inline.

Os elementos `[data-abrir-chat]` (botões) e `[data-chat-bloco]` (o bloco `#atendimento-duvidas` de `servicos.html`) começam com `hidden` e só aparecem quando o chat carrega; com o módulo desativado, ficam ocultos. O botão flutuante do WhatsApp se esconde enquanto a janela do chat está aberta.

**Remover:** apague `js/chatwoot.js` e suas tags `<script>`, e o bloco `#atendimento-duvidas` de `servicos.html`.

### Túnel Cloudflare

O serviço `cloudflared_site` fica no profile `tunel` e só sobe quando pedido.

1. Crie um túnel no painel Cloudflare Zero Trust apontando para `http://site:8080`.
2. `cp .env.example .env` e preencha `CLOUDFLARE_TUNNEL_TOKEN`.
3. `docker compose --profile tunel up -d --build`.

O nginx já confia no header `CF-Connecting-IP` vindo das redes Docker (`set_real_ip_from 172.16.0.0/12`), o que mantém o rate limit por IP real do visitante. Se a sua rede Docker usar outra faixa, ajuste essa linha.

**Remover:** apague o serviço `cloudflared_site` do `docker-compose.yml`, o `.env.example`, e as linhas `set_real_ip_from`/`real_ip_header` do `nginx.conf`.

## Deploy

```
docker compose up -d --build
```

O compose não publica portas: o acesso externo é feito pelo túnel. Para testar localmente sem túnel, adicione temporariamente ao serviço `site`:

```yaml
    ports:
      - "8080:8080"
```

e acesse `http://localhost:8080`.

Observações:
- css/js têm cache de 1h e `assets/` de 30 dias (`immutable`): ao trocar uma imagem, mude também o nome do arquivo.
- Todo arquivo ou pasta novo na raiz precisa entrar no `COPY` do `Dockerfile`.
- Scripts inline e handlers `on*=` são bloqueados pelo CSP. Os blocos `application/ld+json` são dados e funcionam normalmente.

## Validação

Não há dependências no repositório; os linters rodam via `npx` (Node.js necessário):

```
npx -y htmlhint@1.1.4 "*.html"
npx -y stylelint@16.12.0 "css/**/*.css"
npx -y eslint@9.39.1 js
```

As configs não usam `extends` nem plugins, porque o `npx` não resolve pacotes a partir da raiz do projeto.

## Licença

Código e conteúdo: [CC0 1.0 Universal](LICENSE), domínio público.

Exceção: as fontes em `assets/fonts/` ([Inter](https://github.com/rsms/inter) e [Outfit](https://github.com/Outfitio/Outfit-Fonts)) são distribuídas sob a [SIL Open Font License 1.1](https://openfontlicense.org) e mantêm essa licença; o texto e os avisos de copyright estão em `assets/fonts/OFL.txt`, que deve acompanhar as fontes.
