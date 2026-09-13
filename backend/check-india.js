const fs = require("fs");

const g = JSON.parse(
  fs.readFileSync("./src/data/india-land.geojson", "utf8")
);

const india = g.features.find(
  (f) => f.properties?.NAME === "India"
);

console.log("India found:", !!india);
console.log("India geometry:", india?.geometry?.type);

if (india) {
  const coords = [];

  function walk(value) {
    if (
      Array.isArray(value) &&
      value.length === 2 &&
      typeof value[0] === "number" &&
      typeof value[1] === "number"
    ) {
      coords.push(value);
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item);
      }
    }
  }

  walk(india.geometry.coordinates);

  const lons = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);

  console.log("India coordinate count:", coords.length);

  console.log(
    "Longitude:",
    Math.min(...lons),
    "to",
    Math.max(...lons)
  );

  console.log(
    "Latitude:",
    Math.min(...lats),
    "to",
    Math.max(...lats)
  );

  console.log(
    "Sample coordinates:",
    coords.slice(0, 10)
  );
}
