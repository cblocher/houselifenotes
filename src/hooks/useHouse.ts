import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Country } from '../lib/currency';

export function useHouse(houseId: string | null) {
  const [country, setCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!houseId) {
      setCountry(null);
      return;
    }

    const loadHouseCountry = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('houses')
          .select('country')
          .eq('id', houseId)
          .is('deleted_at', null)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setCountry(data.country);
        }
      } catch (error) {
        console.error('Error loading house country:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHouseCountry();
  }, [houseId]);

  return { country, loading };
}
