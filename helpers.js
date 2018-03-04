var helpers = {};

// Returns false if the given coordinates are out of range
helpers.validCoordinates = function (board, distanceFromTop, distanceFromLeft) {
    return (!(distanceFromTop < 0 || distanceFromLeft < 0 ||
      distanceFromTop > board.lengthOfSide - 1 || distanceFromLeft > board.lengthOfSide - 1));
};

// Returns the tile [direction] (North, South, East, or West) of the given X/Y coordinate
helpers.getTileNearby = function (board, distanceFromTop, distanceFromLeft, direction) {

    // These are the X/Y coordinates
    var fromTopNew = distanceFromTop;
    var fromLeftNew = distanceFromLeft;

    // This associates the cardinal directions with an X or Y coordinate
    if (direction === 'North') {
        fromTopNew -= 1;
    } else if (direction === 'East') {
        fromLeftNew += 1;
    } else if (direction === 'South') {
        fromTopNew += 1;
    } else if (direction === 'West') {
        fromLeftNew -= 1;
    } else {
        return false;
    }

    // If the coordinates of the tile nearby are valid, return the tile object at those coordinates
    if (helpers.validCoordinates(board, fromTopNew, fromLeftNew)) {
        return board.tiles[fromTopNew][fromLeftNew];
    } else {
        return false;
    }
};

// Returns an object with certain properties of the nearest object we are looking for
helpers.findNearestObjectDirectionAndDistance = function (board, fromTile, tileCallback) {
    // Storage queue to keep track of places the fromTile has been
    var queue = [];

    // Keeps track of places the fromTile has been for constant time lookup later
    var visited = {};

    // Variable assignments for fromTile's coordinates
    var dft = fromTile.distanceFromTop;
    var dfl = fromTile.distanceFromLeft;

    // Stores the coordinates, the direction fromTile is coming from, and it's location
    var visitInfo = [dft, dfl, 'None', 'START'];

    // Just a unique way of storing each location we've visited
    visited[dft + '|' + dfl] = true;

    // Push the starting tile on to the queue
    queue.push(visitInfo);

    // While the queue has a length
    while (queue.length > 0) {

        // Shift off first item in queue
        var coords = queue.shift();

        // Reset the coordinates to the shifted object's coordinates
        dft = coords[0];
        dfl = coords[1];

        // Loop through cardinal directions
        var directions = ['North', 'East', 'South', 'West'];
        for (var i = 0; i < directions.length; i++) {

            // For each of the cardinal directions get the next tile...
            var direction = directions[i];

            // ...Use the getTileNearby helper method to do this
            var nextTile = helpers.getTileNearby(board, dft, dfl, direction);

            // If nextTile is a valid location to move...
            if (nextTile) {

                // Assign a key variable the nextTile's coordinates to put into our visited object later
                var key = nextTile.distanceFromTop + '|' + nextTile.distanceFromLeft;

                var isGoalTile = false;
                try {
                    isGoalTile = tileCallback(nextTile);
                } catch (err) {
                    isGoalTile = false;
                }

                // If we have visited this tile before
                if (visited.hasOwnProperty(key)) {

                    // Do nothing--this tile has already been visited

                // Is this tile the one we want?
                } else if (isGoalTile) {

                    // This variable will eventually hold the first direction we went on this path
                    var correctDirection = direction;

                    // This is the distance away from the final destination that will be incremented in a bit
                    var distance = 1;

                    // These are the coordinates of our target tileType
                    var finalCoords = [nextTile.distanceFromTop, nextTile.distanceFromLeft];

                    // Loop back through path until we get to the start
                    while (coords[3] !== 'START') {

                        // Haven't found the start yet, so go to previous location
                        correctDirection = coords[2];

                        // We also need to increment the distance
                        distance++;

                        // And update the coords of our current path
                        coords = coords[3];
                    }

                    // Return object with the following pertinent info
                    var goalTile = nextTile;
                    goalTile.direction = correctDirection;
                    goalTile.distance = distance;
                    goalTile.coords = finalCoords;
                    return goalTile;

                // If the tile is unoccupied, then we need to push it into our queue
                } else if (nextTile.type === 'Unoccupied') {

                    queue.push([nextTile.distanceFromTop, nextTile.distanceFromLeft, direction, coords]);

                    // Give the visited object another key with the value we stored earlier
                    visited[key] = true;
                }
            }
        }
    }

    // If we are blocked and there is no way to get where we want to go, return false
    return false;
};

// Returns the direction of the nearest non-team diamond mine or false, if there are no diamond mines
helpers.findNearestNonTeamDiamondMine = function (gameData) {
    var hero = gameData.activeHero;
    var board = gameData.board;

    // Get the path info object
    var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function (mineTile) {
        if (mineTile.type === 'DiamondMine') {
            if (mineTile.owner) {
                return mineTile.owner.team !== hero.team;
            } else {
                return true;
            }
        } else {
            return false;
        }
    }, board);

    // Return the direction that needs to be taken to achieve the goal
    return pathInfoObject.direction;
};

// Returns the nearest health well or false, if there are no health wells
helpers.findNearestHealthWell = function (gameData) {
    var hero = gameData.activeHero;
    var board = gameData.board;

    // Get the path info object
    var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function (healthWellTile) {
        return healthWellTile.type === 'HealthWell';
    });

    // Return the direction that needs to be taken to achieve the goal
    return pathInfoObject.direction;
};

// Returns the direction of the nearest enemy with lower health
// (or returns false if there are no accessible enemies that fit this description)
helpers.findNearestWeakerEnemy = function (gameData) {
    var hero = gameData.activeHero;
    var board = gameData.board;

    // Get the path info object
    var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function (enemyTile) {
        return enemyTile.type === 'Hero' && enemyTile.team !== hero.team && enemyTile.health < hero.health;
    });

    // Return the direction that needs to be taken to achieve the goal
    // If no weaker enemy exists, will simply return undefined, which will
    // be interpreted as "Stay" by the game object
    return pathInfoObject.direction;
};

// Returns the direction of the nearest enemy
// (or returns false if there are no accessible enemies)
helpers.findNearestEnemy = function (gameData) {
    var hero = gameData.activeHero;
    var board = gameData.board;

    // Get the path info object
    var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function (enemyTile) {
        return enemyTile.type === 'Hero' && enemyTile.team !== hero.team;
    });

    // Return the direction that needs to be taken to achieve the goal
    return pathInfoObject.direction;
};

// Returns the direction of the nearest friendly champion
// (or returns false if there are no accessible friendly champions)
helpers.findNearestTeamMember = function (gameData) {
    var hero = gameData.activeHero;
    var board = gameData.board;

    // Get the path info object
    var pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board, hero, function (heroTile) {
        return heroTile.type === 'Hero' && heroTile.team === hero.team;
    });

    // Return the direction that needs to be taken to achieve the goal
    return pathInfoObject.direction;
};

helpers.countNeighbourObjects = function(gameData, targetTile, tileCallback)
{
  const me = gameData.activeHero;
  const board = gameData.board;
  const dft = targetTile.distanceFromTop;
  const dfl = targetTile.distanceFromLeft;
  const directions = ['North', 'East', 'South', 'West'];
  let counter = 0;
  
  for (let i = 0; i < directions.length; i++)
  {
    let tile = helpers.getTileNearby(board, dft, dfl, directions[i]);
    if (tile)
    {
      let isObjectFound = false;
      try
      {
        isObjectFound = tileCallback(tile);
          
      } catch (err)
      {
        isObjectFound = false;
      }
      
      if (isObjectFound)
        counter++;
    }
  }
  
  return counter;
};

helpers.nearestTiles = function(board, targetTile, steps, fromTile = null)
{
  const dft = targetTile.distanceFromTop;
  const dfl = targetTile.distanceFromLeft;
  let key = '-1';
  if (fromTile !== null)
    key = fromTile.distanceFromTop + '|' + fromTile.distanceFromLeft;
  const directions = ['North', 'East', 'South', 'West'];
  
  const area = {};
  for (let i = 0; i < directions.length; i++)
  {
    let place = {};
    let tile = helpers.getTileNearby(board, dft, dfl, directions[i]);
    if (! tile || tile.distanceFromTop + '|' + tile.distanceFromLeft === key)
      place.type = 'Impassable';
    else
    {
      place.type = tile.type;
      place.tile = tile;
      if (steps > 1 && tile.type !== 'Impassable' && tile.type !== 'HealthWell')
        place.nearestTiles = helpers.nearestTiles(board, tile, steps - 1, targetTile);
    }
    area[directions[i]] = place;
  }
  
  return area;
};

helpers.localArea = function(gameData)
{
  const board = gameData.board;
  const me = gameData.activeHero;
  const localArea = helpers.nearestTiles(board, me, 3);
  
  for (let i = 0; i < localArea.length; i++)
  {
    let tile = localArea[i].tile;
    localArea[i].possibilities = helpers.nearestPossibilities(board, tile, me);
  }
  const myTile = {};
  myTile.tile = me;
  myTile.possibilities = helpers.nearestPossibilities(board, me, me);
  localArea.myTile = myTile;
  
  return localArea;
};

helpers.weakestNeighbour = function(localArea, type = 'any')
{
  const neighbour = {};
  neighbour.direction = 'North';
  neighbour.health = 100;
  const directions = ['North', 'East', 'South', 'West'];
  for (let i = 0; i < directions.length; i++)
  {
    let place = localArea[directions[i]];
    if (   place.type === 'Hero' && ! place.tile.dead
        && place.tile.health <= neighbour.health
        && (   type === 'any'
            || type === 'friend'
            && place.tile.team === localArea.myTile.tile.team
            || type === 'enemy'
            && place.tile.team !== localArea.myTile.tile.team))
    {
      neighbour.direction = directions[i];
      neighbour.health = place.tile.health;
      neighbour.tile = place.tile;
    }
  }
  
  return neighbour;
};

helpers.weakestNeighbourDirection = function(localArea, type = 'any')
{
  const neighbour = helpers.weakestNeighbour(localArea, type);
  return neighbour.direction;
};

helpers.isSingleNeighbourEnemyKillable = function(gameData, enemy)
{
  // consider also surroundings
  const me = gameData.activeHero;
  const myTurns = Math.ceil(enemy.health / 30);
  let enemyDamage = 30;
  if (enemy.lastActiveTurn === 0)
    enemyDamage = 20;
  const enemyTurns = Math.ceil(me.health / enemyDamage);
  if (myTurns > enemyTurns)
    return false;
  
  return true;
};

helpers.estimateHeroAggress = function(hero)
{
  let aggress = 20;
  if (hero.damageDone % 20 !== 0 || hero.heroesKilled.length > 0)
    aggress = 30;
  else if (hero.healthRecovered > 0 && hero.damageDone === 0)
    aggress = 0;
  
  return aggress;
};

helpers.distantThreat = function(board, targetTile, hero)
{
  const dft = targetTile.distanceFromTop;
  const dfl = targetTile.distanceFromLeft;
  const directions = ['North', 'East', 'South', 'West'];
  let threat = 0;
  
  for (let i = 0; i < directions.length; i++)
  {
    let tile = helpers.getTileNearby(board, dft, dfl, directions[i]);
    if (! tile || tile.type !== 'Hero' || tile.dead || tile.team === hero.team)
      continue;
    
    if (hero.lastActiveTurn === 0 || tile.lastActiveTurn > 0)
      threat = 20;
  }
  
  return threat;
};

helpers.nearestPossibilities = function(board, targetTile, hero)
{
  const dft = targetTile.distanceFromTop;
  const dfl = targetTile.distanceFromLeft;
  const directions = ['North', 'East', 'South', 'West'];
  let threat = 0;
  let distantThreat = 0;
  let kills = 0;
  let neighbours = [];
  
  let isHeroHasAttack = true;
  if (targetTile.name !== hero.name)
    isHeroHasAttack = false;
  let directionToAttack = false;
  
  for (let i = 0; i < directions.length; i++)
  {
    let tile = helpers.getTileNearby(board, dft, dfl, directions[i]);
    if (! tile)
      continue;
    
    if (distantThreat === 0 && (tile.type === 'Unoccupied' || tile.name === hero.name))
      distantThreat = helpers.distantThreat(board, tile, hero);
      
    if (tile.type !== 'Hero' || tile.dead || tile.id === hero.id)
      continue;
    
    neighbours.push(tile);
    if (tile.team === hero.team && tile.healthGiven > 0)
      threat -= 40;
    else if (tile.health <= 20)
      kills++;
    else if (isHeroHasAttack && tile.health === 30)
    {
      directionToAttack = directions[i];
      kills++;
      isHeroHasAttack = false;
      
    } else if (hero.lastActiveTurn === 0 || tile.lastActiveTurn > 0)
      threat += 30;
    else
      threat += 20;
  }
  
  const possibilities = {};
  possibilities.neighbours = neighbours;
  possibilities.threat = threat;
  possibilities.distantThreat = distantThreat;
  possibilities.kills = kills;
  possibilities.directionToAttack = directionToAttack;
  
  return possibilities;
};

module.exports = helpers;
