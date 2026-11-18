import {program} from 'commander';
import superagent from 'superagent';
import http from 'http';
import fs from 'fs/promises';

program
  .name('my-cli-tool')
  .description('A simple CLI tool example')
  .version('1.0.0')
  .helpOption('--help', 'Довідка по використанню')
  .requiredOption("-c, --cache <path>", "шлях до кешу")
  .requiredOption("-h ,--host <address>", "адреса сервера")
  .requiredOption("-p, --port <number>", "номер порту")

program.parse(process.argv);
const options = program.opts();

const port = Number(options.port);
if (!Number.isInteger(port) || port < 0) 
{
console.error('Помилка: порт має бути цілим числом більше 0');
process.exit(1);
}
 
function sendText(res, status, message, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    ...headers,
  });
  res.end(message);
}

function getCode(req){
    const { pathname } = new URL(req.url, 'http://localhost');
    const match = /^\/(\d{3})$/.exec(pathname);
    console.log(`Received request for path: ${pathname}, matched code: ${match ? match[1] : 'none'}`);
    return match ? match[1] : null;
}

async function fetchFromHttpCat(code) {
  try {
    const response = await superagent
      .get(`https://http.cat/${code}`)
      .buffer(true)
      .parse(superagent.parse.image);
    return response.body;
  } catch (err) {
    console.error(`Помилка при отриманні картинки для коду ${code}:`, err.message);
    return null;
  }
}

async function saveToCache(file, code, data) {
  const tmp = `${file}.${code}.tmp`;
  try {
    await fs.writeFile(tmp, data);
    await fs.rename(tmp, file);
  } catch (err) {
    await fs.rm(tmp, { force: true });
    throw err;
  }
}

async function handleGet(res, file, code) {
  let data;
  let source;

  try {
    data = await fs.readFile(file);
    source = 'cache';
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
    data = await fetchFromHttpCat(code);
    if (!data) {
      return sendText(res, 404, `Картинку для коду ${code} не знайдено`);
    }
    await saveToCache(file, code, data);
    source = 'http.cat';
  }

  res.writeHead(200, {
    'Content-Type': 'image/jpeg',
    'Content-Length': data.length,
    'X-Image-Source': source,
  });
  res.end(data);
}

async function handeRequest(req, res) {
    const code = getCode(req);
    if (!code) {
        sendText(res, 400, 'Невірний запит');
        return;
    }
    else{
        if(req.method === 'GET') {
          console.log(`Handling GET request for code: ${code}`);
          return await handleGet(res, `${options.cache}/${code}.jpg`, code);
        }
    }
    return;
}

function Server(){
    const server = http.createServer((req, res) => {
    try {
      handeRequest(req, res);
    } catch (err) {
      console.error(err);
      sendText(res, 500, 'Внутрішня помилка сервера');
    }});

    server.listen(port, options.host);
    console.log(`Сервер запущено на http://${options.host}:${port}`);
  }

Server();
