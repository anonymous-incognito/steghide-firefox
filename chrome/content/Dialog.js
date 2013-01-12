// vim:sts=4:et:sw=4:ai:nosi:
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

Components.utils.import('resource://gre/modules/FileUtils.jsm');
Components.utils.import('resource://gre/modules/PrivateBrowsingUtils.jsm');

Components.utils.import('resource://steghide-firefox/subprocess.jsm');

Components.utils.import('resource://steghide-firefox/Utils.jsm');
Components.utils.import('resource://steghide-firefox/Encodings.jsm');

const KEY_ENTER = 13;
const KEY_ESCAPE = 27;
const MASKS = {title: 'Formats supported by steghide',
               filter: '*.jpg; *.jpeg; *.bmp; *.wav; *.au'};
const STATE_STOP = Components.interfaces.nsIWebProgressListener.STATE_STOP;
const win = OS.getName().substring(0, 3) == 'WIN';
function groupRadio() {
    var radios = arguments;
    for (var i = 0; i < radios.length; i++) {
        var radio = document.getElementById(radios[i]);
        radio.addEventListener('click', (function(self) {
            return (function() {
                for (var i = 0; i < radios.length; i++) {
                    var id = radios[i];
                    if (id != self.id)
                        document.getElementById(id).setAttribute('selected', false);
                }
                self.setAttribute('selected', true);
            });
        })(radio), false);
    }
}
function onLoad() {
    if (location.search) {
        var params = location.search.substr(1).split(';');
        for (var i = 0; i < params.length; i++) {
            var kv = params[i].split('=');
            var key = kv[0];
            var value = kv[1];
            if (key == 't')
                document.getElementById('tabbox').selectedIndex = value;
            else if (key == 'url') {
                document.getElementById('cover_file').value = value;
                document.getElementById('stego_file').value = value;
            }
        }
    }
    groupRadio('e_passphrase_r', 'e_keyfile_r');
    groupRadio('x_passphrase_r', 'x_keyfile_r');
    var passphrase = Prefs.get('defaultPassphrase');
    document.getElementById('e_passphrase').value = passphrase;
    document.getElementById('x_passphrase').value = passphrase;
    document.getElementById('dont_erase_previous_output').setAttribute('checked',
        Prefs.getBool('dontErasePreviousOutputOnExtract')
    );
    if (document.getElementById('tabbox').selectedIndex == 1 &&
        document.getElementById('stego_file').value &&
        document.getElementById('x_passphrase').value) {
        document.getElementById('extract').click();
    }
}
function onUnload() {
    var e = document.getElementById('compression');
    e.setAttribute('value', e.value);
}
function onKeyPress(event) {
    if (event.keyCode == KEY_ESCAPE)
        close();
}
function stripFileProto(aURL) {
    if (aURL.substr(0, 8) == 'file:///')
        aURL = aURL.substr(win ? 8 : 7);
    return aURL;
}
function pickFile(title, filterObj, save, func) {
    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    const mode = save ? nsIFilePicker.modeSave : nsIFilePicker.modeOpen;
    var filePicker = Components.classes['@mozilla.org/filepicker;1']
                        .createInstance(nsIFilePicker);
    filePicker.init(window, title, mode);
    if (filterObj)
        filePicker.appendFilter(filterObj.title, filterObj.filter);
    filePicker.appendFilters(nsIFilePicker.filterAll);
    var result = filePicker.show();
    if (result == nsIFilePicker.returnOK || result == nsIFilePicker.returnReplace)
        func(filePicker.file.path);
}
function onBrowseCoverFileClick() {
    pickFile('Select cover file', MASKS, false, function(path) {
        document.getElementById('cover_file').value = path;
    });
}
function onBrowseEmbedFileClick() {
    pickFile('Select embed file', null, false, function(path) {
        document.getElementById('embed_file').value = path;
        document.getElementById('embed_text_cb').checked = false;
    });
}
function onBrowseOutputFileClick() {
    pickFile('Select output file', null, true, function(path) {
        document.getElementById('output_file').value = path;
        document.getElementById('overwrite_cover_file').checked = false;
    });
}
function onBrowseStegoFileClick() {
    pickFile('Select stego file', MASKS, false, function(path) {
        document.getElementById('stego_file').value = path;
    });
}
function onBrowseExtractFileClick() {
    pickFile('Select extract file', null, true, function(path) {
        document.getElementById('extract_file').value = path;
        document.getElementById('output_to_stdout').checked = false;
    });
}
function onBrowseExtractKeyfileClick() {
    pickFile('Select key file', null, false, function(path) {
        document.getElementById('x_keyfile').value = path;
        document.getElementById('x_keyfile_r').click();
    });
}
function onBrowseEmbedKeyfileClick() {
    pickFile('Select key file', null, false, function(path) {
        document.getElementById('e_keyfile').value = path;
        document.getElementById('e_keyfile_r').click();
    });
}
function onEmbedKeyPress(event) {
    if (event.keyCode == KEY_ENTER)
        document.getElementById('embed').click();
}
function onExtractKeyPress(event) {
    if (event.keyCode == KEY_ENTER)
        document.getElementById('extract').click();
}
function onPassChange(id) {
    document.getElementById(id + '_r').click();
}
function onEmbedFileChange() {
    document.getElementById('embed_text_cb').checked = false;
}
function onOutputFileChange() {
    document.getElementById('overwrite_cover_file').checked = false;
}
function onExtractFileChange() {
    document.getElementById('output_to_stdout').checked = false;
}
function onEmbedTextChange() {
    document.getElementById('embed_text_cb').checked = true;
}
function clearTextboxes() {
    for (var i = 0; i < arguments.length; i++)
        document.getElementById(arguments[i]).value = '';
}
function saveTextAs(textboxId) {
    pickFile('Save text as...', null, true, function(path) {
        var data = Utf8.encode(document.getElementById(textboxId).value);
        var f = new FileUtils.File(path);
        var os = FileUtils.openFileOutputStream(f, FileUtils.MODE_WRONLY |
                                                   FileUtils.MODE_CREATE |
                                                   FileUtils.MODE_TRUNCATE);
        try {
            os.write(data, data.length);
        }
        finally {
            os.close();
        }
    });
}
function makeURI(aURL, aOriginCharset, aBaseURI) {
    var ioService = Components.classes['@mozilla.org/network/io-service;1']
                        .getService(Components.interfaces.nsIIOService);
    return ioService.newURI(aURL, aOriginCharset, aBaseURI);
}
function temporaryFileFromURL(aURL) {
    var aURI = makeURI(aURL);
    var file = FileUtils.getFile('TmpD', ['steghide.tmp']);
    file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, parseInt('0600', 8));

    const nsIWebBrowserPersist = Components.interfaces.nsIWebBrowserPersist;
    var persist = Components.classes['@mozilla.org/embedding/browser/nsWebBrowserPersist;1']
                    .createInstance(nsIWebBrowserPersist);
    persist.persistFlags = nsIWebBrowserPersist.PERSIST_FLAGS_REPLACE_EXISTING_FILES |
                           nsIWebBrowserPersist.PERSIST_FLAGS_FROM_CACHE;
    var progressListener = {
        done: false,
        onStateChange: function(aWebProgress, aRequest, aStateFlags, aStatus) {
            if (aStateFlags & STATE_STOP)
                this.done = true;
        },
        onLocationChange: function () {},
        onProgressChange: function () {},
        onStatusChange: function () {},
        onSecurityChange: function () {},
        QueryInterface: function(iid) {
            if (iid.equals(Components.interfaces.nsIWebProgressListener) ||
                iid.equals(Components.interfaces.nsISupports))
                return this;
            throw Components.results.NS_ERROR_NO_INTERFACE;
        }
    };
    persist.progressListener = progressListener;
    var nsILoadContext = null;
    try {
        nsILoadContext = PrivateBrowsingUtils.privacyContextFromWindow(window);
    }
    catch(e) {
    }
    persist.saveURI(aURI, null, null, null, null, file, nsILoadContext);
    var currentThread = Components.classes['@mozilla.org/thread-manager;1']
                            .getService(Components.interfaces.nsIThreadManager).currentThread;
    while(!progressListener.done)
        currentThread.processNextEvent(true);
    return file.path;
}
function getOrCreateFile(uri, validate) {
    var proto = uri.substring(0, uri.indexOf('://'));
    if (validate && !validate(proto))
        return null;
    if (proto == 'file')
        return {name: stripFileProto(uri)};
    else if (proto == 'http' || proto == 'https')
        return {name: temporaryFileFromURL(uri), temporary: true};
    return {name: uri}
}
function readPassphraseFromKeyfile(path) {
    var file = new FileUtils.File(path);

    var istream = Components.classes['@mozilla.org/network/file-input-stream;1']
        .createInstance(Components.interfaces.nsIFileInputStream);
    istream.init(file, -1, -1, false);

    var bstream = Components.classes['@mozilla.org/binaryinputstream;1']
        .createInstance(Components.interfaces.nsIBinaryInputStream);
    bstream.setInputStream(istream);

    var bytes = bstream.readBytes(Math.min(1024, bstream.available()));
    bstream.close();
    return bytes;
}
function scrollTextboxToBottom(textbox) {
    var ti = document.getAnonymousNodes(textbox)[0].childNodes[0];
    ti.scrollTop = ti.scrollHeight;
}
function onEmbedCommand() {
    try {
        var cf = document.getElementById('cover_file').value;
        if (!cf) {
            alert('Please, select the cover file.');
            return;
        }
        var ef = document.getElementById('embed_file').value;
        var embedText = document.getElementById('embed_text_cb').checked;
        if (!embedText && !ef) {
            alert('Please, select the embed file.');
            return;
        }
        var text = document.getElementById('embed_text').value;
        if (embedText && !text) {
            alert('Nothing to hide. Enter some text, please.');
            return;
        }
        var sf = document.getElementById('output_file').value;
        var overwriteCoverFile = document.getElementById('overwrite_cover_file').checked;
        if (!overwriteCoverFile && !sf) {
            alert('Please, specify the output file name.');
            return;
        }
        var usePassphrase = document.getElementById('e_passphrase_r').getAttribute('selected') == 'true';
        var useKeyfile = document.getElementById('e_keyfile_r').getAttribute('selected') == 'true';
        var passphrase;
        if (usePassphrase) {
            passphrase = document.getElementById('e_passphrase').value;
            if (!passphrase) {
                alert('Please, enter the passphrase.');
                return;
            }
        }
        else if (useKeyfile) {
            var keyfile = document.getElementById('e_keyfile').value;
            if (!keyfile) {
                alert('Please, select the keyfile.');
                return;
            }
            passphrase = readPassphraseFromKeyfile(keyfile);
            if (!passphrase) {
                alert('Sorry, but the keyfile seems to be empty.');
                return;
            }
        }
        var algorithm = document.getElementById('algorithm').selectedItem.value;
        var mode = document.getElementById('mode').selectedItem.value;
        var compression = document.getElementById('compression').value;
        var noCheckSum = document.getElementById('no_checksum').checked;
        var doNotEmbedFilename = document.getElementById('dont_embed_filename').checked;
        var file = getOrCreateFile(cf, function(proto) {
            if ((proto == 'http' || proto == 'https') &&
                (overwriteCoverFile || sf == '')) {
                alert("Please, uncheck the `Use cover file as output file' checkbox and specify the output file name.");
                return false;
            }
            return true;
        });
        if (file) {
            var args = [
                'embed',
                '-f',
                '-cf', file.name,
                '-ef', embedText ? '-' : ef,
                '-p', passphrase
            ];
            if (algorithm == 'none')
                args.push('-e', algorithm);
            else
                args.push('-e', algorithm, mode);
            if (compression == 0)
                args.push('-Z');
            else
                args.push('-z', compression);
            if (noCheckSum)
                args.push('-K');
            if (doNotEmbedFilename)
                args.push('-N');
            if (!overwriteCoverFile)
                args.push('-sf', sf);
            var output = '';
            subprocess.call({
                command: Prefs.get('pathToSteghide'),
                arguments: args,
                stdin: (
                    embedText ?
                        Utf8.encode(text)
                        :
                        undefined
                ),
                stdout: function(data) {
                    output += data;
                },
                done: function(result) {
                    try {
                        var log = document.getElementById('embed_log');
                        log.value = output;
                        scrollTextboxToBottom(log);
                    }
                    finally {
                        if (file.temporary)
                            OS.unlink(file.name);
                    }
                },
                mergeStderr: true
            });
        }
    }
    catch(e) {
        alert(e);
    }
}
function onExtractCommand() {
    try {
        var sf = document.getElementById('stego_file').value;
        if (!sf) {
            alert('Please, select the stego file.');
            return;
        }
        var xf = document.getElementById('extract_file').value;
        var outputToStdout = document.getElementById('output_to_stdout').checked;
        if (!outputToStdout && !xf) {
            alert('Please, specify the output file name.');
            return;
        }
        var usePassphrase = document.getElementById('x_passphrase_r').getAttribute('selected') == 'true';
        var useKeyfile = document.getElementById('x_keyfile_r').getAttribute('selected') == 'true';
        var passphrase;
        if (usePassphrase) {
            passphrase = document.getElementById('x_passphrase').value;
            if (!passphrase) {
                alert('Please, enter the passphrase.');
                return;
            }
        }
        else if (useKeyfile) {
            var keyfile = document.getElementById('x_keyfile').value;
            if (!keyfile) {
                alert('Please, select the keyfile.');
                return;
            }
            passphrase = readPassphraseFromKeyfile(keyfile);
            if (!passphrase) {
                alert('Sorry, but the keyfile seems to be empty.');
                return;
            }
        }
        var file = getOrCreateFile(sf);
        if (file) {
            var args = [
                'extract',
                '-f',
                '-sf', file.name,
                '-xf', outputToStdout ? '-' : xf,
                '-p', passphrase
            ];
            var output = '', error = '';
            subprocess.call({
                command: Prefs.get('pathToSteghide'),
                arguments: args,
                charset: null,
                stdout: function(data) {
                    output += data;
                },
                stderr: function(data) {
                    error += data;
                },
                done: function(result) {
                    try {
                        var log = document.getElementById('extract_log');
                        var textbox = document.getElementById('extracted_text');
                        var dontErasePreviousOutput = document.getElementById('dont_erase_previous_output')
                                                              .getAttribute('checked') == 'true';
                        if (result.exitCode != 0 && (!win || result.exitCode != 259)) {
                            log.value = error;
                            if (!dontErasePreviousOutput)
                                textbox.value = '';
                        }
                        else {
                            var decodedOutput;
                            if ((decodedOutput = Utf8.decode(output)) === undefined) {
                                if ((decodedOutput = Cp1251.decode(output)) === undefined) {
                                    error += 'Cannot decode data. ' +
                                      'Quite likely it is binary data, not text.\n';
                                }
                            }
                            decodedOutput = decodedOutput || '';
                            if (dontErasePreviousOutput)
                                textbox.value += decodedOutput;
                            else
                                textbox.value = decodedOutput;
                            if (outputToStdout && error)
                                log.value = error;
                            else
                                log.value = 'Success.';
                        }
                        scrollTextboxToBottom(log);
                    }
                    finally {
                        if (file.temporary)
                            OS.unlink(file.name);
                    }
                },
                mergeStderr: false
            });
        }
    }
    catch(e) {
        alert(e);
    }
}
function showSteghideInfo(extract) {
    try {
        var sf;
        if (extract)
            sf = document.getElementById('stego_file').value;
        else
            sf = document.getElementById('cover_file').value;
        if (!sf) {
            if (extract)
                alert('Please, select the stego file.');
            else
                alert('Please, select the cover file.');
            return;
        }
        var passphrase;
        if (extract) {
            var usePassphrase = document.getElementById('x_passphrase_r').getAttribute('selected') == 'true';
            var useKeyfile = document.getElementById('x_keyfile_r').getAttribute('selected') == 'true';
            if (usePassphrase) {
                passphrase = document.getElementById('x_passphrase').value;
                if (!passphrase) {
                    alert('Please, enter the passphrase.');
                    return;
                }
            }
            else if (useKeyfile) {
                var keyfile = document.getElementById('x_keyfile').value;
                if (!keyfile) {
                    alert('Please, select the keyfile.');
                    return;
                }
                passphrase = readPassphraseFromKeyfile(keyfile);
                if (!passphrase) {
                    alert('Sorry, but the keyfile seems to be empty.');
                    return;
                }
            }
        }
        var file = getOrCreateFile(sf);
        if (file) {
            var args = ['info'];
            if (extract)
                args.push('-p', passphrase);
            args.push(file.name);
            var log;
            if (extract)
                log = document.getElementById('extract_log');
            else
                log = document.getElementById('embed_log');
            var output = '';
            subprocess.call({
                command: Prefs.get('pathToSteghide'),
                arguments: args,
                stdout: function(data) {
                    output += data;
                },
                done: function(result) {
                    try {
                        log.value = output;
                        scrollTextboxToBottom(log);
                    }
                    finally {
                        if (file.temporary)
                            OS.unlink(file.name);
                    }
                },
                mergeStderr: true
            });
        }
    }
    catch(e) {
        alert(e);
    }
}

