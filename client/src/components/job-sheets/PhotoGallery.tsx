import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Image, Maximize } from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface PhotoGalleryProps {
  photos: string[];
  title?: string;
  className?: string;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ 
  photos, 
  title = 'Photos', 
  className = ''
}) => {
  const [open, setOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <Card className={`${className} overflow-hidden`}>
        <CardContent className="p-4">
          <div className="flex flex-col items-center justify-center h-40 bg-gray-100 rounded-md">
            <Image className="h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No photos available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const openLightbox = (index: number) => {
    setPhotoIndex(index);
    setOpen(true);
  };

  const slides = photos.map(photo => ({ src: photo }));

  return (
    <div className={className}>
      <h3 className="text-lg font-medium mb-3">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div 
            key={index} 
            className="relative aspect-square group cursor-pointer rounded-md overflow-hidden border border-gray-200"
            onClick={() => openLightbox(index)}
          >
            <img 
              src={photo} 
              alt={`Photo ${index + 1}`} 
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize className="h-6 w-6 text-white" />
            </div>
          </div>
        ))}
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={slides}
        index={photoIndex}
      />
    </div>
  );
};

export default PhotoGallery;