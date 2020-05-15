# s4ndb0x changelog

## v1.0.0
- Material names in dropdown now has proper casing and spaces
- Renamed oil to crude oil
- Slowed down rate of crude oil fire
- Fixed incorrect delta time calculation
- Upgraded reaction systems to be able to compile wildcards and syntax at load
- Now using new tick based update system per frame
- Added acid material
- Added faucet checkbox which makes a tile which acts like wall, but constantly makes the chosen material spawn under it
- Added erase (selects air) on right click
- Auto resize when page size changes
- Added dropdown that now allows choice of how big the drawing cursor is


## v0.5.3
- Fixed that lava was not marked as a liquid


## v0.5.2
- Fixed very annoying and weird bug which decreased performance by ~50% in many browsers if fire was ever made


## v0.5.1
- [Firefox only] Fixed bug where material was made in top left corner when selecting material from material dropdown
- Fixed bug where material would be made when clicking a checkbox


## v0.5.0
- Added animation to liquids
- Added more complex reaction system
- Added materials:
  - fire
- Added floating and old age (turns to air after X seconds) systems
- Added reactions: (* more complex backend options)
  - oil + lava = fire
  - oil + fire = fire*


## v0.4.0
- Optimised a lot
- Added small UI in top right corner
- Increased default scale factor (again)
- Darken colors when with material borders


## v0.3.0
- Added reaction system
- Added reactions:
  - water + lava = stone
  - sand + lava = glass
  - oil + lava = air (destroy both reactants)
- Added materials:
  - stone
  - lava
  - glass
- Added new experimental touch support


## v0.2.0
- Added density system
- Added liquid system
- Added materials: water, oil
- Increased scale factor


## v0.1.0
- Initial release / commit