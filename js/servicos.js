(() => {
  const { normalizar_texto, chave_categoria, buscar_servicos } = window.catalogo_servicos;

  const gerar_slug = (texto) => normalizar_texto(texto).replace(/ /g, '-');

  const agrupar_por_categoria = (servicos) => {
    const agrupado = new Map();
    for (const servico of servicos) {
      const chave = chave_categoria(servico.categoria);
      if (!chave) {
        console.warn('Categoria desconhecida ignorada:', servico.categoria);
        continue;
      }
      if (!agrupado.has(chave)) agrupado.set(chave, []);
      agrupado.get(chave).push(servico);
    }
    return agrupado;
  };

  const criar_card = (servico, numero, ids_usados) => {
    const base_id = 'srv-' + gerar_slug(servico.nome);
    let id_card = base_id;
    let sufixo = 2;
    while (ids_usados.has(id_card)) {
      id_card = base_id + '-' + sufixo++;
    }
    ids_usados.add(id_card);

    const card = document.createElement('div');
    card.className = 'service-detail-card';
    card.id = id_card;

    const cabecalho = document.createElement('div');
    cabecalho.className = 'service-card-header';

    const rotulo_numero = document.createElement('span');
    rotulo_numero.className = 'service-card-number';
    rotulo_numero.textContent = String(numero).padStart(2, '0');

    const titulo = document.createElement('h3');
    titulo.className = 'service-card-title';
    titulo.textContent = servico.nome.trim();

    const descricao = document.createElement('p');
    descricao.className = 'service-card-desc';
    descricao.textContent = servico.descricao.trim();

    cabecalho.append(rotulo_numero, titulo);
    card.append(cabecalho, descricao);
    return card;
  };

  const listar_secoes = () => document.querySelectorAll('.servicos-cat-sec[data-categoria]');

  const renderizar = (agrupado) => {
    const ids_usados = new Set();
    let contador = 0;

    for (const secao of listar_secoes()) {
      const servicos = agrupado.get(secao.dataset.categoria);
      if (!servicos) {
        secao.remove();
        continue;
      }

      const grid = secao.querySelector('.servicos-grid');
      if (!grid) continue;

      const cards = servicos.map((servico) => criar_card(servico, ++contador, ids_usados));
      grid.replaceChildren(...cards);
    }

    document.querySelectorAll('.servicos-cat-sec .section-tag').forEach((tag, indice) => {
      tag.textContent = 'Pilar ' + String(indice + 1).padStart(2, '0');
    });
  };

  const definir_ocupado = (ocupado) => {
    document.querySelectorAll('.servicos-cat-sec .servicos-grid').forEach((grid) => {
      grid.setAttribute('aria-busy', String(ocupado));
    });
  };

  let usuario_rolou = false;
  const eventos_rolagem = ['wheel', 'touchmove', 'keydown'];

  const marcar_rolagem = () => {
    usuario_rolou = true;
    eventos_rolagem.forEach((nome) => window.removeEventListener(nome, marcar_rolagem));
  };

  eventos_rolagem.forEach((nome) => window.addEventListener(nome, marcar_rolagem, { passive: true }));

  const reposicionar_ancora = () => {
    if (usuario_rolou || window.location.hash.length < 2) return;
    const alvo = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (alvo) alvo.scrollIntoView({ behavior: 'auto' });
  };

  const anunciar_status = (mensagem) => {
    const status = document.getElementById('servicos-status');
    if (status) status.textContent = mensagem;
  };

  const texto_do_elemento = (raiz, seletor) => raiz.querySelector(seletor)?.textContent.trim() ?? '';

  const montar_catalogo = () => {
    const script = document.getElementById('dados-estruturados-servicos');
    if (!script) return;

    const catalogos = Array.from(listar_secoes(), (secao) => ({
      '@type': 'OfferCatalog',
      name: texto_do_elemento(secao, '.section-title'),
      itemListElement: Array.from(secao.querySelectorAll('.service-detail-card'), (card) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: texto_do_elemento(card, '.service-card-title'),
          description: texto_do_elemento(card, '.service-card-desc')
        }
      }))
    })).filter((catalogo) => catalogo.name && catalogo.itemListElement.length > 0);

    if (catalogos.length === 0) return;

    try {
      const dados = JSON.parse(script.textContent);
      dados.hasOfferCatalog = {
        '@type': 'OfferCatalog',
        name: 'Catálogo de serviços',
        itemListElement: catalogos
      };
      script.textContent = JSON.stringify(dados);
    } catch (erro) {
      console.warn('Dados estruturados invalidos, catalogo nao gerado:', erro.name);
    }
  };

  const carregar_servicos = async () => {
    definir_ocupado(true);
    try {
      const servicos = await buscar_servicos();
      if (servicos.length === 0) return;

      const agrupado = agrupar_por_categoria(servicos);
      if (agrupado.size === 0) return;

      renderizar(agrupado);
      reposicionar_ancora();
      anunciar_status('Lista de serviços atualizada.');
    } finally {
      definir_ocupado(false);
      montar_catalogo();
    }
  };

  carregar_servicos();
})();
