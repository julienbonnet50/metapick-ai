class ImageCache {
  constructor() {
    this.cache = new Map();
    this.loading = new Map();
    this.ready = false;
  }

  async preloadImages(sources) {
    const promises = sources.map(src => this.loadImage(src));
    await Promise.all(promises);
    this.ready = true;
    return this;
  }

  async loadImage(src) {
    if (this.cache.has(src)) {
      return Promise.resolve(this.cache.get(src));
    }

    // If this image is already loading, return the existing promise
    if (this.loading.has(src)) {
      return this.loading.get(src);
    }

    // Create a new promise for this image
    const loadPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.cache.set(src, src);
        this.loading.delete(src);
        resolve(src);
      };
      img.onerror = (error) => {
        this.loading.delete(src);
        reject(error);
      };
      img.src = src;
    });

    this.loading.set(src, loadPromise);
    return loadPromise;
  }

  getImage(src) {
    return this.cache.get(src) || src;
  }

  isReady() {
    return this.ready;
  }

  clearCache() {
    this.cache.clear();
    this.loading.clear();
    this.ready = false;
  }
}

const imageCache = new ImageCache();
export default imageCache;