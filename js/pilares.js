(() => {
  const { chave_categoria, buscar_servicos } = window.catalogo_servicos;

  const filtrar_pilares = async () => {
    const servicos = await buscar_servicos();
    const categorias_ativas = new Set(
      servicos.map((servico) => chave_categoria(servico.categoria)).filter(Boolean)
    );
    if (categorias_ativas.size === 0) return;

    document.querySelectorAll('.pillar-card[data-categoria]').forEach((card) => {
      if (!categorias_ativas.has(card.dataset.categoria)) card.remove();
    });
  };

  filtrar_pilares();
})();
