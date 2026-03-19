const form = document.getElementById("loginForm")
const campoNomeWrap = document.getElementById("campoNome")
const campoNome = document.getElementById("nome")
const campoUsuario = document.getElementById("usuario")
const campoSenha = document.getElementById("senha")
const mensagem = document.getElementById("loginMensagem")
const submitAuth = document.getElementById("submitAuth")
const tabEntrar = document.getElementById("tabEntrar")
const tabCadastrar = document.getElementById("tabCadastrar")
const API_BASE_URL = localStorage.getItem("authApiUrl") || "http://localhost:3001"

let modoAtual = "entrar"

if (localStorage.getItem("authToken")) {
  window.location = "painel.html"
}

form.addEventListener("submit", handleAuth)

function alternarModo(modo) {
  modoAtual = modo
  const cadastroAtivo = modo === "cadastrar"

  campoNomeWrap.classList.toggle("hidden-field", !cadastroAtivo)
  tabEntrar.classList.toggle("ativa", !cadastroAtivo)
  tabCadastrar.classList.toggle("ativa", cadastroAtivo)
  submitAuth.innerText = cadastroAtivo ? "Criar conta" : "Entrar"
  mensagem.innerText = ""
  mensagem.classList.remove("erro", "sucesso")
  campoNome.required = cadastroAtivo
}

function handleAuth(event) {
  event.preventDefault()

  if (modoAtual === "cadastrar") {
    cadastrar()
    return
  }

  entrar()
}

async function cadastrar() {
  const nome = campoNome.value.trim()
  const email = campoUsuario.value.trim().toLowerCase()
  const senha = campoSenha.value.trim()

  if (!nome || !email || !senha) {
    mostrarMensagem("Preencha nome, e-mail e senha para criar sua conta.", true)
    return
  }

  try {
    const resposta = await fetch(`${API_BASE_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha })
    })
    const dados = await resposta.json()

    if (!resposta.ok) {
      mostrarMensagem(dados.error || "Não foi possível criar a conta.", true)
      return
    }

    mostrarMensagem("Conta criada com sucesso. Faça seu login.", false)
    alternarModo("entrar")
    campoSenha.value = ""
  } catch {
    mostrarMensagem("A API de autenticação não está disponível no momento.", true)
  }
}

async function entrar() {
  const email = campoUsuario.value.trim().toLowerCase()
  const senha = campoSenha.value.trim()

  if (!email || !senha) {
    mostrarMensagem("Preencha e-mail e senha para continuar.", true)
    return
  }

  try {
    const resposta = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha })
    })
    const dados = await resposta.json()

    if (!resposta.ok) {
      mostrarMensagem(dados.error || "Conta não encontrada ou senha incorreta.", true)
      return
    }

    localStorage.setItem("authToken", dados.token)
    localStorage.setItem("usuarioNome", dados.usuario.nome)
    localStorage.setItem("usuarioEmail", dados.usuario.email)
    mostrarMensagem("Login realizado com sucesso.", false)

    window.setTimeout(() => {
      window.location = "painel.html"
    }, 500)
  } catch {
    mostrarMensagem("A API de autenticação não está disponível no momento.", true)
  }
}

function mostrarMensagem(texto, erro) {
  mensagem.innerText = texto
  mensagem.classList.toggle("erro", erro)
  mensagem.classList.toggle("sucesso", !erro)
}
