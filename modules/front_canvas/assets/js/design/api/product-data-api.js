export async function fetchCanvasProductData(pwId) {
    const response = await fetch(`/wp-json/pw/v1/product-data/${pwId}`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const cacheStatus =
        response.headers.get('x-pw-cache') || response.headers.get('X-PW-Cache');

    return {
        data,
        meta: {
            cacheStatus: cacheStatus || null,
            cacheHit: String(cacheStatus || '').toUpperCase() === 'HIT'
        }
    };
}
