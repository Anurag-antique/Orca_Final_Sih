/**
 * Dual-source ocean data service
 * SST: Open-Meteo Marine (live, no key)
 * Chlorophyll: NOAA ERDDAP (bounding box average)
 */

const config = require("../config");

const OPEN_METEO_URL = "https://marine-api.open-meteo.com/v1/marine";
const NOAA_BASE = "https://coastwatch.pfeg.noaa.gov/erddap";
const NOAA_CHL_DATASET = "erdMH1chlamday";
const NOAA_CHL_VAR = "chlorophyll";
const TIMEOUT_MS = (config.incois && config.incois.timeoutMs) || 6000;

async function fetchLiveSST(lat, lon) {
  const url =
    `${OPEN_METEO_URL}?latitude=${lat}&longitude=${lon}` +
    `&current=sea_surface_temperature`;

  const queryTimestamp = new Date().toISOString();
  console.log(`[SST-Fetch] GET ${url}`);

  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Open-Meteo SST HTTP ${res.status}`);

  const json = await res.json();
  const sst = json?.current?.sea_surface_temperature;
  const dataTimestamp = json?.current?.time || queryTimestamp;

  if (typeof sst !== "number" || sst < 10 || sst > 35) {
    throw new Error(`Open-Meteo SST invalid: ${sst}`);
  }

  return {
    source: "Open-Meteo Marine (Live SST)",
    datasetId: "open-meteo-marine-sst",
    queryTimestamp,
    dataTimestamp,
    value: sst,
    unit: "°C",
  };
}

async function fetchLiveChlorophyll(lat, lon) {
  const delta = 0.15;
  const latMin = (lat - delta).toFixed(3);
  const latMax = (lat + delta).toFixed(3);
  const lonMin = (lon - delta).toFixed(3);
  const lonMax = (lon + delta).toFixed(3);

  const url =
    `${NOAA_BASE}/griddap/${NOAA_CHL_DATASET}.json` +
    `?${NOAA_CHL_VAR}%5B(last)%5D` +
    `%5B(${latMin}):1:(${latMax})%5D` +
    `%5B(${lonMin}):1:(${lonMax})%5D`;

  const queryTimestamp = new Date().toISOString();
  console.log(`[CHL-Fetch] GET ${url}`);

  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`NOAA ERDDAP CHL HTTP ${res.status}`);

  const json = await res.json();
  const table = json?.table;
  if (!table?.rows?.length) throw new Error("NOAA ERDDAP CHL: empty");

  const varIndex = table.columnNames.indexOf(NOAA_CHL_VAR);
  const timeIndex = table.columnNames.findIndex((c) =>
    c.toLowerCase().includes("time"),
  );

  const values = [];
  let dataTimestamp = queryTimestamp;

  for (const row of table.rows) {
    const v = parseFloat(row[varIndex]);
    if (Number.isFinite(v) && v > 0 && v < 30) {
      values.push(v);
      if (timeIndex !== -1 && dataTimestamp === queryTimestamp) {
        dataTimestamp = row[timeIndex] || dataTimestamp;
      }
    }
  }

  if (values.length === 0) {
    throw new Error("NOAA ERDDAP CHL: no valid ocean pixels in box");
  }

  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  return {
    source: "NOAA/NASA MODIS-Aqua Chlorophyll",
    datasetId: NOAA_CHL_DATASET,
    queryTimestamp,
    dataTimestamp,
    value: parseFloat(avg.toFixed(2)),
    unit: "mg/m³",
    pixelsUsed: values.length,
  };
}

async function fetchAllParameters(lat, lon) {
  const results = await Promise.allSettled([
    fetchLiveSST(lat, lon),
    fetchLiveChlorophyll(lat, lon),
  ]);

  if (results[0].status === "rejected") {
    console.error("[SST-Fetch] FAILED:", results[0].reason?.message);
  }
  if (results[1].status === "rejected") {
    console.error("[CHL-Fetch] FAILED:", results[1].reason?.message);
  }

  const sst = results[0].status === "fulfilled" ? results[0].value : null;
  const chlorophyll =
    results[1].status === "fulfilled" ? results[1].value : null;

  if (!sst && !chlorophyll) {
    throw new Error(
      `Both failed. SST: ${results[0].reason?.message}. CHL: ${results[1].reason?.message}`,
    );
  }

  return { sst, chlorophyll };
}

module.exports = {
  fetchLiveSST,
  fetchLiveChlorophyll,
  fetchAllParameters,
};
