const marineRoutingService =
  require("./src/services/marineRouting.service");

const origin = [72.8777, 19.0760];
const destination = [83.2185, 17.6868];

console.log("Testing raw A* route...\n");

const offshoreOrigin =
  marineRoutingService.findSafeOffshorePoint(
    origin,
    270
  );

const offshoreDestination =
  marineRoutingService.findSafeOffshorePoint(
    destination,
    90
  );

const grid =
  marineRoutingService.createGrid(
    offshoreOrigin,
    offshoreDestination
  );

const startNode =
  marineRoutingService.findNearestWaterNode(
    offshoreOrigin,
    grid
  );

const goalNode =
  marineRoutingService.findNearestWaterNode(
    offshoreDestination,
    grid
  );

const path =
  marineRoutingService.findAStarPath(
    startNode,
    goalNode,
    grid
  );

console.log("A* path found:", !!path);
console.log("A* path nodes:", path?.length);

if (!path || path.length < 2) {
  process.exit(1);
}

const rawRoute = [
  origin,
  offshoreOrigin,
  ...path,
  offshoreDestination,
  destination
];

console.log(
  "Raw route points:",
  rawRoute.length
);

console.log(
  "Raw route crosses land:",
  marineRoutingService.routeCrossesLand(
    rawRoute
  )
);

console.log("\nChecking connector segments...");

const connectorSegments = [
  {
    name: "Origin → Offshore Origin",
    start: origin,
    end: offshoreOrigin,
  },
  {
    name: "Offshore Destination → Destination",
    start: offshoreDestination,
    end: destination,
  },
];

for (const segment of connectorSegments) {
  const crossesLand =
    marineRoutingService.segmentCrossesLand(
      segment.start,
      segment.end,
      true,
      true
    );

  console.log(
    `${segment.name}:`,
    crossesLand ? "❌ CROSSES LAND" : "✅ CLEAR"
  );

  console.log(
    "  Start:",
    segment.start
  );

  console.log(
    "  End:",
    segment.end
  );
}
console.log("\nChecking individual A* segments...");

let badSegments = 0;

for (let i = 0; i < path.length - 1; i++) {const start = path[i];
const end = path[i + 1];

  const crossesLand =
    marineRoutingService.segmentCrossesLand(
      start,
      end
    );

  if (crossesLand) {
    badSegments++;

    console.log(
      `BAD SEGMENT ${i}:`,
      start,
      "→",
      end
    );
  }
}

console.log(
  "\nBad A* segments:",
  badSegments
);

console.log(
  "Raw A* route valid:",
  badSegments === 0
);