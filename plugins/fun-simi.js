import fs from 'fs'

let handler = async (m, { conn, args, usedPrefix, command, isOwner, isROwner, isAdmin }) => {
  // Permisos: solo admins de grupo o el owner pueden cambiar el estado
  if (!m.isGroup && !isOwner && !isROwner) return m.reply('Este comando solo puede usarse en grupos o por el dueño del bot.')
  const chat = global.db.data.chats[m.chat]
  if (!chat) return m.reply('Base de datos del chat no inicializada.')

  const sub = (args[0] || '').toLowerCase()
  if (!sub || !/^(on|off|encender|apagar|enable|disable)$/i.test(sub)) {
    return m.reply(
`Uso: ${usedPrefix + command} on | off

• Activa o desactiva Simi (respuestas a malas palabras)
• Estado actual: ${chat.simi ? 'Activado ✅' : 'Desactivado ❌'}`.trim()
    )
  }

  const turnOn = /^(on|encender|enable)$/i.test(sub)
  chat.simi = !!turnOn

  try { await global.db.write?.() } catch {}

  return m.reply(`Simi ha sido ${turnOn ? 'activado ✅' : 'desactivado ❌'} en este chat.`)
}

handler.help = ['simi <on|off>']
handler.tags = ['fun']
handler.command = ['simi']

// Requisitos para cambiar estado (similar a antilink): admin u owner
handler.group = true
handler.admin = true

export default handler
