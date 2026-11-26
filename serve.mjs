import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, relative, extname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('./dist/',import.meta.url));
const port = Number(process.env.PORT || 4178);
const types = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.jpg':'image/jpeg',
  '.png':'image/png', '.webp':'image/webp', '.xml':'application/xml', '.txt':'text/plain; charset=utf-8',
};
createServer(async (request,response) => {
  let body;
  let status = 200;
  let extension = '.html';
  let isEnglish = false;
  try {
    const pathname = decodeURIComponent(new URL(request.url,'http://localhost').pathname);
    isEnglish = pathname.startsWith('/en/');
    const path = resolve(directory,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
    const difference = relative(directory,path);
    if (difference.startsWith('..') || isAbsolute(difference)) throw new Error('Invalid path');
    body = await readFile(path);
    extension = extname(path);
  } catch {
    status = 404;
    body = await readFile(resolve(directory,isEnglish?'en/404.html':'404.html')).catch(()=>Buffer.from('Page not found'));
  }
  response.writeHead(status,{'Content-Type':types[extension]??'application/octet-stream'});
  response.end(body);
}).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port+'/'));
