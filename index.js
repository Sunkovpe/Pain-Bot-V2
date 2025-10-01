process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './settings.js'
import './plugins/_allfake.js'
import cfonts from 'cfonts'
import { createRequire } from 'module'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import * as ws from 'ws'
import fs, { readdirSync, statSync, unlinkSync, existsSync, mkdirSync, readFileSync, rmSync, watch } from 'fs'
import yargs from 'yargs';
import { spawn, execSync } from 'child_process'
import lodash from 'lodash'
import { yukiJadiBot } from './plugins/sockets-serbot.js'
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import pino from 'pino'
import Pino from 'pino'
import path, { join, dirname } from 'path'
import { Boom } from '@hapi/boom'
import { makeWASocket, protoType, serialize } from './lib/simple.js'
import { Low, JSONFile } from 'lowdb'
import store from './lib/store.js'
const { proto } = (await import('@whiskeysockets/baileys')).default
import pkg from 'google-libphonenumber'
const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()
const { DisconnectReason, useMultiFileAuthState, MessageRetryMap, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser } = await import('@whiskeysockets/baileys')
import readline, { createInterface } from 'readline'
import NodeCache from 'node-cache'
const { CONNECTING } = ws
const { chain } = lodash
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

let { say } = cfonts

const BRAND_NAME = 'Pain Bot MD'
const BRAND_AUTHOR = 'Sunkovv'

console.log(chalk.magentaBright('\n🚀 Iniciando...'))
say(BRAND_NAME, {
font: 'simple',
align: 'left',
gradient: ['green', 'white']
})
say(`By ${BRAND_AUTHOR}`, {
font: 'console',
align: 'center',
colors: ['cyan', 'magenta', 'yellow']
})
protoType()
serialize()


const __origLog = console.log
console.log = (...args) => {
  try {
    if (args && args.length === 1 && typeof args[0] === 'string' && args[0].trim() === 'Connection Closed') return
  } catch {}
  __origLog(...args)
}

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
}; global.__dirname = function dirname(pathURL) {
return path.dirname(global.__filename(pathURL, true))
}; global.__require = function require(dir = import.meta.url) {
return createRequire(dir)
}

global.timestamp = {start: new Date}
const __dirname = global.__dirname(import.meta.url)
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp('^[#!./-]')

global.db = new Low(/https?:\/\//.test(opts['db'] || '') ? new cloudDBAdapter(opts['db']) : new JSONFile('database.json'))
global.DATABASE = global.db;
global.loadDatabase = async function loadDatabase() {
if (global.db.READ) {
return new Promise((resolve) => setInterval(async function() {
if (!global.db.READ) {
clearInterval(this);
resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
}}, 1 * 1000));
}
if (global.db.data !== null) return;
global.db.READ = true;
await global.db.read().catch(console.error);
global.db.READ = null;
global.db.data = {
users: {},
chats: {},
settings: {},
...(global.db.data || {}),
};
global.db.chain = chain(global.db.data);
};
loadDatabase(); 

const {state, saveState, saveCreds} = await useMultiFileAuthState(global.sessions)
const msgRetryCounterMap = new Map()
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })
const { version } = await fetchLatestBaileysVersion()
let phoneNumber = global.botNumber
const methodCodeQR = process.argv.includes("qr")
const methodCode = !!phoneNumber || process.argv.includes("code")
const MethodMobile = process.argv.includes("mobile")
const colors = chalk.bold.white
const qrOption = chalk.blueBright
const textOption = chalk.cyan
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))
let opcion
if (methodCodeQR) {
opcion = '1'
}
if (!methodCodeQR && !methodCode && !fs.existsSync(`./${global.sessions}/creds.json`)) {
opcion = await question(colors("Seleccione una opción:\n") + qrOption("1. Con código QR\n") + textOption("2. Con código de texto de 8 dígitos\n--> "))
if (!/^[1-2]$/.test(opcion)) {
console.log(chalk.bold.redBright(`No se permiten numeros que no sean 1 o 2, tampoco letras o símbolos especiales.`))
opcion = await question(colors("Seleccione una opción:\n") + qrOption("1. Con código QR\n") + textOption("2. Con código de texto de 8 dígitos\n--> "))
}} 

console.info = () => { }

const connectionOptions = {
logger: pino({ level: 'silent' }),
printQRInTerminal: opcion == '1' ? true : methodCodeQR ? true : false,
mobile: MethodMobile, 
browser: ["MacOs", "Safari"],
auth: {
creds: state.creds,
keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
},
markOnlineOnConnect: false, 
generateHighQualityLinkPreview: true, 
syncFullHistory: false,
getMessage: async (key) => {
try {
let jid = jidNormalizedUser(key.remoteJid);
let msg = await store.loadMessage(jid, key.id);
return msg?.message || "";
} catch (error) {
return "";
}},
msgRetryCounterCache: msgRetryCounterCache || new Map(),
userDevicesCache: userDevicesCache || new Map(),
defaultQueryTimeoutMs: undefined,
cachedGroupMetadata: (jid) => globalThis.conn.chats[jid] ?? {},
version: version, 
keepAliveIntervalMs: 55000, 
maxIdleTimeMs: 60000, 
};

global.conn = makeWASocket(connectionOptions);
conn.ev.on("creds.update", saveCreds)

if (!fs.existsSync(`./${global.sessions}/creds.json`)) {
if (opcion === '2' || methodCode) {
opcion = '2'
if (!conn.authState.creds.registered) {
let addNumber
if (!!phoneNumber) {
addNumber = phoneNumber.replace(/[^0-9]/g, '')
} else {
phoneNumber = await question(chalk.bgBlack(chalk.bold.greenBright(`[ ✪ ]  Por favor, Ingrese el número de WhatsApp.\n${chalk.bold.magentaBright('---> ')}`)))
phoneNumber = (phoneNumber || '').toString().replace(/\D/g,'')
if (!phoneNumber.startsWith('+')) {
phoneNumber = `+${phoneNumber}`
}
rl.close()
addNumber = phoneNumber.replace(/\D/g, '')
setTimeout(async () => {
let codeBot = await conn.requestPairingCode(addNumber)
codeBot = codeBot.match(/.{1,4}/g)?.join("-") || codeBot
console.log(chalk.bold.white(chalk.bgMagenta(`[ ✿ ]  Código:`)), chalk.bold.white(chalk.white(codeBot)))
}, 3000)
}}}}
conn.isInit = false;
conn.well = false;

let reconnecting = false
let retryCount = 0
let reconnectTimer = null

function scheduleReconnect(label = 'close') {
  if (reconnecting) return
  reconnecting = true
  const delay = 1500 
  retryCount = Math.min(retryCount + 1, 3)
  console.log(chalk.yellow(`→ Reconectando (${label}) en ${Math.round(delay / 1000)}s...`))
  clearTimeout(reconnectTimer)
  reconnectTimer = setTimeout(async () => {
    try {
      await global.reloadHandler(true).catch(console.error)
      global.timestamp.connect = new Date
    } finally {
      reconnecting = false
    }
  }, delay)
}

function resetReconnectBackoff() {
  retryCount = 0
  reconnecting = false
  clearTimeout(reconnectTimer)
}
conn.logger.info(`[ ✪ ]  H E C H O\n`)
if (!opts['test']) {
if (global.db) setInterval(async () => {
if (global.db.data) await global.db.write()
if (opts['autocleartmp'] && (global.support || {}).find) (tmp = [os.tmpdir(), 'tmp', `${jadi}`], tmp.forEach((filename) => cp.spawn('find', [filename, '-amin', '3', '-type', 'f', '-delete'])));
}, 30 * 1000);
}

async function connectionUpdate(update) {
const {connection, lastDisconnect, isNewLogin} = update;
global.stopped = connection;
if (isNewLogin) conn.isInit = true;
const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;

if (code && code !== DisconnectReason.loggedOut && conn?.ws.socket == null) {
scheduleReconnect(`code:${code}`)
}
if (global.db.data == null) loadDatabase()
if (update.qr != 0 && update.qr != undefined || methodCodeQR) {
if (opcion == '1' || methodCodeQR) {
console.log(chalk.green.bold(`[ ✪ ]  Escanea este código QR`))}
}
if (connection === "open") {
const userJid = jidNormalizedUser(conn.user.id)
const userName = conn.user.name || conn.user.verifiedName || "Desconocido"
await joinChannels(conn)
console.log(chalk.green.bold(`[ ✪ ]  Conectado a: ${userName}`))
resetReconnectBackoff()
}
let reason = new Boom(lastDisconnect?.error)?.output?.statusCode
if (connection === "close") {
if ([DisconnectReason.loggedOut, 401, 440].includes(reason)) {
console.log(chalk.red(`→ (${code || reason}) › Sesión cerrada. Requiere volver a vincular.`));
return
}
scheduleReconnect('close')
}};
process.on('uncaughtException', console.error);
let isInit = true;
let handler = await import('./handler.js')
global.reloadHandler = async function(restatConn) {
try {
const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
if (Object.keys(Handler || {}).length) handler = Handler
} catch (e) {
console.error(e);
}
if (restatConn) {
const oldChats = global.conn.chats
try {
global.conn.ws.close()
} catch { }
conn.ev.removeAllListeners()
global.conn = makeWASocket(connectionOptions, {chats: oldChats})
isInit = true
}
if (!isInit) {
conn.ev.off('messages.upsert', conn.handler)
conn.ev.off('connection.update', conn.connectionUpdate)
conn.ev.off('creds.update', conn.credsUpdate)
}
conn.handler = handler.handler.bind(global.conn)
conn.connectionUpdate = connectionUpdate.bind(global.conn)
conn.credsUpdate = saveCreds.bind(global.conn, true)
const currentDateTime = new Date()
const messageDateTime = new Date(conn.ev)
if (currentDateTime >= messageDateTime) {
const chats = Object.entries(conn.chats).filter(([jid, chat]) => !jid.endsWith('@g.us') && chat.isChats).map((v) => v[0])
} else {
const chats = Object.entries(conn.chats).filter(([jid, chat]) => !jid.endsWith('@g.us') && chat.isChats).map((v) => v[0])
}
conn.ev.on('messages.upsert', conn.handler)
conn.ev.on('connection.update', conn.connectionUpdate)
conn.ev.on('creds.update', conn.credsUpdate)
isInit = false
return true
};
process.on('unhandledRejection', (reason, promise) => {
console.error("Rechazo no manejado detectado:", reason);
});

global.rutaJadiBot = join(__dirname, `./${jadi}`)
if (global.yukiJadibts) {
if (!existsSync(global.rutaJadiBot)) {
mkdirSync(global.rutaJadiBot, { recursive: true }) 
console.log(chalk.bold.cyan(`✪ La carpeta: ${jadi} se creó correctamente.`))
} else {
console.log(chalk.bold.cyan(`✪ La carpeta: ${jadi} ya está creada.`)) 
}
const readRutaJadiBot = readdirSync(rutaJadiBot)
if (readRutaJadiBot.length > 0) {
const creds = 'creds.json'
for (const gjbts of readRutaJadiBot) {
const botPath = join(rutaJadiBot, gjbts)
const readBotPath = readdirSync(botPath)
if (readBotPath.includes(creds)) {
yukiJadiBot({pathYukiJadiBot: botPath, m: null, conn, args: '', usedPrefix: '/', command: 'serbot'})
}}}}

const pluginFolder = global.__dirname(join(__dirname, './plugins/index'))
const pluginFilter = (filename) => /\.js$/.test(filename)
global.plugins = {}
async function filesInit() {
for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
try {
const file = global.__filename(join(pluginFolder, filename))
const module = await import(file)
global.plugins[filename] = module.default || module
} catch (e) {
conn.logger.error(e)
delete global.plugins[filename]
}}}
filesInit().then((_) => Object.keys(global.plugins)).catch(console.error)

global.reload = async (_ev, filename) => {
if (pluginFilter(filename)) {
const dir = global.__filename(join(pluginFolder, filename), true);
if (filename in global.plugins) {
if (existsSync(dir)) conn.logger.info(` updated plugin - '${filename}'`)
else {
conn.logger.warn(`deleted plugin - '${filename}'`)
return delete global.plugins[filename]
}} else conn.logger.info(`new plugin - '${filename}'`)
const err = syntaxerror(readFileSync(dir), filename, {
sourceType: 'module',
allowAwaitOutsideFunction: true,
});
if (err) conn.logger.error(`syntax error while loading '${filename}'\n${format(err)}`)
else {
try {
const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`));
global.plugins[filename] = module.default || module;
} catch (e) {
conn.logger.error(`error require plugin '${filename}\n${format(e)}'`)
} finally {
global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)))
}}}}
Object.freeze(global.reload)
watch(pluginFolder, global.reload)
await global.reloadHandler()

// Consola interactiva para enviar mensajes a grupos desde la terminal - bot
// Comandos:
//  :groups                -> Lista los grupos con índice
//  :to <idx|jid>         -> Selecciona el destino por índice o JID de grupo
//  :say <mensaje>        -> Envía el mensaje al destino seleccionado
//  :sayto <jid> <mensaje>-> Envía el mensaje directo al JID indicado
;(() => {
  let cliGroups = []
  let cliTarget = null
  const cli = createInterface({ input: process.stdin, output: process.stdout })

  const listGroups = () => {
    cliGroups = []
    const entries = Object.entries(conn.chats || {})
      .filter(([jid, chat]) => jid.endsWith('@g.us'))
    entries.forEach(([jid, chat], idx) => {
      const name = chat?.subject || chat?.name || chat?.vname || jid
      cliGroups.push(jid)
      console.log(`[${idx}] ${name}  <${jid}>`)
    })
    if (!entries.length) console.log('No hay grupos para listar.')
    return cliGroups
  }

  const resolveJid = (arg) => {
    if (!arg) return null

    if (/^\d+$/.test(arg)) {
      const i = parseInt(arg, 10)
      return cliGroups[i] || null
    }

    if (typeof arg === 'string' && arg.endsWith('@g.us')) return arg
    return null
  }

  const help = () => {
    console.log('Comandos consola:')
    console.log(':groups                      -> Lista grupos con índice')
    console.log(':to <idx|jid>               -> Selecciona destino')
    console.log(':say <mensaje>              -> Envía al destino seleccionado')
    console.log(':sayto <jid> <mensaje>      -> Envía directo al JID')
  }

  cli.on('line', async (line) => {
    try {
      const text = (line || '').trim()
      if (!text) return
      if (text === ':groups') {
        listGroups()
        return
      }
      if (text.startsWith(':to ')) {
        const arg = text.slice(4).trim()
        const jid = resolveJid(arg)
        if (!jid) {
          console.log('Destino inválido. Use :groups para ver índices o pase un JID @g.us válido.')
          return
        }
        cliTarget = jid
        console.log(`Destino seleccionado: ${jid}`)
        return
      }
      if (text.startsWith(':sayto ')) {
        const rest = text.slice(7)
        const sp = rest.indexOf(' ')
        if (sp === -1) {
          console.log('Uso: :sayto <jid@grupo.g.us> <mensaje>')
          return
        }
        const jid = resolveJid(rest.slice(0, sp).trim()) || rest.slice(0, sp).trim()
        const msg = rest.slice(sp + 1)
        if (!jid || !msg) {
          console.log('Parámetros inválidos.')
          return
        }
        if (!jid.endsWith('@g.us')) {
          console.log('Solo se permite enviar a JIDs de grupo (@g.us).')
          return
        }
        await conn.sendMessage(jid, { text: msg })
        console.log('Enviado.')
        return
      }
      if (text.startsWith(':say ')) {
        const msg = text.slice(5)
        if (!cliTarget) {
          console.log('Seleccione un destino primero con :to <idx|jid>')
          return
        }
        await conn.sendMessage(cliTarget, { text: msg })
        console.log('Enviado.')
        return
      }

      help()
    } catch (e) {
      console.log('Error consola:', e?.message)
    }
  })
})();

function wsStateName(wsInstance) {
  const s = wsInstance?.readyState
  return s === 0 ? 'CONNECTING' : s === 1 ? 'OPEN' : s === 2 ? 'CLOSING' : s === 3 ? 'CLOSED' : 'UNKNOWN'
}
setInterval(() => {
  try {
    const s = conn?.ws?.socket
    const state = wsStateName(s)
    if (!s || state === 'CLOSED' || state === 'CLOSING') {
      scheduleReconnect(`watchdog:${state || 'NOSOCKET'}`)
    }
  } catch (e) {
    console.log(chalk.gray('Watchdog error:'), e?.message)
  }
}, 5000)
async function _quickTest() {
const test = await Promise.all([
spawn('ffmpeg'),
spawn('ffprobe'),
spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
spawn('convert'),
spawn('magick'),
spawn('gm'),
spawn('find', ['--version']),
].map((p) => {
return Promise.race([
new Promise((resolve) => {
p.on('close', (code) => {
resolve(code !== 127);
});
}),
new Promise((resolve) => {
p.on('error', (_) => resolve(false));
})]);
}));
const [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test;
const s = global.support = {ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find};
Object.freeze(global.support);
}

setInterval(async () => {
const tmpDir = join(__dirname, 'tmp')
try {
const filenames = readdirSync(tmpDir)
filenames.forEach(file => {
const filePath = join(tmpDir, file)
unlinkSync(filePath)})
console.log(chalk.gray(`→ Archivos de la carpeta TMP eliminados`))
} catch {
console.log(chalk.gray(`→ Los archivos de la carpeta TMP no se pudieron eliminar`));
}}, 30 * 1000) 
_quickTest().catch(console.error)
async function isValidPhoneNumber(number) {
try {
number = number.replace(/\s+/g, '')
if (number.startsWith('+521')) {
number = number.replace('+521', '+52');
} else if (number.startsWith('+52') && number[4] === '1') {
number = number.replace('+52 1', '+52');
}
const parsedNumber = phoneUtil.parseAndKeepRawInput(number)
return phoneUtil.isValidNumber(parsedNumber)
} catch (error) {
return false
}}

async function joinChannels(sock) {
for (const value of Object.values(global.ch)) {
if (typeof value === 'string' && value.endsWith('@newsletter')) {
await sock.newsletterFollow(value).catch(() => {})
}}}