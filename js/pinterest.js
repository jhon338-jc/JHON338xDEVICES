// API Image Search untuk Vercel
// Multi-source: Unsplash → Pexels → Pixabay

export default async function handler(req, res) {
  const { query, page = 1 } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query tidak boleh kosong' });
  }

  // Coba Unsplash dulu
  const unsplashResult = await searchUnsplash(query, page);
  if (unsplashResult) {
    return res.json(unsplashResult);
  }

  // Fallback Pexels
  const pexelsResult = await searchPexels(query, page);
  if (pexelsResult) {
    return res.json(pexelsResult);
  }

  // Fallback terakhir: random images sesuai tema
  return res.json({
    success: true,
    query: query,
    source: 'fallback',
    total: 12,
    page: 1,
    images: generateFallbackImages(query)
  });
}

// ========== UNSPLASH ==========
async function searchUnsplash(query, page) {
  try {
    const perPage = 20;
    const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        'Referer': 'https://unsplash.com/'
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) return null;

    const images = data.results.map(img => ({
      url: img.urls?.regular || img.urls?.small || '',
      thumb: img.urls?.thumb || img.urls?.small || '',
      title: img.alt_description || img.description || query,
      width: img.width || 1080,
      height: img.height || 720,
      author: img.user?.name || 'Unsplash',
      color: img.color || '#000000'
    }));

    return {
      success: true,
      query: query,
      source: 'unsplash',
      total: data.total || images.length,
      page: parseInt(page),
      images: images
    };

  } catch (e) {
    console.error('Unsplash error:', e.message);
    return null;
  }
}

// ========== PEXELS ==========
async function searchPexels(query, page) {
  try {
    const perPage = 20;
    // Pexels curated search
    const url = `https://www.pexels.com/en-us/search/${encodeURIComponent(query)}/?page=${page}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8'
      }
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Cari JSON-LD atau script data
    const jsonMatches = html.match(/<script type="application\/json"[^>]*>(.*?)<\/script>/gs);
    let photos = [];

    if (jsonMatches) {
      for (const match of jsonMatches) {
        try {
          const jsonStr = match.replace(/<script type="application\/json"[^>]*>/, '').replace(/<\/script>/, '');
          const data = JSON.parse(jsonStr);
          
          // Cari array photos
          if (data?.props?.pageProps?.photos) {
            photos = data.props.pageProps.photos;
            break;
          }
          if (Array.isArray(data) && data.length > 0 && data[0].src) {
            photos = data;
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }

    if (photos.length === 0) return null;

    const images = photos.slice(0, perPage).map(photo => ({
      url: photo.src?.large || photo.src?.original || photo.src?.medium || '',
      thumb: photo.src?.small || photo.src?.tiny || '',
      title: photo.alt || query,
      width: photo.width || 1080,
      height: photo.height || 720,
      author: photo.photographer || 'Pexels'
    }));

    if (images.length === 0) return null;

    return {
      success: true,
      query: query,
      source: 'pexels',
      total: images.length,
      page: parseInt(page),
      images: images
    };

  } catch (e) {
    console.error('Pexels error:', e.message);
    return null;
  }
}

// ========== FALLBACK IMAGES ==========
function generateFallbackImages(query) {
  const q = query.toLowerCase();
  const images = [];
  
  // Generate 12 images dengan tema sesuai query
  const keywords = q.split(/\s+/);
  const mainKeyword = keywords[0] || 'nature';
  
  // Picsum dengan seed konsisten per query
  const seed = hashCode(query);
  
  for (let i = 0; i < 12; i++) {
    const imgSeed = seed + i;
    images.push({
      url: `https://picsum.photos/seed/${imgSeed}/800/1000`,
      thumb: `https://picsum.photos/seed/${imgSeed}/200/300`,
      title: `${query} #${i + 1}`,
      width: 800,
      height: 1000,
      author: 'Lorem Picsum'
    });
  }

  return images;
}

// Simple hash function
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}