import React, { useState, useEffect } from 'react';

const PDFPreview = ({ fileUrl }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewerMode, setViewerMode] = useState('native'); // 'native' | 'google' | 'direct'

  useEffect(() => {
    // Detectar dispositivo móvil por user agent (más fiable que ancho de pantalla para capacidades de renderizado PDF)
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) 
        || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
      setIsMobile(mobile);
      // En móvil, usar Google Docs Viewer por defecto
      if (mobile) {
        setViewerMode('google');
      }
    };
    checkMobile();
  }, []);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    // Si falla el visor nativo, intentar con Google Docs
    if (viewerMode === 'native') {
      setViewerMode('google');
      setLoading(true);
      setError(false);
    } else if (viewerMode === 'google') {
      // Si Google Docs también falla, mostrar enlace directo
      setViewerMode('direct');
      setLoading(false);
      setError(true);
    }
  };

  const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`;

  // Modo de enlace directo como último recurso
  if (viewerMode === 'direct' || error) {
    return (
      <div className="pdf-preview flex flex-col items-center w-full">
        <div className="py-10 text-center space-y-4">
          <p className="text-gray-600">No se pudo cargar la vista previa del PDF.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Abrir PDF en nueva pestaña
            </a>
            <button
              onClick={() => {
                setViewerMode('google');
                setError(false);
                setLoading(true);
              }}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
            >
              Reintentar vista previa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-preview flex flex-col items-center w-full">
      {loading && (
        <div className="py-10 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {viewerMode === 'native' && (
        <iframe
          src={`${fileUrl}#toolbar=0&navpanes=0`}
          className="w-full h-[600px] border-0 rounded-md"
          onLoad={handleLoad}
          onError={handleError}
          title="PDF Preview"
        />
      )}

      {viewerMode === 'google' && (
        <iframe
          src={googleViewerUrl}
          className="w-full h-[600px] border-0 rounded-md"
          onLoad={handleLoad}
          onError={handleError}
          title="PDF Preview"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      )}
    </div>
  );
};

export default PDFPreview;