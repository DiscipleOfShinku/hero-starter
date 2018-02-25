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

      const healthWellStats =
              helpers.findNearestObjectDirectionAndDistance(gameData.board, me,
                                                  x => x.type === 'HealthWell');
      const distanceToHealthWell = healthWellStats.distance;
      const directionToHealthWell = healthWellStats.direction;

      const neighbourFriends = helpers.countNeighbourObjects(gameData, me,
                                                                'friend');
      const neighbourEnemies = helpers.countNeighbourObjects(gameData, me,
                                                                'enemy');
      
      if (neighbourFriends === 4)
        return helpers.findNearestTeamMember(gameData);
      else if (neighbourEnemies === 4)
        return helpers.findNearestEnemy(gameData);
      else if (me.health <= 60 && distanceToHealthWell === 1)
        return directionToHealthWell;
      else if (me.health === 100 && neighbourEnemies === 0)
          return helpers.findNearestNonTeamDiamondMine(gameData);
      else if (me.health <= 60)
          return helpers.findNearestHealthWell(gameData);
      else
        return helpers.findNearestWeakerEnemy(gameData);
    },
};

// Set our hero's strategy
var move =  moves.adventurer;

// Export the move function here
module.exports = move;
