var gba;
var runCommands = [];

// Setup the emulator
try {
    gba = new GameBoyAdvance();
    gba.keypad.eatInput = true;

    gba.setLogger(function (level, error) {
        console.error(error);
        
        gba.pause();
        
        var screen = document.getElementById('screen');
        
        if (screen.getAttribute('class') == 'dead') {
            console.log('We appear to have crashed multiple times without reseting.');
            return;
        }


        // Show error image in the emulator screen
        // The image can be retrieven from the repository
        var crash = document.createElement('img');
        crash.setAttribute('id', 'crash');
        crash.setAttribute('src', 'resources/crash.png');
        screen.parentElement.insertBefore(crash, screen);
        screen.setAttribute('class', 'dead');
    });
} catch (exception) {
    gba = null;
}

// Initialize emulator once the browser loads
window.onload = function () {
    if (gba && FileReader) {
        var canvas = document.getElementById('screen');
        gba.setCanvas(canvas);

        gba.logLevel = gba.LOG_ERROR;

        // Load the BIOS file of GBA (change the path according to yours)
        loadRom('resources/bios.bin', function (bios) {
            gba.setBios(bios);
        });

        if (!gba.audio.context) {
            // Remove the sound box if sound isn't available
            var soundbox = document.getElementById('sound');
            soundbox.parentElement.removeChild(soundbox);
        }

    } else {
        var dead = document.getElementById('controls');
        dead.parentElement.removeChild(dead);
    }
}

function fadeOut(id, nextId, kill) {
    var e = document.getElementById(id);
    var e2 = document.getElementById(nextId);
    if (!e) {
        return;
    }

    var removeSelf = function () {
        if (kill) {
            e.parentElement.removeChild(e);
        } else {
            e.setAttribute('class', 'dead');
            e.removeEventListener('webkitTransitionEnd', removeSelf);
            e.removeEventListener('oTransitionEnd', removeSelf);
            e.removeEventListener('transitionend', removeSelf);
        }
        if (e2) {
            e2.setAttribute('class', 'hidden');
            setTimeout(function () {
                e2.removeAttribute('class');
            }, 0);
        }
    }

    e.addEventListener('webkitTransitionEnd', removeSelf, false);
    e.addEventListener('oTransitionEnd', removeSelf, false);
    e.addEventListener('transitionend', removeSelf, false);
    e.setAttribute('class', 'hidden');
}

/**
 * Starts the emulator with the given ROM file
 * 
 * @param file 
 */
function run(file) {
    var dead = document.getElementById('loader');

    dead.value = '';
    
    var load = document.getElementById('select');
    load.textContent = 'Loading...';
    load.removeAttribute('onclick');
    
    var pause = document.getElementById('pause');
    pause.textContent = "PAUSE";
    
    gba.loadRomFromFile(file, function (result) {
        if (result) {
            for (var i = 0; i < runCommands.length; ++i) {
                runCommands[i]();
            }

            runCommands = [];
            fadeOut('preload', 'ingame');
            fadeOut('instructions', null, true);
            gba.runStable();
        } else {
            load.textContent = 'FAILED';

            setTimeout(function () {
                load.textContent = 'SELECT';
                
                load.onclick = function () {
                    document.getElementById('loader').click();
                };

            }, 3000);
        }
    });
}

/**
 * Resets the emulator
 * 
 */
function reset() {
    gba.pause();
    gba.reset();

    var load = document.getElementById('select');
    
    load.textContent = 'SELECT';

    var crash = document.getElementById('crash');

    if (crash) {
        var context = gba.targetCanvas.getContext('2d');
        context.clearRect(0, 0, 480, 320);
        gba.video.drawCallback();
        crash.parentElement.removeChild(crash);
        var canvas = document.getElementById('screen');
        canvas.removeAttribute('class');
    } else {
        lcdFade(gba.context, gba.targetCanvas.getContext('2d'), gba.video.drawCallback);
    }

    load.onclick = function () {
        document.getElementById('loader').click();
    };

    fadeOut('ingame', 'preload');

    // Clear the ROM
    gba.rom = null;
}

/**
 * Stores the savefile data in the emulator.
 * 
 * @param file 
 */
function uploadSavedataPending(file) {
    runCommands.push(function () { 
        gba.loadSavedataFromFile(file) 
    });
}

/**
 * Toggles the state of the game
 */
function togglePause() {
    var e = document.getElementById('pause');

    if (gba.paused) {
        gba.runStable();
        e.textContent = "PAUSE";
    } else {
        gba.pause();
        e.textContent = "UNPAUSE";
    }
}

/**
 * From a canvas context, creates an LCD animation that fades the content away.
 * 
 * @param context 
 * @param target 
 * @param callback 
 */
function lcdFade(context, target, callback) {
    var i = 0;

    var drawInterval = setInterval(function () {
        i++;

        var pixelData = context.getImageData(0, 0, 240, 160);

        for (var y = 0; y < 160; ++y) {
            for (var x = 0; x < 240; ++x) {
                var xDiff = Math.abs(x - 120);
                var yDiff = Math.abs(y - 80) * 0.8;
                var xFactor = (120 - i - xDiff) / 120;
                var yFactor = (80 - i - ((y & 1) * 10) - yDiff + Math.pow(xDiff, 1 / 2)) / 80;
                pixelData.data[(x + y * 240) * 4 + 3] *= Math.pow(xFactor, 1 / 3) * Math.pow(yFactor, 1 / 2);
            }
        }
        
        context.putImageData(pixelData, 0, 0);

        target.clearRect(0, 0, 480, 320);

        if (i > 40) {
            clearInterval(drawInterval);
        } else {
            callback();
        }
    }, 50);
}

/**
 * Set the volume of the emulator.
 * 
 * @param value 
 */
function setVolume(value) {
    gba.audio.masterVolume = Math.pow(2, value) - 1;
}
