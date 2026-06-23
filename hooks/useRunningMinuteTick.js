import { useEffect, useState } from 'react';

import { getRunningElapsedMinutes } from '../utils/time';

const TICK_MS = 60_000;

export function useRunningElapsedMinutes(startTime, active) {
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    if (!active || !startTime) {
      setMinutes(0);
      return;
    }

    function tick() {
      setMinutes(getRunningElapsedMinutes(startTime));
    }

    tick();
    const interval = setInterval(tick, TICK_MS);
    return () => clearInterval(interval);
  }, [active, startTime]);

  return minutes;
}
