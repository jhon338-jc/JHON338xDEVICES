// API Pinterest Search untuk Vercel
// Scrape dari HTML Pinterest (gratis, tanpa library)

export default async function handler(req, res) {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query tidak boleh kosong' });
  }

  try {
    const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8'
      }
    });

    if (!response.ok) {
      return res.json({ 
        success: false, 
        error: `HTTP ${response.status}`,
        images: []
      });
    }

    const html = await response.text();

    // Cari JSON data di dalam HTML
    const jsonMatch = html.match(/<script id="__PWS_DATA__" type="application\/json">(.*?)<\/script>/);
    
    if (!jsonMatch || !jsonMatch[1]) {
      // Fallback: coba ekstrak gambar langsung dari HTML
      const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
      const images = [];
      let match;
      
      while ((match = imgRegex.exec(html)) !== null) {
        const src = match[1];
        if (src.includes('pinimg.com') && (src.includes('/736x/') || src.includes('/564x/'))) {
          images.push({
            url: src,
            title: '',
            width: 736,
            height: 0
          });
        }
      }
      
      return res.json({
        success: true,
        query: query,
        total: images.length,
        images: [...new Set(images.map(i => i.url))].map(url => ({ url, title: '' }))
      });
    }

    // Parse JSON data
    const data = JSON.parse(jsonMatch[1]);
    const pins = extractPins(data);
    
    const images = pins.map(pin => ({
      url: pin.images?.orig?.url || pin.images?.['736x']?.url || pin.image || '',
      title: pin.title || pin.description || pin.alt_text || '',
      width: pin.images?.orig?.width || 736,
      height: pin.images?.orig?.height || 0
    })).filter(img => img.url && img.url.includes('pinimg.com'));

    // Hapus duplikat
    const uniqueImages = [];
    const seenUrls = new Set();
    
    for (const img of images) {
      if (!seenUrls.has(img.url)) {
        seenUrls.add(img.url);
        uniqueImages.push(img);
      }
    }

    res.json({
      success: true,
      query: query,
      total: uniqueImages.length,
      images: uniqueImages.slice(0, 30)
    });

  } catch (e) {
    console.error('Pinterest API Error:', e);
    res.json({
      success: false,
      error: e.message || 'Gagal mengambil data',
      images: []
    });
  }
}

function extractPins(data) {
  const pins = [];
  
  function search(obj) {
    if (!obj || typeof obj !== 'object') return;
    
    if (Array.isArray(obj)) {
      obj.forEach(item => search(item));
      return;
    }
    
    // Cek apakah ini object pin
    if (obj.images && (obj.images.orig || obj.images['736x'])) {
      pins.push(obj);
    }
    
    // Cari lebih dalam
    Object.values(obj).forEach(val => search(val));
  }
  
  search(data);
  return pins;
}