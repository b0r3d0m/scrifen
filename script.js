// * This is a test script that deomnstrates some abilities of the Hafen's client scripting
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
//   Returns an array of objects with `id` and `coords` properties
//
// - mapObjectRightClick(id)
//   Clicks an object with the specified ID via the right mouse button
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

