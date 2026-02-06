import React, { useState } from 'react';

const PDFPreview = ({ fileUrl }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setError('Error al cargar el PDF');
    setLoading(false);
  };

  return (
    <div className="pdf-preview flex flex-col items-center w-full">
      {loading && (
        <div className="py-10 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {error && (
        <div className="py-10 text-center text-red-500">
          <p>{error}</p>
          <p className="text-sm mt-2">Intenta descargar el archivo para verlo.</p>
        </div>
      )}
      
      <iframe
        src={`${fileUrl}#toolbar=0&navpanes=0`}
        className="w-full h-[600px] border-0 rounded-md"
        onLoad={handleLoad}
        onError={handleError}
        title="PDF Preview"
      />
    </div>
  );
};

export default PDFPreview;