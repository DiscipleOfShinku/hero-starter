``` js
Game
{
  board: Board,
  heroes: Hero[],
  heroTurnIndex: int,
  activeHero: Hero,
  teams: [Hero[], Hero[]],
  totalTeamDiamonds: [int, int],
  diamondMines: Mine[],
  healthWells: Well[],
  impassables: Impassable[],
  ended: Boolean,
  winningTeam: int,
  diamondMessage: String,
  moveMessage: String,
  attachMessage: String,
  killMessage: String,
  maxTurn: int,
  turn: int,
  hasStarted: Boolean,
}

Board
{
  tiles: Tile[lengthOfSide][lengthOfSide],
  lengthOfSide: int,
}

Tile
{
  distanceFromTop: int,
  distanceFromLeft: int,
  type: 'Unoccupied',
  subType: 'Unoccupied',
}

Impassable extend Tile
{
  id: undefined,
  type: 'Impassable',
  subType: String,
}

Hero extend Tile
{
  id: int,
  minesOwned: {'MineId': MineId},
  mineCount: int,
  minesCaptured: int,
  health: int,
  dead: false,
  diamondsEarned: int,
  damageDone: int,
  heroesKilled: HeroId[],
  lastActiveTurn: int,
  gravesRobbed: int,
  healthRecovered: int,
  healthGiven: int,
  won: false,
  type: 'Hero',
  subType: String,
  team: int,
  name: String,
}

Mine extend Tile
{
  id: int,
  type: 'DiamondMine',
  subType: 'DiamondMine',
  owner: Hero,
}

Well extend Tile
{
  type: 'HealthWell',
  subType: 'HealthWell',
}
```

