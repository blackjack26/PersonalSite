/* --------
 Utils.ts

 Utility functions.
 -------- */
var TSOS;
(function (TSOS) {
    var Utils = /** @class */ (function () {
        function Utils() {
        }
        Utils.toHex = function (n, prefix) {
            if (prefix === void 0) { prefix = false; }
            return (prefix ? '0x' : '') + n.toString(16).toUpperCase();
        };
        Utils.toHexDigit = function (n, digits, prefix) {
            if (prefix === void 0) { prefix = false; }
            var pre = prefix ? '0x' : '';
            var num = n.toString(16).toUpperCase();
            for (var i = num.length; i < digits; i++) {
                pre += '0';
            }
            return pre + num;
        };
        Utils.toDecimal = function (hex) {
            return parseInt(hex, 16);
        };
        Utils.hexToString = function (data) {
            var str = "";
            for (var i = 0; i < data.length - 1; i += 2) {
                var codeStr = data[i] + data[i + 1];
                if (codeStr === "00")
                    break;
                str += String.fromCharCode(TSOS.Utils.toDecimal(codeStr));
            }
            return str;
        };
        Utils.stringToHex = function (data) {
            var hex = "";
            for (var i = 0; i < data.length; i++) {
                hex += data.charCodeAt(i).toString(16);
            }
            return hex.toUpperCase();
        };
        Utils.trim = function (str) {
            // Use a regular expression to remove leading and trailing spaces.
            return str.replace(/^\s+ | \s+$/g, '');
            /*
             Huh? WTF? Okay... take a breath. Here we go:
             - The "|" separates this into two expressions, as in A or B.
             - "^\s+" matches a sequence of one or more whitespace characters at the beginning of a string.
             - "\s+$" is the same thing, but at the end of the string.
             - "g" makes is global, so we get all the whitespace.
             - "" is nothing, which is what we replace the whitespace with.
             */
        };
        Utils.rot13 = function (str) {
            /*
             This is an easy-to understand implementation of the famous and common Rot13 obfuscator.
             You can do this in three lines with a complex regular expression, but I'd have
             trouble explaining it in the future.  There's a lot to be said for obvious code.
             */
            var retVal = '';
            for (var i in str) {
                var ch = str[i];
                var code = 0;
                if ('abcedfghijklmABCDEFGHIJKLM'.indexOf(ch) >= 0) {
                    code = str.charCodeAt(Number(i)) + 13; // It's okay to use 13.  It's not a magic number, it's called rot13.
                    retVal = retVal + String.fromCharCode(code);
                }
                else if ('nopqrstuvwxyzNOPQRSTUVWXYZ'.indexOf(ch) >= 0) {
                    code = str.charCodeAt(Number(i)) - 13; // It's okay to use 13.  See above.
                    retVal = retVal + String.fromCharCode(code);
                }
                else {
                    retVal = retVal + ch;
                }
            }
            return retVal;
        };
        Utils.formatDate = function (date) {
            var year = date.getFullYear();
            var month = this.months[date.getMonth()];
            var dow = this.daysOfWeek[date.getDay()];
            var day = date.getDate();
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var seconds = date.getSeconds();
            return dow + ", " + month + " " + day + ", " + year + " " +
                (hours + ":" + (minutes <= 9 ? '0' + minutes : minutes) + ":" + (seconds <= 9 ? '0' + seconds : seconds));
        };
        Utils.months = [
            'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
        ];
        Utils.daysOfWeek = [
            'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
        ];
        return Utils;
    }());
    TSOS.Utils = Utils;
})(TSOS || (TSOS = {}));
