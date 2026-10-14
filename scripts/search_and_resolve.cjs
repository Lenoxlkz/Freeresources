const fs = require('fs');
const https = require('https');
const path = require('path');

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
      // Handle redirect
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers, finalUrl: url });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, headers: res.headers, finalUrl: url });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ status: 0, error: e.message });
    });
    req.end();
  });
}

// Known user-provided fixes:
const USER_OVERRIDES = {
  gyawun: 'sheikhhaziq/gyawun_music',
  elovaire: 'droidbeauty/elovaire-music',
  cutemusic: 'sosauce/Chocola', // Chocola / CuteMusic
  spotiflac: 'spotbye/SpotiFLAC' // Desktop; mobile is spotiflacapp/SpotiFLAC-Mobile
};

async function run() {
  const auditResults = JSON.parse(fs.readFileSync(path.join(__dirname, 'audit_results.json'), 'utf8'));

  for (const item of auditResults) {
    if (USER_OVERRIDES[item.id]) {
      const target = USER_OVERRIDES[item.id];
      const res = await fetchUrl(`https://api.github.com/repos/${target}`);
      const rel = await fetchUrl(`https://api.github.com/repos/${target}/releases`);
      console.log(`[OVERRIDE] ${item.name} -> ${target} (${res.status}) Stars: ${res.data?.stargazers_count}, Releases: ${Array.isArray(rel.data) ? rel.data.length : 0}`);
      item.resolvedRepo = target;
      item.resolvedStars = res.data?.stargazers_count;
      item.resolvedReleases = Array.isArray(rel.data) ? rel.data.length : 0;
      item.resolvedStatus = res.status;
      continue;
    }

    if (item.status === 301 || item.status === 200) {
      // Follow redirect
      const res = await fetchUrl(`https://api.github.com/repos/${item.configuredRepo}`);
      const realFullName = res.data?.full_name;
      const rel = await fetchUrl(`https://api.github.com/repos/${realFullName || item.configuredRepo}/releases`);
      console.log(`[RESOLVED 200/301] ${item.name} -> ${realFullName} Stars: ${res.data?.stargazers_count}, Releases: ${Array.isArray(rel.data) ? rel.data.length : 0}`);
      item.resolvedRepo = realFullName || item.configuredRepo;
      item.resolvedStars = res.data?.stargazers_count;
      item.resolvedReleases = Array.isArray(rel.data) ? rel.data.length : 0;
      item.resolvedStatus = res.status;
      continue;
    }

    // If 404, search GitHub for repo matching app name and topic music
    const queries = [
      `${item.name} in:name music`,
      `${item.name} android music`,
      `${item.name} youtube music`,
      item.name
    ];

    let found = null;
    for (const q of queries) {
      const searchRes = await fetchUrl(`https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc`);
      if (searchRes.data?.items && searchRes.data.items.length > 0) {
        // Find best candidate
        for (const candidate of searchRes.data.items.slice(0, 5)) {
          const desc = (candidate.description || '').toLowerCase();
          const repoName = candidate.name.toLowerCase();
          const cleanAppName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          if (repoName.includes(cleanAppName) || cleanAppName.includes(repoName) || desc.includes('music') || desc.includes('player') || desc.includes('streaming')) {
            found = candidate;
            break;
          }
        }
      }
      if (found) break;
    }

    if (found) {
      const rel = await fetchUrl(`https://api.github.com/repos/${found.full_name}/releases`);
      console.log(`[SEARCH FOUND] ${item.name} -> ${found.full_name} Stars: ${found.stargazers_count}, Releases: ${Array.isArray(rel.data) ? rel.data.length : 0} | Desc: ${found.description?.slice(0, 60)}`);
      item.resolvedRepo = found.full_name;
      item.resolvedStars = found.stargazers_count;
      item.resolvedReleases = Array.isArray(rel.data) ? rel.data.length : 0;
      item.resolvedStatus = 200;
      item.searchNote = found.description;
    } else {
      console.log(`[NOT FOUND] ${item.name} (${item.configuredRepo})`);
      item.resolvedRepo = null;
    }
  }

  fs.writeFileSync(path.join(__dirname, 'audit_resolved.json'), JSON.stringify(auditResults, null, 2));
}

run();
