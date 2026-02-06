import React from 'react';

const DefaultPreview = () => {
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