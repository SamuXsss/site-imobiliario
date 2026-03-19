const API_BASE_URL = "https://site-imobiliario.onrender.com"
const token = localStorage.getItem("authToken")
const apiImoveis = "https://sheetdb.io/api/v1/r97a6hlebb58a"

if (!token) {
  window.location = "login.html"
}

verificarSessao()
renderFavoritosPainel()

async function verificarSessao() {
  try {
    const resposta = await fetch(`${API_BASE_URL}/api/session`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!resposta.ok) {
      logoutLocal()
      return
    }

    const dados = await resposta.json()
    localStorage.setItem("usuarioNome", dados.usuario.nome)
    localStorage.setItem("usuarioEmail", dados.usuario.email)
    document.getElementById("painelBoasVindas").innerText = `${dados.usuario.nome}, sua sessão está ativa no momento.`
    document.getElementById("painelEmail").innerText = dados.usuario.email
  } catch {
    logoutLocal()
  }
}

async function renderFavoritosPainel() {
  const container = document.getElementById("painelFavoritosLista")
  const favoritos = JSON.parse(localStorage.getItem("favoritos")) || []

  if (!favoritos.length) {
    container.innerHTML = `
      <div class="empty-results">
        <h3>Nenhum favorito salvo</h3>
        <p>Volte ao site principal e salve imóveis para vê-los reunidos aqui.</p>
      </div>
    `
    return
  }

  try {
    const resposta = await fetch(apiImoveis)
    const dados = await resposta.json()
    const salvos = dados.filter(imovel => favoritos.includes(String(imovel.id)))

    if (!salvos.length) {
      container.innerHTML = `
        <div class="empty-results">
          <h3>Seus favoritos não foram encontrados</h3>
          <p>Alguns imóveis podem ter saído da listagem atual.</p>
        </div>
      `
      return
    }

    container.innerHTML = salvos.map(imovel => `
      <article class="favorite-card">
        <img src="${imovel.foto1}" alt="${imovel.nome}" class="favorite-card-image">
        <div class="favorite-card-body">
          <h3>${imovel.nome}</h3>
          <p>${imovel.quartos} quartos</p>
          <p class="favorite-card-price">R$ ${imovel.preco}</p>
          <a href="imovel.html?slug=${imovel.slug}" class="botao">Ver detalhes</a>
        </div>
      </article>
    `).join("")
  } catch {
    container.innerHTML = `
      <div class="empty-results">
        <h3>Não foi possível carregar seus favoritos</h3>
        <p>Tente novamente em instantes.</p>
      </div>
    `
  }
}

async function logout() {
  try {
    await fetch(`${API_BASE_URL}/api/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  } catch {
  }

  logoutLocal()
}

function logoutLocal() {
  localStorage.removeItem("authToken")
  localStorage.removeItem("usuarioNome")
  localStorage.removeItem("usuarioEmail")
  window.location = "login.html"
}
