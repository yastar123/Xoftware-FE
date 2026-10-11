import Image from 'next/image';
import { useState } from 'react';

export default function SafeImage({ src, fallback = "/image-fallback-error.png", alt, ...props }) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc(fallback)}
      {...props}
    />
  );
}
