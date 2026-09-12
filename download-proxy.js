const SOURCE = 'https://github.com/jrb3ss0/downloaders/releases/download/downloads/';
const UPLOAD = 'https://uploads.github.com/repos/jrb3ss0/downloaders/releases/387673081/assets?name=';
const SITE_ORIGIN = 'https://jrb3ss0.github.io';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': SITE_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, X-GitHub-Api-Version',
    'Access-Control-Max-Age': '86400'
  };
}

function safeName(value, fallback) {
  const text = String(value || fallback).trim().slice(0, 160)
    .replaceAll(String.fromCharCode(13), '')
    .replaceAll(String.fromCharCode(10), '')
    .replaceAll('/', '-')
    .replaceAll(String.fromCharCode(92), '-');
  return text || fallback;
}

function validAssetName(fileName) {
  return Boolean(fileName) && fileName.length <= 240 && !fileName.includes('/') && !fileName.includes(String.fromCharCode(92)) && !fileName.includes('..');
}

function extensionOf(fileName) {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 && dot < fileName.length - 1 ? fileName.slice(dot) : '';
}

function suffix(length) {
  if (!length) return '';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, value => String(value % 10)).join('');
}

async function uploadAsset(request, url) {
  const fileName = url.searchParams.get('name') || '';
  const authorization = request.headers.get('Authorization') || '';
  if (!validAssetName(fileName)) return new Response(JSON.stringify({ message: 'Invalid file name.' }), { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });
  if (!authorization.startsWith('Bearer ')) return new Response(JSON.stringify({ message: 'A GitHub access token is required.' }), { status: 401, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } });

  const upstream = await fetch(UPLOAD + encodeURIComponent(fileName), {
    method: 'POST',
    headers: {
      Authorization: authorization,
      Accept: 'application/vnd.github+json',
      'Content-Type': request.headers.get('Content-Type') || 'application/octet-stream',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: request.body
  });

  const headers = new Headers(corsHeaders());
  headers.set('Content-Type', upstream.headers.get('Content-Type') || 'application/json');
  return new Response(upstream.body, { status: upstream.status, headers });
}

async function downloadAsset(request, url) {
  const asset = url.searchParams.get('asset') || '';
  if (!validAssetName(asset)) return new Response('Invalid release asset name.', { status: 400 });

  const requestedDigits = Number.parseInt(url.searchParams.get('digits') || '0', 10);
  const digits = Number.isFinite(requestedDigits) ? Math.min(Math.max(requestedDigits, 0), 20) : 0;
  const extension = extensionOf(asset);
  const fallback = asset.slice(0, asset.length - extension.length) || 'download';
  const downloadName = safeName(url.searchParams.get('name'), fallback) + suffix(digits) + extension;
  const upstream = await fetch(SOURCE + encodeURIComponent(asset), { method: request.method, redirect: 'follow' });

  if (!upstream.ok) return new Response('The requested release asset was not found.', { status: upstream.status });

  const headers = new Headers();
  headers.set('Content-Type', upstream.headers.get('Content-Type') || 'application/octet-stream');
  headers.set('Content-Disposition', 'attachment; filename*=UTF-8' + String.fromCharCode(39) + String.fromCharCode(39) + encodeURIComponent(downloadName));
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  const contentLength = upstream.headers.get('Content-Length');
  if (contentLength) headers.set('Content-Length', contentLength);

  return new Response(request.method === 'HEAD' ? null : upstream.body, { status: 200, headers });
}

addEventListener('fetch', event => event.respondWith((async () => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method === 'OPTIONS' && url.pathname === '/upload') return new Response(null, { status: 204, headers: corsHeaders() });
  if (request.method === 'POST' && url.pathname === '/upload') return uploadAsset(request, url);
  if (request.method === 'GET' || request.method === 'HEAD') return downloadAsset(request, url);
  return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD, POST, OPTIONS' } });
})()));
