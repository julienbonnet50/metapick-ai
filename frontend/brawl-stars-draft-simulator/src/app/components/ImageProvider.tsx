import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import imageCache from '../utils/cacheImage';

// Define the shape of the context
interface ImageCacheContextProps {
  imagesReady: boolean;
  preloadImages: (sources: string[]) => Promise<void>;
}

// Create context with proper default values
const ImageCacheContext = createContext<ImageCacheContextProps>({
  imagesReady: false,
  preloadImages: async () => {},
});

// Custom hook to use the image cache context
export const useImageCache = () => useContext(ImageCacheContext);

// Define the props for the provider
interface ImageProviderProps {
  children: ReactNode; // Ensures 'children' is correctly typed
  imageSources?: string[]; // Optional array of image sources
}

// Image Provider component
export const ImageProvider: React.FC<ImageProviderProps> = ({ children, imageSources = [] }) => {
  const [imagesReady, setImagesReady] = useState(false);

  const preloadImages = async (sources: string[]) => {
    try {
      await imageCache.preloadImages(sources);
      setImagesReady(true);
    } catch (error) {
      console.error('Failed to preload images:', error);
      setImagesReady(true); // Avoid UI blocking
    }
  };

  useEffect(() => {
    if (imageSources.length > 0) {
      preloadImages(imageSources);
    }
  }, [imageSources]);

  return (
    <ImageCacheContext.Provider value={{ imagesReady, preloadImages }}>
      {children}
    </ImageCacheContext.Provider>
  );
};

export default ImageProvider;
