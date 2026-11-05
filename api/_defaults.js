// What the pages show when nothing was edited in the panel. Keep in sync with the HTML of both pages.
module.exports = {
  contato: {
    whatsapp: "5562981549797",
    telefone: "(62) 9 8154-9797",
    site: "www.mathoscontabilidade.com.br",
    instagramHugo: "hugo.mathos",
    instagramMathos: "mathoscontabilidade",
    diaFim: 5,          // 5 = segunda a sexta, 6 = segunda a sábado
    abre: 8,
    fecha: 18
  },
  cartao: {
    topo: "Contador · MEI e Simples",
    frase: "Contabilidade para MEI e empresas do Simples Nacional, com atendimento direto pelo WhatsApp.",
    sobre1: "Hugo Mathos é contador em Goiânia e cuida da contabilidade de quem está começando ou crescendo: microempreendedores individuais e pequenas empresas do Simples Nacional.",
    sobre2: "Você fala direto com quem cuida dos seus números, entende o que precisa pagar e quando, e fica sabendo de qualquer pendência antes que ela vire multa.",
    mensagem: "Olá, Hugo! Vim pelo seu cartão digital."
  },
  bio: {
    frase: "Contabilidade que ajuda sua empresa a crescer.",
    botoes: [
      { id: "wa_geral",   titulo: "Falar no WhatsApp",          sub: "Resposta direta com o contador",                    msg: "Olá! Vim pelo Instagram da Mathos Contabilidade e quero conversar.", visivel: true },
      { id: "wa_mei",     titulo: "Sou MEI",                    sub: "DAS, declaração anual, nota fiscal e limite",       msg: "Olá! Vim pelo Instagram da Mathos. Sou MEI e quero deixar meu CNPJ em dia.", visivel: true },
      { id: "wa_simples", titulo: "Tenho empresa no Simples",   sub: "DAS no anexo certo, Fator R, folha e pró-labore",   msg: "Olá! Vim pelo Instagram da Mathos. Tenho empresa no Simples Nacional e quero conversar sobre a contabilidade.", visivel: true },
      { id: "wa_abrir",   titulo: "Quero abrir minha empresa",  sub: "MEI ou Microempresa, do jeito certo desde o início", msg: "Olá! Vim pelo Instagram da Mathos e quero abrir minha empresa.", visivel: true },
      { id: "wa_trocar",  titulo: "Quero trocar de contador",   sub: "A gente cuida da transição com o escritório atual",  msg: "Olá! Vim pelo Instagram da Mathos e quero trocar de contador.", visivel: true }
    ]
  },
  foto: { v: 0 }        // 0 = the original photo shipped with the site
};
