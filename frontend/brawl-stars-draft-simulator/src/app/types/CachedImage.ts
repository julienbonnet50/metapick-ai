interface CachedImageProps {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
    priority?: boolean;
    [key: string]: any; // Allows additional props
  }