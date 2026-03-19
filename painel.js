const API_BASE_URL = "https://site-imobiliario.onrender.com"
const token = localStorage.getItem("authToken")

if (!token) {
  window.location = "login.html"
}

verificarSessao()

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
    document.getElementById("painelBoasVindas").innerText = `${dados.usuario.nome}, sua sessão está ativa no momento.`
    document.getElementById("painelEmail").innerText = dados.usuario.email
  } catch {
    logoutLocal()
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
