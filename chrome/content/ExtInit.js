/ vim:sts=4:et:sw=4:ai:nosi:
/** steghide-firefox is a Mozilla Firefox addon allowing use of steghide from
    inside a browser.
    Copyright (C) 2011-2012 Anonymous

    This file is part of steghide-firefox.

    steghide-firefox is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    steghide-firefox is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with steghide-firefox. If not, see <http://www.gnu.org/licenses/>.
*/

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

