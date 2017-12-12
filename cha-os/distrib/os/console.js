///<reference path="../globals.ts" />
/* ------------
 Console.ts

 Requires globals.ts

 The OS Console - stdIn and stdOut by default.
 Note: This is not the Shell. The Shell is the "command line interface" (CLI) or interpreter for this console.
 ------------ */
var TSOS;
(function (TSOS) {
    var Console = /** @class */ (function () {
        function Console(currentFont, currentFontSize, currentXPosition, currentYPosition, buffer, scrollDist, wrappedLines) {
            if (currentFont === void 0) { currentFont = _DefaultFontFamily; }
            if (currentFontSize === void 0) { currentFontSize = _DefaultFontSize; }
            if (currentXPosition === void 0) { currentXPosition = 0; }
            if (currentYPosition === void 0) { currentYPosition = _DefaultFontSize; }
            if (buffer === void 0) { buffer = ''; }
            if (scrollDist === void 0) { scrollDist = 0; }
            if (wrappedLines === void 0) { wrappedLines = []; }
            var _this = this;
            this.currentFont = currentFont;
            this.currentFontSize = currentFontSize;
            this.currentXPosition = currentXPosition;
            this.currentYPosition = currentYPosition;
            this.buffer = buffer;
            this.scrollDist = scrollDist;
            this.wrappedLines = wrappedLines;
            this.cursorShown = true;
            this.cursorWidth = 10;
            this.blinkStart = setTimeout(function () {
                _this.startCursorBlink();
            }, 0);
        }
        Console.prototype.init = function () {
            this.clearScreen();
            this.resetXY();
        };
        Console.prototype.clearScreen = function () {
            _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
            _Canvas.height = 500;
        };
        Console.prototype.resetXY = function () {
            this.currentXPosition = 0;
            this.currentYPosition = this.currentFontSize;
        };
        Console.prototype.handleInput = function () {
            var _loop_1 = function () {
                // Get the next character from the kernel input queue.
                var chr = _KernelInputQueue.dequeue();
                // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
                /* Ctrl-C (24 - CANCEL) */
                if (chr === String.fromCharCode(24)) {
                    this_1.buffer = '';
                    this_1.advanceLine();
                    _OsShell.putPrompt();
                }
                else if (chr === String.fromCharCode(11)) {
                    _OsShell.handleInput('cls');
                    this_1.buffer = '';
                }
                else if (chr === String.fromCharCode(13)) {
                    // The enter key marks the end of a console command, so ...
                    // ... tell the shell ...
                    _OsShell.handleInput(this_1.buffer);
                    // ... and reset our buffer.
                    this_1.buffer = '';
                }
                else if (chr === String.fromCharCode(8)) {
                    _DrawingContext.eraseLetter();
                }
                else if (chr === String.fromCharCode(9)) {
                    if (this_1.buffer.length !== 0) {
                        var wordArr = this_1.buffer.toLowerCase().split(' ');
                        var word_1 = wordArr[wordArr.length - 1];
                        var possibleCmds = _OsShell.commandList.filter(function (value) { return value.command.indexOf(word_1) === 0; });
                        // Complete if only one matching command
                        if (possibleCmds.length === 1) {
                            var cmd = possibleCmds[0].command.substr(word_1.length) + ' ';
                            this_1.putText(cmd);
                            this_1.buffer += cmd;
                        }
                        else if (possibleCmds.length > 1) {
                            var oldX = this_1.currentXPosition;
                            var oldY = this_1.currentYPosition;
                            this_1.scrollDist = 0;
                            this_1.advanceLine();
                            this_1.putText(possibleCmds.map(function (value) { return value.command; }).join(', '));
                            this_1.displayCursor(false);
                            this_1.currentXPosition = oldX;
                            this_1.currentYPosition = oldY - this_1.scrollDist;
                            this_1.displayCursor(true);
                        }
                    }
                }
                else if (chr === String.fromCharCode(2191)) {
                    this_1.recallCommand(_OsShell.getPreviousCommand());
                }
                else if (chr === String.fromCharCode(2193)) {
                    this_1.recallCommand(_OsShell.getNextCommand());
                }
                else {
                    // This is a "normal" character, so ...
                    // ... draw it on the screen...
                    this_1.putText(chr);
                    // ... and add it to our buffer.
                    this_1.buffer += chr;
                }
                // TODO: Write a case for Ctrl-C.
            };
            var this_1 = this;
            while (_KernelInputQueue.getSize() > 0) {
                _loop_1();
            }
        };
        // Clears the current input and replaces it with the given command
        Console.prototype.recallCommand = function (cmd) {
            _DrawingContext.clearLine(0, this.currentYPosition, this.currentFont, this.currentFontSize);
            // remove all wrapped lines from current command as well
            if (this.wrappedLines.length > 0) {
                for (var i = 0; i < this.wrappedLines.length; i++) {
                    this.currentYPosition -= this.lineHeight();
                    _DrawingContext.clearLine(0, this.currentYPosition, this.currentFont, this.currentFontSize);
                }
                this.wrappedLines = [];
            }
            this.currentXPosition = 0;
            this.buffer = '';
            _OsShell.putPrompt();
            if (cmd)
                this.putText(cmd);
            this.buffer = cmd;
        };
        Console.prototype.putText = function (text, prompt) {
            if (prompt === void 0) { prompt = false; }
            // My first inclination here was to write two functions: putChar() and putString().
            // Then I remembered that JavaScript is (sadly) untyped and it won't differentiate
            // between the two.  So rather than be like PHP and write two (or more) functions that
            // do the same thing, thereby encouraging confusion and decreasing readability, I
            // decided to write one function and use the term "text" to connote string or char.
            //
            // UPDATE: Even though we are now working in TypeScript, char and string remain undistinguished.
            //         Consider fixing that.
            if (text !== '') {
                this.displayCursor(false);
                // Draw the text at the current X and Y coordinates.
                this.currentXPosition =
                    _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text, prompt);
                this.displayCursor(true);
                this.stopCursorBlink(500);
            }
        };
        Console.prototype.advanceLine = function (wrap) {
            if (wrap === void 0) { wrap = false; }
            if (!wrap) {
                this.displayCursor(false);
                // clear instances of wrapped lines
                this.wrappedLines = [];
            }
            this.currentXPosition = 0;
            /*
             * Font size measures from the baseline to the highest point in the font.
             * Font descent measures from the baseline to the lowest point in the font.
             * Font height margin is extra spacing between the lines.
             */
            var lineHeight = this.lineHeight();
            this.currentYPosition += lineHeight;
            _DrawingContext.clearLine(this.currentXPosition, this.currentYPosition, this.currentFont, this.currentFontSize);
            // Scroll if y-position is greater than canvas height
            if (this.currentYPosition > _Canvas.height) {
                var oldData = _DrawingContext.getImageData(0, 0, _Canvas.width, _Canvas.height);
                this.clearScreen();
                _DrawingContext.putImageData(oldData, 0, -lineHeight);
                this.currentYPosition -= lineHeight;
                this.scrollDist += lineHeight;
            }
            else {
                this.scrollDist = 0;
            }
        };
        Console.prototype.wrapLine = function (x) {
            this.advanceLine(true);
            // Save x-coordinate before wrap for backspace position
            this.wrappedLines.push(x);
        };
        Console.prototype.lineHeight = function () {
            return _DefaultFontSize +
                _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                _FontHeightMargin;
        };
        Console.prototype.startCursorBlink = function () {
            var _this = this;
            if (!_OsShell.hidePrompt) {
                this.cursorBlink = setInterval(function () {
                    _this.displayCursor(!_this.cursorShown);
                }, 500);
            }
            else {
                this.displayCursor(false);
            }
        };
        Console.prototype.stopCursorBlink = function (timeout) {
            var _this = this;
            clearInterval(this.cursorBlink);
            clearTimeout(this.blinkStart);
            this.blinkStart = setTimeout(function () {
                _this.startCursorBlink();
            }, timeout);
        };
        Console.prototype.displayCursor = function (shown) {
            var x = _Console.currentXPosition, y = _Console.currentYPosition, font = _Console.currentFont, size = _Console.currentFontSize;
            if (shown) {
                _DrawingContext.fillStyle = '#586E75';
                _DrawingContext.fillRect(x + 1, y - size + 1, this.cursorWidth - 2, _DrawingContext.fontAscent(font, size) + _DrawingContext.fontDescent(font, size) - 2);
            }
            else {
                _DrawingContext.fillStyle = '#FDF6E3';
                _DrawingContext.fillRect(x, y - size, this.cursorWidth, _DrawingContext.fontAscent(font, size) + _DrawingContext.fontDescent(font, size));
            }
            this.cursorShown = shown;
        };
        Console.prototype.initiateSelfDestruct = function () {
            document.getElementById('canvas-card').classList.add('destruct');
            document.getElementById('btnStartOS').classList.add('destruct');
            document.getElementById('btnHaltOS').classList.add('destruct');
            document.getElementsByTagName('body')[0].classList.remove('is-dark');
            document.getElementsByTagName('body')[0].classList.add('is-info');
        };
        return Console;
    }());
    TSOS.Console = Console;
})(TSOS || (TSOS = {}));
