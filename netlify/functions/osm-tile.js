/**
 * osm-tile.js (Netlify Function)
 * ------------------------------------------------------------------
 * Mismo motivo que esri-tile.js: tile.openstreetmap.org tampoco envía
 * cabeceras CORS (confirmado — es un problema ampliamente reportado
 * por usuarios de librerías WebGL como MapLibre/Mapbox GL), así que
 * sin este proxy el basemap de OpenStreetMap tampoco se dibuja.
 *
 * Se incluye un User-Agent identificable en la petición a OSM, tal
 * como pide su política de uso de tiles (switch2osm.org/tile-serving
 * usage-policy): no usar el user-agent por defecto de librerías HTTP.
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

  const upstreamUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Visor-GIS-Puerto-Rico/1.0 (Netlify Function proxy)',
      },
    });
    if (!upstream.ok) {
      return new Response('Tile no encontrado', { status: upstream.status });
    }
    const buffer = await upstream.arrayBuffer();
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'image/png',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    });
  } catch {
    return new Response('Error al contactar el servicio de OpenStreetMap', { status: 502 });
  }
};

export const config = {
  path: '/api/osm-tile',
};