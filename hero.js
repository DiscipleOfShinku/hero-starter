/* eslint no-unused-vars: 0 */
/*

Strategies for the hero are contained within the "moves" object as
name-value pairs, like so:

    //...
    ambusher : function(gamedData, helpers){
      // implementation of strategy.
    },
    heWhoLivesToFightAnotherDay: function(gamedData, helpers){
      // implementation of strategy.
    },
    //...other strategy definitions.

The "moves" object only contains the data, but in order for a specific
strategy to be implemented we MUST set the "move" variable to a
definite property.  This is done like so:

move = moves.heWhoLivesToFightAnotherDay;

You MUST also export the move function, in order for your code to run
So, at the bottom of this code, keep the line that says:

module.exports = move;

The "move" function must return "North", "South", "East", "West", or "Stay"
(Anything else will be interpreted by the game as "Stay")

The "move" function should accept two arguments that the website will be passing in:
- a "gameData" object which holds all information about the current state
  of the battle
- a "helpers" object, which contains useful helper functions
- check out the helpers.js file to see what is available to you

*/

// Strategy definitions
var moves = {
    adventurer: function(gameData, helpers)
    {
      const me = gameData.activeHero;
      const localArea = helpers.localArea(gameData);
      
      let maxKillPossible = 0;
      let directionToKill = false;
      for (let i in localArea)
      {
        if (localArea[i].type === 'Impassable')
          continue;
        
        let possibilities = localArea[i].possibilities;
        if (maxKillPossible < possibilities.kills)
        {
          maxKillPossible = possibilities.kills;
          if (i === 'myTile')
            directionToKill = possibilities.directionToAttack;
          else
            directionToKill = i;
        }
      }
      if (maxKillPossible > 0)
      {
        if (directionToKill)
          return directionToKill;
        
        let possibilities = localArea.myTile.possibilities;
        if (possibilities.directionToWell)
          return possibilities.directionToWell;
        
        return helpers.findNearestEnemy(gameData);
      }
      
      const weakestNeighbourEnemy = helpers.weakestNeighbour(localArea, 'enemy');
      const weakestNeighbourFriend = helpers.weakestNeighbour(localArea, 'friend');
      const nearestWeakerEnemy = helpers.findNearestWeakerEnemy(gameData);

      const neighbourFriends = helpers.countNeighbourObjects(gameData, me,
                      x => x.type === 'Hero' && ! x.dead && x.team === me.team);
      const neighbourEnemies = helpers.countNeighbourObjects(gameData, me,
                      x => x.type === 'Hero' && ! x.dead && x.team !== me.team);
      
      let areMinesToTake = true;
      if (typeof helpers.findNearestNonTeamDiamondMine(gameData) === 'undefined')
        areMinesToTake = false;
      
      if (neighbourFriends === 4)
        return helpers.weakestNeighbourDirection(localArea);
      else if (neighbourEnemies === 4)
        return helpers.weakestNeighbourDirection(localArea);
      else if (neighbourEnemies === 1 && helpers.isSingleNeighbourEnemyKillable(gameData, weakestNeighbourEnemy.tile))
        return weakestNeighbourEnemy.direction;
      else if (neighbourEnemies > 0 && weakestNeighbourEnemy.health <= me.health)
        return weakestNeighbourEnemy.direction;
      else if (me.health <= 60 && localArea.myTile.possibilities.directionToWell)
        return localArea.myTile.possibilities.directionToWell;
      else if (neighbourFriends > 0 && weakestNeighbourFriend.health < 100)
        return weakestNeighbourFriend.direction;
      else if (me.health > 70 && neighbourEnemies === 0 && areMinesToTake)
        return helpers.findNearestNonTeamDiamondMine(gameData);
      else if (me.health <= 70)
        return helpers.findNearestHealthWell(gameData);
      else if (typeof nearestWeakerEnemy === 'undefined' && me.health < 100)
        return helpers.findNearestHealthWell(gameData);
      else if (typeof nearestWeakerEnemy === 'undefined' && me.health === 100)
        return helpers.findNearestEnemy(gameData);
      else
        return nearestWeakerEnemy;
    },
};

// Set our hero's strategy
var move =  moves.adventurer;

// Export the move function here
module.exports = move;
