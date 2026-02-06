import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const useFilePreview = (documentId) => {
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFileData = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('materiales_metadata')
          .select('file_url, tipo_archivo')
          .eq('id', documentId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        setFileData(data);
      } catch (err) {
        setError('Error fetching file data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchFileData();
    }
  }, [documentId]);

  return { fileData, loading, error };
};

export default useFilePreview;