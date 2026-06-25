import { useCallback, useEffect, useState } from 'react';

import {
  createLocation,
  loadAppData,
  saveBufferTimeMinutes,
  saveReadyTimeOffsetMinutes,
  saveRushHourPeakTimes,
  upsertLocation,
} from '../storage/store';

export function useAppData() {
  const [locations, setLocations] = useState([]);
  const [readyTimeOffsetMinutes, setReadyTimeOffsetMinutes] = useState(null);
  const [bufferTimeMinutes, setBufferTimeMinutes] = useState(null);
  const [rushHourPeakStart, setRushHourPeakStart] = useState('');
  const [rushHourPeakEnd, setRushHourPeakEnd] = useState('');
  const [loading, setLoading] = useState(true);

  const applyLoadedData = useCallback((data) => {
    setLocations(data.locations);
    setReadyTimeOffsetMinutes(data.readyTimeOffsetMinutes);
    setBufferTimeMinutes(data.bufferTimeMinutes);
    setRushHourPeakStart(data.rushHourPeakStart);
    setRushHourPeakEnd(data.rushHourPeakEnd);
  }, []);

  const loadFromStorage = useCallback(async () => {
    setLoading(true);
    try {
      applyLoadedData(await loadAppData());
    } catch (error) {
      console.error('Failed to load app data:', error);
    } finally {
      setLoading(false);
    }
  }, [applyLoadedData]);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const addLocation = useCallback(async ({ name, rushHourAllowanceMinutes }) => {
    const location = createLocation({ name, rushHourAllowanceMinutes });
    setLocations(await upsertLocation(location));
  }, []);

  const updateLocation = useCallback(async (location) => {
    setLocations(await upsertLocation(location));
  }, []);

  const updateReadyTimeOffset = useCallback(async (minutes) => {
    setReadyTimeOffsetMinutes(await saveReadyTimeOffsetMinutes(minutes));
  }, []);

  const updateBufferTime = useCallback(async (minutes) => {
    setBufferTimeMinutes(await saveBufferTimeMinutes(minutes));
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
    bufferTimeMinutes,
    rushHourPeakStart,
    rushHourPeakEnd,
    addLocation,
    updateLocation,
    updateReadyTimeOffset,
    updateBufferTime,
    updateRushHourPeakTimes,
    reload: loadFromStorage,
  };
}
