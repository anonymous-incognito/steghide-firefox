// vim:sts=4:et:sw=4:ai:nosi:

Components.utils.import('resource://steghide-firefox/Utils.jsm');

function onExtensionLoad() {
    removeEventListener('load', arguments.callee, false);
    var pathToSteghide = Prefs.get('pathToSteghide');
    if (!pathToSteghide) {
        pathToSteghide = OS.which('steghide');
        Prefs.set('pathToSteghide', pathToSteghide);
    }
}

addEventListener('load', onExtensionLoad, false);

