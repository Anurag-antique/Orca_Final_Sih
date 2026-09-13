const marineRoutingService = require("./src/services/marineRouting.service");

async function main() {
  try {
    console.log("Testing Mumbai → Visakhapatnam marine route...\n");

    const result = await marineRoutingService.getSeaRoute({
      // Turf/GeoJSON coordinate order = [longitude, latitude]
      origin: [72.8777, 19.0760],
      destination: [83.2185, 17.6868],

      vesselProfile: {
        type: "cruise",
        draftMeters: 8,
      },

      cruisingSpeedKnots: 18,
    });

    console.log("Provider:", result.provider);
    console.log("Routing mode:", result.routingMode);
    console.log("Distance:", result.distanceNm, "NM");
   console.log(
  "ETA:",
  result.durationHours,
  "hours"
);
    console.log("Waypoints:", result.waypoints.length);

    console.log("\nFirst 5 waypoints:");
    console.log(result.waypoints.slice(0, 5));

    console.log("\nLast 5 waypoints:");
    console.log(result.waypoints.slice(-5));

    console.log("\nRoute geometry:");
    console.log("Type:", result.geometry.type);
    console.log(
      "Coordinates:",
      result.geometry.coordinates.length
    );

    console.log("\n✅ Marine routing test completed.");
  } catch (error) {
    console.error("\n❌ Marine routing test failed:");
    console.error(error.message);
    console.error(error.stack);
  }
}

main();