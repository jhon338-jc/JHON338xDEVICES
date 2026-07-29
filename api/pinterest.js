// API Unsplash Search untuk Vercel
// GRATIS, tanpa API key, hasil HD

export default async function handler(req, res) {
  const { query, page = 1 } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query tidak boleh kosong' });
  }

  try {
    // Unsplash search (gratis, rate limit ~50 req/jam)
    const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=20&page=${page}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      // Fallback ke API alternatif
      return await fallbackSearch(query, res);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return await fallbackSearch(query, res);
    }

    const images = data.results.map(img => ({
      url: img.urls?.regular || img.urls?.small || '',
      thumb: img.urls?.thumb || img.urls?.small || '',
      title: img.alt_description || img.description || 'Unsplash Image',
      width: img.width || 1080,
      height: img.height || 720,
      author: img.user?.name || 'Unknown',
      download: img.links?.download || ''
    }));

    res.json({
      success: true,
      query: query,
      source: 'unsplash',
      total: data.total || images.length,
      page: parseInt(page),
      images: images
    });

  } catch (e) {
    console.error('API Error:', e);
    await fallbackSearch(query, res);
  }
}

// Fallback: Pexels API (juga gratis)
async function fallbackSearch(query, res) {
  try {
    const url = `https://www.pexels.com/en-us/search/${encodeURIComponent(query)}/`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await response.text();
    
    // Ekstrak URL gambar dari data JSON di HTML
    const jsonMatch = html.match(/<script type="application\/json" data-hydra="search">(.*?)<\/script>/);
    
    if (jsonMatch && jsonMatch[1]) {
      const data = JSON.parse(jsonMatch[1]);
      const photos = data?.results || data?.photos || [];
      
      const images = photos.map(photo => ({
        url: photo.src?.large || photo.src?.original || '',
        thumb: photo.src?.small || photo.src?.medium || '',
        title: photo.alt || 'Pexels Image',
        width: photo.width || 1080,
        height: photo.height || 720,
        author: photo.photographer || 'Unknown'
      })).filter(img => img.url);

      if (images.length > 0) {
        return res.json({
          success: true,
          query: query,
          source: 'pexels',
          total: images.length,
          page: 1,
          images: images.slice(0, 30)
        });
      }
    }

    // Fallback terakhir: Lorem Picsum (random images)
    const dummyImages = [];
    for (let i = 0; i < 20; i++) {
      dummyImages.push({
        url: `https://picsum.photos/800/1000?random=${i}`,
        thumb: `https://picsum.photos/200/300?random=${i}`,
        title: `${query} - Image ${i + 1}`,
        width: 800,
        height: 1000,
        author: 'Lorem Picsum'
      });
    }

    res.json({
      success: true,
      query: query,
      source: 'picsum',
      total: dummyImages.length,
      page: 1,
      images: dummyImages
    });

  } catch (e2) {
    console.error('Fallback Error:', e2);
    res.json({
      success: false,
      error: 'Gagal mengambil gambar. Coba lagi nanti.',
      images: []
    });
  }
}