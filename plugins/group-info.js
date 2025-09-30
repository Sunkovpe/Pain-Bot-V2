import chalk from 'chalk'

var handler = async (m, { conn, isOwner, args }) => {
  try {
    const ahora = new Date()
    const fecha = ahora.toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })
    const getNameSafe = async (jid = '') => {
      try {
        const val = conn.getName?.(jid)
        if (val && typeof val.then === 'function') return await val
        return val || ''
      } catch { return '' }
    }


    const grupos = []
    if (isOwner) {
      for (const [jid, chat] of Object.entries(conn.chats || {})) {
        if (jid.endsWith('@g.us') && (chat?.isChats || true)) grupos.push(jid)
      }
    } else {
      if (!m.isGroup) return m.reply('Este comando solo funciona dentro de grupos.')
      grupos.push(m.chat)
    }
    if (!grupos.length) return m.reply('No hay grupos para mostrar.')

    const partes = []
    for (const gid of grupos) {
      try {
        const md = await conn.groupMetadata(gid).catch(() => null)
        if (!md) continue
        const participantes = md.participants || []
        const admins = participantes.filter(p => !!p.admin)
        const miembros = participantes.length || 0
        const botJid = conn.user?.jid || conn.user?.id
        const botIsAdmin = participantes.some(p => (p.jid || p.id) === botJid && !!p.admin)
        const adminNombres = []
        for (const p of admins) {
          const jid = p.jid || p.id
          const nA = (conn.chats?.[jid]?.vname) || (await getNameSafe(jid)) || ''
          adminNombres.push(nA || `@${(jid || '').split('@')[0]}`)
        }
        const cread = md?.creation ? new Date(md.creation * 1000) : null
        const fechaCreacion = cread ? cread.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) : 'Desconocida'
        const descripcion = (md?.desc?.toString()?.slice(0, 200) || '').trim()

       
        const miembrosListado = []
        for (let i = 0; i < participantes.length; i++) {
          const p = participantes[i]
          const jid = p.jid || p.id
          const nombre = (conn.chats?.[jid]?.vname) || (await getNameSafe(jid)) || ''
          const etiqueta = nombre || `@${(jid || '').split('@')[0]}`
          const rol = p.admin === 'superadmin' ? 'owner' : p.admin === 'admin' ? 'admin' : 'miembro'
          miembrosListado.push(`${i + 1}. ${etiqueta} ${rol !== 'miembro' ? `(${rol})` : ''}`.trim())
        }

    
        let enlace = null
        if (botIsAdmin) {
          try {
            const code = await conn.groupInviteCode(gid)
            if (code) enlace = `https://chat.whatsapp.com/${code}`
          } catch {}
        }

        partes.push([
          `• Nombre: ${md.subject || 'Sin nombre'}`,
          `• JID: ${gid}`,
          `• Miembros: ${miembros}`,
          `• Admins (${adminNombres.length}): ${adminNombres.join(', ') || 'N/A'}`,
          `• Creado: ${fechaCreacion}`,
          botIsAdmin && enlace ? `• Enlace: ${enlace}` : null,
          descripcion ? `• Descripción: ${descripcion}${md?.desc?.length > 200 ? '…' : ''}` : null,
          '',
          '— Miembros —',
          miembrosListado.join('\n') || 'N/A',
        ].filter(Boolean).join('\n'))
      } catch (e) {
        console.error('[group-info] Error con', gid, e?.message)
      }
    }

    const encabezado = isOwner
      ? `Resumen de grupos (${grupos.length})\nFecha: ${fecha}`
      : `Información del grupo\nFecha: ${fecha}`

    const cuerpo = `${encabezado}\n\n${partes.map((t, i) => `#${i + 1}\n${t}`).join('\n\n')}`.trim()

   
    if (cuerpo.length <= 6000) {
      await conn.sendMessage(m.chat, { text: cuerpo, mentions: await conn.parseMention(cuerpo) }, { quoted: m })
    } else {
      
      let i = 0
      const trozos = []
      for (let off = 0; off < cuerpo.length; off += 4000) trozos.push(cuerpo.slice(off, off + 4000))
      for (const block of trozos) {
        await conn.sendMessage(m.chat, { text: block, mentions: await conn.parseMention(block) }, { quoted: m })
        if (++i >= 5) break 
      }
    }
  } catch (e) {
    console.error(chalk.red('[group-info]'), e)
    m.reply('No se pudo obtener la información de grupos. Inténtalo más tarde.')
  }
}

handler.help = ['groupinfo', 'grupoinfo', 'gruposinfo']
handler.tags = ['grupo']
handler.command = ['groupinfo', 'grupoinfo', 'gruposinfo', 'listagrupos']
handler.group = false
handler.owner = false

export default handler
