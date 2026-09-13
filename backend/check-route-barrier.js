const marineRoutingService = require("./src/services/marineRouting.service");

const origin = [72.8777, 19.0760];
const destination = [83.2185, 17.6868];

console.log("Creating marine routing grid...\n");

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

console.log("Offshore origin:", offshoreOrigin);
console.log("Offshore destination:", offshoreDestination);

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

console.log("\nSTART:", startNode);
console.log("\nGOAL:", goalNode);

const components =
  marineRoutingService.countWaterComponents(
    grid
  );

console.log("\nWater components:");

components
  .slice(0, 10)
  .forEach((component, index) => {
    console.log(
      `${index + 1}. size=${component.size}, start=${component.start}`
    );
  });

function findComponent(grid, target) {
  const visited = new Set();
  const queue = [target];

  const targetKey =
    marineRoutingService.gridKey(
      target.row,
      target.col
    );

  visited.add(targetKey);

  let count = 0;

  while (queue.length > 0) {
    const current = queue.shift();

    count++;

    const neighbours =
      marineRoutingService.getNeighbours(
        current,
        grid
      );

    for (const neighbour of neighbours) {
      const key =
        marineRoutingService.gridKey(
          neighbour.row,
          neighbour.col
        );

      if (visited.has(key)) {
        continue;
      }

      visited.add(key);
      queue.push(neighbour);
    }
  }

  return visited;
}

const startComponent =
  findComponent(
    grid,
    startNode
  );

const goalComponent =
  findComponent(
    grid,
    goalNode
  );

console.log(
  "\nStart component nodes:",
  startComponent.size
);

console.log(
  "Goal component nodes:",
  goalComponent.size
);

console.log(
  "\nSearching for closest nodes between components..."
);

let closest = null;

for (const startKey of startComponent) {

  const [startRow, startCol] =
    startKey.split(":").map(Number);

  const start =
    grid.nodes.get(startKey);

  if (!start) continue;

  for (const goalKey of goalComponent) {

    const [goalRow, goalCol] =
      goalKey.split(":").map(Number);

    const goal =
      grid.nodes.get(goalKey);

    if (!goal) continue;

    const rowDistance =
      Math.abs(
        startRow - goalRow
      );

    const colDistance =
      Math.abs(
        startCol - goalCol
      );

    const distance =
      Math.max(
        rowDistance,
        colDistance
      );

    if (
      !closest ||
      distance < closest.distance
    ) {
      closest = {
        distance,
        start,
        goal
      };
    }
  }
}

console.log("\nClosest boundary nodes:");

console.log(closest);