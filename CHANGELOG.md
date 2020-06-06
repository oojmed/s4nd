# s4ndb0x changelog

## v4.0.0
- Changed density of concrete
- Material of selected / hovered over tile is now shown in the top left
- Can no longer select / highlight the material picker icon
- More accurate mouse drawing
- More slight optimisations in mouse events
- Small refactoring in some areas
- Tweaked styling of panels
- Panels / settings are now hidden by default
- Escape now triggers panels to show and pauses time
- No longer make a new icon every time a material is chosen
- Fixed bug where all liquids were very viscous
- Fixed bug where UI could still be interacted with even if it was hidden
- Padding for info text increased
- Made styling for material picker opener more compatible
- Reduced memory usage
- Static materials now use line shape instead of pyramid / powder shape in the material picker
- Added save system - you can now save and load worlds
- Materials no longer move through walls with no corners
- Increased reaction speed of concrete turning into stone with air
- Increased reaction speed of dirt turning into grass with air
- Keyboard shortcuts now work with caps lock
- Performance graphs now support several types of graphs displaying different aspects
- New debug overlay in top right corner
- Shift+P now cycles through performance graphs
- Reenabled showing performance graph on P shortcut
- Performance graph now shows numbers on the Y axis
- Performance graph: Values over a certain threshold no longer show as red lines
- Removed detailed info (version)


## v3.6.0
- Added concrete - slowly turns to stone


## v3.5.0
- Optimised reactions and moving of tiles


## v3.4.0
- Added a new loading screen, however currently left disabled
- Optimised some maths


## v3.3.0
- Material no longer sink through non-liquids


## v3.2.0
- Added grass + fire (and lava) reactions
- Stopped material picker opener from shrinking after a material has been chosen


## v3.1.1
- Fixed Firefox bug where no mouse events would function


## v3.1.0
- Changed styling of material picker image background to be consistently dark
- Refixed right click making the browser context menu appear
- Adjusted colors of material picker options
- Slightly reduced opacity of tile cursor outline
- Optimised material icon production
- Hide detailed top left info by default
- Performance graph shortcut now also shows detailed (top left) info


## v3.0.0
- Thicker and whiter tile outline
- Added new icon
- Hide tile outline when hovering over UI elements
- Added new material menu
- Properly capitalised UI
- Darkened grass shader
- UI spacing adjustments
- Added missing lava + wood reaction
- Flammable materials + lava no longer use up lava


## v2.0.2
- Made dirt and grass less dense than sand
- Made grass populate grass faster


## v2.0.1
- Moved version info to start of info text instead of after


## v2.0.0
- Added grass
- Dirt will now auto change into grass on contact with air (slowly)
- Added headers to settings
- Added looking around the world
- World now larger than viewport
- Added new viscosity system
- Redesigned settings UI
- Fixed bug where tile updated values were only updated every frame, not every tick
- Added hide UI shortcut on 'H' keypress
- Auto resize UI padding when scale factor changes
- Removed reactions which were compiled
- Simplified settings UI by removing some never used options
- Can now pause simulation with space key


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
- Added outline to show where tiles will be drawn
- Removed outdated debug (dbg) text on the second line of the top left info text
- Added gunpowder material
- Added dirt material
- Made liquids brighter


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
