---
layout: default
title: Guia de Início Rápido
lang: pt
page_id: quickstart
---

# Guia de Início Rápido

Comece a usar o NumiSync Wizard em 5 minutos. Este guia apresenta o fluxo básico de trabalho para enriquecer sua coleção de moedas.

**Nota sobre plataformas:** Este guia funciona para Windows, macOS e Linux. Os atalhos de teclado são mostrados para todas as plataformas onde diferem.

---

## Pré-requisitos

Antes de começar, certifique-se de ter:

- **NumiSync Wizard instalado** ([Guia de Instalação](/pt/installation))
- **Coleção do OpenNumismat** (arquivo .db com algumas moedas)
- **Chave de API do Numista** (gratuita em [numista.com](https://www.numista.com/))

---

## Passo 1: Iniciar e Configurar

### Abrir o NumiSync Wizard

1. Inicie o NumiSync Wizard:
   - **Windows:** Menu Iniciar ou atalho na área de trabalho
   - **macOS:** Pasta Aplicativos ou Launchpad
   - **Linux:** Menu de aplicativos ou execute `numisync-wizard` (se instalado via .deb/.rpm)
2. A primeira inicialização criará um diretório de cache automaticamente

### Adicionar sua Chave de API

1. Clique em **Settings** (ícone de engrenagem) ou pressione:
   - **Windows/Linux:** `Ctrl+,`
   - **macOS:** `Cmd+,`
2. Vá para a aba **API Settings**
3. Cole sua chave de API do Numista
4. Clique em **Save**

**Não tem uma chave de API?** Obtenha uma gratuitamente em [numista.com](https://www.numista.com/) → Perfil → Acesso à API

---

## Passo 2: Abrir sua Coleção

1. Clique em **File → Open Collection** ou pressione:
   - **Windows/Linux:** `Ctrl+O`
   - **macOS:** `Cmd+O`
2. Navegue até seu arquivo `.db` do OpenNumismat
3. Clique em **Open**
4. Suas moedas serão carregadas na janela principal

**Dica:** O NumiSync lembra as coleções recentes. Use **File → Recent Collections** para acesso rápido.

---

## Passo 3: Buscar Correspondências

### Selecionar Moedas para Enriquecer

Você pode enriquecer moedas individualmente ou em lotes:

- **Moeda única:** Clique em uma linha de moeda para selecioná-la
- **Múltiplas moedas:** Segure a tecla modificadora e clique em várias linhas
  - **Windows/Linux:** `Ctrl+Clique`
  - **macOS:** `Cmd+Clique`
- **Intervalo:** Clique na primeira moeda, segure `Shift`, clique na última moeda
- **Todas as moedas:** Selecionar todas
  - **Windows/Linux:** `Ctrl+A`
  - **macOS:** `Cmd+A`

### Iniciar a Busca

1. Clique no botão **Search & Enrich** (ou pressione `F2`)
2. O NumiSync buscará no Numista por cada moeda selecionada
3. O indicador de progresso mostra o status atual

**O que acontece:**
- Busca por denominação, país, ano e marca de cunhagem
- Lida com variações (por exemplo, "Cent" vs "Cents", "EUA" vs "United States")
- Suporta calendários não gregorianos (anos Meiji, anos Hijri, etc.)
- Usa resultados em cache quando disponíveis (mais rápido!)

---

## Passo 4: Revisar Correspondências

### Entendendo os Resultados da Busca

Após a busca, cada moeda exibe um de três status:

- **Match Found** - Entrada do catálogo Numista encontrada
- **Multiple Matches** - Várias possibilidades (seleção manual necessária)
- **No Match** - Nenhuma entrada no catálogo encontrada (tente a busca manual)

### Ver a Comparação de Campos

1. Clique em uma moeda com correspondência
2. O **Field Comparison Panel** mostra:
   - **Coluna esquerda:** Seus dados existentes
   - **Coluna direita:** Dados do catálogo Numista
   - **Diferenças destacadas** em cor
3. Revise o que será alterado

---

## Passo 5: Aceitar ou Refinar Correspondências

### Aceitar Todas as Alterações

Se a correspondência parecer correta:
1. Clique no botão **Accept Match** (ou pressione `Enter`)
2. Todos os dados do Numista atualizam sua moeda imediatamente
3. A moeda é marcada como enriquecida

### Selecionar Campos Individualmente

Para atualizar apenas campos específicos:
1. No Field Comparison Panel, **desmarque** os campos que não deseja atualizar
2. Clique em **Accept Match**
3. Apenas os campos marcados serão atualizados

### Escolher uma Emissão Diferente

Muitas moedas têm múltiplas emissões (anos, marcas de cunhagem, tipos):

1. Clique no botão **Choose Issue**
2. O **Issue Picker Dialog** mostra todas as variantes
3. Selecione a emissão correta para sua moeda
4. A comparação de campos se atualiza com os dados dessa emissão
5. Clique em **Accept Match**

### Busca Manual

Se nenhuma correspondência for encontrada automaticamente:
1. Clique no botão **Manual Search** ou pressione:
   - **Windows/Linux:** `Ctrl+F`
   - **macOS:** `Cmd+F`
2. Modifique os parâmetros de busca (denominação, ano, país)
3. Clique em **Search**
4. Navegue pelos resultados e selecione a entrada correta
5. Clique em **Accept Match**

---

## Passo 6: Baixar Imagens (Opcional)

### Download Automático de Imagens

Se **Data Settings → Images** estiver habilitado:
- As imagens são baixadas automaticamente quando você aceita uma correspondência
- Imagens do anverso, reverso e borda (se disponíveis)
- Armazenadas no diretório de imagens do OpenNumismat

### Download Manual de Imagens

1. Selecione uma moeda enriquecida
2. Clique no botão **Download Images**
3. Escolha quais imagens baixar (anverso, reverso, borda)
4. Clique em **Download**

**Dica:** Use **Image Comparison** para visualizar antes de aceitar

---

## Fluxos de Trabalho Comuns

### Fluxo 1: Enriquecer uma Nova Coleção

1. Abra a coleção com muitas moedas não enriquecidas
2. Selecione todas as moedas (`Ctrl+A`)
3. Clique em **Search & Enrich** (ou pressione `F2`)
4. Revise as correspondências uma a uma
5. Aceite as correspondências conforme avança
6. Use a busca manual para moedas sem correspondência

**Economia de tempo:** 2-3 minutos por moeda → 10-15 segundos por moeda

### Fluxo 2: Atualizar Apenas os Preços

1. Vá para **Settings → Data Settings**
2. Desmarque **Basic** e **Issue** (deixe **Pricing** marcado)
3. Selecione as moedas a atualizar
4. Clique em **Search & Enrich**
5. Aceite as correspondências (apenas os preços são atualizados)

**Dica Pro:** Adquira uma [Licença de Apoiador](/pt/license) para usar o **Fast Pricing Mode** — atualiza todas as moedas identificadas instantaneamente!

### Fluxo 3: Corrigir Correspondências Incorretas

1. Selecione uma moeda com dados incorretos
2. Clique em **Manual Search**
3. Encontre a entrada correta no catálogo
4. Aceite a correspondência
5. Os dados antigos são sobrescritos

**Dica:** Use **Field Comparison** para verificar antes de aceitar

---

## Dicas para Melhores Resultados

### Dicas de Busca

**Boas Práticas:**
- Comece com moedas que têm informações completas (ano, país, denominação)
- Use abreviações de denominação padrão ("1 Cent" e não "1c")
- Deixe o NumiSync normalizar as denominações automaticamente

**Evite:**
- Buscar moedas com campos essenciais faltando (país, denominação)
- Editar manualmente os parâmetros de busca sem necessidade
- Presumir que a primeira correspondência é a correta — sempre verifique!

### Qualidade dos Dados

**Boas Práticas:**
- Revise a comparação de campos antes de aceitar
- Use o Issue Picker quando existirem múltiplas variantes
- Verifique se as imagens correspondem à sua moeda física

**Evite:**
- Aceitar todas as correspondências sem revisar
- Sobrescrever bons dados com dados incompletos do catálogo
- Esquecer de fazer backup da sua coleção primeiro!

### Desempenho

**Boas Práticas:**
- Habilite o cache (Settings → General → Cache)
- Trabalhe em lotes de 10-20 moedas
- Use o Fast Pricing Mode para grandes atualizações (Licença de Apoiador)

**Evite:**
- Buscar mais de 1.000 moedas de uma vez (respeita os limites de taxa, mas é lento)
- Desabilitar o cache (desperdiça chamadas à API)
- Buscar a mesma moeda repetidamente (use o cache)

---

## Atalhos de Teclado

**Windows/Linux:**
- `Ctrl+O` - Abrir coleção
- `F2` - Search & Enrich nas moedas selecionadas
- `Ctrl+F` - Busca manual
- `Enter` - Aceitar correspondência
- `Escape` - Cancelar/Fechar diálogo
- `Ctrl+A` - Selecionar todas as moedas
- `Ctrl+,` - Abrir configurações
- `F1` - Abrir ajuda

**macOS:**
- `Cmd+O` - Abrir coleção
- `F2` - Search & Enrich nas moedas selecionadas
- `Cmd+F` - Busca manual
- `Enter` - Aceitar correspondência
- `Escape` - Cancelar/Fechar diálogo
- `Cmd+A` - Selecionar todas as moedas
- `Cmd+,` - Abrir configurações
- `F1` - Abrir ajuda

---

## Próximos Passos

### Explorar Recursos Premium

Adquira uma **[Licença de Apoiador ($10)](/pt/license)** para desbloquear:
- **Fast Pricing Mode** - Atualize os preços de todas as moedas identificadas em lote
- **Auto-Propagate** - Aplique dados de tipo a moedas correspondentes automaticamente
- **Sem avisos repetitivos!**

### Recursos Avançados

- **Field Mapping** - Personalize como os dados do Numista se mapeiam para seus campos
- **Operações em Lote** - Processe centenas de moedas de forma eficiente
- **Suporte Multi-Computador** - Compartilhe cache entre dispositivos
- **Localização de Cache Personalizada** - Armazene o cache em uma unidade de rede

### Saiba Mais

- **[Manual do Usuário](https://github.com/inguy24/numismat-enrichment/blob/main/docs/reference/USER-MANUAL.md)** - Documentação completa de funcionalidades
- **[FAQ](#)** - Perguntas frequentes respondidas
- **[Tutoriais em Vídeo](#)** - Em breve!

---

## Precisa de Ajuda?

### Problemas Comuns

**P: Por que minha moeda não foi identificada?**
- R: O país ou a denominação pode precisar de normalização. Tente a busca manual com variações.

**P: Por que alguns campos não estão sendo atualizados?**
- R: Verifique as **Data Settings** — algumas categorias de dados podem estar desabilitadas.

**P: Posso desfazer uma correspondência aceita?**
- R: Não automaticamente. Restaure a partir de um backup ou reverta os dados manualmente.

**P: Como atualizo apenas os preços sem alterar outros campos?**
- R: Settings → Data Settings → Desmarque Basic e Issue, deixe Pricing marcado.

**P: O que acontece se eu buscar a mesma moeda duas vezes?**
- R: O NumiSync usa os resultados em cache (instantâneo), a menos que você clique em "Refresh from API".

### Obter Suporte

- **Problemas:** [Reporte no GitHub](https://github.com/inguy24/numismat-enrichment/issues)
- **Discussões:** [Pergunte à comunidade](https://github.com/inguy24/numismat-enrichment/discussions)
- **Documentação:** [Documentação completa](https://github.com/inguy24/numismat-enrichment/tree/main/docs)

---

<div style="text-align: center; margin: 2em 0;">
  <a href="/pt/installation" style="display: inline-block; padding: 10px 20px; background: #6c757d; color: white; text-decoration: none; border-radius: 6px;">← Guia de Instalação</a>
  <a href="/pt/" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 6px;">Voltar ao Início</a>
</div>
