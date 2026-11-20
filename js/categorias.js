(() => {
  const mapa_categorias = {
    'consultoria': 'consultoria',
    'consultoria e planejamento': 'consultoria',
    'produtos': 'produtos',
    'venda de produtos': 'produtos',
    'suporte': 'suporte',
    'suporte e manutencao': 'suporte'
  };

  const normalizar_texto = (texto) =>
    texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/&/g, ' e ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

  const chave_categoria = (nome_categoria) => mapa_categorias[normalizar_texto(nome_categoria)];

  const texto_valido = (valor) => typeof valor === 'string' && valor.trim() !== '';

  const filtrar_servicos = (dados) => {
    if (!Array.isArray(dados)) return [];
    return dados.filter(
      (item) =>
        item !== null &&
        typeof item === 'object' &&
        texto_valido(item.nome) &&
        texto_valido(item.descricao) &&
        texto_valido(item.categoria)
    );
  };

  const buscar_servicos = async () => {
    try {
      const resposta = await fetch('/servicos.json', {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(4000)
      });
      if (!resposta.ok) return [];
      return filtrar_servicos(await resposta.json());
    } catch (erro) {
      console.warn('Lista de servicos indisponivel, mantendo conteudo estatico:', erro.name);
      return [];
    }
  };

  window.catalogo_servicos = Object.freeze({ normalizar_texto, chave_categoria, buscar_servicos });
})();
