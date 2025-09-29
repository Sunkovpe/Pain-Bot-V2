import { readdirSync, unlinkSync, existsSync, promises as fs } from 'fs'
import path from 'path'
import cp from 'child_process'
import { promisify } from 'util'
import moment from 'moment-timezone'
import fetch from 'node-fetch'
const exec = promisify(cp.exec).bind(cp)
const linkRegex = /https:\/\/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i

const handler = async (m, { conn, text, command, usedPrefix, args }) => {
try {
const nombre = m.pushName || 'Anónimo'
const tag = '@' + m.sender.split('@')[0]
const usertag = Array.from(new Set([...text.matchAll(/@(\d{5,})/g)]), m => `${m[1]}@s.whatsapp.net`)
const chatLabel = m.isGroup ? (await conn.getName(m.chat) || 'Grupal') : 'Privado'
const horario = `${moment.tz('America/Caracas').format('DD/MM/YYYY hh:mm:ss A')}`
switch (command) {
case 'suggest': case 'sug': {
if (!text) return conn.reply(m.chat, 'ඞ Escribe la sugerencia que quieres enviar al propietario de la Bot.', m)
if (text.length < 10) return conn.reply(m.chat, '⚠︎ La sugerencia debe tener más de 10 caracteres.', m)
await m.react('🕒')
const sug = `✔ 𝗦𝗨𝗚𝗘𝗥𝗘𝗡𝗖𝗜𝗔 𝗥𝗘𝗖𝗜𝗕𝗜𝗗𝗔\n\n𖠰 *Usuario* » ${nombre}\n✩ *Tag* » ${tag}\n✿ *Sugerencia* » ${text}\n✦ *Chat* » ${chatLabel}\n✰ *Fecha* » ${horario}\n♤ *InfoBot* » ${botname} / ${vs}`
await conn.sendMessage(`${suittag}@s.whatsapp.net`, { text: sug, mentions: [m.sender, ...usertag] }, { quoted: m })
await m.react('✔️')
m.reply('۝ La sugerencia ha sido enviada al desarrollador. Gracias por contribuir a mejorar nuestra experiencia.')
break
}
case 'report': case 'reportar': {
if (!text) return conn.reply(m.chat, 'ඞ Por favor, ingresa el error que deseas reportar.', m)
if (text.length < 10) return conn.reply(m.chat, '⚠︎ Especifique mejor el error, mínimo 10 caracteres.', m)
await m.react('🕒')
const rep = `✔ 𝗥𝗘𝗣𝗢𝗥𝗧𝗘 𝗥𝗘𝗖𝗜𝗕𝗜𝗗𝗢\n\n〄 *Usuario* » ${nombre}\n✩ *Tag* » ${tag}\n✿ *Reporte* » ${text}\n✦ *Chat* » ${chatLabel}\n✰ *Fecha* » ${horario}\n♤ *InfoBot* » ${botname} / ${vs}`
await conn.sendMessage(`${suittag}@s.whatsapp.net`, { text: rep, mentions: [m.sender, ...usertag] }, { quoted: m })
await m.react('✔️')
m.reply('ඩා El informe ha sido enviado al desarrollador. Ten en cuenta que cualquier reporte falso podría resultar en restricciones en el uso del *Bot*.')
break
}
case 'invite': {
if (!text) return m.reply(`ඞ Debes enviar un enlace para invitar el Bot a tu grupo.`)
let [_, code] = text.match(linkRegex) || []
if (!code) return m.reply('⚠︎ El enlace de invitación no es válido.')
await m.react('🕒')
const invite = `✔ 𝗜𝗡𝗩𝗜𝗧𝗔𝗖𝗜𝗢𝗡 𝗔 𝗨𝗡 𝗚𝗥𝗨𝗣𝗢\n\n〄 *Usuario* » ${nombre}\n✩ *Tag* » ${tag}\n✿ *Chat* » ${chatLabel}\n✰ *Fecha* » ${horario}\n♤ *InfoBot* » ${botname} / ${vs}\n✦ *Link* » ${text}`
const mainBotNumber = global.conn.user.jid.split('@')[0]
const senderBotNumber = conn.user.jid.split('@')[0]
if (mainBotNumber === senderBotNumber)
await conn.sendMessage(`${suittag}@s.whatsapp.net`, { text: invite, mentions: [m.sender, ...usertag] }, { quoted: m })
else
await conn.sendMessage(`${senderBotNumber}@s.whatsapp.net`, { text: invite, mentions: [m.sender, ...usertag] }, { quoted: m })
await m.react('✔️')
m.reply('ඩා El enlace fue enviado correctamente. ¡Gracias por tu invitación! ฅ^•ﻌ•^ฅ')
break
}
case 'speedtest': case 'stest': {
await m.react('🕒')
const o = await exec('python3 ./lib/ookla-speedtest.py --secure --share')
const { stdout, stderr } = o
if (stdout.trim()) {
const url = stdout.match(/http[^"]+\.png/)?.[0]
if (url) await conn.sendMessage(m.chat, { image: { url }, caption: stdout.trim() }, { quoted: m })
}
if (stderr.trim()) {
const url2 = stderr.match(/http[^"]+\.png/)?.[0]
if (url2) await conn.sendMessage(m.chat, { image: { url: url2 }, caption: stderr.trim() }, { quoted: m })
}
await m.react('✔️')
break
}
case 'fixmsg': case 'ds': {
if (global.conn.user.jid !== conn.user.jid)
return conn.reply(m.chat, 'ඞ Usa este comando en el número principal del Bot.', m)
await m.react('🕒')
const chatIdList = m.isGroup ? [m.chat, m.sender] : [m.sender]
const sessionPath = './Sessions/'
let files = await fs.readdir(sessionPath)
let count = 0
for (let file of files) {
for (let id of chatIdList) {
if (file.includes(id.split('@')[0])) {
await fs.unlink(path.join(sessionPath, file))
count++
break
}}}
await m.react(count === 0 ? '✖️' : '✔️')
conn.reply(m.chat, count === 0 ? '⚠︎ No se encontraron archivos relacionados con tu ID.' : `⚠︎ Se eliminaron ${count} archivos de sesión.`, m)
break
}

}}} catch (err) {
await m.react('✖️')
conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${err.message}`, m)
}}

handler.help = ['suggest', 'reporte', 'invite', 'speedtest', 'fixmsg', 'script']
handler.tags = ['main']
handler.command = ['suggest', 'sug', 'report', 'reportar', 'invite', 'speedtest', 'stest', 'fixmsg', 'ds']

export default handler