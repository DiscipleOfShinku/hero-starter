const helpers = {};

// Returns false if the given coordinates are out of range
helpers.validCoordinates = (board, distanceFromTop, distanceFromLeft) =>
{
  return (! (   distanceFromTop < 0 || distanceFromLeft < 0
             || distanceFromTop > board.lengthOfSide - 1
             || distanceFromLeft > board.lengthOfSide - 1));
};

// Returns the tile [direction] (North, South, East, or West) of the given X/Y
// coordinate
helpers.getTileNearby = (board, distanceFromTop, distanceFromLeft, direction) =>
{
  // These are the X/Y coordinates
  let fromTopNew = distanceFromTop;
  let fromLeftNew = distanceFromLeft;

  // This associates the cardinal directions with an X or Y coordinate
  if (direction === 'North')
    fromTopNew -= 1;
  else if (direction === 'East')
    fromLeftNew += 1;
  else if (direction === 'South')
    fromTopNew += 1;
  else if (direction === 'West')
    fromLeftNew -= 1;
  else
    return false;

  // If the coordinates of the tile nearby are valid, return the tile object at
  // those coordinates
  if (helpers.validCoordinates(board, fromTopNew, fromLeftNew))
      return board.tiles[fromTopNew][fromLeftNew];

  return false;
};

// Returns an object with certain properties of the nearest object we are
// looking for
helpers.findNearestObjectDirectionAndDistance = (board, fromTile,
                                                 tileCallback) =>
{
  // Storage queue to keep track of places the fromTile has been
  const queue = [];

  // Keeps track of places the fromTile has been for constant time lookup later
  const visited = {};

  // Variable assignments for fromTile's coordinates
  let dft = fromTile.distanceFromTop;
  let dfl = fromTile.distanceFromLeft;

  // Stores the coordinates, the direction fromTile is coming from, and it's
  // location
  let visitInfo = [dft, dfl, 'None', 'START'];

  // Just a unique way of storing each location we've visited
  visited[dft + '|' + dfl] = true;

  // Push the starting tile on to the queue
  queue.push(visitInfo);

  const directions = ['North', 'East', 'South', 'West'];

  while (queue.length > 0)
  {
    let coords = queue.shift();

    // Reset the coordinates to the shifted object's coordinates
    dft = coords[0];
    dfl = coords[1];

    for (let i = 0; i < directions.length; i++)
    {
      const direction = directions[i];

      const nextTile = helpers.getTileNearby(board, dft, dfl, direction);

      if (! nextTile)
        continue;

      const key = nextTile.distanceFromTop + '|' + nextTile.distanceFromLeft;

      if (visited.hasOwnProperty(key))
        continue;

      let isGoalTile = false;
      try
      {
        isGoalTile = tileCallback(nextTile);
      }
      catch (err)
      {
        isGoalTile = false;
      }

      if (isGoalTile)
      {
        // This variable will eventually hold the first direction we went on
        // this path
        let correctDirection = direction;

        let distance = 1;

        const targetCoords =
        [
          nextTile.distanceFromTop,
          nextTile.distanceFromLeft,
        ];

        // Loop back through path until we get to the start
        while (coords[3] !== 'START')
        {
          // Haven't found the start yet, so go to previous location
          correctDirection = coords[2];

          distance++;

          // And update the coords of our current path
          coords = coords[3];
        }

        // Return object with the following pertinent info
        const goalTile = nextTile;
        goalTile.direction = correctDirection;
        goalTile.distance = distance;
        goalTile.coords = targetCoords;

        return goalTile;
      }

      if (nextTile.type === 'Unoccupied')
      {
        visitInfo =
        [
          nextTile.distanceFromTop,
          nextTile.distanceFromLeft,
          direction,
          coords,
        ];
        queue.push(visitInfo);

        visited[key] = true;
      }
    }
  }

  // If we are blocked and there is no way to get where we want to go
  return false;
};

// Returns the direction of the nearest non-team diamond mine or false, if there
// are no diamond mines
helpers.findNearestNonTeamDiamondMine = gameData =>
{
  const hero = gameData.activeHero;
  const board = gameData.board;

  const tileCallback = tile =>
  {
    if (tile.type !== 'DiamondMine')
      return false;

    if (! tile.owner)
      return true;

    return tile.owner.team !== hero.team;
  };

  const pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board,
                                                            hero, tileCallback);

  return pathInfoObject ? pathInfoObject.direction : false;
};

// Returns the nearest health well or false, if there are no health wells
helpers.findNearestHealthWell = gameData =>
{
  const hero = gameData.activeHero;
  const board = gameData.board;

  const tileCallback = tile => tile.type === 'HealthWell';

  // Get the path info object
  const pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board,
                                                            hero, tileCallback);

  return pathInfoObject ? pathInfoObject.direction : false;
};

// Returns the direction of the nearest enemy with lower health
// (or returns false if there are no accessible enemies that fit this
// description)
helpers.findNearestWeakerEnemy = gameData =>
{
  const hero = gameData.activeHero;
  const board = gameData.board;

  const tileCallback = tile =>
  {
    return (   tile.type === 'Hero'
            && tile.team !== hero.team
            && tile.health < hero.health);
  };

  // Get the path info object
  const pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board,
                                                            hero, tileCallback);

  return pathInfoObject? pathInfoObject.direction : false;
};

// Returns the direction of the nearest enemy
// (or returns false if there are no accessible enemies)
helpers.findNearestEnemy = gameData =>
{
  const hero = gameData.activeHero;
  const board = gameData.board;

  const tileCallback = tile =>
  {
    return (tile.type === 'Hero' && tile.team !== hero.team);
  };

  // Get the path info object
  const pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board,
                                                            hero, tileCallback);

  return pathInfoObject? pathInfoObject.direction : false;
};

// Returns the direction of the nearest friendly champion
// (or returns false if there are no accessible friendly champions)
helpers.findNearestTeamMember = gameData =>
{
  const hero = gameData.activeHero;
  const board = gameData.board;

  const tileCallback = tile =>
  {
    return (tile.type === 'Hero' && tile.team === hero.team);
  };

  // Get the path info object
  const pathInfoObject = helpers.findNearestObjectDirectionAndDistance(board,
                                                            hero, tileCallback);

  return pathInfoObject? pathInfoObject.direction : false;
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
      {
        place.nearestTiles = helpers.nearestTiles(board, tile, steps - 1,
                                                  targetTile);
      }
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

  for (let i in localArea)
  {
    if (localArea[i].type === 'Impassable')
      continue;

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
  let directionToWell = false;

  let isHeroHasAttack = true;
  if (targetTile.name !== hero.name)
    isHeroHasAttack = false;

  let directionToAttack = false;

  for (let i = 0; i < directions.length; i++)
  {
    let tile = helpers.getTileNearby(board, dft, dfl, directions[i]);
    if (! tile)
      continue;

    if (   distantThreat === 0
        && (tile.type === 'Unoccupied' || tile.name === hero.name))
    {
      distantThreat = helpers.distantThreat(board, tile, hero);
    }

    if (tile.type === 'HealthWell')
      directionToWell = directions[i];

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
  possibilities.directionToWell = directionToWell;
  possibilities.directionToAttack = directionToAttack;

  return possibilities;
};

module.exports = helpers;

