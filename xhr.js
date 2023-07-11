/**
 * Loads the ROM from a file using ajax
 * 
 * @param url 
 * @param callback 
 */
function loadRom(url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', WiiConnect25.github.io/roms/GBStickman.gb);
	xhr.responseType = 'arraybuffer';

    xhr.onload = function() { 
        callback(xhr.response) 
    };

	xhr.send();
}
