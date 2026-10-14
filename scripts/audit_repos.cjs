const fs = require('fs');
const https = require('https');
const path = require('path');

// Read musicApps.ts and extract apps
const musicAppsCode = fs.readFileSync(path.join(__dirname, '../src/data/musicApps.ts'), 'utf8');

// Quick parser to get app objects with id, name, githubRepo, githubUrl, installSources
const repoRegex = /id:\s*'([^']+)',\s*name:\s*'([^']+)',[\s\S]*?githubRepo:\s*'([^']+)',/g;
let match;
const apps = [];
while ((match = repoRegex.exec(musicAppsCode)) !== null) {
  apps.push({
    id: match[1],
    name: match[2],
    githubRepo: match[3]
  });
}

console.log(`Found ${apps.length} apps to audit.`);

const TOKEN = process.env.GITHUB_TOKEN || '';

function fetchUrl(url) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'OpenStreamAudit/1.0',
        ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {}),
        'Accept': 'application/vnd.github+json'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, headers: res.headers });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ status: 0, error: e.message });
    });
    req.end();
  });
}

async function audit() {
  const results = [];
  for (const app of apps) {
    const repoRes = await fetchUrl(`https://api.github.com/repos/${app.githubRepo}`);
    const relRes = await fetchUrl(`https://api.github.com/repos/${app.githubRepo}/releases`);
    
    const status = repoRes.status;
    const realFullName = repoRes.data?.full_name;
    const releaseCount = Array.isArray(relRes.data) ? relRes.data.length : 0;
    const isRedirect = realFullName && realFullName.toLowerCase() !== app.githubRepo.toLowerCase();
    const isArchived = repoRes.data?.archived || false;
    const stars = repoRes.data?.stargazers_count;
    const latestRelease = Array.isArray(relRes.data) && relRes.data[0] ? relRes.data[0].tag_name : null;

    results.push({
      id: app.id,
      name: app.name,
      configuredRepo: app.githubRepo,
      status,
      realFullName,
      isRedirect,
      isArchived,
      releaseCount,
      latestRelease,
      stars
    });

    console.log(`[${status}] ${app.name} (${app.githubRepo}) -> ${realFullName || 'FAILED'} | Rel: ${releaseCount} | Stars: ${stars}`);
  }

  fs.writeFileSync(path.join(__dirname, 'audit_results.json'), JSON.stringify(results, null, 2));
  console.log('Audit complete. Results saved to audit_results.json');
}

audit();
