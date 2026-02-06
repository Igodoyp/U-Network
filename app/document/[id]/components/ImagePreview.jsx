import React from 'react';

const ImagePreview = ({ src, alt }) => {
  return (
    <div className="flex items-center justify-center bg-gray-100 p-4 rounded-lg">
      <img src={src} alt={alt} className="max-w-full max-h-[600px] object-contain" />
    </div>
  );
};

export default ImagePreview;