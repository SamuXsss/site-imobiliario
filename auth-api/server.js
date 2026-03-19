const http = require("http")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

const PORT = process.env.PORT || 3001
const DATA_DIR = path.join(__dirname, "data")
const USERS_FILE = path.join(DATA_DIR, "users.json")
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json")

garantirArquivos()

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res)

  if (req.method === "OPTIONS") {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.url === "/api/register" && req.method === "POST") {
    const body = await lerJson(req)
    return responderCadastro(res, body)
  }

  if (req.url === "/api/login" && req.method === "POST") {
    const body = await lerJson(req)
    return responderLogin(res, body)
  }

  if (req.url === "/api/session" && req.method === "GET") {
    return responderSessao(req, res)
  }

  if (req.url === "/api/logout" && req.method === "POST") {
    return responderLogout(req, res)
  }

  res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" })
  res.end(JSON.stringify({ error: "Rota não encontrada." }))
})

server.listen(PORT, () => {
  console.log(`Auth API pronta em http://localhost:${PORT}`)
})

function garantirArquivos() {
  fs.mkdirSync(DATA_DIR, { recursive: true })

  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, "[]")
  }

  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, "[]")
  }
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

function lerArquivoJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"))
}

function salvarArquivoJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

function lerJson(req) {
  return new Promise(resolve => {
    let body = ""

    req.on("data", chunk => {
      body += chunk
    })

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        resolve({})
      }
    })
  })
}

function responderJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" })
  res.end(JSON.stringify(data))
}

function hashSenha(senha, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(senha, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

function verificarSenha(senha, senhaArmazenada) {
  const [salt, originalHash] = senhaArmazenada.split(":")
  const hashAtual = crypto.scryptSync(senha, salt, 64).toString("hex")
  return crypto.timingSafeEqual(Buffer.from(originalHash, "hex"), Buffer.from(hashAtual, "hex"))
}

function extrairToken(req) {
  const auth = req.headers.authorization || ""
  return auth.startsWith("Bearer ") ? auth.slice(7) : ""
}

function responderCadastro(res, body) {
  const nome = String(body.nome || "").trim()
  const email = String(body.email || "").trim().toLowerCase()
  const senha = String(body.senha || "").trim()

  if (!nome || !email || !senha) {
    return responderJson(res, 400, { error: "Preencha nome, e-mail e senha." })
  }

  const usuarios = lerArquivoJson(USERS_FILE)
  const usuarioExiste = usuarios.some(usuario => usuario.email === email)

  if (usuarioExiste) {
    return responderJson(res, 409, { error: "Já existe uma conta com esse e-mail." })
  }

  usuarios.push({
    id: crypto.randomUUID(),
    nome,
    email,
    senha: hashSenha(senha),
    criadoEm: new Date().toISOString()
  })

  salvarArquivoJson(USERS_FILE, usuarios)
  return responderJson(res, 201, { ok: true })
}

function responderLogin(res, body) {
  const email = String(body.email || "").trim().toLowerCase()
  const senha = String(body.senha || "").trim()
  const usuarios = lerArquivoJson(USERS_FILE)
  const usuario = usuarios.find(item => item.email === email)

  if (!usuario || !verificarSenha(senha, usuario.senha)) {
    return responderJson(res, 401, { error: "Conta não encontrada ou senha incorreta." })
  }

  const sessoes = lerArquivoJson(SESSIONS_FILE)
  const token = crypto.randomUUID()

  sessoes.push({
    token,
    usuarioId: usuario.id,
    criadoEm: new Date().toISOString()
  })

  salvarArquivoJson(SESSIONS_FILE, sessoes)

  return responderJson(res, 200, {
    token,
    usuario: {
      nome: usuario.nome,
      email: usuario.email
    }
  })
}

function responderSessao(req, res) {
  const token = extrairToken(req)
  const sessoes = lerArquivoJson(SESSIONS_FILE)
  const usuarios = lerArquivoJson(USERS_FILE)
  const sessao = sessoes.find(item => item.token === token)

  if (!sessao) {
    return responderJson(res, 401, { error: "Sessão inválida." })
  }

  const usuario = usuarios.find(item => item.id === sessao.usuarioId)

  if (!usuario) {
    return responderJson(res, 401, { error: "Usuário não encontrado." })
  }

  return responderJson(res, 200, {
    usuario: {
      nome: usuario.nome,
      email: usuario.email
    }
  })
}

function responderLogout(req, res) {
  const token = extrairToken(req)
  const sessoes = lerArquivoJson(SESSIONS_FILE).filter(item => item.token !== token)
  salvarArquivoJson(SESSIONS_FILE, sessoes)
  return responderJson(res, 200, { ok: true })
}
