/**
 * Verifica los links de src/data/musicApps.ts contra GitHub y los demás canales.
 *
 * Uso:
 *   GITHUB_TOKEN=<tu_token_nuevo> node scripts/verify_links.cjs
 *   (el token es opcional, pero sin él GitHub limita a 60 peticiones/hora)
 *
 * Por cada app comprueba:
 *   - que el repo exista y si fue renombrado/movido (full_name distinto)
 *   - si está archivado y qué licencia declara
 *   - el último release y los nombres de sus archivos instalables
 *   - que respondan los links que no son de GitHub (F-Droid, IzzyOnDroid, Flathub, AUR...)
 * Escribe el resultado en scripts/verify_report.json. Sale con código 1 si hay problemas.
 */
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.GITHUB_TOKEN || '';
const src = fs.readFileSync(path.join(__dirname, '../src/data/musicApps.ts'), 'utf8');

const apps = src
  .split(/\n  \{\n    id: '/)
  .slice(1)
  .map((b) => {
    const get = (k) => (b.match(new RegExp(k + ": '([^']*)'")) || [])[1] || '';
    const block = (b.match(/installSources: \[([\s\S]*?)\n    \],/) || [])[1] || '';
    const urls = [...block.matchAll(/url: '([^']*)'/g)].map((m) => m[1]);
    return { id: b.match(/^([^']+)'/)[1], name: get('name'), repo: get('githubRepo'), urls };
  });

const ghHeaders = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'openstream-link-verifier',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

async function gh(p) {
  const r = await fetch('https://api.github.com' + p, { headers: ghHeaders });
  let data = null;
  try { data = await r.json(); } catch {}
  return { status: r.status, data, remaining: r.headers.get('x-ratelimit-remaining') };
}

async function probe(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const r = await fetch(url, { method, redirect: 'follow', headers: { 'User-Agent': 'openstream-link-verifier' } });
      if (r.status < 400 || method === 'GET') return r.status;
    } catch (e) {
      if (method === 'GET') return 0;
    }
  }
  return 0;
}

(async () => {
  const report = [];
  for (const app of apps) {
    const row = { id: app.id, name: app.name, repo: app.repo, problems: [], notes: [], assets: [] };

    const repo = await gh(`/repos/${app.repo}`);
    if (repo.status === 403 || repo.status === 429) {
      console.error('Límite de GitHub alcanzado. Ejecuta de nuevo con GITHUB_TOKEN o espera una hora.');
      process.exit(2);
    }
    if (repo.status !== 200) {
      row.problems.push(`repo ${app.repo} responde ${repo.status}`);
    } else {
      const d = repo.data;
      if (d.full_name.toLowerCase() !== app.repo.toLowerCase()) {
        row.problems.push(`repo renombrado/movido: usar ${d.full_name}`);
      }
      if (d.archived) row.notes.push('repo archivado (considera status: discontinued)');
      row.license = d.license ? d.license.spdx_id : 'sin licencia declarada';
      row.stars = d.stargazers_count;

      let rel = await gh(`/repos/${app.repo}/releases/latest`);
      if (rel.status !== 200) {
        const list = await gh(`/repos/${app.repo}/releases?per_page=1`);
        rel = { status: list.status, data: Array.isArray(list.data) ? list.data[0] : null };
      }
      if (rel.data && rel.data.tag_name) {
        row.latest = rel.data.tag_name;
        row.assets = (rel.data.assets || []).map((a) => a.name);
        if (!row.assets.length) row.notes.push('el último release no tiene archivos adjuntos');
      } else {
        row.notes.push('sin releases en GitHub');
      }
    }

    for (const url of app.urls) {
      if (url.startsWith('https://github.com/')) continue; // ya cubierto por la API
      const st = await probe(url);
      if (st === 0 || st >= 400) row.problems.push(`${url} responde ${st || 'sin respuesta'}`);
    }

    report.push(row);
    const flag = row.problems.length ? 'XX' : 'OK';
    console.log(`[${flag}] ${app.name} (${app.repo})${row.problems.length ? ' -> ' + row.problems.join(' | ') : ''}`);
  }

  fs.writeFileSync(path.join(__dirname, 'verify_report.json'), JSON.stringify(report, null, 2));
  const bad = report.filter((r) => r.problems.length);
  console.log(`\n${report.length - bad.length}/${report.length} apps sin problemas. Detalle en scripts/verify_report.json`);
  process.exit(bad.length ? 1 : 0);
})();
