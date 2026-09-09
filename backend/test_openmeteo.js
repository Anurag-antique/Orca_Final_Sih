(async () => {
  try {
    const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=18.9220&longitude=72.8347&current=temperature_2m,wind_speed_10m', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      console.log('[OPEN-METEO TEST] Successfully reached Open-Meteo API!');
      console.log('[OPEN-METEO TEST] Temp:', data.current?.temperature_2m, 'Wind:', data.current?.wind_speed_10m);
    } else {
      console.log('[OPEN-METEO TEST] Response status:', res.status);
    }
  } catch (err) {
    console.log('[OPEN-METEO TEST] Network check:', err.message);
  }
})();
