import React, { useState, useEffect } from 'react';

const DefaultPreview = ({ fileUrl, fileName }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      || (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);
    setIsMobile(mobile);
  }, []);

  // Si hay una URL de archivo, intentar mostrarlo con Google Docs Viewer
  if (fileUrl) {
    const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`;
    
    return (
      <div className="flex flex-col items-center w-full">
        <iframe
          src={googleViewerUrl}
          className="w-full h-[600px] border-0 rounded-md"
          title="Document Preview"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
        <div className="mt-3 text-center">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            ¿No se ve? Abrir archivo en nueva pestaña
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Vista previa no disponible</h2>
      <p className="text-gray-600 text-center">
        El tipo de archivo que intentas visualizar no es compatible. 
        Por favor, descarga el archivo para verlo en tu dispositivo.
      </p>
    </div>
  );
};

export default DefaultPreview;