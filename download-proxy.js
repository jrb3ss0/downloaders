const SOURCE = 'https://github.com/jrb3ss0/downloaders/releases/download/downloads/';

function safeName(value, fallback) {
  const text = String(value || fallback).trim().slice(0, 160)
    .replaceAll(String.fromCharCode(13), '')
    .replaceAll(String.fromCharCode(10), '')
    .replaceAll('/', '-')
    .replaceAll(String.fromCharCode(92), '-');
  return text || fallback;
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

async function handleRequest(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }

    const query = new URL(request.url).searchParams;
    const asset = query.get('asset') || '';
    if (!asset || asset.length > 240 || asset.includes('/') || asset.includes(String.fromCharCode(92)) || asset.includes('..')) {
      return new Response('Invalid release asset name.', { status: 400 });
    }

    const requestedDigits = Number.parseInt(query.get('digits') || '0', 10);
    const digits = Number.isFinite(requestedDigits) ? Math.min(Math.max(requestedDigits, 0), 20) : 0;
    const extension = extensionOf(asset);
    const fallback = asset.slice(0, asset.length - extension.length) || 'download';
    const downloadName = safeName(query.get('name'), fallback) + suffix(digits) + extension;
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

addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));
