const OWNER = 'jrb3ss0';
const REPO = 'downloaders';
const TAG = 'downloads';
const SOURCE_BASE = `https://github.com/${OWNER}/${REPO}/releases/download/${TAG}/`;

function cleanBaseName(value, fallback) {
  const name = (value || fallback)
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
  return name || fallback;
}

function extensionOf(fileName) {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 && dot < fileName.length - 1 ? fileName.slice(dot) : '';
}

function randomDigits(length) {
  if (!length) return '';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, value => String(value % 10)).join('');
}

function encodeDispositionName(name, extension) {
  const outputName = `${name}${extension}`;
  const asciiFallback = `download${extension.replace(/[^a-zA-Z0-9.]/g, '') || '.bin'}`;
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(outputName)}`;
}

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }

    const url = new URL(request.url);
    const asset = url.searchParams.get('asset') || '';
    if (!asset || asset.length > 240 || asset.includes('/') || asset.includes('\\') || asset.includes('..') || /[\u0000-\u001F\u007F]/.test(asset)) {
      return new Response('Invalid release asset name.', { status: 400 });
    }

    const requestedDigits = Number.parseInt(url.searchParams.get('digits') || '0', 10);
    const digits = Number.isFinite(requestedDigits) ? Math.min(Math.max(requestedDigits, 0), 20) : 0;
    const originalExtension = extensionOf(asset);
    const fallback = asset.slice(0, asset.length - originalExtension.length) || 'download';
    const outputBaseName = cleanBaseName(url.searchParams.get('name'), fallback);
    const outputName = `${outputBaseName}${randomDigits(digits)}`;

    const upstream = await fetch(`${SOURCE_BASE}${encodeURIComponent(asset)}`, {
      method: request.method,
      headers: { 'User-Agent': 'Downloaders custom filename proxy' },
      redirect: 'follow'
    });

    if (!upstream.ok) {
      return new Response('The requested release asset was not found.', { status: upstream.status });
    }

    const headers = new Headers();
    headers.set('Content-Type', upstream.headers.get('Content-Type') || 'application/octet-stream');
    headers.set('Content-Disposition', encodeDispositionName(outputName, originalExtension));
    headers.set('Cache-Control', 'no-store');
    headers.set('X-Content-Type-Options', 'nosniff');
    const contentLength = upstream.headers.get('Content-Length');
    if (contentLength) headers.set('Content-Length', contentLength);

    return new Response(request.method === 'HEAD' ? null : upstream.body, { status: 200, headers });
  }
};
