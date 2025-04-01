// CachedImage.jsx
import React, { useState, useEffect } from 'react';
import imageCache from '../utils/cacheImage';

interface CachedImageProps {
    src: string;
    alt: string;
    className: string;
    width: number;
    height: number;
    [key: string]: any; // for the ...props
  }

  const CachedImage = ({ src, alt, className, width, height, ...props }: CachedImageProps) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      setLoading(true);
      try {
        const cachedSrc = await imageCache.getImage(src);
        if (isMounted) {
          setImageSrc(cachedSrc);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading image:', error);
        if (isMounted) {
          setImageSrc(src); // Fallback to original source
          setLoading(false);
        }
      }
    };
    
    loadImage();
    
    return () => {
      isMounted = false;
    };
  }, [src]);
  
  return (
    <>
      {loading ? (
        <div 
          className={`${className} flex items-center justify-center bg-gray-200`}
          style={{ width, height }}
        >
          <span className="animate-pulse">Loading...</span>
        </div>
      ) : (
        <img
        src={imageSrc?.toString()}
        alt={alt}
        className={className}
        width={width}
        height={height}
        {...props}
        />
      )}
    </>
  );
};

export default CachedImage;