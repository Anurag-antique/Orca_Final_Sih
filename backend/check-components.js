const marineRoutingService =
  require("./src/services/marineRouting.service");

const start = [72.70146831955375, 19.0867228040629];
const goal = [83.40146831955376, 17.686722804062903];

const grid =
  marineRoutingService.createGrid(
    start,
    goal
  );

const startNode =
  marineRoutingService.findNearestWaterNode(
    start,
    grid
  );

const goalNode =
  marineRoutingService.findNearestWaterNode(
    goal,
    grid
  );

console.log("\nSTART NODE");
console.log(startNode);

console.log("\nGOAL NODE");
console.log(goalNode);

function componentFromNode(node) {
  const visited = new Set();
  const queue = [node];

  const startKey =
    marineRoutingService.gridKey(
      node.row,
      node.col
    );

  visited.add(startKey);

  let size = 0;

  while (queue.length > 0) {
    const current = queue.shift();

    size++;

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

  return {
    size,
    start: node.coordinates,
    containsStart: visited.has(
      marineRoutingService.gridKey(
        startNode.row,
        startNode.col
      )
    ),
    containsGoal: visited.has(
      marineRoutingService.gridKey(
        goalNode.row,
        goalNode.col
      )
    )
  };
}

console.log(
  "\nSTART COMPONENT"
);

console.log(
  componentFromNode(startNode)
);

console.log(
  "\nGOAL COMPONENT"
);

console.log(
  componentFromNode(goalNode)
);