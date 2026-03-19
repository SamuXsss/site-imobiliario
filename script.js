const api = "https://sheetdb.io/api/v1/r97a6hlebb58a"

let dados = []
let lancamentos = []
let lancamentoAtualIndex = 0
let autoplayLancamentos = null
let autoplayImagensLancamento = null
let imagemLancamentoAtualIndex = 0

fetch(api)
  .then(res => res.json())
  .then(data => {
    const imoveisValidos = data.filter(temDadosMinimos)
    dados = imoveisValidos.filter(imovel => !ehLancamento(imovel))
    lancamentos = imoveisValidos.filter(ehLancamento)
    aplicarFiltros()
    renderLancamentos()
    renderFavoritos()
    atualizarAcesso()
  })

function mostrar(lista) {
  const container = document.getElementById("lista-imoveis")
  container.innerHTML = ""

  if (!lista.length) {
    container.innerHTML = `<div class="empty-results"><h3>Nenhum imóvel encontrado</h3><p>Tente ajustar os filtros para ver mais opções.</p></div>`
    return
  }

  const favoritos = obterFavoritos()

  lista.forEach(imovel => {
    const favoritoAtivo = favoritos.includes(String(imovel.id))
    container.innerHTML += `
      <div class="card">
        <img src="${imovel.foto1}" alt="${imovel.nome}">
        <h3>${imovel.nome}</h3>
        <p>${imovel.quartos} quartos</p>
        <p>R$ ${imovel.preco}</p>
        <a href="imovel.html?slug=${imovel.slug}">Ver imóvel</a>
        <button type="button" onclick="favoritar('${imovel.id}')">${favoritoAtivo ? "Salvo" : "Salvar aos favoritos"}</button>
      </div>
    `
  })
}

function aplicarFiltros() {
  const texto = document.getElementById("busca").value.toLowerCase().trim()
  const quartosMaximos = Number(document.getElementById("filtroQuartos").value || 0)
  const precoMaximo = Number(document.getElementById("filtroPreco").value || 0)

  const filtrados = dados.filter(imovel => {
    const nome = (imovel.nome || "").toLowerCase()
    const quartos = normalizarQuartos(imovel.quartos)
    const preco = normalizarPreco(imovel.preco)

    const passouBusca = nome.includes(texto)
    const passouQuartos = !quartosMaximos || quartos <= quartosMaximos
    const passouPreco = !precoMaximo || (preco > 0 && preco <= precoMaximo)

    return passouBusca && passouQuartos && passouPreco
  })

  mostrar(filtrados)
}

function limparFiltros() {
  document.getElementById("busca").value = ""
  document.getElementById("filtroQuartos").value = ""
  document.getElementById("filtroPreco").value = ""
  aplicarFiltros()
}

function favoritar(id) {
  const favoritos = obterFavoritos()
  const idTexto = String(id)

  if (!favoritos.includes(idTexto)) {
    favoritos.push(idTexto)
  }

  localStorage.setItem("favoritos", JSON.stringify(favoritos))
  renderFavoritos()
  aplicarFiltros()
}

function obterFavoritos() {
  return JSON.parse(localStorage.getItem("favoritos")) || []
}

function renderFavoritos() {
  const container = document.getElementById("favoritosLista")
  const favoritos = obterFavoritos()
  const salvos = dados.filter(imovel => favoritos.includes(String(imovel.id)))

  if (!salvos.length) {
    container.innerHTML = `<p class="empty-state">Você ainda não salvou imóveis.</p>`
    return
  }

  container.innerHTML = salvos.map(imovel => `
    <a class="favorite-item" href="imovel.html?slug=${imovel.slug}">
      <strong>${imovel.nome}</strong>
      <span>${imovel.quartos} quartos</span>
      <span>R$ ${imovel.preco}</span>
    </a>
  `).join("")
}

function atualizarAcesso() {
  const authStatus = document.getElementById("authStatus")
  const authActions = document.getElementById("authActions")
  const token = localStorage.getItem("authToken")
  const nome = localStorage.getItem("usuarioNome")

  if (token) {
    authStatus.innerText = nome ? `${nome}, sua conta está conectada no momento.` : "Sua conta está conectada no momento."
    authActions.innerHTML = `
      <a href="painel.html" class="botao botao-full">Ir para minha conta</a>
      <button type="button" class="ghost-button" onclick="logoutHome()">Logout</button>
    `
    return
  }

  authStatus.innerText = "Entre ou crie sua conta para continuar."
  authActions.innerHTML = `<a href="login.html" class="botao botao-full">Entrar ou cadastrar</a>`
}

function logoutHome() {
  localStorage.removeItem("authToken")
  localStorage.removeItem("usuarioNome")
  localStorage.removeItem("usuarioEmail")
  atualizarAcesso()
}

function renderLancamentos() {
  const container = document.getElementById("launchCarousel")
  const dots = document.getElementById("launchDots")

  if (!lancamentos.length) {
    container.innerHTML = `
      <div class="launch-empty">
        <h3>Nenhum lançamento configurado ainda</h3>
        <p>Adicione na API um imóvel com categoria, tipo, status ou lançamento marcado como "lancamento" ou "na planta".</p>
      </div>
    `
    dots.innerHTML = ""
    return
  }

  lancamentoAtualIndex = 0
  container.innerHTML = ""
  dots.innerHTML = lancamentos.map((_, index) => `
    <button type="button" class="launch-dot${index === 0 ? " ativa" : ""}" onclick="mostrarLancamento(${index})" aria-label="Ver lançamento ${index + 1}"></button>
  `).join("")

  mostrarLancamento(0)
  iniciarAutoplayLancamentos()
}

function mostrarLancamento(index) {
  if (!lancamentos.length) {
    return
  }

  lancamentoAtualIndex = index
  const lancamento = lancamentos[index]
  const fotosLancamento = obterFotosImovel(lancamento)
  const caracteristicas = montarCaracteristicasLancamento(lancamento)
  const container = document.getElementById("launchCarousel")
  const dots = document.querySelectorAll(".launch-dot")

  container.innerHTML = `
    <div class="launch-card">
      <div class="launch-visual">
        <video class="launch-main-video" id="launchMainVideo" autoplay muted loop playsinline preload="metadata" poster="${fotosLancamento[0]}">
          <source src="video-home.mp4" type="video/mp4">
        </video>
        <div class="launch-video-overlay">
          <span class="launch-video-badge">Vídeo do lançamento</span>
          <button type="button" class="launch-video-expand" onclick="abrirVideoModal()">Ver em tela cheia</button>
        </div>
      </div>

      <div class="launch-copy">
        <span class="launch-label">Lançamento em destaque</span>
        <h3>${lancamento.nome}</h3>
        <p>${lancamento.descricao || "Espaço ideal para apresentar diferenciais, conceito do projeto e oportunidade comercial."}</p>

        <div class="launch-characteristics">
          ${caracteristicas.map(item => `
            <div class="launch-characteristic">
              <strong>${item.rotulo}</strong>
              <span>${item.valor}</span>
            </div>
          `).join("")}
        </div>

        <div class="launch-meta">
          <div class="launch-meta-item">
            <strong>Preço</strong>
            <span>${formatarPrecoLancamento(lancamento.preco)}</span>
          </div>
          <div class="launch-meta-item">
            <strong>Quartos</strong>
            <span>${lancamento.quartos || "A definir"}</span>
          </div>
          <div class="launch-meta-item">
            <strong>Metragem</strong>
            <span>${lancamento.metragem || "Consulte"}</span>
          </div>
        </div>

        <div class="launch-actions">
          <a href="imovel.html?slug=${lancamento.slug}" class="botao">Ver detalhes</a>
          <button type="button" class="ghost-button launch-ghost" onclick="abrirPdfModal()">Ver apresentação completa</button>
          <a href="https://wa.me/5511952531263" class="ghost-button launch-ghost">Falar sobre este lançamento</a>
        </div>
      </div>
    </div>
  `

  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("ativa", dotIndex === index)
  })
}

function iniciarAutoplayLancamentos() {
  if (autoplayLancamentos) {
    clearInterval(autoplayLancamentos)
  }

  if (lancamentos.length <= 1) {
    return
  }

  autoplayLancamentos = setInterval(() => {
    const proximo = (lancamentoAtualIndex + 1) % lancamentos.length
    mostrarLancamento(proximo)
  }, 4500)
}

function mostrarImagemLancamento(index) {
  if (!lancamentos.length) {
    return
  }

  const lancamento = lancamentos[lancamentoAtualIndex]
  const fotosLancamento = obterFotosImovel(lancamento)
  const imagem = document.getElementById("launchMainImage")
  const contador = document.getElementById("launchImageCounter")
  const dots = document.querySelectorAll(".launch-image-dot")

  if (!imagem || !fotosLancamento.length) {
    return
  }

  imagemLancamentoAtualIndex = index
  imagem.src = fotosLancamento[index]
  contador.innerText = `${index + 1} / ${fotosLancamento.length}`

  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("ativa", dotIndex === index)
  })
}

function iniciarAutoplayImagensLancamento(fotosLancamento) {
  if (autoplayImagensLancamento) {
    clearInterval(autoplayImagensLancamento)
  }

  if (fotosLancamento.length <= 1) {
    return
  }

  autoplayImagensLancamento = setInterval(() => {
    const proximaImagem = (imagemLancamentoAtualIndex + 1) % fotosLancamento.length
    mostrarImagemLancamento(proximaImagem)
  }, 2800)
}

function montarCaracteristicasLancamento(imovel) {
  const candidatos = [
    { rotulo: "Status", valor: imovel.status },
    { rotulo: "Tipologia", valor: imovel.tipologia || imovel.tipo },
    { rotulo: "Diferencial", valor: imovel.diferencial || imovel.categoria },
    { rotulo: "Região", valor: imovel.bairro || imovel.regiao || imovel.cidade },
    { rotulo: "Endereço", valor: resumirEndereco(imovel.endereco) }
  ]

  const caracteristicas = candidatos.filter(item => valorUtil(item.valor)).slice(0, 4)

  if (caracteristicas.length) {
    return caracteristicas
  }

  return [
    { rotulo: "Status", valor: "Lançamento em destaque" },
    { rotulo: "Conceito", valor: "Apresentação premium do empreendimento" },
    { rotulo: "Atendimento", valor: "Contato direto pelo WhatsApp" },
    { rotulo: "Visita", valor: "Consulte disponibilidade e condições" }
  ]
}

function resumirEndereco(endereco) {
  if (!valorUtil(endereco)) {
    return ""
  }

  return String(endereco).split(",").slice(0, 2).join(",").trim()
}

function formatarPrecoLancamento(preco) {
  return valorUtil(preco) ? `R$ ${preco}` : "Consulte valores"
}

function valorUtil(valor) {
  return String(valor || "").trim() !== ""
}

function normalizarPreco(valor) {
  if (typeof valor === "number") {
    return valor
  }

  return Number(String(valor || "").replace(/[^\d]/g, ""))
}

function normalizarQuartos(valor) {
  if (typeof valor === "number") {
    return valor
  }

  const correspondencia = String(valor || "").match(/\d+/)
  return correspondencia ? Number(correspondencia[0]) : 0
}

function ehLancamento(imovel) {
  const texto = String(imovel.status || "").toLowerCase()

  return texto.includes("lancamento") || texto.includes("na planta")
}

function temDadosMinimos(imovel) {
  const baseValida =
    (imovel.nome || "").trim() !== "" &&
    (imovel.slug || "").trim() !== ""

  if (!baseValida) {
    return false
  }

  if (ehLancamento(imovel)) {
    return true
  }

  if ((imovel.foto1 || "").trim() === "") {
    return false
  }

  return normalizarPreco(imovel.preco) > 0
}

function obterFotosImovel(imovel) {
  const fotos = []

  for (let i = 1; i <= 18; i++) {
    const foto = imovel["foto" + i]
    if (foto && String(foto).trim() !== "") {
      fotos.push(foto)
    }
  }

  return fotos.length ? fotos : [imovel.foto1]
}

function abrirPdfModal() {
  const modal = document.getElementById("pdfModal")
  if (!modal) {
    return
  }

  modal.classList.add("aberto")
  modal.setAttribute("aria-hidden", "false")
  document.body.classList.add("pdf-open")
}

function fecharPdfModal() {
  const modal = document.getElementById("pdfModal")
  if (!modal) {
    return
  }

  modal.classList.remove("aberto")
  modal.setAttribute("aria-hidden", "true")
  document.body.classList.remove("pdf-open")
}

function abrirVideoModal() {
  const modal = document.getElementById("videoModal")
  const player = document.getElementById("videoModalPlayer")

  if (!modal || !player) {
    return
  }

  modal.classList.add("aberto")
  modal.setAttribute("aria-hidden", "false")
  document.body.classList.add("pdf-open")
  player.currentTime = 0
  player.play()
}

function fecharVideoModal() {
  const modal = document.getElementById("videoModal")
  const player = document.getElementById("videoModalPlayer")

  if (!modal || !player) {
    return
  }

  modal.classList.remove("aberto")
  modal.setAttribute("aria-hidden", "true")
  document.body.classList.remove("pdf-open")
  player.pause()
}

document.getElementById("busca").addEventListener("input", aplicarFiltros)
document.getElementById("filtroQuartos").addEventListener("change", aplicarFiltros)
document.getElementById("filtroPreco").addEventListener("change", aplicarFiltros)
