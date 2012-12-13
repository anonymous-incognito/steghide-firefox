// vim:sts=4:et:sw=4:ai:nosi:ft=javascript

let EXPORTED_SYMBOLS = [ 'Utf8', 'Cp1251' ];

var Utf8 = {
    encode: function (str) {
        const chr = String.fromCharCode;
        var result = '';
        for (var i = 0; i < str.length; i++) {

            var c = str.charCodeAt(i);

            if (c <= 0x7f) {
                result += chr(c);
            }
            else if ((c >= 0x80) && (c <= 0x7ff)) {
                result += chr((c >> 6) | 0xc0) +
                          chr((c & 0x3f) | 0x80);
            }
            else if ((c >= 0x800) && (c <= 0xffff)) {
                result += chr((c >> 12) | 0xe0) +
                          chr(((c >> 6) & 0x3f) | 0x80) +
                          chr((c & 0x3f) | 0x80);
            }
            else if ((c >= 0x10000) && (c <= 0x10ffff)) {
                result += chr((c >> 18) | 0xf0) +
                          chr(((c >> 12) & 0x3f) | 0x80) +
                          chr(((c >> 6) & 0x3f) | 0x80) +
                          chr((c & 0x3f) | 0x80);
            }
            else {
                return;
            }
        }
        return result;
    },

    decode: function (str) {
        var result = '';
        var i = 0;
        var c, ucp;
        while (i < str.length) {
            c = str.charCodeAt(i);
            if (c <= 0x7f) {
                ucp = c;
            }
            else {
                var n;
                if ((c & 0xe0) == 0xc0) {
                    ucp = c & 0x1f;
                    n = 1;
                }
                else if ((c & 0xf0) == 0xe0) {
                    ucp = c & 0x0f;
                    n = 2;
                }
                else if ((c & 0xf8) == 0xf0) {
                    ucp = c & 7;
                    n = 3;
                }
                else {
                    return;
                }
                if (i >= str.length - n)
                    return;
                while (n--) {
                    c = str.charCodeAt(++i);
                    if ((c & 0xc0) != 0x80)
                        return;
                    ucp <<= 6;
                    ucp |= c & 0x3f;
                }
            }
            result += String.fromCharCode(ucp);
            i++;
        }
        return result;
    },

    validate: function (str) {
        var utf8Regex = new RegExp(
          '^(' +
            '[\x09\x0A\x0D\x20-\x7E]' +            // ASCII
            '|[\xC2-\xDF][\x80-\xBF]' +            // non-overlong 2-byte
            '|\xE0[\xA0-\xBF][\x80-\xBF]' +        // excluding overlongs
            '|[\xE1-\xEC\xEE\xEF][\x80-\xBF]{2}' + // straight 3-byte
            '|\xED[\x80-\x9F][\x80-\xBF]' +        // excluding surrogates
            '|\xF0[\x90-\xBF][\x80-\xBF]{2}' +     // planes 1-3
            '|[\xF1-\xF3][\x80-\xBF]{3}' +         // planes 4-15
            '|\xF4[\x80-\x8F][\x80-\xBF]{2}' +     // plane 16
          ')*$'
        );
        return str.search(utf8Regex) != -1;
    }
};

var Cp1251 = {
    encode: function(str) {
        var c, result = '';
        for (var i = 0; i < str.length; i++) {
            c = str.charCodeAt(i);
            if (c <= 127) {
                result += str.charAt(i);
            }
            else {
                if (c >= 1040 && c <= 1103) {
                    c -= 848;
                }
                else if (c == 1105) {
                    c = 184;
                }
                else if (c == 1025) {
                    c = 168;
                }
                else {
                    return;
                }
                result += String.fromCharCode(c);
            }
        }
        return result;
    },

    decode: function(str) {
        var c, result = '';
        for (var i = 0; i < str.length; i++) {
            c = str.charCodeAt(i);
            if (c <= 127) {
                result += str.charAt(i);
            }
            else {
                if (c >= 192) {
                    c += 848;
                }
                else if (c == 184) {
                    c = 1105;
                }
                else if (c == 168) {
                    c = 1025;
                }
                else {
                    return;
                }
                result += String.fromCharCode(c);
            }
        }
        return result;
    },

    validate: function (str) {
        var cp1251Regex = new RegExp(
            '^[\x09\x0A\x0D\x20-\x7E\xC0-\xFF\xB8\xA8]*$'
        );
        return str.search(cp1251Regex) != -1;
    }
};

