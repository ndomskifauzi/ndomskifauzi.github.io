import { mkdir, writeFile, copyFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { name, email, origin, headline, profiles, projects, articles, copy } from './content.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
const out = join(root, 'dist');
const langs = ['id', 'en'];
const paths = ['', 'about/', 'experience/', 'projects/', 'insights/', 'contact/'];
const routes = [...paths, ...projects.filter(p => p.case).map(p => 'projects/' + p.id + '/'), ...articles.map(a => 'insights/' + a.id + '/')];
const personId = origin + '/#person';
const siteId = origin + '/#website';
const portrait = '/assets/ndomski-fauzi.webp';
const social = '/assets/social-card.jpg';
const pathFor = (lang, path = '') => '/' + (lang === 'en' ? 'en/' : '') + path;
const otherLang = lang => lang === 'id' ? 'en' : 'id';
const absolute = (lang, path) => origin + pathFor(lang, path);
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e = escapeHtml;
const button = (href, label, type = 'secondary') => `<a class="button button--${type}" href="${e(href)}">${e(label)}</a>`;
const inline = (href, label) => `<a class="text-link" href="${e(href)}">${e(label)}</a>`;
const eyebrow = label => `<p class="eyebrow">${e(label)}</p>`;
const tags = items => `<ul class="tags">${items.map(x => `<li>${e(x)}</li>`).join('')}</ul>`;

const assets = ['style.css', 'favicon.png', 'social-card.jpg', 'ndomski-fauzi.webp', 'ndomski-fauzi-400.webp', 'ndomski-fauzi-800.webp',
  ...projects.flatMap(p => [p.image,p.screenshot?.[0]]).filter(Boolean)];

function picture(lang, size = 'hero') {
  const alt = lang === 'id' ? 'Potret monokrom Ndomski fauzi' : 'Black-and-white portrait of Ndomski fauzi';
  const priority = size === 'hero' ? ' fetchpriority="high"' : '';
  const slot = size === 'hero' ? '(max-width: 650px) 90vw, (max-width: 900px) 45vw, 467px' : '(max-width: 650px) 90vw, 400px';
  const fallback = size === 'hero' ? portrait : '/assets/ndomski-fauzi-800.webp';
  return `<figure class="portrait portrait--${size}"><div class="portrait-frame"><img src="${fallback}" srcset="/assets/ndomski-fauzi-400.webp 400w, /assets/ndomski-fauzi-800.webp 800w, ${portrait} 1000w" sizes="${slot}" width="1000" height="1094" alt="${alt}"${priority}></div><figcaption><span class="location-point" aria-hidden="true"></span>${e(copy[lang].location)}</figcaption></figure>`;
}

function header(lang, path) {
  const c = copy[lang];
  const selected = path.split('/')[0];
  return `<a class="skip" href="#main">${e(c.skip)}</a>
  <header class="top"><div class="wrap top-inner">
    <a class="wordmark" href="${pathFor(lang)}"><span class="mark" aria-hidden="true">nf<span>.</span></span><span>${e(name)}</span></a>
    <nav class="primary-nav" aria-label="${e(c.navLabel)}">${paths.map((item, i) => `<a href="${pathFor(lang,item)}"${item === path ? ' aria-current="page"' : item.split('/')[0] === selected ? ' aria-current="location"' : ''}>${c.nav[i]}</a>`).join('')}</nav>
    <a class="language" href="${pathFor(otherLang(lang), path)}" hreflang="${otherLang(lang)}" lang="${otherLang(lang)}" aria-label="${lang === 'id' ? 'Read in English' : 'Baca dalam Bahasa Indonesia'}">${lang === 'id' ? 'EN' : 'ID'}</a>
  </div></header>`;
}

function footer(lang) {
  const c = copy[lang];
  return `<footer class="bottom"><div class="wrap bottom-inner">
    <a class="wordmark" href="${pathFor(lang)}"><span class="mark" aria-hidden="true">nf<span>.</span></span><span>${e(name)}</span></a>
    <p>${e(c.location)}</p><div class="footer-links"><a href="${profiles[0].url}">GitHub</a><a href="${pathFor(lang,'contact/')}">${c.nav[5]}</a></div>
  </div></footer>`;
}

function projectTile(lang, project, heading = 'h3') {
  const i = langs.indexOf(lang);
  const c = copy[lang];
  const caseUrl = pathFor(lang, 'projects/' + project.id + '/');
  return `<article class="project-card${project.image ? '' : ' project-card--text'}" id="${project.id}">
    ${project.image ? `<div class="project-media"><img src="/assets/${project.image}" alt="${e(project.alt[i])}" width="960" height="540" loading="lazy" decoding="async"></div>` : ''}
    <div class="project-body">
      <p class="project-role">${e(project.role[i])}</p>
      <${heading}>${e(project.name)}</${heading}><p>${e(project.summary[i])}</p>
      ${tags(project.areas)}
      <div class="project-links">${project.case ? inline(caseUrl, c.readCase) : ''}${inline(project.url, c.projectLink)}</div>
    </div></article>`;
}

function skills(lang) {
  const c = copy[lang];
  return `<section class="section" aria-labelledby="skills"><div class="section-heading"><div>${eyebrow(c.skills)}<h2 id="skills">${e(c.focus)}</h2></div><p>${e(c.focusBody)}</p></div>
    <div class="skill-grid">${c.skillGroups.map(([label, items])=> `<section class="skill-card"><h3>${e(label)}</h3><ul>${items.map(item => `<li>${e(item)}</li>`).join('')}</ul></section>`).join('')}</div>
  </section>`;
}

function home(lang) {
  const c = copy[lang];
  return `<div class="wrap">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">${eyebrow('Developer.')}<h1 id="hero-title"><span>Ndomski</span> <span>fauzi<span class="hero-dot" aria-hidden="true">.</span></span></h1>
        <p class="tagline">Build. Optimize. Evolve.</p><p class="hero-intro">${e(c.intro)}</p>
        <div class="hero-actions">${button(pathFor(lang,'projects/'),c.viewProjects,'primary')}${button(pathFor(lang,'about/'),c.about)}</div>
        <div class="hero-links"><a href="${profiles[0].url}">GitHub</a><a href="${pathFor(lang,'contact/')}">${c.nav[5]}</a></div>
      </div>
      ${picture(lang)}
    </section>
    <section class="experience-strip" aria-label="${e(c.nav[2])}">${['2016','2017','2018'].map((year,i) => `<div><p class="strip-label">${e(c.quick[i])}</p><p class="strip-date">${c.since} <strong>${year}</strong></p></div>`).join('')}</section>
    <section class="section" aria-labelledby="selected"><div class="section-heading"><h2 id="selected">${e(c.selected)}</h2>${inline(pathFor(lang,'projects/'),c.viewAll)}</div>
      <div class="project-grid">${projects.slice(0,2).map(p=>projectTile(lang,p)).join('')}</div>
    </section>
    ${skills(lang)}
    <section class="contact-band"><h2>${e(c.contactCta)}</h2>${button(pathFor(lang,'contact/'),c.write,'primary')}</section>
  </div>`;
}

const pageHeader = (label, title, intro) => `<div class="page-intro">${eyebrow(label)}<h1>${e(title)}</h1><p>${e(intro)}</p></div>`;
const byline = (lang, date) => {
  const printed = date ? new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date)) : '';
  return `<p class="byline">${e(copy[lang].author)} <a rel="author" href="${pathFor(lang,'about/')}">${e(name)}</a>${date ? ` <span aria-hidden="true">·</span> <time datetime="${date}">${e(printed)}</time>` : ''}</p>`;
};
const sections = blocks => blocks.map(([title, body]) => `<section><h2>${e(title)}</h2><p>${e(body)}</p></section>`).join('');

function inner(lang, path) {
  const c = copy[lang];
  const i = langs.indexOf(lang);
  const project = projects.find(p => p.case && path === 'projects/' + p.id + '/');
  const article = articles.find(a => path === 'insights/' + a.id + '/');
  const section = paths.indexOf(path);
  let title = c.nav[section];
  let description;
  let content;
  if (path === 'about/') {
    title = c.about;
    description = c.biography[0];
    content = `<div class="wrap">${pageHeader(c.nav[1],name,'Developer & Digital Marketing Specialist')}
      <div class="about-grid">${picture(lang,'about')}<div class="prose"><p class="professional-headline" lang="en">${e(headline)}</p>${c.biography.map(p=>`<p>${e(p)}</p>`).join('')}
      <div class="button-row">${button(pathFor(lang,'projects/'),c.viewProjects,'primary')}${button(pathFor(lang,'experience/'),c.nav[2])}${button(pathFor(lang,'contact/')+'#profiles',c.allProfiles)}</div></div></div>${skills(lang)}</div>`;
  } else if (path === 'experience/') {
    description = c.timelineIntro;
    content = `<div class="wrap">${pageHeader(c.nav[2],lang === 'id' ? 'Perjalanan profesional.' : 'Professional journey.',description)}
      <ol class="timeline">${c.timeline.map(([year, role, item])=>`<li><span class="timeline-year">${e(year)}</span><div><h2>${e(role)}</h2><p>${e(item)}</p></div></li>`).join('')}</ol>
      <div class="section-tail">${button(pathFor(lang,'projects/'),c.viewProjects,'primary')}</div></div>`;
  } else if (path === 'projects/') {
    description = c.projectsIntro;
    content = `<div class="wrap">${pageHeader(c.nav[3],lang === 'id' ? 'Portofolio proyek.' : 'Project portfolio.',description)}
      <div class="project-grid all-projects">${projects.map(p=>projectTile(lang,p,'h2')).join('')}</div></div>`;
  } else if (path === 'insights/') {
    description = c.insightsIntro;
    content = `<div class="wrap">${pageHeader(c.nav[4],lang === 'id' ? 'Catatan kerja.' : 'Working notes.',description)}
      <div class="editorial-list">${articles.map(a => `<article>${byline(lang,a.date)}<h2>${e(a.title[i])}</h2><p>${e(a.description[i])}</p>${inline(pathFor(lang,'insights/'+a.id+'/'),c.readInsight)}</article>`).join('')}</div></div>`;
  } else if (path === 'contact/') {
    description = c.contactIntro;
    content = `<div class="wrap">${pageHeader(c.nav[5],c.contactCta,description)}<div class="contact-grid">
      <section class="contact-card"><h2>Email</h2><p><a href="mailto:${email}">${email}</a></p>${button('mailto:'+email,c.emailLink,'primary')}<p class="contact-location">${e(c.fullLocation)}</p></section>
      <section class="profiles-card" id="profiles"><h2>${e(c.elsewhere)}</h2><ul class="profile-list">${profiles.map(p=>`<li><a href="${e(p.url)}"${p.verified ? ' rel="me"' : ''}><span>${e(p.name)}</span><span>${e(p.label)}</span></a></li>`).join('')}</ul></section>
      </div></div>`;
  } else if (project) {
    title = project.name + ' — ' + (lang === 'id' ? 'Studi kasus' : 'Case study');
    description = project.summary[i];
    const [image,width,height] = project.screenshot;
    const caption = lang === 'id' ? 'Tampilan beranda publik ' : 'Public homepage of ';
    content = `<div class="wrap">${pageHeader(c.readCase,project.name,description)}<div class="article-layout">
      <article class="prose"><figure class="case-image"><img src="/assets/${image}" alt="${caption}${e(project.name)}" width="${width}" height="${height}"><figcaption>${caption}${e(project.name)}</figcaption></figure>${byline(lang)}
      ${sections(project.case[i])}<p>${inline(project.example,lang === 'id' ? 'Lihat halaman publik' : 'See the public page')}</p></article>
      <aside class="contact-card"><p class="eyebrow">${e(c.nav[3])}</p><p>${e(project.role[i])}</p>${tags(project.areas)}${inline(pathFor(lang,'projects/'),c.viewAll)}</aside>
      </div></div>`;
  } else if (article) {
    title = article.title[i];
    description = article.description[i];
    content = `<div class="wrap">${pageHeader(c.nav[4],title,description)}<div class="article-layout">
      <article class="prose">${byline(lang,article.date)}${sections(article.sections[i])}<p>${inline(pathFor(lang,'projects/rinrun-travel/'),lang === 'id' ? 'Lihat contoh di studi kasus RinRun Travel' : 'See an example in the RinRun Travel case study')}</p></article>
      </div></div>`;
  }
  return { title, description, content, project, article };
}

function graph(lang, path, title, description, article, project) {
  const url = absolute(lang,path);
  const pageId = url + '#webpage';
  const about = path === 'about/';
  const rinrun = { '@type':'Organization', '@id': 'https://www.sewamotordieng.com/#organization', name:'RinRun Travel', url:projects[0].url };
  const vd = { '@type':'Organization', '@id': 'https://vdgrup.id/#organization', name:'VD Grup', url:projects[1].url };
  const nodes = [
    { '@type':'WebSite', '@id':siteId, url:origin+'/', name, inLanguage:langs, publisher:{'@id':personId} },
    {
      '@type':'Person','@id':personId, name, url:origin+'/about/',
      image:origin+portrait, description:copy[lang].biography[0],
      jobTitle:['Developer','Digital Marketing Specialist'],
      homeLocation:{'@type':'Place',name:copy[lang].fullLocation},
      knowsAbout:copy[lang].skillGroups.flatMap(([,items])=>items),
      sameAs:profiles.filter(p=>p.verified).map(p=>p.url),
      worksFor:[{'@id':rinrun['@id']},{'@id':vd['@id']}],
      mainEntityOfPage:{'@id':origin+'/about/#webpage'},
    },
    {...rinrun, founder:{'@id':personId}}, vd,
    {
      '@type': about ? 'ProfilePage' : 'WebPage', '@id':pageId, url, name:title, description, inLanguage:lang,
      isPartOf:{'@id':siteId},
      ...(article ? {mainEntity:{'@id':url+'#article'}} : about || !path ? {mainEntity:{'@id':personId}} : {}),
      ...(project ? {about:{'@id':project.id === 'rinrun-travel' ? rinrun['@id'] : vd['@id']}} : {}),
    },
  ];
  if (article) nodes.push({
    '@type':'BlogPosting', '@id':url+'#article', url, headline:title, description, inLanguage:lang,
    datePublished:article.date, mainEntityOfPage:{'@id':pageId},
    author:{'@id':personId}, publisher:{'@id':personId}, image:origin+social,
  });
  return JSON.stringify({'@context':'https://schema.org','@graph':nodes}).replace(/</g,'\\u003c');
}

function html(lang, path, missing = false) {
  const c = copy[lang];
  const info = missing ? {
    title:c.missing, description:c.missingBody,
    content:`<div class="wrap"><div class="page-intro not-found">${eyebrow('404')}<h1>${e(c.missing)}</h1><p>${e(c.missingBody)}</p><div class="button-row">${button(pathFor(lang),c.back,'primary')}${button(pathFor(lang,'projects/'),c.viewProjects)}</div></div></div>`,
  } : path ? inner(lang,path) : { title:name+(lang === 'id' ? ' — Developer & Digital Marketing Specialist' : ' — Web Developer & Digital Marketing Specialist'), description:c.homeDescription, content:home(lang) };
  const title = path || missing ? info.title+' | '+name : info.title;
  const url = absolute(lang,path);
  const metadata = missing ? '<meta name="robots" content="noindex">' : `
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="id" href="${absolute('id',path)}">
  <link rel="alternate" hreflang="en" href="${absolute('en',path)}">
  <link rel="alternate" hreflang="x-default" href="${absolute('id',path)}">
  <meta property="og:type" content="${info.article ? 'article' : 'website'}">
  <meta property="og:title" content="${e(title)}">
  <meta property="og:description" content="${e(info.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:locale" content="${lang === 'id' ? 'id_ID' : 'en_US'}">
  <meta property="og:image" content="${origin+social}">
  <meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${e(name)} — Build. Optimize. Evolve.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${e(title)}">
  <meta name="twitter:description" content="${e(info.description)}">
  <meta name="twitter:image" content="${origin+social}">
  <script type="application/ld+json">${graph(lang,path,info.title,info.description,info.article,info.project)}</script>`;
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="theme-color" content="#0A0A0A">
  <title>${e(title)}</title>
  <meta name="description" content="${e(info.description)}">
  <meta name="author" content="${e(name)}">
  <link rel="icon" type="image/png" href="/assets/favicon.png">
  <link rel="stylesheet" href="/assets/style.css">${metadata}
</head>
<body>
  ${header(lang,path)}
  <main id="main" tabindex="-1">${info.content}</main>
  ${footer(lang)}
</body>
</html>
`;
}

await mkdir(join(out,'assets'),{recursive:true});
for (const file of assets) {
  await access(join(root,file));
  await copyFile(join(root,file),join(out,'assets',file));
}
for (const lang of langs) {
  for (const route of routes) {
    const file = join(out,pathFor(lang,route),'index.html');
    await mkdir(dirname(file),{recursive:true});
    await writeFile(file,html(lang,route));
  }
  await writeFile(join(out,pathFor(lang),'404.html'),html(lang,'',true));
}
const defaultEntries = routes.flatMap(route => langs.map(lang =>
  `  <url><loc>${absolute(lang,route)}</loc>${langs.map(alt=>`<xhtml:link rel="alternate" hreflang="${alt}" href="${absolute(alt,route)}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${absolute('id',route)}"/></url>`));
await writeFile(join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${defaultEntries.join('\n')}\n</urlset>\n`);
await writeFile(join(out,'robots.txt'),`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
await writeFile(join(out,'.nojekyll'),'');
console.log('Built '+defaultEntries.length+' indexable HTML pages.');
