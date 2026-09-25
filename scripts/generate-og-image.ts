import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function generateOgImage() {
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = path.join(publicDir, 'og-image.png');

  let browser;
  try {
    browser = await chromium.launch();
  } catch {
    try {
      browser = await chromium.launch({ channel: 'msedge' });
    } catch {
      browser = await chromium.launch({ channel: 'chrome' });
    }
  }

  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 630px;
      background: linear-gradient(135deg, #0a0f1d 0%, #0d1a33 50%, #102447 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 64px 72px;
      position: relative;
      overflow: hidden;
    }
    .grid-bg {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image: 
        linear-gradient(rgba(37, 99, 235, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(37, 99, 235, 0.08) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
    }
    .accent-glow {
      position: absolute;
      top: -100px;
      right: -100px;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.35) 0%, rgba(37, 99, 235, 0) 70%);
      border-radius: 50%;
      pointer-events: none;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      position: relative;
      z-index: 2;
    }
    .logo-badge {
      width: 56px;
      height: 56px;
      background: #2563eb;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
    }
    .brand-name {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
    }
    .brand-tag {
      font-size: 13px;
      font-weight: 600;
      color: #60a5fa;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      background: rgba(37, 99, 235, 0.2);
      border: 1px solid rgba(96, 165, 250, 0.3);
      padding: 6px 12px;
      border-radius: 20px;
      margin-left: 8px;
    }
    .main-content {
      position: relative;
      z-index: 2;
      max-width: 900px;
    }
    .title {
      font-size: 56px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -1px;
      margin-bottom: 20px;
    }
    .title span {
      background: linear-gradient(90deg, #60a5fa, #93c5fd);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .description {
      font-size: 22px;
      line-height: 1.5;
      color: #94a3b8;
      font-weight: 400;
    }
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 24px;
      position: relative;
      z-index: 2;
    }
    .badges {
      display: flex;
      gap: 12px;
    }
    .badge {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      color: #cbd5e1;
    }
    .site-url {
      font-size: 18px;
      font-weight: 700;
      color: #60a5fa;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="accent-glow"></div>
  
  <div class="header">
    <div class="logo-badge">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
        <path d="M6 6h10"/>
        <path d="M6 10h10"/>
        <path d="M6 14h6"/>
      </svg>
    </div>
    <div class="brand-name">CivilMath</div>
    <div class="brand-tag">Engineering Suite</div>
  </div>

  <div class="main-content">
    <h1 class="title">Professional Civil Engineering <span>Calculators</span></h1>
    <p class="description">Fast, accurate calculations for concrete design, beam analysis, rebar BBS schedules, geotechnical bearing capacity, and surveying.</p>
  </div>

  <div class="footer">
    <div class="badges">
      <div class="badge">Concrete & Mix</div>
      <div class="badge">Beam & Column Analysis</div>
      <div class="badge">Rebar BBS Generator</div>
      <div class="badge">Soil & Surveying</div>
    </div>
    <div class="site-url">civilmath.com</div>
  </div>
</body>
</html>
  `;

  await page.setContent(html);
  await page.screenshot({ path: outputPath, type: 'png' });
  await browser.close();
  console.log(`Generated og-image.png at ${outputPath}`);
}

generateOgImage().catch(err => {
  console.error('Failed to generate og-image:', err);
  process.exit(1);
});
