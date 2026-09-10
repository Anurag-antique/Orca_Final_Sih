/**
 * NOAA ERDDAP Data Service
 * Fetches live ocean data from NOAA's public ERDDAP server.
 * No API key required.
 */

const config = require("../config");

const DATASETS = {
  sst: {
    id: "jplMURSST41",
    variable: "analysed_sst",
    unit: "K",
    validRange: [270, 310],
    label: "NOAA MUR SST (Live)",
  },
  chlorophyll: {
    id: "erdMH1chlamday",
    variable: "chlorophyll",
    unit: "mg/m³",
    validRange: [0, 30],
    label: "NOAA/NASA MODIS-Aqua Chlorophyll (Live)",
  },
};

const BASE_URL = "https://coastwatch.pfeg.noaa.gov/erddap";
const TIMEOUT_MS = (config.incois && config.incois.timeoutMs) || 6000;

async function fetchErddapPoint(datasetConfig, lat, lon, dateStr = null) {
  // Create a small bounding box around the point (approx 5km radius)
  const delta = 0.05; // 0.05 degrees is ~5.5km at the equator
  const latMin = lat - delta;
  const latMax = lat + delta;
  const lonMin = lon - delta;
  const lonMax = lon + delta;

  const timeSelector = dateStr ? `(${dateStr})` : "(last)";

  // Query the bounding box. The (latMin):(latMax) and (lonMin):(lonMax) syntax tells ERDDAP to return all points in that range.
  const url =
    `${BASE_URL}/griddap/${datasetConfig.id}.json` +
    `?${datasetConfig.variable}[${timeSelector}][(${latMin}):1:(${latMax})][(${lonMin}):1:(${lonMax})]`;

  const queryTimestamp = new Date().toISOString();
  console.log(`[NOAA-Fetch] GET ${url}`);

  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });

  if (!res.ok) {
    throw new Error(
      `NOAA ERDDAP ${datasetConfig.id} returned HTTP ${res.status}`,
    );
  }

  const json = await res.json();
  const table = json?.table;

  if (!table || !Array.isArray(table.rows) || table.rows.length === 0) {
    throw new Error(`NOAA ERDDAP ${datasetConfig.id}: empty response`);
  }

  const columnNames = table.columnNames;
  const varIndex = columnNames.indexOf(datasetConfig.variable);
  if (varIndex === -1) {
    throw new Error(
      `NOAA ERDDAP: variable '${datasetConfig.variable}' not found.`,
    );
  }

  const timeIndex = columnNames.findIndex((c) =>
    c.toLowerCase().includes("time"),
  );

  // Collect all valid, non-null values
  const validValues = [];
  let dataTimestamp = queryTimestamp;

  for (const row of table.rows) {
    const rawValue = parseFloat(row[varIndex]);
    if (Number.isFinite(rawValue)) {
      validValues.push(rawValue);
      if (timeIndex !== -1 && !dataTimestamp) {
        dataTimestamp = row[timeIndex];
      }
    }
  }

  if (validValues.length === 0) {
    throw new Error(
      `NOAA ERDDAP: no valid data points found in the bounding box.`,
    );
  }

  // Calculate the average of the valid points
  const averageValue =
    validValues.reduce((a, b) => a + b, 0) / validValues.length;

  let finalValue = averageValue;
  if (datasetConfig.unit === "K") {
    finalValue = averageValue - 273.15;
  }

  // Validate the final average value against the expected range
  const [min, max] = datasetConfig.validRange;
  if (!Number.isFinite(finalValue) || finalValue < min || finalValue > max) {
    throw new Error(
      `NOAA ERDDAP: averaged value ${finalValue} out of range [${min}, ${max}]`,
    );
  }

  return {
    source: datasetConfig.label,
    datasetId: datasetConfig.id,
    queryTimestamp,
    dataTimestamp,
    value: finalValue,
    unit: datasetConfig.unit === "K" ? "°C" : datasetConfig.unit,
  };
}
// async function fetchErddapPoint(datasetConfig, lat, lon) {
//   // Tomcat 10+ rejects raw brackets — must be percent-encoded
//   const LB = "%5B";
//   const RB = "%5D";

//   const url =
//     `${BASE_URL}/griddap/${datasetConfig.id}.json` +
//     `?${datasetConfig.variable}${LB}(last)${RB}${LB}(${lat})${RB}${LB}(${lon})${RB}`;

//   const queryTimestamp = new Date().toISOString();

//   console.log(`[NOAA-Fetch] GET ${url}`);

//   const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });

//   if (!res.ok) {
//     throw new Error(
//       `NOAA ERDDAP ${datasetConfig.id} returned HTTP ${res.status}`,
//     );
//   }

//   const json = await res.json();
//   const table = json?.table;

//   if (!table || !Array.isArray(table.rows) || table.rows.length === 0) {
//     throw new Error(`NOAA ERDDAP ${datasetConfig.id}: empty response`);
//   }

//   const columnNames = table.columnNames;
//   const row = table.rows[0];

//   const varIndex = columnNames.indexOf(datasetConfig.variable);
//   if (varIndex === -1) {
//     throw new Error(
//       `NOAA ERDDAP ${datasetConfig.id}: variable '${datasetConfig.variable}' not found. ` +
//         `Available: ${columnNames.join(", ")}`,
//     );
//   }

//   let value = parseFloat(row[varIndex]);
//   if (datasetConfig.unit === "K") value = value - 273.15;

//   const timeIndex = columnNames.findIndex((c) =>
//     c.toLowerCase().includes("time"),
//   );
//   const dataTimestamp =
//     timeIndex !== -1 && row[timeIndex] ? row[timeIndex] : queryTimestamp;

//   const [min, max] = datasetConfig.validRange;
//   if (!Number.isFinite(value) || value < min || value > max) {
//     console.warn(
//       `NOAA ERDDAP ${datasetConfig.id}: value ${value} out of range [${min}, ${max}]`,
//     );
//     return null;
//   }

//   return {
//     source: datasetConfig.label,
//     datasetId: datasetConfig.id,
//     queryTimestamp,
//     dataTimestamp,
//     value,
//     unit: datasetConfig.unit === "K" ? "°C" : datasetConfig.unit,
//   };
// }

async function fetchLiveSST(lat, lon) {
  return fetchErddapPoint(DATASETS.sst, lat, lon);
}

async function fetchLiveChlorophyll(lat, lon) {
  return fetchErddapPoint(DATASETS.chlorophyll, lat, lon);
}

async function fetchAllParameters(lat, lon) {
  const results = await Promise.allSettled([
    fetchLiveSST(lat, lon),
    fetchLiveChlorophyll(lat, lon),
  ]);

  const sst = results[0].status === "fulfilled" ? results[0].value : null;
  const chlorophyll =
    results[1].status === "fulfilled" ? results[1].value : null;

  if (!sst && !chlorophyll) {
    throw new Error(
      `NOAA ERDDAP: both fetches failed. ` +
        `SST: ${results[0].reason?.message || "unknown"}. ` +
        `Chl: ${results[1].reason?.message || "unknown"}.`,
    );
  }

  return { sst, chlorophyll };
}

module.exports = {
  fetchLiveSST,
  fetchLiveChlorophyll,
  fetchAllParameters,
};
