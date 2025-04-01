// imageCache.js
const imageCache = {
    cache: new Map(),
    
    // Add image to cache
    async cacheImage(src) {
      if (this.cache.has(src)) {
        return this.cache.get(src);
      }
      
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        const objectURL = URL.createObjectURL(blob);
        this.cache.set(src, objectURL);
        return objectURL;
      } catch (error) {
        console.error(`Failed to cache image: ${src}`, error);
        return src; // Fallback to original source
      }
    },
    
    // Get image from cache or fetch it
    async getImage(src) {
      if (this.cache.has(src)) {
        return this.cache.get(src);
      }
      
      return this.cacheImage(src);
    },
    
    // Preload multiple images
    async preloadImages(sources) {
      return Promise.all(sources.map(src => this.cacheImage(src)));
    },
    
    // Clear cache (for memory management)
    clearCache() {
      this.cache.forEach(objectURL => {
        URL.revokeObjectURL(objectURL);
      });
      this.cache.clear();
    }
  };
  
  export default imageCache;