import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

const PORT = 3000;
const APK_PATH = path.resolve('TrackYourMovement.apk');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal && (net.address.startsWith('192.168.') || net.address.startsWith('172.') || net.address.startsWith('10.'))) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const server = http.createServer((req, res) => {
  if (req.url === '/download' || req.url === '/TrackYourMovement.apk') {
    if (!fs.existsSync(APK_PATH)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('APK file not ready yet. Please wait for the build to finish.');
    }
    const stat = fs.statSync(APK_PATH);
    res.writeHead(200, {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Length': stat.size,
      'Content-Disposition': 'attachment; filename="TrackYourMovement.apk"'
    });
    fs.createReadStream(APK_PATH).pipe(res);
    return;
  }

  const apkExists = fs.existsSync(APK_PATH);
  const sizeMb = apkExists ? (fs.statSync(APK_PATH).size / (1024 * 1024)).toFixed(1) : 0;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Download Track your movement App</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #F8FAF9;
      color: #1A1A1A;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background: white;
      border-radius: 24px;
      padding: 32px 24px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
      border: 1px solid rgba(79, 169, 154, 0.15);
    }
    .logo {
      width: 80px;
      height: 80px;
      background: #4FA99A;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      box-shadow: 0 8px 16px rgba(79, 169, 154, 0.25);
    }
    .logo svg {
      width: 44px;
      height: 44px;
      fill: none;
      stroke: white;
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #111;
    }
    p {
      color: #666;
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 24px 0;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 16px 0;
      background: #4FA99A;
      color: white;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 14px;
      box-shadow: 0 4px 12px rgba(79, 169, 154, 0.35);
      transition: transform 0.1s ease;
      box-sizing: border-box;
    }
    .btn:active {
      transform: scale(0.98);
    }
    .steps {
      margin-top: 24px;
      text-align: left;
      background: #F8FAF9;
      padding: 16px;
      border-radius: 12px;
      font-size: 13px;
      color: #444;
      line-height: 1.6;
    }
    .steps ol {
      margin: 0;
      padding-left: 20px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <svg viewBox="0 0 24 24">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    </div>
    <h1>Track your movement</h1>
    <p>Standalone Android Mobile App (${sizeMb > 0 ? sizeMb + ' MB' : 'Ready to install'})</p>
    
    <a href="/download" class="btn">Download & Install APK</a>

    <div class="steps">
      <strong>Installation Steps:</strong>
      <ol>
        <li>Tap the download button above</li>
        <li>Open the downloaded <code>TrackYourMovement.apk</code> file</li>
        <li>If prompted, allow <em>"Install unknown apps"</em> for your browser</li>
        <li>Tap <strong>Install</strong> and enjoy!</li>
      </ol>
    </div>
  </div>
</body>
</html>
  `);
});

server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIp();
  console.log(`APK Download Server running:`);
  console.log(`- Local URL:   http://localhost:${PORT}`);
  console.log(`- On Phone:    http://${ip}:${PORT}`);
});
