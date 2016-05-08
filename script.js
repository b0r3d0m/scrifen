// * This is a test script that demonstrates some abilities of the Hafen's client scripting
//
// It does the following actions:
// - Logs in using provided login and password (replace them with the actual ones in `onLogin` function below)
// - Selects a specified character (replace it with the real one in `onCharSelect` function below)
// - Starts autowalking (with pathfinding)
// - When a forageable curio encountered, it picks it and place it in the study interface if it is a dandelion
// - When an aggresive animal or an unknown player encountered, it teleports to the hearth fire and starts autowalking again
//
// There are a lot more functions that you can use for the client scripting, please see the comments below
//
// * You should use a patched version of Amber client to make it work -- https://www.dropbox.com/s/srykok9g0uljfk6/amber-script.zip?dl=0
// Source code is available here -- https://github.com/b0r3d0m/amber ("feature/script-api" branch)
//
// * This script should be named "script.js" (w/o double quotes) and placed in the root directory of the modified Amber client (the same directory where you have the "hafen.jar" file)
//
// * It is written in Javascript but you can use Java standard library via `java` object (for example, `java.lang.Thread.sleep`)
//
// * Please read all NOTEs and comments
//
// * I'm strongly recommend not to use the game's client by yourself when there's "script.js" file in the game's directory
//   If you want to use the client by yourself, rename this script to something else and restart the client
//
// * Feel free to ask me any questions
//
// b0r3d0m

///////////////////////
// User-defined "global" variables
///////////////////////

/**
 * Game object from the {@link onGameLoaded} function
 * @type {Game}
 */
var g = null;
/**
 * ID of the autowalking timer
 * @type {Number}
 */
var autoWalkingTimerId = null;

///////////////////////
// API events
///////////////////////

// NOTE that you should define all API event functions, even if you don't want to handle some of them
//      Just do nothing if you don't want to process such events

/**
 * It is fired when the login screen appeared
 * @return {Object} credentials - Object that contains information about login and password to log in with
 * @return {String} credentials.login - The actual login
 * @return {String} credentials.password - The actual password
 */
function onLogin() {
  print('Logging in...');

  var credentials = {
    login: 'login',
    password: 'pass'
  };
  return credentials;
}

/**
 * It is fired 3 seconds after the character select. screen appeared
 * @return {String} characterName - Name of the character to select
 */
function onCharSelect() {
  print('Selecting character...');

  return 'somechar';
}

/** It is fired 10 seconds after the selected character entered the world
 * @param {Object} game This is the main interface to the client API, so generally you should keep a reference to it somewhere in the script
 */
function onGameLoaded(game) {
  print('Game loaded');

  g = game;

  print('Starting autowalking...');
  startAutoWalking();
}

// `game` interface:
// - getPlayerCoords()
//   Returns an object with the `x` and `y` properties represents the player's coordinates
//
// - getInvItems()
//   Returns an array of items' names from the character's inventory or `null` if there was an error
// 
// - studyCurio(curioName)
//   Places a curio with the specified name from the character's inventory to the study inventory
//   Returns `true` on success and `false` otherwise
//   NOTE that it doesn't handle situations when you don't have enough points to study the specified curio (it returns `true` in such cases)
//        Use function `getCharAttentionInfo` to check it
//
// - getCharAttentionInfo()
//   Returns an object with `max` and `used` properties 
// 
// - goTo(x, y)
//   Makes the character go to the specified coordinates (with the pathfinding enabled)
// 
// - pickItem(id)
//   Picks a foragable item with the specified id (with the pathfinding enabled)
//   Takes item's id
//   Returns `true` if there is an item with such id or `false` otherwise
// 
// - travelToHearthFire()
//   Makes the character travel to its hearth fire
//
// - getMapObjects(name)
//   Returns an array of map objects with the specified name (each of them has `name`, `fullName`, `id` and `coords` properties)
//
// - getMapObjectsByFullName(fullName)
//   The same as the `getMapObjects` function but looking for a fullName instead of name (for example, `gfx/terobjs/plants/carrot` instead of `carrot`) -- may be useful to distinguish between growing and laying objects
//
// - getAllMapObjects()
//   Returns an array of map objects (each of them has `name`, `fullName`, `id` and `coords` properties)
//
// - mapObjectRightClick(id)
//   Clicks an object with the specified ID via the right mouse button
//   NOTE That you can't use this function for some specific objects (for example, tables -- use `openTable` function instead)
//   Returns `true` on success or `false` otherwise
//
// - transferItem(name)
//   Transfers an item with the specified name from the character's inventory to an opened container (or study interface if there are no containers opened)
//   Returns `true` on success or `false` otherwise
//
// - transferItems(name)
//   The same as the `transferItem` function but transfers all objects wit the specified name
//   Returns `true` on success or `false` otherwise
//
// - getItemsFrom(windowName)
//   Returns an array of items' names from the specified window (for example, 'Frame' in case of drying frames) or `null` if there was an error
//
// - transferItemFrom(windowName, itemName)
//   Transfers an item with the specified name from the specified window to the character's inventory
//   Returns `true` on success or `false` otherwise
//
// - transferItemsFrom(windowName, itemsName)
//   The same as `transferItemFrom` function but transfers all objects with the specified name
//   Returns `true` on success or `false` otherwise
//
// - getHP()
//   Returns an object with `shp` and `hhp` properties represent the soft and hard hitpoints percents correspondingly (or -1 if there was an error)
//
// - getStamina()
//   Returns stamina of the player or -1 if there was an error
//
// - getEnergy()
//   Returns energy of the player / 100 or -1 if there was an error
//
// - drink()
//   Makes the character drink water from any of the following containers -- bucket, kuksa, waterskin and waterflask (from both character's inventory and equipment screen)
//   NOTE that this method, unlike many others, is synchronous
//        This is a result of its "adaptive" behavior -- it tries to drink from one container and if it's not enough it switches to the next one
//
// - eat(itemName)
//   Makes the character eat the specified item from its inventory
//   Returns `true` on success or `false` otherwise
//
// - eatFrom(windowName, itemName)
//   Makes the character eat the specified item from the specified window
//   Returns `true` on success or `false` otherwise
//
// - takeItemFromStockpile()
//   Takes item from an opened stockpile
//   Returns `true` on success or `false` otherwise
//
// - getStockpileInfo()
//   Returns an object that represents information about an opened stockpile (it has `resBaseName`, `used` and `total` properties) or `null` if there was an error
//
// - createStockpileWithItem(itemName, x, y)
//   Creates a stockpile with the specified item at (x, y) coordinates
//   Returns `true` on success or `false` otherwise
//   NOTE However, there are a lot of situations when this function can fail but still return `true` as a result
//        For example, createStockpileWithItem, unlike goTo and pickItem functions, doesn't use pathfinding (romovs didn't implement it yet)
//        The rule of thumb here is to wait for some time (this function, like many others, is asynchronous) and call the `getStockpileInfo` function to check whether we actually opened a stockpile menu
//
// - waitForPf()
//   Waits for pathfinding to finish
//
// - takeItem(itemName)
//   Takes an item from the character's inventory (it has the same effect as left-clicking an item)
//   It may be useful to call this function for map objects' interacting
//   Returns `true` on success or `false` otherwise
//
// - getEquippedItems()
//   Returns an array of items' names that equipped on the character or `null` if there was an error
//
// - equipItem(itemName)
//   Equips the specified item
//   Returns `true` on success or `false` otherwise
//
// - unequipItem(itemName)
//   Unequips the specified item (the item will be transferred to the character's inventory)
//   Returns `true` on success or `false` otherwise
//
// - sendAreaChatMessage(msg)
//   Sends the specified message to the area chat
//   Returns `true` on success or `false` otherwise
//
// - sendPartyChatMessage(msg)
//   Sends the specified message to the party chat
//   Returns `true` on success or `false` otherwise
//
// - sendVillageChatMessage(msg)
//   Sends the specified message to the village chat
//   Returns `true` on success or `false` otherwise
//
// - sendPrivateChatMessage(to, msg)
//   Sends the specified message to the player specified in the `to` parameter
//   Returns `true` on success or `false` otherwise
//
// - liftObject(id)
//   Makes the character to lift an object with the specified ID
//   Returns `true` on success or `false` otherwise
//
// - mapRightClick(x, y)
//   Right clicks the specified location
//   NOTE that this function, unlike several others, doesn't use pathfinder
//
// - getSpeed()
//   Returns speed of the character (0 <= speed <= 3 where 0 is "crawl" and 3 is "sprint") or -1 if there was an error
//
// - setSpeed(speed)
//   Sets speed of the character to the specified level (acceptable values -- 0 <= speed <= 3 where 0 is "crawl" and 3 is "sprint")
//
// - useMenuAction(hotkeys)
//   Activates menu action via the specified hotkeys (for example, `g.useMenuAction(['a', 'l'];` activates Adventure -> Lift action)
//   Returns `true` on success or `false` otherwise
//
// - craft(itemName)
//   Makes the character to craft the specified item
//   Returns `true` on success or `false` otherwise
//   NOTE that this function doesn't check that the character actually crafted the specified item
//
// - craftAll(itemName)
//   The same as the `craft` function but uses "Craft all" option instead of "Craft"
//
// - chooseFlowerMenuOption(option)
//   Chooses the specified flower menu option
//   Returns `true` on success or `false` otherwise
//
// - dropItem(itemName)
//   Makes the character to drop the specified item from its inventory
//   Returns `true` on success or `false` otherwise
//
// - dropItemFromHand()
//   Makes the character to drop an item from its hand
//   Returns `true` on success or `false` otherwise
//
// - useItemFromHandOnObject(id)
//   Makes the character to use an item from its hand on an object with the specified ID
//   Returns `true` on success or `false` otherwise
//
// - getBarrelContent(id)
//   Returns a type of the barrel's content ('water', 'milk', 'honey' etc) or 'empty' if it's empty. Returns null if there was an error
//
// - getBarrelLiters(id)
//   Returns amount of liquid inside a barrel with the specified ID or null if there was an error
//   NOTE that this function right-clicks the barrel and waits 5 seconds for the "Barrel" window to appear
//
// - getGrowthStage(id)
//   Returns growth stage of a plant with the specified ID or -1 if there was an error
//
// - getHighlightedMapObjects()
//   Returns an array of highlighted map objects (each of them has `name`, `fullName`, `id` and `coords` properties)
//
// - waitForTaskToFinish()
//   Waits for the current task to finish (until hourglass is gone)
//
// - useItemFromHandOnCoords(x, y)
//   Uses an item from hand on the specified coords (you can take it to your hand via `takeItem` function)
//   Returns `true` on success or `false` otherwise
//
// - dropItemFromHandToWindow(windowName)
//   Drops an item from hand to the specified window (useful when having a butcket in your hands)
//   Returns `true` on success or `false` otherwise
//
// - takeItemFromWindow(windowName, itemName)
//   The same as the `takeItem` function but takes an item from the specified window
//   Returns `true` on success or `false` otherwise
//
// - feastEat(itemName)
//   Clicks a "Feast" button and then eats the specified item (NOTE that you should open a table before using this function via the `openTable` function, see below)
//   Returns `true` on success or `false` otherwise
//
// - openTable(id)
//   Opens a table with the specified ID
//   Returns `true` on success or `false` otherwise
//
// - logout()
//   Logs out from the current account
// 
// - quit()
//   Closes game's window
//   NOTE that in most situations it's better to call the `logout` function instead of this one
//        because the `logout` sends a direct message about your willings to the game's server while the `quit` function
//        just simply calls `System.exit(0)` that can lead to the more "delayed" logout

// NOTE that any events except `onLogin` and `onCharSelect` can be fired **before** `onGameLoaded`
// NOTE that the majority of API functions are asynchronous -- including but not limited to `goTo`, `pickItem`, `travelToHearthFire` and `logout`
//      Synrhonous ones include `getInvItems` and `quit`
// NOTE that you should NOT use the === operator when the API objects take place in comparisons, use == operator instead
// NOTE that any functions that work with items' names expect an item's base resource name
//      So instead of 'Dried Fox Hide' you should pass 'foxhide', instead of 'Raw Fox Hide' you should pass 'foxhide-blood' etc

/** It is fired when a foragable curio was found (once for each of them)
 * @param {Number} id ID of the curio
 * @param {String} name Name of the curio
 * @param {Object} coords Coordinates of the curio
 * @param {Number} coords.x x coordinate of the curio
 * @param {Number} coords.y y coordinate of the curio
 */
function onCurioFound(id, name, coords) {
  if (g == null) {
    return;
  }

  print('Curio "' + name + '" found, trying to pick it...');

  stopAutoWalking();
  g.pickItem(id);

  setTimeout(function() {
    if (name == 'dandelion') {
      var mw = getMentalWeight(name);

      var attentionInfo = g.getCharAttentionInfo();
      var freeAttention = attentionInfo.max - attentionInfo.used;
      if (freeAttention >= mw) {
        print('Trying to study the curio...');
        g.studyCurio(name);
      }
    }

    print('Resuming autowalking...');
    startAutoWalking();
  }, 10000);
}

/** It is fired when a creature was encountered (once for each of them)
 * @param {Number} id ID of the creature 
 * @param {String} name Name of the creature
 * @param {Object} coords Coordinates of the creature
 * @param {Number} coords.x x coordinate of the creature
 * @param {Number} coords.y y coordinate of the creature
 */
function onCreatureFound(id, name, coords) {
  if (g == null) {
    return;
  }

  if (isAggr(name)) {
    print('Creature "' + name + '" encountered, trying to travel to the hearth fire...');

    stopAutoWalking();
    g.travelToHearthFire();

    setTimeout(function() {
      print('Resuming autowalking...');
      startAutoWalking();
    }, 10000);
  }
}

/** It is fired when another player was encountered (once for each of them)
 * @param {Number} id ID of the player
 * @param {String} name Name of the player
 * @param {Object} coords Coordinates of the player
 * @param {Number} coords.x x coordinate of the creature
 * @param {Number} coords.y y coordinate of the creature
 */
function onPlayerFound(id, isKin, coords) {
  if (g == null) {
    return;
  }

  if (!isKin) {
    print('Non-kin player encountered, trying to travel to the hearth fire...');

    stopAutoWalking();
    g.travelToHearthFire();

    setTimeout(function() {
      print('Resuming autowalking...');
      startAutoWalking();
    }, 10000);
  }
}

/** It is fired when the flower menu appears (the one that opens after right clicking an object)
 * @param {Array} options Available flower menu options
 */
function onFlowerMenuOpen(options) {
  // ignored
}

/** It is fired when the user enters a command in the console window
 * @param {String} input User command
 */
function onUserInput(input) {
  // ignored
}

/** It is fired when a chat message received from another player
 * @param {String} chat Chat name
 * @param {String} from Sender's name (or '???' if it's unknown)
 * @param {String} msg Message
 */
function onChatMessage(chat, from, msg) {
  // ignored
}

/** It is fired when a new object highlighted via ALT + LMB
 * @param {Object} obj Highlighted map object
 * @param {String} obj.name Basename of the map object's resource
 * @param {String} obj.fullName Full name of the map object's resource
 * @param {Number} obj.id Map object's ID
 * @param {Object} obj.coords Coordinates of the map object
 * @param {Number} obj.coords.x x coordinate of the map object
 * @param {Number} obj.coords.y y coordinate of the map object
 */
function onMapObjectHighlight(obj) {
  // ignored
}

///////////////////////
// User-defined functions
///////////////////////

/** Starts autowalking timer that will move character x+50, y+50 every second */
function startAutoWalking() {
  autoWalkingTimerId = setInterval(function() {
    var playerCoords = g.getPlayerCoords();
    g.goTo(playerCoords.x + 50, playerCoords.y + 50);
  }, 1000);
}

/** Stops autowalking timer */
function stopAutoWalking() {
  clearInterval(autoWalkingTimerId);
  // NOTE that clearInterval (nor clearTimeout) does NOT wait for the currently executing task to finish
  //      so let's sleep for some time manually
  sleep(2000);
}

/** Determines whether the specified animal is aggresive (NOTE that this function is incomplete)
 * @param {String} animal Name of the animal to check
 * @return {Boolean} true if the specified animal is aggressive or false otherwise
 */
function isAggr(animal) {
  return animal == "badger" || animal == "lynx" || animal == "bat" || animal == "bear" || animal == "boar"; // etc
}

/** Returns a mental weight of the specified curio (NOTE that this function is incomplete)
 * @param {String} curioName Name of the curio
 * @return {Number} Mental weight of the specified curio
 */
function getMentalWeight(curioName) {
  var mws = {
    'dandelion': 1
    // etc
  };
  return mws[curioName];
}

/** Prints the specified message to stdout
 * @param {String} msg Message to print
 */
function print(msg) {
  java.lang.System.out.println(msg);
}

/**
 * Sleeps for the specified amount of milliseconds <br>
 * NOTE that this function should be used carefully <br>
 *      It prevents the event loop from triggering new actions until you finally return from the API event function <br>
 *      If possible, use `setTimeout` and `setInterval` functions instead <br>
 * @param {Number} millisecs Amount of milliseconds to sleep for
 */
function sleep(millisecs) {
  java.lang.Thread.sleep(millisecs);
}

///////////////////////
// Helper functions to work with timeouts and intervals
///////////////////////

var setTimeout,
    clearTimeout,
    setInterval,
    clearInterval;

(function () {
    var timer = new java.util.Timer();
    var counter = 1; 
    var ids = {};

    setTimeout = function(fn, delay) {
        var id = counter++;
        ids[id] = new JavaAdapter(java.util.TimerTask, {run: fn});
        timer.schedule(ids[id], delay);
        return id;
    }

    clearTimeout = function(id) {
        ids[id].cancel();
        timer.purge();
        delete ids[id];
    }

    setInterval = function(fn, delay) {
        var id = counter++; 
        ids[id] = new JavaAdapter(java.util.TimerTask, {run: fn});
        timer.schedule(ids[id], delay, delay);
        return id;
    }

    clearInterval = clearTimeout;

})();

