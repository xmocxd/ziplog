import { useCallback, useEffect, useState } from 'react';

import {
  createLocation,
  loadAppData,
  saveReadyTimeOffsetMinutes,
  saveRushHourPeakTimes,
  upsertLocation,
} from '../storage/store';

export function useAppData() {
  const [locations, setLocations] = useState([]);
  const [readyTimeOffsetMinutes, setReadyTimeOffsetMinutes] = useState(null);
  const [rushHourPeakStart, setRushHourPeakStart] = useState('');
  const [rushHourPeakEnd, setRushHourPeakEnd] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    loadAppData()
      .then((data) => {
        if (!active) return;
        setLocations(data.locations);
        setReadyTimeOffsetMinutes(data.readyTimeOffsetMinutes);
        setRushHourPeakStart(data.rushHourPeakStart);
        setRushHourPeakEnd(data.rushHourPeakEnd);
      })
      .catch((error) => console.error('Failed to load app data:', error))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const addLocation = useCallback(async ({ name, rushHourAllowanceMinutes }) => {
    const location = createLocation({ name, rushHourAllowanceMinutes });
    setLocations(await upsertLocation(location));
  }, []);

  const updateLocation = useCallback(async (location) => {
    setLocations(await upsertLocation(location));
  }, []);

  const updateReadyTimeOffset = useCallback(async (minutes) => {
    const saved = await saveReadyTimeOffsetMinutes(minutes);
    setReadyTimeOffsetMinutes(saved);
  }, []);

  const updateRushHourPeakTimes = useCallback(async (start, end) => {
    const saved = await saveRushHourPeakTimes(start, end);
    setRushHourPeakStart(saved.rushHourPeakStart);
    setRushHourPeakEnd(saved.rushHourPeakEnd);
  }, []);

  return {
    locations,
    loading,
    readyTimeOffsetMinutes,
    rushHourPeakStart,
    rushHourPeakEnd,
    addLocation,
    updateLocation,
    updateReadyTimeOffset,
    updateRushHourPeakTimes,
  };
}
