import React, { useState, useEffect } from 'react';
import PDFPreview from './PDFPreview';
import ImagePreview from './ImagePreview';
import DefaultPreview from './DefaultPreview';

const DocumentPreview = ({ document }) => {
  const [previewType, setPreviewType] = useState('default');
  
  useEffect(() => {
    // Detectar el tipo de archivo basado en la extensión
    if (document.fileUrl) {
      const extension = document.fileUrl.split('.').pop()?.toLowerCase();
      
      if (['pdf'].includes(extension)) {
        setPreviewType('pdf');
      } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
        setPreviewType('image');
      } else {
        setPreviewType('default');
      }
    }
  }, [document.fileUrl]);

  // Renderizar el componente adecuado según el tipo de archivo
  switch (previewType) {
    case 'pdf':
      return <PDFPreview fileUrl={document.fileUrl} />;
    case 'image':
      return <ImagePreview src={document.fileUrl} alt={document.titulo} />;
    default:
      return <DefaultPreview />;
  }
};

export default DocumentPreview;