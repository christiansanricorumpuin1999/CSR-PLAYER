import React, { useEffect, useState } from 'react';

interface ArtworkImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallback: React.ReactNode;
}

export function ArtworkImage({ src, alt, className, fallback }: ArtworkImageProps) {
  const [current, setCurrent] = useState(src);

  useEffect(() => {
    setCurrent(src);
  }, [src]);

  if (!current) return <>{fallback}</>;

  return (
    <img
      src={current}
      alt={alt}
      className={className}
      onError={() => setCurrent(undefined)}
    />
  );
}
