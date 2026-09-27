// ================= LANDING PAGE CONTROLS =================
console.log('Script carregado com sucesso');

// Declarar as funções no escopo global explicitamente
window.showSystem = function(targetScreen = 'inicio') {
    const landing = document.querySelector('.netflix-landing');
    const container = document.querySelector('.container');

    if (!landing || !container) return;

    document.body.classList.add('system-active');

    landing.style.display = 'none';
    landing.style.visibility = 'hidden';
    landing.style.opacity = '0';

    container.style.display = 'flex';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.right = '0';
    container.style.bottom = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.zIndex = '9999';
    container.style.background = 'var(--netflix-dark)';
    container.style.padding = '0';
    container.style.overflow = 'hidden';

    const card = container.querySelector('.card');
    if (card) {
        card.style.maxHeight = '100vh';
        card.style.borderRadius = '0';
        card.style.margin = '0';
        card.style.height = '100vh';
        card.style.overflowY = 'auto';
    }

    if (targetScreen !== 'inicio') {
        mostrarTela(targetScreen);
    } else {
        mostrarTela('inicio');
    }
};

window.voltarParaLanding = function() {
    const landing = document.querySelector('.netflix-landing');
    const container = document.querySelector('.container');
    const inicio = document.getElementById('inicio');

    if (!landing || !container || !inicio) {
        console.error('Elementos necessários não encontrados');
        return;
    }

    // Apenas remove a classe - CSS controla tudo
    document.body.classList.remove('system-active');

    console.log('Classe system-active removida. CSS vai controlar o display.');

    // Reset to initial screen
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
    inicio.classList.add('ativa');
};

window.toggleFaq = function(element) {
    const answer = element.nextElementSibling;
    const icon = element.querySelector('.faq-icon');
    
    if (answer && icon) {
        answer.classList.toggle('open');
        icon.textContent = answer.classList.contains('open') ? '×' : '+';
    }
};

window.voltarParaTelaInicial = function() {
    // Limpa qualquer estado de autenticação ou acesso
    grupoAtual = "";
    isProfLogado = false;

    // Garante que está no sistema
    const landing = document.querySelector('.netflix-landing');
    const container = document.querySelector('.container');

    if (landing && container) {
        document.body.classList.add('system-active');

        // Navega explicitamente para a tela inicial
        mostrarTela('inicio');
    }
};

// ================= CONFIGURAÇÃO FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyBd8vchRcXzpknvszJikiFhiJz8eIg5nnY",
  authDomain: "laboratorioif.firebaseapp.com",
  databaseURL: "https://laboratorioif-default-rtdb.firebaseio.com",
  projectId: "laboratorioif"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let grupoAtual = ""; window.dadosProfessor = [];
let praticasRenderizadas = { p1: false, p2: false, p3: false, p4: false }; 

// ================= SEGURANÇA: HASH DE SENHAS (SHA-256) =================
// As senhas não ficam mais em texto puro no código nem no banco de dados.
async function hashSenha(senha) {
    const data = new TextEncoder().encode(senha);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const HASH_SENHA_PROFESSOR = "b98fa8019f3a49b8e9db23e42215d4454689e09e9ddaa0e571d9826de151e9fa";
const HASH_SENHA_TESTE = "20f3765880a5c269b747e1e906054a4b4a3a991259f1e16b5dde4742cec2319a";

const modulosPraticas = [
    { id: "Prática 1", titulo: "Prática 1: Associação de Resistores", img: "pra_1.jpeg?v=" + Date.now() },
    { id: "Prática 2", titulo: "Prática 2: Leis de Kirchhoff", img: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?auto=format&fit=crop&w=400&q=80" },
    { id: "Prática 3", titulo: "Prática 3: Divisor de Tensão e Corrente", img: "https://static.todamateria.com.br/upload/ci/rc/circuito-eletrico-og.jpg?class=ogImageWide" },
    { id: "Prática 4", titulo: "Prática 4: Análise Nodal", img: "https://www.casadoeletricistars.com.br/fotos/1/287/Blog%20-%20Casa%20do%20Eletricista%20(56)(1).png" }
];

const dicCores = { "Preto": "black", "Marrom": "#8B4513", "Vermelho": "red", "Laranja": "orange", "Amarelo": "#eab308", "Verde": "#16a34a", "Azul": "#2563eb", "Violeta": "#8b5cf6", "Cinza": "gray", "Branco": "white", "Dourado": "#ca8a04", "Prateado": "silver" };
const digitos = { "Preto": 0, "Marrom": 1, "Vermelho": 2, "Laranja": 3, "Amarelo": 4, "Verde": 5, "Azul": 6, "Violeta": 7, "Cinza": 8, "Branco": 9 };
const mults = { "Preto": 1, "Marrom": 10, "Vermelho": 100, "Laranja": 1000, "Amarelo": 10000, "Verde": 100000, "Azul": 1000000, "Violeta": 10000000, "Cinza": 100000000, "Branco": 1000000000, "Dourado": 0.1, "Prateado": 0.01 };

window.preencherSelect = function(id, obj) { 
    const s = document.getElementById(id); if(!s) return; s.innerHTML = ''; 
    for (let cor in obj) { let opt = document.createElement("option"); opt.value = cor; opt.text = cor; s.appendChild(opt); } 
};

document.addEventListener("DOMContentLoaded", () => {
    // 1. RECUPERA SESSÃO AO ATUALIZAR A PÁGINA (F5)
    grupoAtual = sessionStorage.getItem('grupoAtual') || "";
    if(sessionStorage.getItem('isTest') === 'true') document.body.classList.add('is-test');
    let isProfLogado = sessionStorage.getItem('isProfLogado') === 'true';

    let profHtml = ""; let alunoHtml = "";
    modulosPraticas.forEach(m => {
        profHtml += `<div class="module-card" onclick="mostrarRegistros('${m.id}')"><div class="module-img" style="background-image: url('${m.img}');"></div><div class="module-title">${m.titulo}</div></div>`;
        alunoHtml += `<div class="module-card" onclick="abrirAtividade('${m.id}')"><div class="module-img" style="background-image: url('${m.img}');"></div><div class="module-title">${m.titulo}</div></div>`;
    });

    // Verifica se os elementos existem antes de tentar preenchê-los
    const gridProf = document.getElementById("gridProf");
    const gridAluno = document.getElementById("gridAluno");
    if (gridProf) gridProf.innerHTML = profHtml;
    if (gridAluno) gridAluno.innerHTML = alunoHtml;

    // ENTER KEY LISTENERS - com verificação de existência
    const senhaProfessor = document.getElementById("senhaProfessor");
    if (senhaProfessor) {
        senhaProfessor.addEventListener("keypress", e => { if (e.key === "Enter") entrarProfessor(); });
    }

    const nomeGrupo = document.getElementById("nomeGrupo");
    if (nomeGrupo) {
        nomeGrupo.addEventListener("keypress", e => { if (e.key === "Enter") entrarGrupo(); });
    }

    const senhaGrupo = document.getElementById("senhaGrupo");
    if (senhaGrupo) {
        senhaGrupo.addEventListener("keypress", e => { if (e.key === "Enter") entrarGrupo(); });
    }

    // Inicializar práticas conforme a página atual
    if (document.getElementById('p1_resistores')) {
        renderizarPratica1();
    }
    if (document.getElementById('p2_resistores')) {
        renderizarPratica2();
    }
    if (document.getElementById('p3_resistores')) {
        renderizarPratica3();
    }
    if (document.getElementById('p4_resistores')) {
        renderizarPratica4();
    }

    if (isProfLogado) monitorarStatusEmTempoReal();
});

window.sairConta = function() {
    // Se for aluno saindo, avisa ao Firebase que ele ficou Offline
    if (grupoAtual !== "") {
        db.ref('statusTurmaIF/' + grupoAtual).update({
            status: 'Offline', timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    document.body.classList.remove('is-test');
    grupoAtual = "";

    // Limpa a memória do F5
    sessionStorage.removeItem('grupoAtual');
    sessionStorage.removeItem('isTest');
    sessionStorage.removeItem('isProfLogado');
    sessionStorage.removeItem('tipoPratica');
    sessionStorage.removeItem('groqApiKey');

    // Limpa elementos de prática apenas se existirem (página de aluno)
    praticasRenderizadas = { p1: false, p2: false, p3: false, p4: false };
    if(document.getElementById("p1_resistores")) document.getElementById("p1_resistores").innerHTML = "";
    if(document.getElementById("p2_resistores")) document.getElementById("p2_resistores").innerHTML = "";
    if(document.getElementById("p3_resistores")) document.getElementById("p3_resistores").innerHTML = "";
    if(document.getElementById("p4_resistores")) document.getElementById("p4_resistores").innerHTML = "";
    if(document.getElementById("infoP1")) document.getElementById("infoP1").value = "";
    if(document.getElementById("infoP2")) document.getElementById("infoP2").value = "";
    if(document.getElementById("infoP3")) document.getElementById("infoP3").value = "";
    if(document.getElementById("infoP4")) document.getElementById("infoP4").value = "";

    window.location.href = 'index.html';
};

window.entrarProfessor = async function(event) {
    if (event) event.preventDefault();
    
    let s = document.getElementById("senhaProfessor");
    if (!s) return;

    if (!s.value) {
        alert("Por favor, digite a senha.");
        return;
    }

    if (await hashSenha(s.value) === HASH_SENHA_PROFESSOR) {
        s.value = "";
        sessionStorage.setItem('isProfLogado', 'true');
        window.location.href = 'menu-professor.html';
    } else {
        alert("Credencial inválida.");
    }
};

function sanitizarChaveGroq(chave) {
    if (!chave) return '';
    const limpa = String(chave)
        .replace(/^\uFEFF/, '')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/^Bearer\s+/i, '')
        .replace(/["'`]/g, '')
        .replace(/\s+/g, '')
        .trim();
    const match = limpa.match(/gsk_[A-Za-z0-9+/=_-]{10,}/i);
    return match ? match[0] : '';
}

function chaveGroqDoGrupo() {
    const campoPagina = document.getElementById('groqApiKeyPratica') || document.getElementById('groqApiKeyGrupo') || document.getElementById('groqApiKey');
    const daTela = sanitizarChaveGroq(campoPagina && campoPagina.value);
    if (daTela) {
        salvarChaveGroqGrupo(daTela);
        return daTela;
    }
    return sanitizarChaveGroq(sessionStorage.getItem('groqApiKey') || localStorage.getItem('groqApiKey'));
}

function salvarChaveGroqGrupo(chave) {
    const limpa = sanitizarChaveGroq(chave);
    if (!limpa) {
    sessionStorage.removeItem('groqApiKey');
    localStorage.removeItem('groqApiKey');
        localStorage.removeItem('groqApiKey');
        return '';
    }
    sessionStorage.setItem('groqApiKey', limpa);
    localStorage.setItem('groqApiKey', limpa);
    return limpa;
}

async function validarChaveGroqServidor(chave) {
    const resposta = await fetch('/api/validar-chave', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groqApiKey: chave })
    });
    const resultado = await resposta.json().catch(() => ({}));
    if (!resposta.ok || !resultado.ok) {
        throw new Error(resultado.error || 'A Groq recusou esta chave.');
    }
    return true;
}

window.salvarChaveGroqTela = async function() {
    const campo = document.getElementById('groqApiKeyGrupo');
    const status = document.getElementById('groqKeyStatus');
    if (!campo) return;
    const chave = sanitizarChaveGroq(campo.value);
    if (!chave) {
        alert('Cole uma chave Groq comecando com gsk_. Crie em https://console.groq.com/keys');
        return;
    }
    if (status) status.textContent = 'Validando chave na Groq...';
    try {
        await validarChaveGroqServidor(chave);
        salvarChaveGroqGrupo(chave);
        campo.value = '';
        campo.placeholder = 'Chave salva neste grupo';
        if (status) status.textContent = 'Chave Groq deste grupo validada e salva nesta sessao.';
        alert('Chave Groq validada e salva para este grupo.');
    } catch (erro) {
        if (status) status.textContent = erro.message;
        alert(erro.message);
    }
};

window.entrarGrupo = async function(event) {
    if (event) event.preventDefault();
    
    let nomeEl = document.getElementById("nomeGrupo");
    let senhaEl = document.getElementById("senhaGrupo");
    
    if (!nomeEl || !senhaEl) {
        console.error('Campos de login não encontrados');
        return;
    }
    
    let nome = nomeEl.value.trim(), senha = senhaEl.value;
    if (!nome || !senha) return alert("Preencha as credenciais.");
    const groqEl = document.getElementById("groqApiKey");
    const chaveGroq = sanitizarChaveGroq(groqEl ? groqEl.value : "");
    if (!chaveGroq) {
        return alert("Cole a chave Groq do grupo. Crie em https://console.groq.com/keys");
    }
    try {
        await validarChaveGroqServidor(chaveGroq);
        salvarChaveGroqGrupo(chaveGroq);
    } catch (erro) {
        return alert(erro.message);
    }
    let btn = (typeof event !== 'undefined' && event) ? event.target : null;
let senhaHash = await hashSenha(senha);

if (nome === "testelw" && senhaHash === HASH_SENHA_TESTE) {
    grupoAtual = nome;
    sessionStorage.setItem('grupoAtual', nome);
    sessionStorage.setItem('isTest', 'true');
    document.body.classList.add('is-test');
    registrarPresencaOnline(nome);

    window.location.href = 'escolha-pratica.html';
    return;
}

document.body.classList.remove('is-test'); 
let txt = "Autenticando..."; 
if(btn && btn.tagName === "BUTTON") { txt = btn.innerText; btn.innerText = "Autenticando..."; btn.disabled = true; }

db.ref('gruposIF/' + nome).once('value').then(snap => {
    let saved = snap.val();
    // Compara pelo hash; aceita senhas antigas em texto puro e as migra para hash
    if (!saved || saved === senhaHash || saved === senha) { 
        if(!saved || saved === senha) db.ref('gruposIF/' + nome).set(senhaHash); 
        
        grupoAtual = nome;
        sessionStorage.setItem('grupoAtual', nome);
        registrarPresencaOnline(nome);
        window.location.href = 'escolha-pratica.html'; 
    }
    else { alert("Senha incorreta."); }
    if(btn && btn.tagName === "BUTTON") { btn.innerText = txt; btn.disabled = false; }
}).catch(err => { 
    alert("Erro de conexão."); 
    if(btn && btn.tagName === "BUTTON") { btn.innerText = txt; btn.disabled = false; } 
});
}

// Função auxiliar para marcar o aluno como online assim que loga
function registrarPresencaOnline(nomeGrupo) {
    let ref = db.ref('statusTurmaIF/' + nomeGrupo);
    ref.set({ status: 'Online', timestamp: firebase.database.ServerValue.TIMESTAMP });
    // Se a internet do aluno cair ou ele fechar o navegador, o Firebase acusa Offline sozinho:
    ref.onDisconnect().update({ status: 'Offline', timestamp: firebase.database.ServerValue.TIMESTAMP });
}

// ================= FUNÇÃO DE ANÁLISE DE FOTO =================
const FOTO_TITULOS = {
    p1_resistores: "Definicao dos 5 Resistores",
    p1_serie: "Associacao em Serie",
    p1_paralelo: "Associacao em Paralelo",
    p1_mista: "Associacao Mista",
    p2_resistores: "Resistores Individuais",
    p2_serie: "Circuito Serie",
    p2_paralelo: "Circuito Paralelo",
    p2_misto: "Circuito Misto",
    p3_resistores: "Resistores Individuais",
    p3_serie: "Divisor de Tensao (Serie)",
    p3_paralelo: "Divisor de Corrente (Paralelo)",
    p4_resistores: "Resistores Individuais",
    p4_fontes: "Fontes de Tensao",
    p4_nos: "Tensoes Nodais (Superno)",
    p4_vr: "Tensoes nos Resistores",
    p4_i: "Correntes"
};

function criarCaixaChaveGroq() {
    const atual = chaveGroqDoGrupo();
    return `
    <div class="foto-questao-container groq-pratica-box">
        <h4>Chave Groq deste grupo</h4>
        <p class="foto-ajuda">Cole a chave aqui se a analise pedir. Crie em <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">console.groq.com/keys</a>.</p>
        <div class="foto-upload-area">
            <input type="password" id="groqApiKeyPratica" class="input-destaque" placeholder="gsk_..." autocomplete="off" value="${atual ? '' : ''}">
            <button type="button" class="btn-analisar-foto" onclick="salvarChaveGroqPratica()">Salvar chave</button>
        </div>
        <div id="groqKeyStatusPratica" class="foto-feedback ${atual ? 'show sucesso' : ''}">${atual ? 'Chave Groq ja salva neste aparelho.' : ''}</div>
    </div>`;
}

window.salvarChaveGroqPratica = async function() {
    const campo = document.getElementById('groqApiKeyPratica');
    const status = document.getElementById('groqKeyStatusPratica');
    if (!campo) return;
    const chave = sanitizarChaveGroq(campo.value) || chaveGroqDoGrupo();
    if (!chave) {
        alert('Cole uma chave Groq comecando com gsk_.');
        return;
    }
    if (status) {
        status.textContent = 'Validando chave na Groq...';
        status.className = 'foto-feedback show analisando';
    }
    try {
        await validarChaveGroqServidor(chave);
        salvarChaveGroqGrupo(chave);
        campo.value = '';
        campo.placeholder = 'Chave salva';
        if (status) {
            status.textContent = 'Chave Groq validada e salva.';
            status.className = 'foto-feedback show sucesso';
        }
    } catch (erro) {
        if (status) {
            status.textContent = erro.message;
            status.className = 'foto-feedback show erro';
        }
        alert(erro.message);
    }
};

function criarComponenteFoto(questaoId, descricao) {
    return `
    <div class="foto-questao-container" id="foto-container-${questaoId}">
        <h4>${descricao}</h4>
        <p class="foto-ajuda">Envie um arquivo ou tire foto do papel com os calculos. A IA responde em portugues se esta correto.</p>
        <div class="foto-upload-area">
            <div class="foto-input-wrapper">
                <button type="button" class="btn-foto-upload">Arquivo</button>
                <input type="file" id="foto-${questaoId}" accept="image/*" onchange="previewFoto('${questaoId}', this)">
            </div>
            <div class="foto-input-wrapper">
                <button type="button" class="btn-foto-camera">Camera</button>
                <input type="file" id="camera-${questaoId}" accept="image/*" capture="environment" onchange="previewFoto('${questaoId}', this)">
            </div>
            <img id="preview-${questaoId}" class="foto-preview" alt="Preview">
            <button type="button" id="btn-analisar-${questaoId}" class="btn-analisar-foto" onclick="analisarFoto('${questaoId}')" disabled>
                Analisar com IA
            </button>
        </div>
        <div id="feedback-${questaoId}" class="foto-feedback"></div>
    </div>`;
}

window.fotosPratica = {};
window.feedbacksPratica = {};

function compactarImagem(arquivo, maxLado = 1280, qualidade = 0.82) {
    return new Promise((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onerror = () => reject(new Error("Falha ao ler a imagem"));
        leitor.onload = () => {
            const img = new Image();
            img.onload = () => {
                let w = img.width;
                let h = img.height;
                if (w > maxLado || h > maxLado) {
                    const escala = maxLado / Math.max(w, h);
                    w = Math.round(w * escala);
                    h = Math.round(h * escala);
                }
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL("image/jpeg", qualidade));
            };
            img.onerror = () => reject(new Error("Imagem invalida"));
            img.src = leitor.result;
        };
        leitor.readAsDataURL(arquivo);
    });
}

window.previewFoto = async function(questaoId, inputEl) {
    const input = inputEl || document.getElementById(`foto-${questaoId}`);
    const preview = document.getElementById(`preview-${questaoId}`);
    const btnAnalisar = document.getElementById(`btn-analisar-${questaoId}`);
    const feedback = document.getElementById(`feedback-${questaoId}`);

    if (!input || !input.files || !input.files[0]) return;

    try {
        const dataUrl = await compactarImagem(input.files[0]);
        preview.src = dataUrl;
        preview.classList.add("has-image");
        btnAnalisar.disabled = false;
        window.fotosPratica[questaoId] = dataUrl;
        if (feedback) {
            feedback.textContent = "Foto pronta. Clique em Analisar com IA.";
            feedback.className = "foto-feedback show analisando";
        }
    } catch (erro) {
        alert("Nao foi possivel ler a foto: " + erro.message);
    }
};

window.analisarFoto = async function(questaoId) {
    const feedback = document.getElementById(`feedback-${questaoId}`);
    const btnAnalisar = document.getElementById(`btn-analisar-${questaoId}`);
    const fotoBase64 = window.fotosPratica[questaoId];

    if (!fotoBase64) return alert("Selecione ou tire uma foto primeiro!");

    feedback.textContent = "Analisando a foto, aguarde...";
    feedback.className = "foto-feedback show analisando";
    if (btnAnalisar) btnAnalisar.disabled = true;

    try {
        const [prefixo, base64Limpo] = fotoBase64.split(",");
        const mimeType = (prefixo.match(/data:(image\/[a-zA-Z0-9.+-]+);base64/) || [])[1] || "image/jpeg";

        const groqApiKey = chaveGroqDoGrupo();
        if (!groqApiKey) {
            throw new Error("Cole a chave Groq nesta pagina (comeca com gsk_). Crie em https://console.groq.com/keys");
        }

        const resposta = await fetch("/api/analisar", {
            method: "POST",
            cache: "no-store",
            headers: {
                "Content-Type": "application/json",
                "x-groq-api-key": groqApiKey
            },
            body: JSON.stringify({
                imagemBase64: base64Limpo,
                mimeType,
                contexto: FOTO_TITULOS[questaoId] || questaoId,
                groqApiKey
            })
        });

        const resultado = await resposta.json();
        if (!resposta.ok || resultado.error) {
            throw new Error(resultado.error || "Falha na analise");
        }

        window.feedbacksPratica[questaoId] = resultado.feedback;
        feedback.textContent = resultado.feedback;
        feedback.className = "foto-feedback show sucesso";
    } catch (erro) {
        feedback.textContent = "Erro ao analisar foto: " + erro.message;
        feedback.className = "foto-feedback show erro";
    } finally {
        if (btnAnalisar) btnAnalisar.disabled = false;
    }
};

async function enviarFoto() {
  const inputFoto = document.getElementById("foto-caderno");
  const arquivo = inputFoto && inputFoto.files[0];
  const destino = document.getElementById("feedback-resultado");

  if (!arquivo) return alert("Selecione uma foto primeiro!");
  if (destino) destino.innerText = "Analisando a foto, aguarde...";

  try {
    const dataUrl = await compactarImagem(arquivo);
    const [prefixo, base64Limpo] = dataUrl.split(",");
    const mimeType = (prefixo.match(/data:(image\/[a-zA-Z0-9.+-]+);base64/) || [])[1] || "image/jpeg";

    const groqApiKey = chaveGroqDoGrupo();
    if (!groqApiKey) {
      throw new Error("Cole a chave Groq nesta pagina (comeca com gsk_). Crie em https://console.groq.com/keys");
    }

    const resposta = await fetch("/api/analisar", {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "x-groq-api-key": groqApiKey
      },
      body: JSON.stringify({ imagemBase64: base64Limpo, mimeType, groqApiKey })
    });

    const resultado = await resposta.json();
    if (!resposta.ok || resultado.error) {
      throw new Error(resultado.error || "Falha na analise");
    }
    if (destino) destino.innerText = resultado.feedback;
  } catch (erro) {
    if (destino) destino.innerText = "Erro ao analisar foto: " + erro.message;
  }
}

// ================= FUNÇÃO DE AUTOPREENCHIMENTO PARA TESTE =================
function executarTeste(num) {
    let btn = document.getElementById('btnTeste' + num);
    let oldText = btn.innerText;
    btn.innerText = "Processando e Enviando...";
    btn.disabled = true;

    let tela = document.getElementById('pratica' + num);
    if (!tela) return;
    
    let infoInput = tela.querySelector('.input-destaque');
    if (infoInput) infoInput.value = "Gerado via Auto Teste - " + new Date().getHours() + "h" + new Date().getMinutes() + "m";
    
    let inputs = tela.querySelectorAll('input:not(.input-destaque)');
    inputs.forEach(inp => {
        if (inp.id.includes('escala')) inp.value = "20";
        else if (inp.id.includes('delta')) inp.value = "0";
        else if (inp.id.includes('tol_aluno')) inp.value = "5";
        else inp.value = "0"; 
    });

    let selects = tela.querySelectorAll('select');
    selects.forEach(sel => {
        if(sel.id.includes('tipo')) sel.value = "4";
        else if(sel.id.includes('c1')) sel.value = "Marrom"; 
        else if(sel.id.includes('c2')) sel.value = "Preto"; 
        else if(sel.id.includes('mul')) sel.value = "Marrom"; 
        else if(sel.id.includes('tol')) sel.value = "Dourado"; 
        sel.dispatchEvent(new Event('change'));
    });

    let R = 100;

    if (num === 1) {
        for(let i=1; i<=5; i++) { document.getElementById(`r${i}_nom`).value = R; document.getElementById(`r${i}_med`).value = R; }
        for(let i=2; i<=5; i++) {
            document.getElementById(`s${i}_nom`).value = R * i; document.getElementById(`s${i}_med`).value = R * i;
            document.getElementById(`p${i}_nom`).value = R / i; document.getElementById(`p${i}_med`).value = R / i;
        }
        let gabMisto = 1 / ( (1/(R+R)) + (1/(R+R)) + (1/R) );
        document.getElementById(`m_nom`).value = gabMisto; document.getElementById(`m_med`).value = gabMisto;
    }
    else if (num === 2) {
        for(let i=1; i<=3; i++) { document.getElementById(`p2_r${i}_nom`).value = R; document.getElementById(`p2_r${i}_med`).value = R; }
        let sReq = R * 3;
        document.getElementById('p2_s_req_nom').value = sReq; document.getElementById('p2_s_req_med').value = sReq;
        document.getElementById('p2_s_itotal_nom').value = (5/sReq)*1000; document.getElementById('p2_s_itotal_med').value = (5/sReq)*1000;
        document.getElementById('p2_s_vtotal_nom').value = 5; document.getElementById('p2_s_vtotal_med').value = 5;
        for(let i=1; i<=3; i++) { document.getElementById(`p2_s_v${i}_nom`).value = 5/3; document.getElementById(`p2_s_v${i}_med`).value = 5/3; }

        let pReq = R / 3;
        document.getElementById('p2_p_req_nom').value = pReq; document.getElementById('p2_p_req_med').value = pReq;
        document.getElementById('p2_p_itotal_nom').value = (5/pReq)*1000; document.getElementById('p2_p_itotal_med').value = (5/pReq)*1000;
        document.getElementById('p2_p_itotal2_nom').value = (5/pReq)*1000; document.getElementById('p2_p_itotal2_med').value = (5/pReq)*1000;
        document.getElementById('p2_p_vtotal_nom').value = 5; document.getElementById('p2_p_vtotal_med').value = 5;
        for(let i=1; i<=3; i++) { document.getElementById(`p2_p_v${i}_nom`).value = 5; document.getElementById(`p2_p_v${i}_med`).value = 5; }
        document.getElementById('p2_p_i1_nom').value = 50; document.getElementById('p2_p_i1_med').value = 50;
        document.getElementById('p2_p_i2_nom').value = 50; document.getElementById('p2_p_i2_med').value = 50;
        document.getElementById('p2_p_i3_nom').value = 50; document.getElementById('p2_p_i3_med').value = 50;
        document.getElementById('p2_p_i23_nom').value = 100; document.getElementById('p2_p_i23_med').value = 100;

        let mReq = R + R/2;
        let mItot = (6.5/mReq)*1000;
        document.getElementById('p2_m_req_nom').value = mReq; document.getElementById('p2_m_req_med').value = mReq;
        document.getElementById('p2_m_itotal_nom').value = mItot; document.getElementById('p2_m_itotal_med').value = mItot;
        document.getElementById('p2_m_itotal2_nom').value = mItot; document.getElementById('p2_m_itotal2_med').value = mItot;
        document.getElementById('p2_m_vtotal_nom').value = 6.5; document.getElementById('p2_m_vtotal_med').value = 6.5;
        document.getElementById('p2_m_v1_nom').value = (mItot/1000)*R; document.getElementById('p2_m_v1_med').value = (mItot/1000)*R;
        document.getElementById('p2_m_v2_nom').value = (mItot/1000)*(R/2); document.getElementById('p2_m_v2_med').value = (mItot/1000)*(R/2);
        document.getElementById('p2_m_v3_nom').value = (mItot/1000)*(R/2); document.getElementById('p2_m_v3_med').value = (mItot/1000)*(R/2);
        document.getElementById('p2_m_i1_nom').value = mItot; document.getElementById('p2_m_i1_med').value = mItot;
        document.getElementById('p2_m_i2_nom').value = mItot/2; document.getElementById('p2_m_i2_med').value = mItot/2;
        document.getElementById('p2_m_i3_nom').value = mItot/2; document.getElementById('p2_m_i3_med').value = mItot/2;
    }
    else if (num === 3) {
        for(let i=1; i<=3; i++) { document.getElementById(`p3_r${i}_nom`).value = R; document.getElementById(`p3_r${i}_med`).value = R; }
        document.getElementById('p3_s_vtotal_nom').value = 5; document.getElementById('p3_s_vtotal_med').value = 5;
        for(let i=1; i<=3; i++) { document.getElementById(`p3_s_v${i}_nom`).value = 5/3; document.getElementById(`p3_s_v${i}_med`).value = 5/3; }
        
        let iTot_mA = (5/(R/3))*1000;
        document.getElementById('p3_p_itotal_nom').value = iTot_mA; document.getElementById('p3_p_itotal_med').value = iTot_mA;
        for(let i=1; i<=3; i++) { document.getElementById(`p3_p_i${i}_nom`).value = 50; document.getElementById(`p3_p_i${i}_med`).value = 50; }
    }
    else if (num === 4) {
        for(let i=1; i<=4; i++) { document.getElementById(`p4_r${i}_nom`).value = R; document.getElementById(`p4_r${i}_med`).value = R; }
        document.getElementById('p4_e1_nom').value = 5; document.getElementById('p4_e1_med').value = 5;
        document.getElementById('p4_e2_nom').value = 12; document.getElementById('p4_e2_med').value = 12;

        let invSum = 4/R;
        let Va = (5/R - 12/R - 12/R) / invSum;
        let Vb = Va + 12;

        document.getElementById('p4_no_va_nom').value = Va;
        document.getElementById('p4_no_vb_nom').value = Vb;

        let vr1 = Va - 5; let vr2 = Va; let vr3 = Vb; let vr4 = Vb; 
        document.getElementById('p4_vr_1_nom').value = vr1; document.getElementById('p4_vr_1_med').value = vr1;
        document.getElementById('p4_vr_2_nom').value = vr2; document.getElementById('p4_vr_2_med').value = vr2;
        document.getElementById('p4_vr_3_nom').value = vr3; document.getElementById('p4_vr_3_med').value = vr3;
        document.getElementById('p4_vr_4_nom').value = vr4; document.getElementById('p4_vr_4_med').value = vr4;

        let i1 = (vr1/R)*1000; let i2 = (vr2/R)*1000; let i3 = -(i1 + i2); 
        let i5 = (vr3/R)*1000; let i6 = (vr4/R)*1000; let i4 = -(i5 + i6);

        document.getElementById('p4_i_1_nom').value = i1; document.getElementById('p4_i_1_med').value = i1;
        document.getElementById('p4_i_2_nom').value = i2; document.getElementById('p4_i_2_med').value = i2;
        document.getElementById('p4_i_3_nom').value = i3; document.getElementById('p4_i_3_med').value = i3;
        document.getElementById('p4_i_4_nom').value = i4; document.getElementById('p4_i_4_med').value = i4;
        document.getElementById('p4_i_5_nom').value = i5; document.getElementById('p4_i_5_med').value = i5;
        document.getElementById('p4_i_6_nom').value = i6; document.getElementById('p4_i_6_med').value = i6;
    }

    setTimeout(() => {
        if (num === 1) enviarPratica1();
        else if (num === 2) enviarPratica2();
        else if (num === 3) enviarPratica3();
        else if (num === 4) enviarPratica4();
        
        btn.innerText = oldText;
        btn.disabled = false;
    }, 800);
}

function parseValue(str) {
    if (str === undefined || str === null || str === "") return 0;
    if (typeof str === 'number') return isNaN(str) ? 0 : str;
    str = str.toString().trim().replace(',', '.');
    if (str === "") return 0;
    let mult = 1;
    if (str.endsWith('micro')) { mult = 1e-6; str = str.slice(0, -5); }
    else if (str.endsWith('m')) { mult = 1e-3; str = str.slice(0, -1); }
    else if (str.endsWith('M')) { mult = 1e6; str = str.slice(0, -1); }
    else if (str.endsWith('k') || str.endsWith('K')) { mult = 1e3; str = str.slice(0, -1); }
    let val = parseFloat(str) * mult;
    return isNaN(val) ? 0 : val;
}

function formatEng(val, unit = '') {
    if (val === 0) return '0 ' + unit; if (isNaN(val) || val === null || val === undefined) return '-';
    let sign = val < 0 ? '-' : '';
    let absVal = Math.abs(val);
    if (absVal >= 1e6) return sign + parseFloat((absVal / 1e6).toFixed(2)) + ' M' + unit;
    if (absVal >= 1e3) return sign + parseFloat((absVal / 1e3).toFixed(2)) + ' k' + unit;
    if (absVal >= 1) return sign + parseFloat(absVal.toFixed(2)) + ' ' + unit;
    if (absVal >= 1e-3) return sign + parseFloat((absVal * 1e3).toFixed(2)) + ' m' + unit;
    if (absVal >= 1e-6) return sign + parseFloat((absVal * 1e6).toFixed(2)) + ' micro' + unit;
    return sign + parseFloat(absVal.toFixed(4)) + ' ' + unit;
}

function calcDeltaInterno(nominal, medido) {
    if (!nominal || nominal === 0) return 0;
    return (((Math.abs(medido) - Math.abs(nominal)) / Math.abs(nominal)) * 100);
}

window.mostrarTela = function(id, vindoDoHistorico = false) {
    const tela = document.getElementById(id);
    if (!tela) return;

    document.querySelectorAll(".tela").forEach(t => t.classList.remove("ativa"));
    tela.classList.add("ativa");

    if (!vindoDoHistorico && id !== 'loginProfessor' && id !== 'loginGrupo') {
        window.history.pushState({ tela: id }, "", `#${id}`);
    }

    let btnTopo = document.getElementById("btnVoltarTopo");
    if (btnTopo) {
        btnTopo.style.display = (id === 'inicio' || id === 'loginProfessor' || id === 'loginGrupo') ? 'none' : 'flex';
    }
};




window.abrirAtividade = function(idModulo) {
    if (idModulo === "Prática 1") {
        window.location.href = 'pratica1.html';
    }
    else if (idModulo === "Prática 2") {
        window.location.href = 'pratica2.html';
    }
    else if (idModulo === "Prática 3") {
        window.location.href = 'pratica3.html';
    }
    else if (idModulo === "Prática 4") {
        window.location.href = 'pratica4.html';
    }
}

// ================= COMPONENTES ATUALIZADOS PARA TECLADO DE CELULAR =================
function UI_Row(idPrefix, title) {
    return `<div class="registro"><strong>${title}</strong>
        <div class="flex-row"><input class="col-4" type="number" inputmode="decimal" id="${idPrefix}_nom" placeholder="Nominal (Aluno)"><input class="col-4" type="number" inputmode="decimal" id="${idPrefix}_med" placeholder="Medido"></div>
        <div class="flex-row"><input class="col-4" type="number" inputmode="decimal" id="${idPrefix}_delta" placeholder="Δ (%) Erro"><input class="col-4" type="text" id="${idPrefix}_escala" placeholder="Escala Multímetro"></div></div>`;
}

function UI_Row_OnlyNominal(idPrefix, title) {
    return `<div class="registro"><strong>${title}</strong>
        <div class="flex-row"><input class="col-4" type="number" inputmode="decimal" id="${idPrefix}_nom" placeholder="Valor Nominal (Calculado pelo Aluno)"></div></div>`;
}

function renderResistoresUI(qtd, prefix, containerId) {
    let resHTML = "";
    for(let i=1; i<=qtd; i++) {
        resHTML += `<div class="registro"><strong style="color:var(--primary-color);">Resistor R${i}</strong>
            <div class="resistor-dinamico" id="${prefix}r${i}_visual"><div class="faixa-dinamica" id="${prefix}r${i}_f1" style="left:15%"></div><div class="faixa-dinamica" id="${prefix}r${i}_f2" style="left:30%"></div><div class="faixa-dinamica" id="${prefix}r${i}_f3" style="left:45%; display:none;"></div><div class="faixa-dinamica" id="${prefix}r${i}_f4" style="left:65%"></div><div class="faixa-dinamica" id="${prefix}r${i}_f5" style="left:80%"></div></div>
            <select id="${prefix}r${i}_tipo" onchange="atualizarCor(${i}, '${prefix}')"><option value="4">Padrão 4 Faixas</option><option value="5">Padrão 5 Faixas</option></select>
            <div class="flex-row"><select class="col-4" id="${prefix}r${i}_c1" onchange="atualizarCor(${i}, '${prefix}')"></select><select class="col-4" id="${prefix}r${i}_c2" onchange="atualizarCor(${i}, '${prefix}')"></select><select class="col-4" id="${prefix}r${i}_c3" onchange="atualizarCor(${i}, '${prefix}')" style="display:none;"></select></div>
            <div class="flex-row"><select class="col-4" id="${prefix}r${i}_mul" onchange="atualizarCor(${i}, '${prefix}')"></select><select class="col-4" id="${prefix}r${i}_tol" onchange="atualizarCor(${i}, '${prefix}')"></select></div>
            <div class="flex-row"><input class="col-4" type="number" inputmode="decimal" id="${prefix}r${i}_nom" placeholder="Nominal (Aluno)"><input class="col-4" type="number" inputmode="decimal" id="${prefix}r${i}_med" placeholder="Medido"><input class="col-4" type="number" inputmode="decimal" id="${prefix}r${i}_tol_aluno" placeholder="Tol Lida (%)"></div>
            <div class="flex-row"><input class="col-4" type="number" inputmode="decimal" id="${prefix}r${i}_delta" placeholder="ΔR (%)"><input class="col-4" type="text" id="${prefix}r${i}_escala" placeholder="Escala"></div></div>`;
    }
    document.getElementById(containerId).innerHTML = resHTML;
    for(let i=1; i<=qtd; i++) {
        preencherSelect(`${prefix}r${i}_c1`, digitos); preencherSelect(`${prefix}r${i}_c2`, digitos); preencherSelect(`${prefix}r${i}_c3`, digitos);
        preencherSelect(`${prefix}r${i}_mul`, mults);
        preencherSelect(`${prefix}r${i}_tol`, { "Marrom":"±1%", "Vermelho":"±2%", "Verde":"±0.5%", "Azul":"±0.25%", "Violeta":"±0.1%", "Cinza":"±0.05%", "Dourado":"±5%", "Prateado":"±10%" });
        atualizarCor(i, prefix);
    }
}

function atualizarCor(i, prefix) {
    let t = document.getElementById(`${prefix}r${i}_tipo`).value;
    document.getElementById(`${prefix}r${i}_f1`).style.background = dicCores[document.getElementById(`${prefix}r${i}_c1`).value];
    document.getElementById(`${prefix}r${i}_f2`).style.background = dicCores[document.getElementById(`${prefix}r${i}_c2`).value];
    if(t === "5") {
        document.getElementById(`${prefix}r${i}_f3`).style.display = "block"; document.getElementById(`${prefix}r${i}_c3`).style.display = "block";
        document.getElementById(`${prefix}r${i}_f3`).style.background = dicCores[document.getElementById(`${prefix}r${i}_c3`).value];
    } else {
        document.getElementById(`${prefix}r${i}_f3`).style.display = "none"; document.getElementById(`${prefix}r${i}_c3`).style.display = "none";
    }
    document.getElementById(`${prefix}r${i}_f4`).style.background = dicCores[document.getElementById(`${prefix}r${i}_mul`).value];
    document.getElementById(`${prefix}r${i}_f5`).style.background = dicCores[document.getElementById(`${prefix}r${i}_tol`).value];
}

function getVal(id) { return parseValue(document.getElementById(id).value); }
function getStr(id) { return document.getElementById(id).value || ""; }

window.renderizarPratica1 = function() {
    if (praticasRenderizadas.p1) return;
    praticasRenderizadas.p1 = true;
    renderResistoresUI(5, "", "p1_resistores");
    
    document.getElementById("p1_resistores").innerHTML += criarCaixaChaveGroq() + criarComponenteFoto("p1_resistores", "Foto: Definição dos 5 Resistores");
    
    let assocS = ""; for(let i=2; i<=5; i++) assocS += UI_Row(`s${i}`, `Req (Série R1 até R${i})`); 
    document.getElementById("p1_serie").innerHTML = assocS + criarComponenteFoto("p1_serie", "Foto: Associação em Série");
    
    let assocP = ""; for(let i=2; i<=5; i++) assocP += UI_Row(`p${i}`, `Req (Paralelo R1 até R${i})`); 
    document.getElementById("p1_paralelo").innerHTML = assocP + criarComponenteFoto("p1_paralelo", "Foto: Associação em Paralelo");
    
    document.getElementById("p1_mista").innerHTML = UI_Row(`m`, `Req Misto (R1//(R2+R3)//(R4+R5))`) + criarComponenteFoto("p1_mista", "Foto: Associação Mista");
}

window.enviarPratica1 = function() {
    let infoA = document.getElementById("infoP1").value.trim(); if (!infoA) return alert("Preencha a identificação.");
    let sub = { grupo: grupoAtual, tipo: 'Prática 1', infoAtividade: infoA, divulgado: false, timestamp: firebase.database.ServerValue.TIMESTAMP, resistores: [], serie: [], paralelo: [], mista: {}, fotos: {}, feedbacks: {} };
    let exactNominals = [];

    for(let i=1; i<=5; i++) {
        let t = document.getElementById(`r${i}_tipo`).value, c1 = document.getElementById(`r${i}_c1`).value, c2 = document.getElementById(`r${i}_c2`).value, c3 = document.getElementById(`r${i}_c3`).value, mul = document.getElementById(`r${i}_mul`).value, tol = document.getElementById(`r${i}_tol`).value;
        let gabNom = (t === "5") ? (digitos[c1]*100 + digitos[c2]*10 + digitos[c3]) * mults[mul] : (digitos[c1]*10 + digitos[c2]) * mults[mul]; exactNominals.push(gabNom);
        let medA = getVal(`r${i}_med`);
        sub.resistores.push({ id: i, t: t, c1: c1, c2: c2, c3: c3, mul: mul, tol: tol, gabNom: gabNom, nomA: getVal(`r${i}_nom`), medA: medA, tolA: getStr(`r${i}_tol_aluno`), deltaA: getVal(`r${i}_delta`), escala: getStr(`r${i}_escala`), gabDelta: calcDeltaInterno(gabNom, medA) });
    }
    for(let i=2; i<=5; i++) {
        let medA = getVal(`s${i}_med`); let gabNom = 0; for(let j=0; j<i; j++) gabNom += exactNominals[j];
        sub.serie.push({ qtd: i, nomA: getVal(`s${i}_nom`), medA: medA, deltaA: getVal(`s${i}_delta`), escala: getStr(`s${i}_escala`), gabNom: gabNom, gabDelta: calcDeltaInterno(gabNom, medA) });
    }
    for(let i=2; i<=5; i++) {
        let medA = getVal(`p${i}_med`); let inv = 0; for(let j=0; j<i; j++) inv += (1/exactNominals[j]); let gabNom = 1 / inv;
        sub.paralelo.push({ qtd: i, nomA: getVal(`p${i}_nom`), medA: medA, deltaA: getVal(`p${i}_delta`), escala: getStr(`p${i}_escala`), gabNom: gabNom, gabDelta: calcDeltaInterno(gabNom, medA) });
    }
    let m_medA = getVal(`m_med`); let gabMisto = 1 / ( (1/(exactNominals[3]+exactNominals[4])) + (1/(exactNominals[1]+exactNominals[2])) + (1/exactNominals[0]) );
    sub.mista = { nomA: getVal(`m_nom`), medA: m_medA, deltaA: getVal(`m_delta`), escala: getStr(`m_escala`), gabNom: gabMisto, gabDelta: calcDeltaInterno(gabMisto, m_medA) };

    // Adicionar fotos e feedbacks
    sub.fotos = window.fotosPratica || {};
    sub.feedbacks = window.feedbacksPratica || {};

    let btnEl = document.getElementById("btnPratica1");
    if(btnEl) { btnEl.innerText = "Salvando..."; btnEl.disabled = true; }
    db.ref('registrosLabIF').push(sub).then(() => { alert("Enviado com sucesso!"); window.location.href = 'escolha-pratica.html'; }).catch(err=>alert(err)).finally(() => { if(btnEl){ btnEl.innerText = "Submeter à Nuvem"; btnEl.disabled = false;} });
}

window.renderizarPratica2 = function() {
    if (praticasRenderizadas.p2) return;
    praticasRenderizadas.p2 = true;
    renderResistoresUI(3, "p2_", "p2_resistores");
    
    document.getElementById("p2_resistores").innerHTML += criarCaixaChaveGroq() + criarComponenteFoto("p2_resistores", "Foto: Resistores Individuais");
    
    document.getElementById("p2_serie").innerHTML = UI_Row('p2_s_req', 'Req (Série R1+R2+R3)') + UI_Row('p2_s_itotal', 'I Total (mA)') + UI_Row('p2_s_vtotal', 'Tensão Total da Fonte') + UI_Row('p2_s_v1', 'Tensão V1 (sobre R1)') + UI_Row('p2_s_v2', 'Tensão V2 (sobre R2)') + UI_Row('p2_s_v3', 'Tensão V3 (sobre R3)') + criarComponenteFoto("p2_serie", "Foto: Circuito Série");
    
    document.getElementById("p2_paralelo").innerHTML = UI_Row('p2_p_req', 'Req (Paralelo R1//R2//R3)') + UI_Row('p2_p_itotal', 'I Total 1ª Medição (mA)') + UI_Row('p2_p_vtotal', 'Tensão Total da Fonte') + UI_Row('p2_p_v1', 'Tensão V1 (sobre R1)') + UI_Row('p2_p_v2', 'Tensão V2 (sobre R2)') + UI_Row('p2_p_v3', 'Tensão V3 (sobre R3)') + UI_Row('p2_p_itotal2', 'I Total 2ª Medição (mA)') + UI_Row('p2_p_i1', 'Corrente I1 (mA)') + UI_Row('p2_p_i2', 'Corrente I2 (mA)') + UI_Row('p2_p_i23', 'Corrente I23 (mA)') + UI_Row('p2_p_i3', 'Corrente I3 (mA)') + criarComponenteFoto("p2_paralelo", "Foto: Circuito Paralelo");
    
    document.getElementById("p2_misto").innerHTML = UI_Row('p2_m_req', 'Req Mista R1 + (R2//R3)') + UI_Row('p2_m_itotal', 'I Total 1ª Medição (mA)') + UI_Row('p2_m_vtotal', 'Tensão Total da Fonte (6.5V)') + UI_Row('p2_m_v1', 'Tensão V1 (sobre R1)') + UI_Row('p2_m_v2', 'Tensão V2 (sobre R2)') + UI_Row('p2_m_v3', 'Tensão V3 (sobre R3)') + UI_Row('p2_m_itotal2', 'I Total 2ª Medição (mA)') + UI_Row('p2_m_i1', 'Corrente I1 (mA)') + UI_Row('p2_m_i2', 'Corrente I2 (mA)') + UI_Row('p2_m_i3', 'Corrente I3 (mA)') + criarComponenteFoto("p2_misto", "Foto: Circuito Misto");
}

window.enviarPratica2 = function() {
    let infoA = document.getElementById("infoP2").value.trim(); if (!infoA) return alert("Preencha a identificação.");
    let sub = { grupo: grupoAtual, tipo: 'Prática 2', infoAtividade: infoA, divulgado: false, timestamp: firebase.database.ServerValue.TIMESTAMP, resistores: [], serie: {}, paralelo: {}, misto: {}, fotos: {}, feedbacks: {} };
    let R = [];

    for(let i=1; i<=3; i++) {
        let t = getStr(`p2_r${i}_tipo`), c1 = getStr(`p2_r${i}_c1`), c2 = getStr(`p2_r${i}_c2`), c3 = getStr(`p2_r${i}_c3`), mul = getStr(`p2_r${i}_mul`), tol = getStr(`p2_r${i}_tol`);
        let gabNom = (t === "5") ? (digitos[c1]*100 + digitos[c2]*10 + digitos[c3]) * mults[mul] : (digitos[c1]*10 + digitos[c2]) * mults[mul]; R.push(gabNom);
        let medA = getVal(`p2_r${i}_med`);
        sub.resistores.push({ id: i, t:t, c1:c1, c2:c2, c3:c3, mul:mul, tol:tol, gabNom: gabNom, nomA: getVal(`p2_r${i}_nom`), medA: medA, tolA: getStr(`p2_r${i}_tol_aluno`), deltaA: getVal(`p2_r${i}_delta`), escala: getStr(`p2_r${i}_escala`), gabDelta: calcDeltaInterno(gabNom, medA) });
    }

    let r1 = R[0], r2 = R[1], r3 = R[2];
    let sReq = r1+r2+r3; let sItot = (5/sReq)*1000;
    let getS = (id, gNom) => { let m = getVal('p2_s_'+id+'_med'); return { nomA: getVal('p2_s_'+id+'_nom'), medA: m, deltaA: getVal('p2_s_'+id+'_delta'), escala: getStr('p2_s_'+id+'_escala'), gabNom: gNom, gabDelta: calcDeltaInterno(gNom, m) }; };
    sub.serie = { req: getS('req', sReq), itotal: getS('itotal', sItot), vtotal: getS('vtotal', 5), v1: getS('v1', 5*r1/sReq), v2: getS('v2', 5*r2/sReq), v3: getS('v3', 5*r3/sReq) };

    let pReq = 1/(1/r1 + 1/r2 + 1/r3); let pItot = (5/pReq)*1000;
    let getP = (id, gNom) => { let m = getVal('p2_p_'+id+'_med'); return { nomA: getVal('p2_p_'+id+'_nom'), medA: m, deltaA: getVal('p2_p_'+id+'_delta'), escala: getStr('p2_p_'+id+'_escala'), gabNom: gNom, gabDelta: calcDeltaInterno(gNom, m) }; };
    sub.paralelo = { req: getP('req', pReq), itotal: getP('itotal', pItot), vtotal: getP('vtotal', 5), v1: getP('v1', 5), v2: getP('v2', 5), v3: getP('v3', 5), itotal2: getP('itotal2', pItot), i1: getP('i1', (5/r1)*1000), i2: getP('i2', (5/r2)*1000), i23: getP('i23', (5/r2)*1000 + (5/r3)*1000), i3: getP('i3', (5/r3)*1000) };

    let mR23 = 1/(1/r2 + 1/r3); let mReq = r1 + mR23; let mItot = (6.5/mReq)*1000;
    let getM = (id, gNom) => { let m = getVal('p2_m_'+id+'_med'); return { nomA: getVal('p2_m_'+id+'_nom'), medA: m, deltaA: getVal('p2_m_'+id+'_delta'), escala: getStr('p2_m_'+id+'_escala'), gabNom: gNom, gabDelta: calcDeltaInterno(gNom, m) }; };
    let mV1 = (mItot/1000)*r1; let mV23 = (mItot/1000)*mR23;
    sub.misto = { req: getM('req', mReq), itotal: getM('itotal', mItot), vtotal: getM('vtotal', 6.5), v1: getM('v1', mV1), v2: getM('v2', mV23), v3: getM('v3', mV23), itotal2: getM('itotal2', mItot), i1: getM('i1', mItot), i2: getM('i2', (mV23/r2)*1000), i3: getM('i3', (mV23/r3)*1000) };

    // Adicionar fotos e feedbacks
    sub.fotos = window.fotosPratica || {};
    sub.feedbacks = window.feedbacksPratica || {};

    let btnEl = document.getElementById("btnPratica2");
    if(btnEl) { btnEl.innerText = "Salvando..."; btnEl.disabled = true; }
    db.ref('registrosLabIF').push(sub).then(() => { alert("Enviado com sucesso!"); window.location.href = 'escolha-pratica.html'; }).catch(err=>alert(err)).finally(() => { if(btnEl) { btnEl.innerText = "Submeter à Nuvem"; btnEl.disabled = false;} });
}

window.renderizarPratica3 = function() {
    if (praticasRenderizadas.p3) return;
    praticasRenderizadas.p3 = true;
    renderResistoresUI(3, "p3_", "p3_resistores");
    
    document.getElementById("p3_resistores").innerHTML += criarCaixaChaveGroq() + criarComponenteFoto("p3_resistores", "Foto: Resistores Individuais");
    
    document.getElementById("p3_serie").innerHTML = UI_Row('p3_s_vtotal', 'Tensão Total da Fonte (V)') + UI_Row('p3_s_v1', 'Tensão V1 (sobre R1)') + UI_Row('p3_s_v2', 'Tensão V2 (sobre R2)') + UI_Row('p3_s_v3', 'Tensão V3 (sobre R3)') + criarComponenteFoto("p3_serie", "Foto: Divisor de Tensão (Série)");
    
    document.getElementById("p3_paralelo").innerHTML = UI_Row('p3_p_itotal', 'I Total (mA)') + UI_Row('p3_p_i1', 'Corrente I1 (mA)') + UI_Row('p3_p_i2', 'Corrente I2 (mA)') + UI_Row('p3_p_i3', 'Corrente I3 (mA)') + criarComponenteFoto("p3_paralelo", "Foto: Divisor de Corrente (Paralelo)");
}

window.enviarPratica3 = function() {
    let infoA = document.getElementById("infoP3").value.trim(); if (!infoA) return alert("Preencha a identificação.");
    let sub = { grupo: grupoAtual, tipo: 'Prática 3', infoAtividade: infoA, divulgado: false, timestamp: firebase.database.ServerValue.TIMESTAMP, resistores: [], serie: {}, paralelo: {}, fotos: {}, feedbacks: {} };
    let R = [];

    for(let i=1; i<=3; i++) {
        let t = getStr(`p3_r${i}_tipo`), c1 = getStr(`p3_r${i}_c1`), c2 = getStr(`p3_r${i}_c2`), c3 = getStr(`p3_r${i}_c3`), mul = getStr(`p3_r${i}_mul`), tol = getStr(`p3_r${i}_tol`);
        let gabNom = (t === "5") ? (digitos[c1]*100 + digitos[c2]*10 + digitos[c3]) * mults[mul] : (digitos[c1]*10 + digitos[c2]) * mults[mul]; R.push(gabNom);
        let medA = getVal(`p3_r${i}_med`);
        sub.resistores.push({ id: i, t:t, c1:c1, c2:c2, c3:c3, mul:mul, tol:tol, gabNom: gabNom, nomA: getVal(`p3_r${i}_nom`), medA: medA, tolA: getStr(`p3_r${i}_tol_aluno`), deltaA: getVal(`p3_r${i}_delta`), escala: getStr(`p3_r${i}_escala`), gabDelta: calcDeltaInterno(gabNom, medA) });
    }

    let r1 = R[0], r2 = R[1], r3 = R[2];
    let getO = (prefix, id, gNom) => { let m = getVal(prefix+id+'_med'); return { nomA: getVal(prefix+id+'_nom'), medA: m, deltaA: getVal(prefix+id+'_delta'), escala: getStr(prefix+id+'_escala'), gabNom: gNom, gabDelta: calcDeltaInterno(gNom, m) }; };

    let sReq = r1+r2+r3;
    sub.serie = { vtotal: getO('p3_s_', 'vtotal', 5), v1: getO('p3_s_', 'v1', 5*r1/sReq), v2: getO('p3_s_', 'v2', 5*r2/sReq), v3: getO('p3_s_', 'v3', 5*r3/sReq) };

    let pReq = 1/(1/r1 + 1/r2 + 1/r3); let iTot_mA = (5/pReq)*1000;
    sub.paralelo = { itotal: getO('p3_p_', 'itotal', iTot_mA), i1: getO('p3_p_', 'i1', iTot_mA * (pReq/r1)), i2: getO('p3_p_', 'i2', iTot_mA * (pReq/r2)), i3: getO('p3_p_', 'i3', iTot_mA * (pReq/r3)) };

    // Adicionar fotos e feedbacks
    sub.fotos = window.fotosPratica || {};
    sub.feedbacks = window.feedbacksPratica || {};

    let btnEl = document.getElementById("btnPratica3");
    if(btnEl) { btnEl.innerText = "Salvando..."; btnEl.disabled = true; }
    db.ref('registrosLabIF').push(sub).then(() => { alert("Enviado com sucesso!"); window.location.href = 'escolha-pratica.html'; }).catch(err=>alert(err)).finally(() => { if(btnEl) { btnEl.innerText = "Submeter à Nuvem"; btnEl.disabled = false;} });
}

window.renderizarPratica4 = function() {
    if (praticasRenderizadas.p4) return;
    praticasRenderizadas.p4 = true;
    renderResistoresUI(4, "p4_", "p4_resistores");
    
    document.getElementById("p4_resistores").innerHTML += criarCaixaChaveGroq() + criarComponenteFoto("p4_resistores", "Foto: Resistores Individuais");

    document.getElementById("p4_fontes").innerHTML = 
        UI_Row('p4_e1', 'Tensão Fonte E1 (Medida)') + UI_Row('p4_e2', 'Tensão Fonte E2 (Medida)') + criarComponenteFoto("p4_fontes", "Foto: Fontes de Tensão");

    document.getElementById("p4_nos").innerHTML = 
        UI_Row_OnlyNominal('p4_no_va', 'Tensão Nó A (Va)') + UI_Row_OnlyNominal('p4_no_vb', 'Tensão Nó B (Vb)') + criarComponenteFoto("p4_nos", "Foto: Tensões Nodais (Supernó)");

    document.getElementById("p4_vr").innerHTML = 
        UI_Row('p4_vr_1', 'Tensão VR1') + UI_Row('p4_vr_2', 'Tensão VR2') + UI_Row('p4_vr_3', 'Tensão VR3') + UI_Row('p4_vr_4', 'Tensão VR4') + criarComponenteFoto("p4_vr", "Foto: Tensões nos Resistores");

    document.getElementById("p4_i").innerHTML = 
        UI_Row('p4_i_1', 'Corrente I1 (em R1 e E1) (mA)') + 
        UI_Row('p4_i_2', 'Corrente I2 (em R2) (mA)') + 
        UI_Row('p4_i_3', 'Corrente I3 (ramo E2, do - pro +) (mA)') + 
        UI_Row('p4_i_4', 'Corrente I4 (ramo E2, do + pro -) (mA)') + 
        UI_Row('p4_i_5', 'Corrente I5 (em R3 pro terra) (mA)') + 
        UI_Row('p4_i_6', 'Corrente I6 (em R4 pro terra) (mA)') + criarComponenteFoto("p4_i", "Foto: Correntes");
}

window.enviarPratica4 = function() {
    let infoA = document.getElementById("infoP4").value.trim(); if (!infoA) return alert("Preencha a identificação.");
    let sub = { grupo: grupoAtual, tipo: 'Prática 4', infoAtividade: infoA, divulgado: false, timestamp: firebase.database.ServerValue.TIMESTAMP, resistores: [], fontes: {}, nos: {}, v_res: {}, i_res: {}, fotos: {}, feedbacks: {} };
    let R = [];

    for(let i=1; i<=4; i++) {
        let t = getStr(`p4_r${i}_tipo`), c1 = getStr(`p4_r${i}_c1`), c2 = getStr(`p4_r${i}_c2`), c3 = getStr(`p4_r${i}_c3`), mul = getStr(`p4_r${i}_mul`), tol = getStr(`p4_r${i}_tol`);
        let gabNom = (t === "5") ? (digitos[c1]*100 + digitos[c2]*10 + digitos[c3]) * mults[mul] : (digitos[c1]*10 + digitos[c2]) * mults[mul]; R.push(gabNom);
        let medA = getVal(`p4_r${i}_med`);
        sub.resistores.push({ id: i, t:t, c1:c1, c2:c2, c3:c3, mul:mul, tol:tol, gabNom: gabNom, nomA: getVal(`p4_r${i}_nom`), medA: medA, tolA: getStr(`p4_r${i}_tol_aluno`), deltaA: getVal(`p4_r${i}_delta`), escala: getStr(`p4_r${i}_escala`), gabDelta: calcDeltaInterno(gabNom, medA) });
    }

    let r1 = R[0], r2 = R[1], r3 = R[2], r4 = R[3];
    let getO = (prefix, id, gNom) => { let m = getVal(prefix+id+'_med'); return { nomA: getVal(prefix+id+'_nom'), medA: m, deltaA: getVal(prefix+id+'_delta'), escala: getStr(prefix+id+'_escala'), gabNom: gNom, gabDelta: calcDeltaInterno(gNom, m) }; };
    let getNominalOnly = (prefix, id, gNom) => { return { nomA: getVal(prefix+id+'_nom'), gabNom: gNom }; };

    sub.fontes = { e1: getO('p4_e', '1', 5), e2: getO('p4_e', '2', 12) };

    let invSum = (1/r1) + (1/r2) + (1/r3) + (1/r4);
    let Va = (5/r1 - 12/r3 - 12/r4) / invSum;
    let Vb = Va + 12;

    sub.nos = { va: getNominalOnly('p4_no_', 'va', Va), vb: getNominalOnly('p4_no_', 'vb', Vb) };

    let vr1 = Va - 5; let vr2 = Va; let vr3 = Vb; let vr4 = Vb; 
    sub.v_res = { vr1: getO('p4_vr_', '1', vr1), vr2: getO('p4_vr_', '2', vr2), vr3: getO('p4_vr_', '3', vr3), vr4: getO('p4_vr_', '4', vr4) };

    let i1 = (vr1/r1)*1000;
    let i2 = (vr2/r2)*1000;
    let i3 = -(i1 + i2); 
    
    let i5 = (vr3/r3)*1000;
    let i6 = (vr4/r4)*1000;
    let i4 = -(i5 + i6);
    
    sub.i_res = { 
        i1: getO('p4_i_', '1', i1), 
        i2: getO('p4_i_', '2', i2), 
        i3: getO('p4_i_', '3', i3), 
        i4: getO('p4_i_', '4', i4), 
        i5: getO('p4_i_', '5', i5),
        i6: getO('p4_i_', '6', i6)
    };

    // Adicionar fotos e feedbacks
    sub.fotos = window.fotosPratica || {};
    sub.feedbacks = window.feedbacksPratica || {};

    let btnEl = document.getElementById("btnPratica4");
    if(btnEl) { btnEl.innerText = "Salvando..."; btnEl.disabled = true; }
    db.ref('registrosLabIF').push(sub).then(() => { alert("Enviado com sucesso!"); window.location.href = 'escolha-pratica.html'; }).catch(err=>alert(err)).finally(() => { if(btnEl) { btnEl.innerText = "Submeter à Nuvem"; btnEl.disabled = false;} });
}

window.mostrarRegistros = function(tipo) {
    sessionStorage.setItem('tipoPratica', tipo);
    window.location.href = 'lista-professor.html';
}

window.divulgarNota = function(id, tipo) { db.ref('registrosLabIF/' + id).update({ divulgado: true }).then(() => mostrarRegistros(tipo)); };
window.apagarRegistro = function(id, tipo) { if (confirm("Confirma exclusão?")) { db.ref('registrosLabIF/' + id).remove().then(() => mostrarRegistros(tipo)); } };

window.mostrarResultadosGrupo = function() {
    let lista = document.getElementById("listaGrupo"); lista.innerHTML = "<p>Buscando...</p>"; mostrarTela("resultadoGrupo");
    db.ref('registrosLabIF').once('value').then(snap => {
        let regs = []; snap.forEach(c => { let d = c.val(); d.id = c.key; regs.push(d); }); window.dadosProfessor = regs; 
        lista.innerHTML = ""; let achou = false;
        regs.forEach(r => {
            if (r.grupo === grupoAtual && r.divulgado) {
                achou = true;
                lista.innerHTML += `<div class="registro"><strong>Prática:</strong> ${r.tipo}<br><strong>ID:</strong> ${r.infoAtividade}<br><br><button onclick="gerarPDFCorrecao('${r.id}')" class="btn-secundario">📄 Baixar Correção (PDF)</button></div>`;
            }
        });
        if (!achou) lista.innerHTML = "<p>Não há avaliações liberadas.</p>";
    });
}

// Funções auxiliares para geração de PDF
function checkAcerto(nomA, gabNom, deltaA, gabDelta) {
    let diffNom = Math.abs(Math.abs(nomA||0) - Math.abs(gabNom||0));
    let limitCorretoNom = Math.abs(gabNom||0) * 0.002 + 0.05; 
    let limitParcialNom = Math.abs(gabNom||0) * 0.05 + 0.1;   
    
    let diffDelta = Math.abs(Math.abs(deltaA||0) - Math.abs(gabDelta||0));
    let limitCorretoDelta = 0.5; 
    let limitParcialDelta = 1.5; 

    let isCorretoNom = diffNom <= limitCorretoNom;
    let isParcialNom = diffNom <= limitParcialNom;
    let isCorretoDelta = diffDelta <= limitCorretoDelta;
    let isParcialDelta = diffDelta <= limitParcialDelta;

    if (isCorretoNom && isCorretoDelta) return '<span style="color:#059669; font-weight:bold;">✓ Correto</span>';
    else if (isParcialNom && isParcialDelta) return '<span style="color:#ca8a04; font-weight:bold;">⚠ Parcialmente Incorreta</span>';
    else return '<span style="color:#ef4444; font-weight:bold;">✗ Incorreto</span>';
}

function rowHtml(label, obj, unit) {
    if(!obj) return '';
    const stlGabarito = "background-color: #dcfce7; color: #065f46; font-weight: bold; border: 2px solid #10b981;";
    let status = checkAcerto(obj.nomA, obj.gabNom, obj.deltaA, obj.gabDelta);
    return `<tr>
        <td><strong>${label}</strong></td>
        <td style="${stlGabarito}">${formatEng(obj.gabNom, unit)}</td>
        <td>${formatEng(obj.nomA, unit)}</td>
        <td>${formatEng(obj.medA, unit)}<br><small>Escala: ${obj.escala||'-'}</small></td>
        <td style="${stlGabarito}">${(obj.gabDelta||0).toFixed(2)}%</td>
        <td>${(obj.deltaA||0)}%</td>
        <td>${status}</td>
    </tr>`;
}

function rowHtmlNominalOnly(label, obj, unit) {
    if(!obj) return '';
    const stlGabarito = "background-color: #dcfce7; color: #065f46; font-weight: bold; border: 2px solid #10b981;";
    let diffNom = Math.abs(Math.abs(obj.nomA||0) - Math.abs(obj.gabNom||0));
    let limitCorretoNom = Math.abs(obj.gabNom||0) * 0.002 + 0.05;
    let limitParcialNom = Math.abs(obj.gabNom||0) * 0.05 + 0.1;
    let status;

    if (diffNom <= limitCorretoNom) status = '<span style="color:#059669; font-weight:bold;">✓ Correto</span>';
    else if (diffNom <= limitParcialNom) status = '<span style="color:#ca8a04; font-weight:bold;">⚠ Parcialmente Incorreta</span>';
    else status = '<span style="color:#ef4444; font-weight:bold;">✗ Incorreto</span>';

    return `<tr>
        <td><strong>${label}</strong></td>
        <td style="${stlGabarito}">${formatEng(obj.gabNom, unit)}</td>
        <td colspan="4">${formatEng(obj.nomA, unit)}</td>
        <td>${status}</td>
    </tr>`;
}

window.gerarPDFCorrecao = function(idRegistro) {
    let r = window.dadosProfessor.find(x => x.id === idRegistro);
    if(!r) return alert("Erro ao carregar dados.");

    const stlGabarito = "background-color: #dcfce7; color: #065f46; font-weight: bold; border: 2px solid #10b981;";
    
    let htmlStr = `
    <style>
        tr { page-break-inside: avoid !important; }
        h3 { page-break-after: avoid !important; margin-top: 30px; }
        table { page-break-inside: auto; }
    </style>
    <div style="width: 1050px; box-sizing: border-box; padding: 20px; font-family: Arial, sans-serif; color: #333; background: #fff;">
        <div style="text-align:center; margin-bottom: 20px;">
            <h1 style="color:#10b981; font-size:24px; margin-bottom: 5px;">Relatório de Correção - ${r.tipo}</h1>
            <p style="margin:0; font-size:14px; color:#555;">Grupo: <strong>${r.grupo}</strong> | ID: <strong>${r.infoAtividade}</strong></p>
        </div>`;

    let tbHead = (titulo) => `<h3>${titulo}</h3>
        <table border="1" width="100%" cellspacing="0" cellpadding="6" style="border-collapse:collapse; text-align:center; font-size:12px; margin-bottom: 20px;">
            <tr style="background:#f0fdf4; color:#065f46;">
                <th>Variável</th><th style="${stlGabarito}">Gabarito (Nominal)</th><th>Aluno (Nominal)</th><th>Medição (Aluno)</th><th style="${stlGabarito}">Gabarito (ΔR %)</th><th>ΔR % (Aluno)</th><th>Status</th>
            </tr>`;

    htmlStr += tbHead("1. Resistores Individuais");
    if(r.resistores) {
        r.resistores.forEach(x => {
            let status = checkAcerto(x.nomA, x.gabNom, x.deltaA, x.gabDelta);
            let cores = x.t === "5" ? `${x.c1},${x.c2},${x.c3}, Mult:${x.mul}, Tol:${x.tol}` : `${x.c1},${x.c2}, Mult:${x.mul}, Tol:${x.tol}`;
            htmlStr += `<tr>
                <td><strong>R${x.id}</strong><br><span style="font-size:9px">${cores}</span></td>
                <td style="${stlGabarito}">${formatEng(x.gabNom, 'Ω')}</td><td>${formatEng(x.nomA, 'Ω')}</td><td>${formatEng(x.medA, 'Ω')}<br><small>Escala: ${x.escala||'-'}</small></td>
                <td style="${stlGabarito}">${(x.gabDelta||0).toFixed(2)}%</td><td>${(x.deltaA||0)}%</td><td>${status}</td>
            </tr>`;
        });
    }
    htmlStr += `</table>`;
    
    const idsFoto = new Set([
        ...Object.keys(r.fotos || {}),
        ...Object.keys(r.feedbacks || {})
    ]);
    let blocoIa = "";
    if (idsFoto.size > 0) {
        blocoIa += `<h3 style="margin-top: 30px;">Analise da IA - Calculos no papel</h3>`;
        idsFoto.forEach(questaoId => {
            const foto = r.fotos && r.fotos[questaoId] ? r.fotos[questaoId] : "";
            const feedbackBruto = r.feedbacks && r.feedbacks[questaoId] ? r.feedbacks[questaoId] : "Nao analisado";
            const feedback = String(feedbackBruto)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            const titulo = (typeof FOTO_TITULOS !== "undefined" && FOTO_TITULOS[questaoId]) ? FOTO_TITULOS[questaoId] : questaoId;
            const imgHtml = foto
                ? `<img src="${foto}" style="max-width: 360px; max-height: 240px; border: 2px solid #10b981; border-radius: 4px; margin: 10px 0;">`
                : "";
            blocoIa += `
            <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; page-break-inside: avoid;">
                <h4 style="margin: 0 0 10px 0; color: #10b981;">${titulo}</h4>
                ${imgHtml}
                <div style="background: #dcfce7; padding: 10px; border-radius: 4px; border-left: 4px solid #10b981; white-space: pre-wrap; text-align: left;">
                    <strong>Feedback da IA:</strong><br>${feedback}
                </div>
            </div>`;
        });
    }

    if (r.tipo === 'Prática 1') {
        htmlStr += tbHead("2. Associação em Série"); if (r.serie) r.serie.forEach(x => htmlStr += rowHtml(`R1 a R${x.qtd}`, x, 'Ω')); htmlStr += `</table>`;
        htmlStr += tbHead("3. Associação em Paralelo"); if (r.paralelo) r.paralelo.forEach(x => htmlStr += rowHtml(`R1 a R${x.qtd}`, x, 'Ω')); htmlStr += `</table>`;
        if(r.mista) { htmlStr += tbHead("4. Associação Mista"); htmlStr += rowHtml('R1 // (R2+R3) // (R4+R5)', r.mista, 'Ω'); htmlStr += `</table>`; }
    } 
    else if (r.tipo === 'Prática 2') {
        if(r.serie) {
            htmlStr += tbHead("2. Circuito Série");
            htmlStr += rowHtml('Req', r.serie.req, 'Ω') + rowHtml('I Total', r.serie.itotal, 'mA') + rowHtml('V Total', r.serie.vtotal, 'V') + rowHtml('V1', r.serie.v1, 'V') + rowHtml('V2', r.serie.v2, 'V') + rowHtml('V3', r.serie.v3, 'V');
            htmlStr += `</table>`;
        }
        if(r.paralelo) {
            htmlStr += tbHead("3. Circuito Paralelo");
            htmlStr += rowHtml('Req', r.paralelo.req, 'Ω') + rowHtml('I Total (1)', r.paralelo.itotal, 'mA') + rowHtml('V Total', r.paralelo.vtotal, 'V') + rowHtml('V1', r.paralelo.v1, 'V') + rowHtml('V2', r.paralelo.v2, 'V') + rowHtml('V3', r.paralelo.v3, 'V') + rowHtml('I Total (2)', r.paralelo.itotal2, 'mA') + rowHtml('I1', r.paralelo.i1, 'mA') + rowHtml('I2', r.paralelo.i2, 'mA') + rowHtml('I23', r.paralelo.i23, 'mA') + rowHtml('I3', r.paralelo.i3, 'mA');
            htmlStr += `</table>`;
        }
        if(r.misto) {
            htmlStr += tbHead("4. Circuito Misto");
            htmlStr += rowHtml('Req', r.misto.req, 'Ω') + rowHtml('I Total (1)', r.misto.itotal, 'mA') + rowHtml('V Total', r.misto.vtotal, 'V') + rowHtml('V1', r.misto.v1, 'V') + rowHtml('V2', r.misto.v2, 'V') + rowHtml('V3', r.misto.v3, 'V') + rowHtml('I Total (2)', r.misto.itotal2, 'mA') + rowHtml('I1', r.misto.i1, 'mA') + rowHtml('I2', r.misto.i2, 'mA') + rowHtml('I3', r.misto.i3, 'mA');
            htmlStr += `</table>`;
        }
    }
    else if (r.tipo === 'Prática 3') {
        if(r.serie) {
            htmlStr += tbHead("2. Divisor de Tensão (Série)");
            htmlStr += rowHtml('Tensão Total', r.serie.vtotal, 'V') + rowHtml('V1', r.serie.v1, 'V') + rowHtml('V2', r.serie.v2, 'V') + rowHtml('V3', r.serie.v3, 'V');
            htmlStr += `</table>`;
        }
        if(r.paralelo) {
            htmlStr += tbHead("3. Divisor de Corrente (Paralelo)");
            htmlStr += rowHtml('I Total', r.paralelo.itotal, 'mA') + rowHtml('I1', r.paralelo.i1, 'mA') + rowHtml('I2', r.paralelo.i2, 'mA') + rowHtml('I3', r.paralelo.i3, 'mA');
            htmlStr += `</table>`;
        }
    }
    else if (r.tipo === 'Prática 4') {
        if(r.fontes) {
            htmlStr += tbHead("2. Fontes de Tensão");
            htmlStr += rowHtml('E1', r.fontes.e1, 'V') + rowHtml('E2', r.fontes.e2, 'V');
            htmlStr += `</table>`;
        }
        if(r.nos) {
            htmlStr += `<h3>3. Tensões Nodais (Supernó)</h3>
            <table border="1" width="100%" cellspacing="0" cellpadding="6" style="border-collapse:collapse; text-align:center; font-size:12px; margin-bottom: 20px;">
                <tr style="background:#f0fdf4; color:#065f46;">
                    <th>Variável</th><th style="${stlGabarito}">Gabarito (Nominal)</th><th colspan="4">Aluno (Nominal)</th><th>Status</th>
                </tr>`;
            htmlStr += rowHtmlNominalOnly('Va', r.nos.va, 'V') + rowHtmlNominalOnly('Vb', r.nos.vb, 'V');
            htmlStr += `</table>`;
        }
        if(r.v_res) {
            htmlStr += tbHead("4. Tensões nos Resistores");
            htmlStr += rowHtml('VR1', r.v_res.vr1, 'V') + rowHtml('VR2', r.v_res.vr2, 'V') + rowHtml('VR3', r.v_res.vr3, 'V') + rowHtml('VR4', r.v_res.vr4, 'V');
            htmlStr += `</table>`;
        }
        if(r.i_res) {
            htmlStr += tbHead("5. Correntes");
            if (r.i_res.i1) htmlStr += rowHtml('I1 (R1 e E1)', r.i_res.i1, 'mA');
            if (r.i_res.i2) htmlStr += rowHtml('I2 (R2)', r.i_res.i2, 'mA');
            if (r.i_res.i3) htmlStr += rowHtml('I3 (Ramo E2: do - pro +)', r.i_res.i3, 'mA');
            if (r.i_res.i4) htmlStr += rowHtml('I4 (Ramo E2: do + pro -)', r.i_res.i4, 'mA');
            if (r.i_res.i5) htmlStr += rowHtml('I5 (R3)', r.i_res.i5, 'mA');
            if (r.i_res.i6) htmlStr += rowHtml('I6 (R4)', r.i_res.i6, 'mA');
            htmlStr += `</table>`;
        }
    }

    htmlStr += blocoIa;
    htmlStr += `</div>`;
    let nomeArquivo = `Correcao_${r.tipo.replace(/\s/g, '')}_${r.grupo}.pdf`;
    
    html2pdf().set({
        margin: [10, 10, 10, 10], 
        filename: nomeArquivo, 
        pagebreak: { mode: ['css', 'legacy'], avoid: 'tr' }, 
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    }).from(htmlStr).save().then(() => console.log("PDF Gerado com sucesso")).catch(e => alert("Erro PDF"));
}

// Função de teste para verificar se html2pdf está funcionando
window.testarPDF = function() {
    console.log("Testando html2pdf...");
    console.log("html2pdf disponível:", typeof html2pdf);
    
    if (typeof html2pdf === 'undefined') {
        alert("ERRO: html2pdf não está carregado!");
        return;
    }
    
    let htmlTeste = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1>Teste de PDF</h1>
        <p>Se você está lendo isso, o html2pdf está funcionando!</p>
        <p>Data: ${new Date().toLocaleString()}</p>
    </div>`;
    
    html2pdf().set({
        margin: [10, 10, 10, 10], 
        filename: 'teste.pdf', 
        pagebreak: { mode: ['css', 'legacy'], avoid: 'tr' }, 
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(htmlTeste).save().then(() => {
        console.log("PDF de teste gerado com sucesso");
        alert("PDF de teste gerado com sucesso!");
    }).catch(e => {
        console.error("Erro ao gerar PDF de teste:", e);
        alert("Erro ao gerar PDF de teste: " + e.message);
    });
}

window.mostrarRegistrosScreen = function() {
    const tipoPratica = sessionStorage.getItem('tipoPratica') || 'Prática 1';
    const lista = document.getElementById("listaRegistros");
    lista.innerHTML = "<p>Buscando...</p>";

    db.ref('registrosLabIF').once('value').then(snap => {
        let regs = [];
        snap.forEach(c => { 
            let d = c.val(); 
            d.id = c.key; 
            regs.push(d); 
        });
        window.dadosProfessor = regs;
        
        let filts = regs.filter(r => r.tipo === tipoPratica);
        if (filts.length === 0) {
            return lista.innerHTML = "<p>Nenhum registro encontrado.</p>";
        }
        
        let gruposMap = {};
        filts.forEach(r => { 
            if(!gruposMap[r.grupo]) gruposMap[r.grupo] = []; 
            gruposMap[r.grupo].push(r); 
        });
        
        let h = "";
        Object.keys(gruposMap).sort().forEach(g => {
            h += `<div class="grupo-card">
                    <h2>Grupo: ${g}</h2>
                    <div>`;
            gruposMap[g].forEach(r => {
                h += `<div class="registro">
                        <strong>ID:</strong> ${r.infoAtividade}<br><br>
                        <button onclick="gerarPDFCorrecao('${r.id}')" class="btn-secundario">📄 Ver Correção (PDF)</button><br>
                        ${!r.divulgado ? 
                            `<button onclick="divulgarNota('${r.id}', '${tipoPratica}')" class="btn-secundario" style="margin-top:10px;">Liberar ao Aluno</button>` : 
                            `<span class="status-ok" style="margin-top:10px; display:inline-block">Avaliação Liberada ✔</span>`
                        }
                        <button onclick="apagarRegistro('${r.id}', '${tipoPratica}')" class="btn-perigo" style="margin-top:10px; float:right;">Excluir</button>
                        <div style="clear:both"></div>
                    </div>`;
            });
            h += `</div></div>`;
        });
        lista.innerHTML = h;
    });
}

// ==========================================
// FUNÇÃO QUE ATUALIZA O PAINEL DO PROFESSOR
// ==========================================

// Constante para controle de localStorage
const STORAGE_KEY = 'gruposDescartadosStatus';

// Função auxiliar: Obter grupos descartados do localStorage
window.getGruposDescartados = function() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error('Erro ao ler localStorage:', e);
        return {};
    }
};

// Função auxiliar: Salvar grupos descartados no localStorage
function salvarGrupoDescartado(nomeGrupo) {
    try {
        const descartados = getGruposDescartados();
        descartados[nomeGrupo] = Date.now(); // Timestamp exato da remoção
        localStorage.setItem(STORAGE_KEY, JSON.stringify(descartados));
    } catch (e) {
        console.error('Erro ao salvar no localStorage:', e);
    }
}

// Função auxiliar: Remover grupo do localStorage (quando reconectar)
function removerGrupoDescartado(nomeGrupo) {
    try {
        const descartados = getGruposDescartados();
        delete descartados[nomeGrupo];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(descartados));
    } catch (e) {
        console.error('Erro ao remover do localStorage:', e);
    }
}

// Função principal: Remover grupo da visualização (botão X)
function removerStatusVisual(nomeGrupo) {
    // Salva no localStorage com timestamp
    salvarGrupoDescartado(nomeGrupo);
    
    // Remove imediatamente da DOM
    const container = document.getElementById('listaStatusGrupos');
    if(container) {
        const elementos = container.querySelectorAll('[data-grupo]');
        elementos.forEach(el => {
            if(el.getAttribute('data-grupo') === nomeGrupo) {
                el.remove();
            }
        });
        
        // Verifica se ficou vazio
        if(container.children.length === 0 || container.innerText.trim() === '') {
            container.innerHTML = '<div class="desc">Nenhuma bancada conectada ainda.</div>';
        }
    }
}

// Função principal: Monitorar status em tempo real com lógica de descarte
function monitorarStatusEmTempoReal() {
    db.ref('statusTurmaIF').on('value', snap => {
        let container = document.getElementById('listaStatusGrupos');
        if(!container) return;
        let dados = snap.val();
        let html = '';
        let gruposDescartados = getGruposDescartados();
        
        if(dados) {
            let gruposVisiveis = 0;
            
            for(let nomeGrupo in dados) {
                let s = dados[nomeGrupo];
                let timestampGrupo = s.timestamp || 0;
                let descartadoEm = gruposDescartados[nomeGrupo] || 0;
                
                // Lógica de reconexão: Se o grupo está online ou teve atividade recente após o descarte
                let isOnline = s.status === 'Online';
                let isAusente = s.status.includes('Ausente');
                let isOffline = s.status === 'Offline';
                
                // Verifica se reconectou baseado em timestamp (atividade recente)
                let reconectou = timestampGrupo > descartadoEm;
                
                // Se reconectou (ou está online), remove do localStorage
                if((isOnline || reconectou) && descartadoEm > 0) {
                    removerGrupoDescartado(nomeGrupo);
                    descartadoEm = 0; // Atualiza variável local
                }
                
                // Renderiza apenas se:
                // 1. O grupo está online, OU
                // 2. O grupo está ausente (saiu da aba/app), OU
                // 3. O grupo está offline mas não foi descartado, OU
                // 4. O grupo reconectou após ser descartado
                if(isOnline || isAusente || descartadoEm === 0 || reconectou) {
                    let cor = s.status === 'Online' ? '#10b981' : (s.status.includes('Ausente') ? '#ef4444' : '#6b7280');
                    let estilo = s.status.includes('Ausente') ? 'animation: piscarAlerta 1.5s infinite;' : '';
                    
                    // Botão X visível apenas quando realmente offline (não ausente)
                    let botaoRemover = (isOffline && !isAusente) ? 
                        `<button onclick="removerStatusVisual('${nomeGrupo}')" 
                                class="btn-remover-status"
                                title="Remover da lista">✕</button>` : '';
                    
                    html += `<div data-grupo="${nomeGrupo}" 
                                style="display: flex; justify-content: space-between; 
                                       padding: 10px 0; border-bottom: 1px solid #e5e7eb; 
                                       align-items: center;">
                                <strong>${nomeGrupo}</strong> 
                                <div style="display: flex; align-items: center;">
                                    <span style="color: ${cor}; font-weight: 600; 
                                                  background: ${cor}15; padding: 4px 10px; 
                                                  border-radius: 6px; ${estilo}">${s.status}</span>
                                    ${botaoRemover}
                                </div>
                             </div>`;
                    gruposVisiveis++;
                }
            }
            
            if(gruposVisiveis === 0) {
                html = '<div class="desc">Nenhuma bancada conectada ainda.</div>';
            }
        } else {
            html = '<div class="desc">Nenhuma bancada conectada ainda.</div>';
        }
        container.innerHTML = html;
    });
}

// ==========================================
// SISTEMA UNIFICADO DE STATUS (TEMPO REAL)
// ==========================================

// 1. Monitora a conexão contínua com o Firebase (Resolve quedas de energia/internet)
db.ref('.info/connected').on('value', function(snap) {
    if (snap.val() === true) {
        let grupo = sessionStorage.getItem('grupoAtual') || grupoAtual;
        
        if (grupo) {
            let refStatus = db.ref('statusTurmaIF/' + grupo);
            
            // Define como online assim que conectar
            refStatus.update({ 
                status: 'Online', 
                timestamp: firebase.database.ServerValue.TIMESTAMP 
            });
            
            // Reconfigura onDisconnect para garantir que funciona após desconexão
            refStatus.onDisconnect().update({ 
                status: 'Offline', 
                timestamp: firebase.database.ServerValue.TIMESTAMP 
            });
        }
    }
});

// 2. Detecta se o aluno minimizou o navegador ou trocou de aba (Mobile/Desktop)
document.addEventListener("visibilitychange", function() {
    let grupo = sessionStorage.getItem('grupoAtual') || grupoAtual;
    
    if (grupo) {
        let refStatus = db.ref('statusTurmaIF/' + grupo);
        
        if (document.hidden) {
            // Aluno mudou de aba, minimizou ou saiu do app
            refStatus.update({ 
                status: '⚠️ Ausente (Saiu da Aba)', 
                timestamp: firebase.database.ServerValue.TIMESTAMP 
            });
        } else {
            // Aluno voltou para a tela
            refStatus.update({ 
                status: 'Online', 
                timestamp: firebase.database.ServerValue.TIMESTAMP 
            });
            
            // Exibe o alerta apenas quando ele VOLTA para a tela
            setTimeout(() => {
                alert("Atenção! O sistema detectou que você saiu da aba durante a aula. Mantenha o foco na atividade!");
            }, 500);
        }
    }
});

// 3. Evento específico para PWAs - quando o app é fechado/minimizado no mobile
window.addEventListener('pagehide', function(event) {
    let grupo = sessionStorage.getItem('grupoAtual') || grupoAtual;
    
    if (grupo) {
        // Usa navigator.sendBeacon para garantir que a requisição seja enviada
        // mesmo quando a página está sendo fechada
        const data = JSON.stringify({
            status: 'Offline',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Tenta enviar via Firebase diretamente
        try {
            db.ref('statusTurmaIF/' + grupo).update({ 
                status: 'Offline', 
                timestamp: firebase.database.ServerValue.TIMESTAMP 
            });
        } catch(e) {
            console.error('Erro ao marcar offline no pagehide:', e);
        }
    }
});

// 4. Evento quando o app é congelado pelo sistema (mobile)
document.addEventListener('freeze', function() {
    let grupo = sessionStorage.getItem('grupoAtual') || grupoAtual;
    
    if (grupo) {
        try {
            db.ref('statusTurmaIF/' + grupo).update({ 
                status: 'Offline', 
                timestamp: firebase.database.ServerValue.TIMESTAMP 
            });
        } catch(e) {
            console.error('Erro ao marcar offline no freeze:', e);
        }
    }
});

// 5. Evento quando o app é resumido (retorna do congelamento)
document.addEventListener('resume', function() {
    let grupo = sessionStorage.getItem('grupoAtual') || grupoAtual;
    
    if (grupo) {
        try {
            db.ref('statusTurmaIF/' + grupo).update({ 
                status: 'Online', 
                timestamp: firebase.database.ServerValue.TIMESTAMP 
            });
        } catch(e) {
            console.error('Erro ao marcar online no resume:', e);
        }
    }
});

// 6. Fallback para beforeunload (desktop principalmente)
window.addEventListener("beforeunload", function (e) {
    let grupo = sessionStorage.getItem("grupoAtual") || grupoAtual; 
    
    if (grupo) {
        db.ref('statusTurmaIF/' + grupo).update({ 
            status: 'Offline', 
            timestamp: firebase.database.ServerValue.TIMESTAMP 
        });
    }
});
