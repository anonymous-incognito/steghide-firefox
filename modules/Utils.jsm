// vim:sts=4:et:sw=4:ai:nosi:ft=javascript

let EXPORTED_SYMBOLS = [ 'OS', 'Prefs' ];

const Cc = Components.classes;
const Ci = Components.interfaces;

const NS_PREF_SERVICE = '@mozilla.org/preferences-service;1';
const NS_ENVIRONMENT = '@mozilla.org/process/environment;1';
const NS_LOCAL_FILE = '@mozilla.org/file/local;1';
const NS_XUL_RUNTIME = '@mozilla.org/xre/app-info;1';

var OS = {
    getName: function () {
        xulRuntime = Cc[NS_XUL_RUNTIME].getService(Ci.nsIXULRuntime);
        return xulRuntime.OS;
    },

    which: function(filename) {
        var env = Cc[NS_ENVIRONMENT].getService(Ci.nsIEnvironment);
        var win = OS.getName().substring(0, 3) == 'WIN';
        var dirsep = win ? ';' : ':';
        var ext = win ? '.exe' : '';
        var file = Cc[NS_LOCAL_FILE].createInstance(Ci.nsILocalFile);
        var paths = env.get('PATH').split(dirsep);
        var path;
        for (var i = 0; i < paths.length; i++) {
            file.initWithPath(paths[i]);
            file.append(filename + ext);
            if (file.exists()) {
                path = file.path;
                break;
            }
        }
        return path;
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
            .getBranch('extensions.steghidefirefox.');
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
            .getBranch('extensions.steghidefirefox.');
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

