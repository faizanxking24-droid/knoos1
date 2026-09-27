const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const mode = process.argv[2] || 'after';
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots', mode);

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const routes = [
  { name: 'home', path: '/' },
  { name: 'men', path: '/men' },
  { name: 'women', path: '/women' },
  { name: 'product', path: '/product/apex-runner-x1' },
  { name: 'search', path: '/search' },
  { name: 'cart', path: '/cart' },
  { name: 'login', path: '/login' },
  { name: 'about', path: '/about' },
  { name: 'contact', path: '/contact' },
  { name: 'faq', path: '/faq' },
  { name: 'returns', path: '/returns-refunds' },
  { name: 'privacy', path: '/privacy' },
  { name: 'terms', path: '/terms' },
];

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

async function capture() {
  for (const route of routes) {
    for (const vp of viewports) {
      const filename = `${route.name}_${vp.name}.png`;
      const outPath = path.join(OUTPUT_DIR, filename);
      const url = `http://localhost:3000${route.path}`;
      const cmd = `"${CHROME_PATH}" --headless=new --disable-gpu --virtual-time-budget=3000 --window-size=${vp.width},${vp.height} --screenshot="${outPath}" "${url}"`;
      console.log(`Capturing ${filename} from ${url}...`);
      try {
        execSync(cmd, { stdio: 'ignore', timeout: 20000 });
      } catch (err) {
        console.error(`Failed to capture ${filename}:`, err.message);
      }
    }
  }
  console.log('Capture complete!');
}

capture();
