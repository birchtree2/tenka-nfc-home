import { readFile, writeFile, mkdir, cp, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseDocument } from 'yaml';
export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const text = (value, name) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} 必须是非空字符串`);
  return value;
};
const webURL = (value, name) => {
  text(value, name);
  if (!/^https:\/\//i.test(value)) throw new Error(`${name} 必须是 https:// 链接`);
  new URL(value);
};
const escape = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function build({ outputDirectory = 'dist' } = {}) {
  const document = parseDocument(await readFile(resolve(root, 'config.yml'), 'utf8'), { uniqueKeys: true });
  if (document.errors.length) throw new Error(document.errors.map(e => e.message).join('\n'));
  const c = document.toJS({ maxAliasCount: 50 });
  for (const [name, fields] of Object.entries({site:['title','url','description','share_image'],profile:['name','role'],images:['entry_character','character','character_alt','portrait','portrait_alt','loader'],intro:['speaker','japanese','chinese'],music:['title','artist','song_id','url','cover'],footer:['text','credits_label','credits_url']})) {
    if (!c[name] || typeof c[name] !== 'object') throw new Error(`缺少配置 ${name}`);
    for (const field of fields) text(c[name][field], `${name}.${field}`);
  }
  if (typeof c.profile.tagline?.enable !== 'boolean') throw new Error('profile.tagline.enable 必须是 true 或 false');
  text(c.profile.tagline.text,'profile.tagline.text');
  webURL(c.site.url,'site.url'); webURL(c.music.url,'music.url'); webURL(c.footer.credits_url,'footer.credits_url');
  if (!/^\d+$/.test(c.music.song_id)) throw new Error('music.song_id 必须是加引号的数字 ID');
  if (!Array.isArray(c.profile.about) || !c.profile.about.length) throw new Error('profile.about 必须是段落数组');
  c.profile.about.forEach((p,i)=>text(p,`profile.about[${i}]`));
  if (!Array.isArray(c.contacts) || c.contacts.length !== 4) throw new Error('contacts 必须配置四个按钮');
  const ids = new Set();
  for (const contact of c.contacts) {
    ['id','label','value','avatar'].forEach(k=>text(contact[k],`contacts.${k}`));
    if (ids.has(contact.id)) throw new Error(`重复的联系人 id: ${contact.id}`);
    ids.add(contact.id);
    if (!['link','copy','expand'].includes(contact.action)) throw new Error('contact.action 只能是 link、copy 或 expand');
    if (contact.action === 'link') webURL(contact.value,'contact.value');
  }
  for (const key of ['accent','background']) if (!/^#[0-9a-f]{6}$/i.test(c.theme?.[key])) throw new Error(`theme.${key} 必须是六位十六进制颜色`);
  for (const [obj, key] of [[c.intro,'enabled'],[c.music,'enabled']]) if (typeof obj[key] !== 'boolean') throw new Error('enabled 必须是 true 或 false');
  if (!Number.isFinite(c.intro.duration_seconds) || c.intro.duration_seconds < 0 || c.intro.duration_seconds > 60) throw new Error('intro.duration_seconds 必须是 0–60 之间的秒数');
  if (typeof c.intro.voice !== 'string') throw new Error('intro.voice 必须是路径或空字符串');
  if (!Number.isFinite(c.intro.volume) || c.intro.volume < 0 || c.intro.volume > 1) throw new Error('intro.volume 必须在 0–1 之间');
  if (!Number.isFinite(c.intro.typing_ms) || c.intro.typing_ms < 0 || c.intro.typing_ms > 500) throw new Error('intro.typing_ms 必须在 0–500 之间');
  const assets = [c.site.share_image,c.images.entry_character,c.images.character,c.images.portrait,c.images.loader,c.music.cover,...c.contacts.map(x=>x.avatar),c.intro.voice].filter(Boolean);
  for (const asset of assets) {
    if (/^https:\/\//.test(asset)) {webURL(asset,'asset');continue;}
    if (!asset.startsWith('assets/') || asset.split('/').includes('..')) throw new Error(`素材路径必须以 assets/ 开头: ${asset}`);
    await access(resolve(root,asset)).catch(()=>{throw new Error(`找不到素材: ${asset}`)});
  }
  const out = resolve(root,outputDirectory);
  await mkdir(out,{recursive:true});
  await cp(resolve(root,'assets'),resolve(out,'assets'),{recursive:true});
  for (const name of ['styles.css','script.js']) await cp(resolve(root,name),resolve(out,name));
  const values = {TITLE:c.site.title,DESCRIPTION:c.site.description,URL:c.site.url,SHARE_IMAGE:new URL(c.site.share_image,c.site.url).href,ENTRY_IMAGE:c.images.entry_character,NAME:c.profile.name,TAGLINE:c.profile.tagline.text};
  const html = (await readFile(resolve(root,'index.html'),'utf8')).replace(/\{\{([A-Z_]+)\}\}/g,(_,key)=>escape(text(values[key],key)));
  await writeFile(resolve(out,'index.html'),html);
  await writeFile(resolve(out,'site-config.js'),`window.SITE_CONFIG = ${JSON.stringify(c,null,2)};\n`);
  await writeFile(resolve(out,'.nojekyll'),'');
  console.log(`Built ${outputDirectory}/ from config.yml`);
  return c;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await build();
