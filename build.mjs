// Keybloom build: bundle src/main.js into one IIFE and inline it, with src/styles.css and the
// bundled OFL fonts (base64), into src/index.html → dist/keybloom.html.
// The output is a single self-contained file that works offline (pattern borrowed from Gridforge).
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';

const dev = process.argv.includes('--dev');

const result = await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  minify: !dev,
  sourcemap: false,
  target: ['es2020'],
  write: false,
  legalComments: 'none',
});

const fontFile = (pkg, name) =>
  readFileSync(`node_modules/@fontsource/${pkg}/files/${name}`).toString('base64');
const face = (family, pkg, file, weight) =>
  `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;` +
  `src:url(data:font/woff2;base64,${fontFile(pkg, file)}) format('woff2');}`;
const fonts = [
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible', 'atkinson-hyperlegible-latin-400-normal.woff2', 400),
  face('Atkinson Hyperlegible', 'atkinson-hyperlegible', 'atkinson-hyperlegible-latin-700-normal.woff2', 700),
  face('OpenDyslexic', 'opendyslexic', 'opendyslexic-latin-400-normal.woff2', 400),
  face('OpenDyslexic', 'opendyslexic', 'opendyslexic-latin-700-normal.woff2', 700),
].join('\n');

const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = fonts + '\n' + readFileSync('src/styles.css', 'utf8');
const tpl = readFileSync('src/index.html', 'utf8');
if (!tpl.includes('<!--BUNDLE-->') || !tpl.includes('/*STYLES*/')) throw new Error('template slots missing');

const html = tpl
  .replace('/*STYLES*/', () => css)
  .replace('<!--BUNDLE-->', () => `<script>${js}</script>`);

mkdirSync('dist', { recursive: true });
writeFileSync('dist/keybloom.html', html);
const kb = (statSync('dist/keybloom.html').size / 1024).toFixed(0);
console.log(`dist/keybloom.html  ${kb} KB${dev ? ' (dev)' : ''}`);
if (kb > 1536) throw new Error('Build is over the 1.5 MB budget');
