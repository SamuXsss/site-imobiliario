const api = "https://sheetdb.io/api/v1/r97a6hlebb58a"

const params = new URLSearchParams(window.location.search)
const slug = params.get("slug")
let fotosImovel = []
let fotoAtualIndex = 0

fetch(api)
  .then(res => res.json())
  .then(data => {
    const imovel = data.find(i => i.slug == slug)

    if (!imovel) {
      document.getElementById("titulo").innerText = "Imóvel não encontrado"
      document.getElementById("descricao").innerText = "Não foi possível carregar os detalhes deste imóvel."
      return
    }

    document.getElementById("titulo").innerText = imovel.nome
    document.getElementById("descricao").innerText = imovel.descricao
    document.getElementById("preco").innerText = "R$ " + imovel.preco
    document.getElementById("fotoPrincipal").src = imovel.foto1
    document.getElementById("mapa").src =
      "https://maps.google.com/maps?q=" + imovel.endereco + "&output=embed"

    const miniaturas = document.getElementById("miniaturas")

    miniaturas.innerHTML = ""
    fotosImovel = []

    for (let i = 1; i <= 18; i++) {
      const foto = imovel["foto" + i]

      if (foto && foto.trim() !== "") {
        const indice = fotosImovel.length
        fotosImovel.push(foto)
        miniaturas.innerHTML += `<button class="thumb-button" type="button" onclick="selecionarFoto(${indice})"><img src="${foto}" class="thumb" alt="Miniatura do imóvel"></button>`
      }
    }

    if (fotosImovel.length > 0) {
      selecionarFoto(0)
    }

    const numero = "5511952531263"
    const mensagem = "Olá, tenho interesse nesse imóvel: " + imovel.nome
    const link = "https://wa.me/" + numero + "?text=" + encodeURIComponent(mensagem)

    document.getElementById("whatsappBtn").href = link
  })

function selecionarFoto(index, abrirModal = false) {
  if (!fotosImovel.length) {
    return
  }

  fotoAtualIndex = index

  const fotoPrincipal = document.getElementById("fotoPrincipal")
  const lightboxImagem = document.getElementById("lightboxImagem")
  const viewerCounter = document.getElementById("viewerCounter")
  const lightboxCounter = document.getElementById("lightboxCounter")
  const thumbButtons = document.querySelectorAll(".thumb-button")

  fotoPrincipal.classList.remove("ativa")
  lightboxImagem.classList.remove("ativa")

  fotoPrincipal.src = fotosImovel[fotoAtualIndex]
  lightboxImagem.src = fotosImovel[fotoAtualIndex]
  viewerCounter.innerText = `${fotoAtualIndex + 1} / ${fotosImovel.length}`
  lightboxCounter.innerText = `${fotoAtualIndex + 1} / ${fotosImovel.length}`

  thumbButtons.forEach((button, buttonIndex) => {
    button.classList.toggle("ativa", buttonIndex === fotoAtualIndex)
  })

  requestAnimationFrame(() => {
    fotoPrincipal.classList.add("ativa")
    lightboxImagem.classList.add("ativa")
  })

  if (abrirModal) {
    abrirTelaCheia()
  }
}

function moverFoto(direcao, manterModal = false) {
  if (!fotosImovel.length) {
    return
  }

  const total = fotosImovel.length
  const novoIndice = (fotoAtualIndex + direcao + total) % total

  selecionarFoto(novoIndice)

  if (manterModal) {
    abrirTelaCheia()
  }
}

function abrirTelaCheia() {
  if (!fotosImovel.length) {
    return
  }

  const lightbox = document.getElementById("lightbox")
  lightbox.classList.add("aberto")
  document.body.classList.add("lightbox-open")
}

function fecharTelaCheia(event) {
  if (event && event.target && event.target.id !== "lightbox") {
    return
  }

  document.getElementById("lightbox").classList.remove("aberto")
  document.body.classList.remove("lightbox-open")
}

document.addEventListener("keydown", event => {
  const lightboxAberto = document.getElementById("lightbox").classList.contains("aberto")

  if (event.key === "Escape" && lightboxAberto) {
    fecharTelaCheia()
  }

  if (event.key === "ArrowLeft") {
    moverFoto(-1, lightboxAberto)
  }

  if (event.key === "ArrowRight") {
    moverFoto(1, lightboxAberto)
  }
})
