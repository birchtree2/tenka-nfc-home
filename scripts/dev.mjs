import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { build, root } from './build.mjs';
await build({outputDirectory:'.preview'});
const output = resolve(root,'.preview');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.woff2':'font/woff2'};
let error=null, timer, building=false, queued=false;
async function rebuild(){
  if(building){queued=true;return;}
  building=true;
  try{await build({outputDirectory:'.preview'});error=null;}catch(e){error=e.message;console.error(error);}
  finally{building=false;if(queued){queued=false;rebuild();}}
}
for(const item of ['config.yml','index.html','styles.css','script.js','assets']) watch(resolve(root,item),{recursive:item==='assets'},()=>{clearTimeout(timer);timer=setTimeout(rebuild,150);});
let restartTimer;
watch(resolve(root,'scripts'),()=>{clearTimeout(restartTimer);restartTimer=setTimeout(()=>process.exit(0),300);});
http.createServer(async(req,res)=>{
  try{
    if(error){res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});res.end(`配置构建失败：${error}`);return;}
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=resolve(output,'.'+(path.endsWith('/')?path+'index.html':path));
    if(!file.startsWith(output+sep)){res.writeHead(403);res.end();return;}
    await stat(file);const data=await readFile(file);
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4173'));
