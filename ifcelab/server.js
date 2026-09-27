import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const GROQ_MODEL = 'qwen/qwen3.8-27b';

app.use(cors());
app.use(express.json({ limit: '15mb' }));

const PROMPT_ANALISE = [
  'Voce e um professor de eletronica do IFCE.',
  'Analise a foto de um papel ou caderno com calculos (resistores, circuitos, Kirchhoff, divisores, analise nodal).',
  'Responda SOMENTE em portugues, de forma objetiva e direta.',
  'Comece com: CORRETO. ou INCORRETO.',
  'Se estiver correto, confirme o resultado em 1 ou 2 frases.',
  'Se houver erro, aponte o erro e informe o calculo/resultado correto.',
  'Nao use introducao, nao use markdown e nao invente dados que nao aparecem na imagem.',
  'Se a imagem estiver ilegivel, diga isso objetivamente.'
].join(' ');

function mimeDaImagem(imagemBase64, mimeInformado) {
  if (mimeInformado && /^image\/(jpeg|jpg|png|webp|gif)$/i.test(mimeInformado)) {
    return mimeInformado.toLowerCase() === 'image/jpg' ? 'image/jpeg' : mimeInformado.toLowerCase();
  }
  if (imagemBase64.startsWith('/9j/')) return 'image/jpeg';
  if (imagemBase64.startsWith('iVBOR')) return 'image/png';
  if (imagemBase64.startsWith('UklGR')) return 'image/webp';
  if (imagemBase64.startsWith('R0lGOD')) return 'image/gif';
  return 'image/jpeg';
}

function limparBase64(valor) {
  if (!valor || typeof valor !== 'string') return '';
  return valor.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '').replace(/\s/g, '');
}

function sanitizarChaveGroq(chave) {
  if (!chave || typeof chave !== 'string') return '';
  let limpa = chave
    .replace(/^\uFEFF/, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/^Bearer\s+/i, '')
    .replace(/["'`]/g, '')
    .replace(/\s+/g, '')
    .trim();
  const match = limpa.match(/gsk_[A-Za-z0-9+/=_-]{10,}/i);
  return match ? match[0] : '';
}

function erroGroqAmigavel(mensagem, status) {
  const texto = String(mensagem || '').toLowerCase();
  if (status === 401 || texto.includes('invalid api key') || texto.includes('unauthorized')) {
    return 'A Groq recusou esta chave. Crie uma nova em https://console.groq.com/keys e cole no login do grupo.';
  }
  if (status === 429 || texto.includes('rate limit')) {
    return 'Limite da Groq atingido. Aguarde um pouco ou use outra chave.';
  }
  if (texto.includes('model')) {
    return 'Modelo Groq indisponivel no momento. Tente novamente.';
  }
  return mensagem || 'Falha ao chamar a Groq';
}

app.post('/api/validar-chave', async (req, res) => {
  try {
    const apiKey = sanitizarChaveGroq((req.body || {}).groqApiKey);
    if (!apiKey) {
      return res.status(400).json({ ok: false, error: 'Cole uma chave Groq valida comecando com gsk_' });
    }

    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.error) {
      const msg = (data.error && data.error.message) || `Erro Groq HTTP ${response.status}`;
      return res.status(400).json({ ok: false, error: erroGroqAmigavel(msg, response.status) });
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Nao foi possivel validar a chave: ' + error.message });
  }
});

app.post('/api/analisar', async (req, res) => {
  try {
    const { imagemBase64, mimeType, contexto, groqApiKey } = req.body || {};
    const base64 = limparBase64(imagemBase64);

    if (!base64) {
      return res.status(400).json({ error: 'Imagem nao fornecida' });
    }

    const apiKey = sanitizarChaveGroq(groqApiKey || req.headers['x-groq-api-key']);
    if (!apiKey) {
      return res.status(400).json({ error: 'Cole a chave Groq nesta pagina. Ela deve comecar com gsk_.' });
    }

    const mime = mimeDaImagem(base64, mimeType);
    const extra = contexto ? ` Contexto da questao: ${String(contexto).slice(0, 200)}.` : '';

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT_ANALISE + extra },
              {
                type: 'image_url',
                image_url: { url: `data:${mime};base64,${base64}` }
              }
            ]
          }
        ],
        temperature: 0.2,
        max_completion_tokens: 700,
        reasoning_effort: 'none',
        reasoning_format: 'hidden'
      })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      const msg = (data.error && data.error.message) || `Erro Groq HTTP ${response.status}`;
      return res.status(response.status === 200 ? 502 : response.status).json({
        error: erroGroqAmigavel(msg, response.status)
      });
    }

    const escolha = data.choices && data.choices[0] && data.choices[0].message;
    const feedback = ((escolha && escolha.content) || '').trim();

    if (!feedback) {
      return res.status(502).json({ error: 'A IA nao retornou uma resposta' });
    }

    res.json({
      feedback,
      model: GROQ_MODEL
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar imagem: ' + error.message });
  }
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log('API Key configurada:', !!process.env.GROQ_API_KEY);
  console.log(`Usando Groq AI com modelo ${GROQ_MODEL}`);
});
