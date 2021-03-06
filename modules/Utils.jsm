// vim:sts=4:et:sw=4:ai:nosi:ft=javascript
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

let EXPORTED_SYMBOLS = [ 'OSUtils', 'Prefs' ];

const Cc = Components.classes;
const Ci = Components.interfaces;

const NS_PREF_SERVICE = '@mozilla.org/preferences-service;1';
const NS_ENVIRONMENT = '@mozilla.org/process/environment;1';
const NS_LOCAL_FILE = '@mozilla.org/file/local;1';
const NS_XUL_RUNTIME = '@mozilla.org/xre/app-info;1';

const PREF_BRANCH = 'extensions.steghidefirefox.';

var OSUtils = {
    getName: function () {
        var xulRuntime = Cc[NS_XUL_RUNTIME].getService(Ci.nsIXULRuntime);
        return xulRuntime.OS;
    },

    which: function(filename) {
        var env = Cc[NS_ENVIRONMENT].getService(Ci.nsIEnvironment);
        var win = OSUtils.getName().substring(0, 3) == 'WIN';
        var paths = env.get('PATH').split(win ? ';' : ':');
        var ext = win ? '.exe' : '';
        var file = Cc[NS_LOCAL_FILE].createInstance(Ci.nsILocalFile);
        for (var i = 0; i < paths.length; i++) {
            file.initWithPath(paths[i]);
            file.append(filename + ext);
            if (file.exists())
                return file.path;
        }
    },

    unlink: function (filename) {
        var aFile = Cc[NS_LOCAL_FILE].createInstance(Ci.nsILocalFile);
        aFile.initWithPath(filename);
        aFile.remove(false);
    }
};

var Prefs = {
    get: function(name, type) {
        var prefs = Cc[NS_PREF_SERVICE]
            .getService(Ci.nsIPrefService)
            .getBranch(PREF_BRANCH);
        switch (type) {
            case 'bool':
                return prefs.getBoolPref(name);
            case 'int':
                return prefs.getIntPref(name);
            default:
                return prefs.getCharPref(name);
        }
    },

    getBool: function (name) {
        return Prefs.get(name, 'bool');
    },

    getInt: function (name) {
        return Prefs.get(name, 'int');
    },

    getChar: function (name) {
        return Prefs.get(name, 'char');
    },

    set: function(name, value) {
        var prefs = Cc[NS_PREF_SERVICE]
            .getService(Ci.nsIPrefService)
            .getBranch(PREF_BRANCH);
        switch (typeof(value)) {
            case 'boolean':
                prefs.setBoolPref(name, value);
                break;
            case 'number':
                prefs.setIntPref(name, value);
                break;
            default:
                prefs.setCharPref(name, value);
        }
    },
};

