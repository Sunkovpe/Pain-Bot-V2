import fs from 'fs'
import path from 'path'

// Carga y cacheo de palabras y respuestas
let PALABRAS = []
let FRASES = []
let RESPUESTAS = []

const palabrasPath = path.join(path.dirname(new URL(import.meta.url).pathname), '../lib/palabras.json')
try {
  const raw = fs.readFileSync(palabrasPath, 'utf-8')
  const json = JSON.parse(raw)
  PALABRAS = Array.isArray(json.palabras) ? json.palabras : []
  FRASES = Array.isArray(json.frases) ? json.frases : []
  RESPUESTAS = Array.isArray(json.respuestas) ? json.respuestas : []
} catch (e) {
  console.error('[Simi] No se pudo leer lib/palabras.json:', e?.message)
  PALABRAS = ['basura', 'idiota', 'estupido', 'imbecil', 'mierda']
  FRASES = ['que asco', 'nadie te quiere']
  RESPUESTAS = ['Serás tú.', '¿Todo bien en casa?', 'Con respeto se habla mejor.']
}

function pickRandom(list) { return list[Math.floor(Math.random() * list.length)] }

// Normaliza texto para coincidencias simples (opcional)
function norm(str = '') {
  return (str || '')
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

// Construye expresiones de búsqueda simples
const PALABRAS_N = PALABRAS.map(norm)
const FRASES_N = FRASES.map(norm)

var handler = m => m
handler.before = async function (m, { conn, isOwner, isAdmin, isBotAdmin, groupMetadata, chat }) {
  try {
    // Ignorar si no hay texto
    if (!m || typeof m.text !== 'string' || !m.text.trim()) return
    // Ignorar mensajes del propio bot
    if (m.sender === (conn?.user?.jid || this.user.jid)) return

    const c = global.db?.data?.chats?.[m.chat]
    if (!c) return

    // Si el bot está baneado en el chat, no responder (respeta banchat)
    if (c.isBanned) return

    // Simi debe estar activado en este chat
    if (!c.simi) return

    // No responder a comandos (para no interferir) ni a mensajes con prefijo
    const prefix = global.prefix
    if (prefix instanceof RegExp ? prefix.test(m.text) : (typeof prefix === 'string' && m.text.startsWith(prefix))) return

    const textN = norm(m.text)

    // Coincidencia por palabra individual o frase
    const hitPalabra = PALABRAS_N.some(w => w && textN.includes(w))
    const hitFrase = FRASES_N.some(f => f && textN.includes(f))
    if (!hitPalabra && !hitFrase) return

    // Elegir una respuesta aleatoria
    const reply = pickRandom(RESPUESTAS)
    if (!reply) return

    // Responder citando el mensaje
    await conn.reply(m.chat, reply, m)
  } catch (e) {
    console.error('[Simi Listener] Error:', e)
  }
}

handler.tags = ['fun']
handler.help = []
handler.command = /^$/ // no es comando, es listener

export default handler
