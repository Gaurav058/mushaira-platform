const https = require('https');
const fs = require('fs');
const state = JSON.parse(fs.readFileSync(process.env.USERPROFILE + '/.expo/state.json', 'utf8'));
const sid = state.auth.sessionSecret;
const buildId = process.argv[2] || 'b29b2318-dec1-4790-91aa-3ba7adb29ba4';

// Try GraphQL API
const query = JSON.stringify({
  query: `{
    app(appId: "ea3ddd32-8acc-4b95-99a9-0dcdba36358c") {
      builds(limit: 4, filter: { platform: ANDROID }) {
        edges {
          node {
            id
            status
            error { errorCode message }
            logFiles
          }
        }
      }
    }
  }`
});

const req = https.request({
  hostname: 'api.expo.dev',
  path: '/graphql',
  method: 'POST',
  headers: {
    'expo-session': sid,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(query)
  }
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    try {
      const j = JSON.parse(d);
      const edges = j?.data?.builds?.edges || [];
      edges.forEach(e => {
        const b = e.node;
        console.log('\n--- Build', b.id, '---');
        console.log('Status:', b.status);
        if (b.error) console.log('Error:', JSON.stringify(b.error, null, 2));
        if (b.logFiles) console.log('Log Files:', JSON.stringify(b.logFiles));
      });
      if (!edges.length) console.log('Response:', JSON.stringify(j).slice(0, 500));
    } catch (e) { console.log(d.slice(0, 2000)); }
  });
});
req.write(query);
req.end();

