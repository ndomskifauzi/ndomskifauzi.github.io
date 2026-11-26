import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { origin, profiles } from './content.mjs';

const output = new URL('./dist/', import.meta.url);
const read = path => readFile(new URL(path,output),'utf8');
const sitemap = await read('sitemap.xml');
const robots = await read('robots.txt');
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>new URL(match[1]));
const urls = new Set(pages.map(url=>url.href));
assert.equal(urls.size,pages.length);
assert.equal(pages.length % 2,0);
assert.match(robots,/^User-agent: \*\nAllow: \//);
assert(robots.includes('Sitemap: '+origin+'/sitemap.xml'));
const titles = new Set();
const descriptions = new Set();
const files = new Map();
for (const url of pages) {
  assert.equal(url.origin,origin);
  const route = url.pathname.slice(1);
  const file = await read(route+'index.html');
  files.set(url.pathname,file);
  assert.equal([...file.matchAll(/<h1(?:\s|>)/g)].length,1);
  assert.equal(file.includes('content="noindex"'),false);
  assert(file.includes('rel="canonical" href="'+url.href+'"'));
  const title = file.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = file.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert(title && description && description.length >= 40);
  assert(!titles.has(title),'Duplicate title: '+title);
  assert(!descriptions.has(description),'Duplicate description: '+description);
  titles.add(title);
  descriptions.add(description);
  const id = origin+(url.pathname.startsWith('/en/') ? url.pathname.slice(3) : url.pathname);
  const en = origin+'/en'+new URL(id).pathname;
  const alt = { id, en, 'x-default':id };
  for (const [lang, href] of Object.entries(alt)) {
    assert(urls.has(href));
    assert(file.includes('hreflang="'+lang+'" href="'+href+'"'));
  }
  assert(file.includes('<html lang="'+(url.pathname.startsWith('/en/')?'en':'id')+'">'));
  const data = JSON.parse(file.match(/<script type="application\/ld\+json">(.*?)<\/script>/)?.[1]??'');
  assert.equal(data['@context'],'https://schema.org');
  const graph = data['@graph'];
  const byId = new Map(graph.map(node=>[node['@id'],node]));
  const profile = byId.get(origin+'/#person');
  const page = byId.get(url.href+'#webpage');
  assert.equal(page.url,url.href);
  assert.equal(profile['@type'],'Person');
  assert.deepEqual(profile.sameAs,profiles.filter(p=>p.verified).map(p=>p.url));
  assert(profile.worksFor.every(node=>byId.has(node['@id'])));
  if (url.pathname.endsWith('/about/')) {
    assert.equal(page['@type'],'ProfilePage');
    assert.equal(page.mainEntity['@id'],profile['@id']);
  }
  if (url.pathname.includes('/insights/') && page.mainEntity) {
    assert.equal(byId.get(page.mainEntity['@id'])['@type'],'BlogPosting');
    assert.equal(byId.get(page.mainEntity['@id']).author['@id'],profile['@id']);
  }
}
for (const [route,file] of files) {
  for (const [,raw] of file.matchAll(/(?:href|src)="(\/(?!\/)[^"]+|\/|#[^"]+)"/g)) {
    const destination = new URL(raw,origin+route);
    const target = destination.pathname;
    if (target.startsWith('/assets/')) {
      await access(new URL(target.slice(1),output));
    } else {
      assert(files.has(target),'Broken internal link: '+route+' → '+raw);
      if (destination.hash) assert(files.get(target).includes('id="'+destination.hash.slice(1)+'"'),'Missing anchor: '+raw);
    }
  }
  for (const [,sourceSet] of file.matchAll(/srcset="([^"]+)"/g)) {
    for (const source of sourceSet.split(',')) await access(new URL(source.trim().split(' ')[0].slice(1),output));
  }
}
for (const errorPage of ['404.html','en/404.html']) {
  assert((await read(errorPage)).includes('content="noindex"'));
}
console.log('Verified '+pages.length+' pages, unique metadata, sitemap, reciprocal hreflang, internal links, and schema references.');
