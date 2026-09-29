
/**
 * esri-tile.js (Netlify Function)
 * ------------------------------------------------------------------
 * Proxy ligero para los tiles del servicio gratuito de Esri World
 * Imagery. Existe por un motivo puramente técnico: MapLibre GL JS
 * dibuja el mapa con WebGL y necesita subir cada tile como textura,
 * lo cual el navegador solo permite si la respuesta trae cabeceras
 * CORS (Access-Control-Allow-Origin). El servicio público clásico de
 * Esri (server.arcgisonline.com) no las envía, así que el tile se
 * descarga (por eso el Network tab mostraba 200) pero el navegador
 * bloquea usarlo para pintar el mapa, en silencio.
 *
 * Esta función pide el tile a Esri desde el servidor (donde no
 * aplican las reglas CORS del navegador) y lo reenvía al cliente
 * añadiendo `Access-Control-Allow-Origin: *`. Así seguimos usando
 * el servicio 100% gratuito de Esri, sin cuentas ni tokens.
 * ------------------------------------------------------------------
 */
export default async (request) => {
  const url = new URL(request.url);
  const z = url.searchParams.get('z');
  const x = url.searchParams.get('x');
  const y = url.searchParams.get('y');

  if (!z || !x || !y) {
    return new Response('Faltan parámetros z/x/y', { status: 400 });
  }

  const upstreamUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

  try {
    const upstream = await fetch(upstreamUrl);
    if (!upstream.ok) {
      return new Response('Tile no encontrado', { status: upstream.status });
    }
    const buffer = await upstream.arrayBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'image/jpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    });
  } catch {
    return new Response('Error al contactar el servicio de Esri', { status: 502 });
  }
};

export const config = {
  path: '/api/esri-tile',
};