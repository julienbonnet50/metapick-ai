import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import imageCache from '../utils/cacheImage';

const CachedImage: React.FC<CachedImageProps> = ({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  priority = false, 
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(imageCache.cache.has(src));
  const [imageSrc, setImageSrc] = useState(imageCache.getImage(src));

  useEffect(() => {
    if (!isLoaded) {
      const loadImage = async () => {
        try {
          await imageCache.loadImage(src);
          setImageSrc(imageCache.getImage(src));
          setIsLoaded(true);
        } catch (error) {
          console.error(`Failed to load image: ${src}`, error);
          // Still set the original source to allow Next.js to handle it
          setImageSrc(src);
        }
      };
      
      loadImage();
    }
  }, [src, isLoaded]);

  return (
    <>
      {!isLoaded && (
        <div 
          className={`${className} flex items-center justify-center bg-gray-200`}
          style={{ width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height }}
        >
          <div className="loading loading-spinner loading-sm"></div>
        </div>
      )}
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${!isLoaded ? 'hidden' : ''}`}
        priority={priority}
        {...props}
      />
    </>
  );
};

export default CachedImage;  // Default export
