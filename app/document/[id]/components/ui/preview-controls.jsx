import React from 'react';

const PreviewControls = ({ onZoomIn, onZoomOut, onDownload }) => {
  return (
    <div className="flex justify-between items-center p-4 bg-gray-100 rounded-md shadow-md">
      <div className="flex items-center">
        <button 
          onClick={onZoomOut} 
          className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200"
        >
          Zoom Out
        </button>
        <button 
          onClick={onZoomIn} 
          className="ml-2 px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200"
        >
          Zoom In
        </button>
      </div>
      <button 
        onClick={onDownload} 
        className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        Download
      </button>
    </div>
  );
};

export default PreviewControls;