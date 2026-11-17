
const formChat = document.getElementById("formChat");
const apiKey = document.getElementById("apiKey");
const mensagem = document.getElementById("mensagem");
const historicoElemento = document.getElementById("historico");
const btnEnviar = document.getElementById("btnEnviar");
const btnLimpar = document.getElementById("btnLimpar");
const aviso = document.getElementById("aviso");

let historico = [];

const instrucoes = `
Você é a Impulso IA, assistente virtual da Impulso Brasil.

A Impulso Brasil é uma iniciativa de impacto social que promove
a inclusão juvenil e conecta jovens a oportunidades de aprendizagem,
participação social, voluntariado e desenvolvimento profissional.

Ajude os jovens com dúvidas sobre estudos, projetos sociais,
participação comunitária, desenvolvimento de habilidades e carreira.

Responda em português brasileiro, com educação, clareza,
respeito e motivação.

Não invente vagas, parcerias ou oportunidades oficiais.
Se não souber uma informação, seja transparente.
`;

function adicionarMensagem(texto, tipo, nome) {
    const bloco = document.createElement("div");
    bloco.className = `mensagem ${tipo}`;

    const autor = document.createElement("strong");
    autor.textContent = nome;

    const conteudo = document.createElement("p");
    conteudo.textContent = texto;

    bloco.appendChild(autor);
    bloco.appendChild(conteudo);

    historicoElemento.appendChild(bloco);
    historicoElemento.scrollTop = historicoElemento.scrollHeight;
}

function extrairResposta(dados) {
    if (dados.output_text) {
        return dados.output_text.trim();
    }

    let texto = "";

    for (const item of (dados.output || [])) {
        if (item.type === "message") {
            for (const parte of (item.content || [])) {
                if (parte.type === "output_text") {
                    texto += parte.text;
                }
            }
        }
    }

    return texto.trim();
}

async function enviarMensagem(event) {
    event.preventDefault();

    const chave = apiKey.value.trim();
    const texto = mensagem.value.trim();

    if (!chave) {
        aviso.textContent = "Insira sua chave da API.";
        apiKey.focus();
        return;
    }

    if (!texto) {
        aviso.textContent = "Digite uma mensagem.";
        mensagem.focus();
        return;
    }

    adicionarMensagem(texto, "usuario", "Você");

    historico.push({
        role: "user",
        content: texto
    });

    mensagem.value = "";
    aviso.textContent = "A Impulso IA está pensando...";

    btnEnviar.disabled = true;
    btnEnviar.textContent = "Enviando...";

    try {
        const resposta = await fetch(
            "https://api.openai.com/v1/responses",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${chave}`
                },
                body: JSON.stringify({
                    model: "gpt-5.5",
                    instructions: instrucoes,
                    input: historico
                })
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.error?.message ||
                `Erro HTTP ${resposta.status}.`
            );
        }

        const textoResposta = extrairResposta(dados);

        if (!textoResposta) {
            throw new Error("A API não retornou uma resposta de texto.");
        }

        adicionarMensagem(textoResposta, "bot", "Impulso IA");

        historico.push({
            role: "assistant",
            content: textoResposta
        });

        aviso.textContent = "Resposta recebida!";

    } catch (erro) {
        historico.pop();

        adicionarMensagem(
            erro.message,
            "erro",
            "Erro ao conversar"
        );

        aviso.textContent = "Confira sua chave e sua conexão.";
        console.error("Erro na API:", erro);

    } finally {
        btnEnviar.disabled = false;
        btnEnviar.textContent = "Enviar ➤";
        mensagem.focus();
    }
}

formChat.addEventListener("submit", enviarMensagem);

btnLimpar.addEventListener("click", function() {
    historico = [];
    historicoElemento.innerHTML = "";

    adicionarMensagem(
        "Conversa reiniciada! Como posso ajudar você? 😊",
        "bot",
        "Impulso IA"
    );

    aviso.textContent = "Conversa limpa!";
});
