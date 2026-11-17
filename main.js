import {program} from 'commander';
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
 


function Server(){
    const server = http.createServer((req, res) => {
    try {
      Answer(req, res);
    } catch (err) {
      console.error(err);
      sendError(res, 500, 'Внутрішня помилка сервера');
    }});

    server.listen(port, options.host, () => {
    console.log(`Server running at http://${options.host}:${port}/`);
    });
  }

