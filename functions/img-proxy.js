/**
 * Cloudflare Pages Function: /img-proxy?url=ENCODED_URL
 * 服务端代理，解决跨域图片无法在 html-to-image 中内联的问题
 */
export async function onRequest(context) {
  const { request } = context
  const url = new URL(request.url)
  const target = url.searchParams.get('url')

  if (!target) {
    return new Response('Missing url parameter', { status: 400 })
  }

  // 安全校验：只允许 http/https 协议
  let targetUrl
  try {
    targetUrl = new URL(target)
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return new Response('Invalid URL protocol', { status: 400 })
    }
  } catch {
    return new Response('Invalid URL', { status: 400 })
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Markdown2Card/1.0)' },
      cf: { cacheTtl: 3600, cacheEverything: true }
    })

    if (!response.ok) {
      return new Response(`Upstream error: ${response.status}`, { status: response.status })
    }

    const contentType = response.headers.get('Content-Type') || 'image/jpeg'
    const body = await response.arrayBuffer()

    return new Response(body, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff'
      }
    })
  } catch (e) {
    return new Response('Proxy error: ' + e.message, { status: 502 })
  }
}
