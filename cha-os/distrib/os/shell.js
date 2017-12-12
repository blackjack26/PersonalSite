///<reference path="../globals.ts" />
///<reference path="../utils.ts" />
///<reference path="shellCommand.ts" />
///<reference path="userCommand.ts" />
/* ------------
 Shell.ts

 The OS Shell - The "command line interface" (CLI) for the console.

 Note: While fun and learning are the primary goals of all enrichment center activities,
 serious injuries may occur when trying to write your own Operating System.
 ------------ */
// TODO: Write a base class / prototype for system services and let Shell inherit from it.
var TSOS;
(function (TSOS) {
    var Shell = /** @class */ (function () {
        function Shell() {
            // Properties
            this.promptStr = '>';
            this.commandList = [];
            this.curses = '[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]';
            this.apologies = '[sorry]';
            this.commandHistory = [];
            this.historyIndex = 0;
            this.lastCommand = '';
            this.cmdOccurrence = 1;
            this.hidePrompt = false;
        }
        Shell.prototype.init = function () {
            var sc;
            //
            // Load the command list.
            // ver
            sc = new TSOS.ShellCommand(this.shellVer, 'ver', '- Displays the current version data.');
            this.commandList[this.commandList.length] = sc;
            // help
            sc = new TSOS.ShellCommand(this.shellHelp, 'help', '- This is the help command. Seek help.');
            this.commandList[this.commandList.length] = sc;
            // shutdown
            sc = new TSOS.ShellCommand(this.shellShutdown, 'shutdown', '- Shuts down the virtual OS but leaves the underlying host / hardware simulation running.');
            this.commandList[this.commandList.length] = sc;
            // cls
            sc = new TSOS.ShellCommand(this.shellCls, 'cls', '- Clears the screen and resets the cursor position.');
            this.commandList[this.commandList.length] = sc;
            // man <topic>
            sc = new TSOS.ShellCommand(this.shellMan, 'man', '<topic> - Displays the MANual page for <topic>.');
            this.commandList[this.commandList.length] = sc;
            // trace <on | off>
            sc = new TSOS.ShellCommand(this.shellTrace, 'trace', '<on | off> - Turns the OS trace on or off.');
            this.commandList[this.commandList.length] = sc;
            // rot13 <string>
            sc = new TSOS.ShellCommand(this.shellRot13, 'rot13', '<string> - Does rot13 obfuscation on <string>.');
            this.commandList[this.commandList.length] = sc;
            // prompt <string>
            sc = new TSOS.ShellCommand(this.shellPrompt, 'prompt', '<string> - Sets the prompt.');
            this.commandList[this.commandList.length] = sc;
            // date
            sc = new TSOS.ShellCommand(this.shellDate, 'date', '- Displays the current date and time.');
            this.commandList[this.commandList.length] = sc;
            // whereami
            sc = new TSOS.ShellCommand(this.shellWhereAmI, 'whereami', '- Displays the user\'s current location');
            this.commandList[this.commandList.length] = sc;
            // ni
            sc = new TSOS.ShellCommand(this.shellNi, 'ni', '- Those who hear it, seldom live to tell the tale!');
            this.commandList[this.commandList.length] = sc;
            // status
            sc = new TSOS.ShellCommand(this.shellStatus, 'status', '<string> - Displays a user-defined status message.');
            this.commandList[this.commandList.length] = sc;
            // history
            sc = new TSOS.ShellCommand(this.shellHistory, 'history', '[number] - Displays the user\'s command history');
            this.commandList[this.commandList.length] = sc;
            // recall
            sc = new TSOS.ShellCommand(this.shellRecall, 'recall', '<number> - Recalls a command based on it\'s history number');
            this.commandList[this.commandList.length] = sc;
            // paradox
            sc = new TSOS.ShellCommand(this.shellParadox, 'paradox', '- Initiates kernel destruction');
            this.commandList[this.commandList.length] = sc;
            // load
            sc = new TSOS.ShellCommand(this.shellLoad, 'load', '- [priority] Loads the user program input');
            this.commandList[this.commandList.length] = sc;
            // run
            sc = new TSOS.ShellCommand(this.shellRun, 'run', '<pid> - runs the given process');
            this.commandList[this.commandList.length] = sc;
            // ps  - list the running processes and their IDs
            sc = new TSOS.ShellCommand(this.shellPs, 'ps', '- Displays all active processes');
            this.commandList[this.commandList.length] = sc;
            // kill <id> - kills the specified process id.
            sc = new TSOS.ShellCommand(this.shellKill, 'kill', '<pid> - kills the given process');
            this.commandList[this.commandList.length] = sc;
            // clearmem
            sc = new TSOS.ShellCommand(this.shellClearmem, 'clearmem', '- Clears all memory segments');
            this.commandList[this.commandList.length] = sc;
            // runall
            sc = new TSOS.ShellCommand(this.shellRunall, 'runall', '- Runs all loaded programs');
            this.commandList[this.commandList.length] = sc;
            // quantum
            sc = new TSOS.ShellCommand(this.shellQuantum, 'quantum', '- <number> Sets the quantum for round robin');
            this.commandList[this.commandList.length] = sc;
            // format
            sc = new TSOS.ShellCommand(this.shellFormat, 'format', '- [-quick | -full] formats the hard disk');
            this.commandList[this.commandList.length] = sc;
            // create
            sc = new TSOS.ShellCommand(this.shellCreate, 'create', '- <filename> creates a file with given name');
            this.commandList[this.commandList.length] = sc;
            // read
            sc = new TSOS.ShellCommand(this.shellRead, 'read', '- <filename> reads data from the given file');
            this.commandList[this.commandList.length] = sc;
            // write
            sc = new TSOS.ShellCommand(this.shellWrite, 'write', '- <filename> "data" writes the data to the given file');
            this.commandList[this.commandList.length] = sc;
            // delete
            sc = new TSOS.ShellCommand(this.shellDelete, 'delete', '- <filename> deletes the given file');
            this.commandList[this.commandList.length] = sc;
            // ls
            sc = new TSOS.ShellCommand(this.shellLs, 'ls', '- [-l] lists the current files');
            this.commandList[this.commandList.length] = sc;
            // getschedule
            sc = new TSOS.ShellCommand(this.shellGetSchedule, 'getschedule', '- gets the current scheduling type');
            this.commandList[this.commandList.length] = sc;
            // setschedule
            sc = new TSOS.ShellCommand(this.shellSetSchedule, 'setschedule', '- <rr | fcfs | priority> sets the scheduling type');
            this.commandList[this.commandList.length] = sc;
            // Display the initial prompt.
            this.putPrompt();
        };
        Shell.prototype.putPrompt = function () {
            _StdOut.putText(this.promptStr, true);
        };
        Shell.prototype.handleInput = function (buffer) {
            _Kernel.krnTrace('Shell Command~' + buffer);
            if (buffer && buffer !== '') {
                this.commandHistory.push(buffer);
                this.historyIndex = this.commandHistory.length;
            }
            //
            // Parse the input...
            //
            var userCommand = this.parseInput(buffer);
            _Console.buffer = '';
            // ... and assign the command and args to local variables.
            var cmd = userCommand.command;
            var args = userCommand.args;
            // Command counting
            if (this.lastCommand !== cmd) {
                this.cmdOccurrence = 1;
                this.lastCommand = cmd;
            }
            else {
                this.cmdOccurrence += 1;
            }
            //
            // Determine the command and execute it.
            //
            // TypeScript/JavaScript may not support associative arrays in all browsers so we have to iterate over the
            // command list in attempt to find a match.  TODO: Is there a better way? Probably. Someone work it out and tell me in class.
            var index = 0;
            var found = false;
            var fn = undefined;
            while (!found && index < this.commandList.length) {
                if (this.commandList[index].command === cmd) {
                    found = true;
                    fn = this.commandList[index].func;
                }
                else {
                    ++index;
                }
            }
            if (found) {
                this.execute(fn, args);
            }
            else {
                // It's not found, so check for curses and apologies before declaring the command invalid.
                if (this.curses.indexOf('[' + TSOS.Utils.rot13(cmd) + ']') >= 0) {
                    this.execute(this.shellCurse);
                }
                else if (this.apologies.indexOf('[' + cmd + ']') >= 0) {
                    this.execute(this.shellApology);
                }
                else if (cmd === 'nu') {
                    this.execute(this.shellNu);
                }
                else if (cmd === '') {
                    _StdOut.advanceLine();
                    this.putPrompt();
                }
                else {
                    this.execute(this.shellInvalidCommand);
                }
            }
        };
        // Note: args is an option parameter, ergo the ? which allows TypeScript to understand that.
        Shell.prototype.execute = function (fn, args) {
            // We just got a command, so advance the line...
            _StdOut.advanceLine();
            // ... call the command function passing in the args with some über-cool functional programming ...
            fn(args);
            if (!_OsShell.hidePrompt) {
                // Check to see if we need to advance the line again
                if (_StdOut.currentXPosition > 0) {
                    _StdOut.advanceLine();
                }
                // ... and finally write the prompt again.
                this.putPrompt();
            }
        };
        Shell.prototype.parseInput = function (buffer) {
            var retVal = new TSOS.UserCommand();
            // 1. Remove leading and trailing spaces.
            buffer = TSOS.Utils.trim(buffer);
            // 2. Separate on spaces so we can determine the command and command-line args, if any.
            var tempList = buffer.split(' ');
            // 3. Lower-case it the command
            tempList[0] = tempList[0].toLowerCase();
            // 4. Take the first (zeroth) element and use that as the command.
            var cmd = tempList.shift(); // Yes, you can do that to an array in JavaScript.  See the Queue class.
            // 4.1 Remove any left-over spaces.
            cmd = TSOS.Utils.trim(cmd);
            // 4.2 Record it in the return value.
            retVal.command = cmd;
            // 5. Now create the args array from what's left.
            for (var i in tempList) {
                var arg = TSOS.Utils.trim(tempList[i]);
                if (arg != '') {
                    retVal.args[retVal.args.length] = tempList[i];
                }
            }
            return retVal;
        };
        Shell.prototype.getPreviousCommand = function () {
            if (!this.commandHistory.length)
                return '';
            if (this.historyIndex > 0)
                this.historyIndex--;
            return this.commandHistory[this.historyIndex];
        };
        Shell.prototype.getNextCommand = function () {
            if (!this.commandHistory.length)
                return '';
            if (this.historyIndex < this.commandHistory.length)
                this.historyIndex++;
            if (this.historyIndex === this.commandHistory.length)
                return '';
            return this.commandHistory[this.historyIndex];
        };
        //
        // Shell Command Functions.  Kinda not part of Shell() class exactly, but
        // called from here, so kept here to avoid violating the law of least astonishment.
        //
        Shell.prototype.shellInvalidCommand = function () {
            _StdOut.putText('Invalid Command. ');
            if (_SarcasticMode) {
                _StdOut.putText('Unbelievable. You, [subject name here],');
                _StdOut.advanceLine();
                _StdOut.putText('must be the pride of [subject hometown here].');
            }
            else {
                _StdOut.putText('Type \'help\' for, well... help.');
            }
        };
        Shell.prototype.shellCurse = function () {
            _StdOut.putText('Oh, so that\'s how it\'s going to be, eh? Fine.');
            _StdOut.advanceLine();
            _StdOut.putText('Bitch.');
            _SarcasticMode = true;
        };
        Shell.prototype.shellApology = function () {
            if (_SarcasticMode) {
                _StdOut.putText('I think we can put our differences behind us.');
                _StdOut.advanceLine();
                _StdOut.putText('For science . . . You monster.');
                _SarcasticMode = false;
            }
            else {
                _StdOut.putText('For what?');
            }
        };
        Shell.prototype.shellVer = function (args) {
            _StdOut.putText(APP_NAME + ' version ' + APP_VERSION);
            _StdOut.advanceLine();
            _StdOut.putText('** Fact Sphere approved **');
        };
        Shell.prototype.shellHelp = function (args) {
            _StdOut.putText('Commands:');
            for (var i in _OsShell.commandList) {
                _StdOut.advanceLine();
                _StdOut.putText('  ' + _OsShell.commandList[i].command + ' ' + _OsShell.commandList[i].description);
            }
        };
        Shell.prototype.shellShutdown = function (args) {
            _OsShell.hidePrompt = true;
            _StdOut.putText('Shutting down...');
            // Call Kernel shutdown routine.
            _Kernel.krnShutdown();
        };
        Shell.prototype.shellCls = function (args) {
            _StdOut.clearScreen();
            _StdOut.resetXY();
        };
        Shell.prototype.shellMan = function (args) {
            if (args.length > 0) {
                var topic = args[0].toLowerCase();
                switch (topic) {
                    case 'help':
                        _StdOut.putText('Help displays a list of (hopefully) valid commands.');
                        break;
                    case 'ver':
                        _StdOut.putText('Most likely displays the current version of the OS.');
                        break;
                    case 'shutdown':
                        _StdOut.putText('Terminates the operating system upon execution.');
                        break;
                    case 'cls':
                        _StdOut.putText('Clears the content on the screen.');
                        break;
                    case 'trace':
                        _StdOut.putText('Turns the OS trace on or off.');
                        _StdOut.advanceLine();
                        _StdOut.putText('Usage: \0trace <on | off>\f');
                        break;
                    case 'rot13':
                        _StdOut.putText('Does rot13 obfuscation on the given argument');
                        _StdOut.advanceLine();
                        _StdOut.putText('Usage: \0rot13 <string>\f');
                        break;
                    case 'prompt':
                        _StdOut.putText('Sets the CLI prompt.');
                        _StdOut.advanceLine();
                        _StdOut.putText('Usage: \0prompt <string>\f');
                        break;
                    case 'date':
                        _StdOut.putText('Shows the current date and time.');
                        break;
                    case 'whereami':
                        _StdOut.putText('Describes the current user\'s state of mind');
                        break;
                    case 'ni':
                        _StdOut.putText('Those who hear it, seldom live to tell the tale!');
                        break;
                    case 'status':
                        _StdOut.putText('Updates the host display with a status message');
                        _StdOut.advanceLine();
                        _StdOut.putText('Usage: \0status <string>\f');
                        break;
                    case 'history':
                        _StdOut.putText('Displays a list of commands the user has executed');
                        _StdOut.advanceLine();
                        _StdOut.putText('Usage: \0history [number]\f');
                        _StdOut.advanceLine();
                        _StdOut.putText('  [number] - (Optional) how far back to into history');
                        break;
                    case 'recall':
                        _StdOut.putText('Recalls a command based on it\'s historical number.');
                        _StdOut.advanceLine();
                        _StdOut.putText('Usage: \0recall <number>\f');
                        break;
                    case 'paradox':
                        _StdOut.putText('Only use this in case of rouge AI');
                        break;
                    case 'load':
                        _StdOut.putText('Loads a user program into the OS');
                        _StdOut.advanceLine();
                        _StdOut.putText('Usage: \0load [priority]\f');
                        _StdOut.advanceLine();
                        _StdOut.putText('  [priority] - (Optional) the priority of the process for scheduling');
                        break;
                    case 'run':
                        _StdOut.putText('Runs a process by the given process ID');
                        _StdOut.advanceLine();
                        _StdOut.putText('Usage: \0run <pid>\f');
                        break;
                    case 'ps':
                        _StdOut.putText('Displays all active processes');
                        break;
                    case 'kill':
                        _StdOut.putText('Kills the given processes');
                        _StdOut.advanceLine();
                        _StdOut.putText('Usage: \0kill <pid> [<pid> ...]\f');
                        break;
                    case 'clearmem':
                        _StdOut.putText('Clears all memory segments');
                        break;
                    case 'runall':
                        _StdOut.putText('Runs all the currently loaded programs');
                        break;
                    case 'quantum':
                        _StdOut.putText('Sets the quantum for round robin scheduling');
                        _StdOut.advanceLine();
                        _StdOut.putText('Usage: \0quantum <number>\f');
                        break;
                    case 'format':
                        _StdOut.putText('Formats this disk to allow file creation');
                        _StdOut.advanceLine();
                        _StdOut.putText('Usage: \0format [-quick | -full]\f');
                        _StdOut.advanceLine();
                        _StdOut.putText('  [-quick] - (Optional) marks all of disk as free');
                        _StdOut.advanceLine();
                        _StdOut.putText('  [-full] - (Optional) clears all data off disk');
                        break;
                    case 'create':
                        _StdOut.putText('Creates a file with the given name');
                        _StdOut.advanceLine();
                        _StdOut.putText('Usage: \0create <filename>\f');
                        break;
                    case 'read':
                        _StdOut.putText('Reads data from the given file');
                        _StdOut.advanceLine();
                        _StdOut.putText('Usage: \0read <filename>\f');
                        break;
                    case 'write':
                        _StdOut.putText('Writes data to the given file');
                        _StdOut.advanceLine();
                        _StdOut.putText('Usage: \0write <filename> "data"\f');
                        break;
                    case 'delete':
                        _StdOut.putText('Deletes the given file');
                        _StdOut.advanceLine();
                        _StdOut.putText('Usage: \0delete <filename>\f');
                        break;
                    case 'ls':
                        _StdOut.putText('Lists the current files');
                        _StdOut.advanceLine();
                        _StdOut.putText('Usage: \0ls [-l]\f');
                        _StdOut.advanceLine();
                        _StdOut.putText('  [-l] - (Optional) displays file size and creation date');
                        break;
                    case 'getschedule':
                        _StdOut.putText('Gets the current scheduling type');
                        break;
                    case 'setschedule':
                        _StdOut.putText('Sets the scheduling type');
                        _StdOut.advanceLine();
                        _StdOut.putText('Usage: \0setschedule <rr | fcfs | priority>\f');
                        break;
                    default:
                        _StdOut.putText('No manual entry for ' + args[0] + '.');
                }
            }
            else {
                _StdOut.putText('Usage: \0man <topic>\f  Please supply a topic.');
            }
        };
        Shell.prototype.shellTrace = function (args) {
            if (args.length > 0) {
                var setting = args[0].toLowerCase();
                switch (setting) {
                    case 'on':
                        if (_Trace && _SarcasticMode) {
                            _StdOut.putText('Trace is already on, doofus.');
                        }
                        else {
                            _Trace = true;
                            _StdOut.putText('Trace ON');
                        }
                        break;
                    case 'off':
                        _Trace = false;
                        _StdOut.putText('Trace OFF');
                        break;
                    default:
                        _StdOut.putText('Invalid arguement.  Usage: \0trace <on | off>\f.');
                }
            }
            else {
                _StdOut.putText('Usage: \0trace <on | off>\f');
            }
        };
        Shell.prototype.shellRot13 = function (args) {
            if (args.length > 0) {
                // Requires Utils.ts for rot13() function.
                _StdOut.putText(args.join(' ') + ' = \'' + TSOS.Utils.rot13(args.join(' ')) + '\'');
            }
            else {
                _StdOut.putText('Usage: \0rot13 <string>\f  Please supply a string.');
            }
        };
        Shell.prototype.shellPrompt = function (args) {
            if (args.length > 0) {
                _OsShell.promptStr = args[0];
            }
            else {
                _StdOut.putText('Usage: \0prompt <string>\f  Please supply a string.');
            }
        };
        Shell.prototype.shellDate = function (args) {
            _StdOut.putText(TSOS.Utils.formatDate(new Date()));
        };
        Shell.prototype.shellWhereAmI = function (args) {
            _StdOut.putText('You are in the Enrichment Center');
        };
        Shell.prototype.shellNi = function (args) {
            if (_OsShell.cmdOccurrence === 1)
                _StdOut.putText('No! Not the Knights who say "Ni"!');
            else if (_OsShell.cmdOccurrence === 2)
                _StdOut.putText('No! Noooo! Aaaugh! No!');
            else if (_OsShell.cmdOccurrence === 3)
                _StdOut.putText('Please, no more! We will find you a shrubbery!');
            else if (_OsShell.cmdOccurrence === 4)
                _StdOut.putText('Shhh! We no longer the Knights who say "Ni"!');
        };
        Shell.prototype.shellNu = function (args) {
            _StdOut.putText('No, no, no, no, it\'s not that. It\'s "ni".');
        };
        Shell.prototype.shellStatus = function (args) {
            if (args.length > 0) {
                TSOS.Control.hostUpdateStatus(args.join(' '));
            }
            else {
                _StdOut.putText('Usage: \0status <string>\f  Please supply a string.');
            }
        };
        Shell.prototype.shellHistory = function (args) {
            var limit = 0;
            if (args.length > 0)
                limit = Number(args[0]);
            // when recalling, other recall commands are omitted
            var noRecall = _OsShell.commandHistory.filter(function (value) { return value.indexOf('recall') !== 0; });
            // Make sure the limit is a proper number (in range of history list)
            if (isNaN(limit) || limit < 0 || limit >= noRecall.length) {
                _StdOut.putText('Please enter a valid number.');
            }
            else {
                // Return only limited history if specified
                var start = 0;
                if (limit !== 0)
                    start = noRecall.length - limit - 1; // -1, account for skipping current command
                var maxIntLength = noRecall.length.toString().length;
                for (var i = start; i < noRecall.length - 1; i++) {
                    var indexNumLength = i.toString().length;
                    var output = ' ';
                    for (var i_1 = 0; i_1 < maxIntLength - indexNumLength; i_1++)
                        output += ' ';
                    output += i + ' ' + noRecall[i];
                    _StdOut.putText(output);
                    _StdOut.advanceLine();
                }
            }
        };
        Shell.prototype.shellRecall = function (args) {
            if (args.length > 0) {
                var num = Number(args[0]);
                // when recalling, other recall commands are omitted
                var noRecall = _OsShell.commandHistory.filter(function (value) { return value.indexOf('recall') !== 0; });
                if (isNaN(num)) {
                    _StdOut.putText('Usage: \0recall <number>\f  Please supply a number');
                }
                else if (num < 0 || num >= noRecall.length) {
                    _StdOut.putText('Please supply a valid history number.');
                }
                else {
                    var newCmd = noRecall[num];
                    _StdOut.putText(newCmd);
                    _OsShell.handleInput(newCmd);
                    _StdOut.currentXPosition = 0;
                }
            }
            else {
                _StdOut.putText('Usage: \0recall <number>\f  Please supply a number');
            }
        };
        Shell.prototype.shellParadox = function (args) {
            _Kernel.krnTrapError('Rogue AI detected');
            _OsShell.hidePrompt = true;
        };
        Shell.prototype.validateProgram = function (program) {
            if (!program) {
                _StdOut.putText('Please enter code in "User Program Input".');
                return null;
            }
            else {
                var programHex = program.replace(/\n/g, '').split(' ');
                var programSize = programHex.length;
                // Rather than matching for proper values, look for improper values.
                // If any exist, then the code is invalid.
                // Also if all the letters are valid hex, make sure they
                var matches = program.match(/[^0-9A-Fa-f \n]/g);
                if (matches) {
                    _StdOut.putText('Invalid characters found in program: ');
                    _StdOut.advanceLine();
                    _StdOut.putText(' ' + matches.join(', '));
                    return null;
                }
                else if (programSize > _FixedSegmentLength) {
                    _StdOut.putText('Program is too large!');
                    return null;
                }
                // Validate that all hex codes are 2 digits
                var hexLengthErr = [];
                for (var i = 0; i < programHex.length; i++) {
                    if (programHex[i].length != 2) {
                        hexLengthErr.push(programHex[i]);
                    }
                }
                if (hexLengthErr.length > 0) {
                    _StdOut.putText('Invalid hex code found in program: ');
                    _StdOut.advanceLine();
                    _StdOut.putText(' ' + hexLengthErr.join(', '));
                    return null;
                }
                return programHex;
            }
        };
        Shell.prototype.shellLoad = function (args) {
            var priority = Number.MAX_VALUE;
            if (args.length > 0) {
                var num = Number(args[0]);
                if (isNaN(num)) {
                    _StdOut.putText("Priority must be a number.");
                    return;
                }
                priority = num;
            }
            var input = TSOS.Control.getProgramInput();
            var validProgram = _OsShell.validateProgram(input);
            if (validProgram != null) {
                var pcb = new TSOS.PCB();
                pcb.priority = priority;
                if (_MMU.load(validProgram, pcb)) {
                    TSOS.Control.updateMemoryDisplay();
                    _StdOut.putText("Program loaded [PID " + pcb.pid + "].");
                }
                else {
                    _StdOut.putText("Unable to load program.");
                }
            }
        };
        Shell.prototype.shellRun = function (args) {
            // Missing args
            if (args.length <= 0) {
                _StdOut.putText('Usage: \0run <pid>\f  Please supply a PID');
                return;
            }
            // Invalid PID
            var pid = args[0];
            if (isNaN(pid)) {
                _StdOut.putText('PID must be a number.');
                return;
            }
            // Assure proper state changes
            var process = TSOS.PCB.getProcess(pid);
            if (!process || !process.ready()) {
                _StdOut.putText("Cannot find process [PID " + pid + "]. Please load program.");
                return;
            }
            if (args[1] == '>' || args[1] == '&>') {
                process.redirectOutput = args[2];
            }
            TSOS.Control.updateProcessDisplay();
        };
        Shell.prototype.shellKill = function (args) {
            // Proper argument lengths
            if (args.length < 1) {
                _StdOut.putText("Usage: \0kill <pid>\f  Please supply a PID");
                return;
            }
            for (var i = 0; i < args.length; i++) {
                var pid = Number(args[i]);
                if (isNaN(pid)) {
                    _StdOut.putText("The PID should be a number.");
                    return;
                }
                else if (TSOS.PCB.getProcess(pid) == null) {
                    _StdOut.putText("Process [PID " + pid + "] does not exist.");
                    return;
                }
                _StdOut.putText("Killing process [PID " + pid + "]...");
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(SYSTEMCALL_IRQ, { type: 2 /* KILL_PROCESS */, pid: pid }));
            }
        };
        Shell.prototype.shellClearmem = function (args) {
            TSOS.PCB.removeAllProcesses();
            _MMU.clearMemory();
        };
        Shell.prototype.shellPs = function (args) {
            var processes = TSOS.PCB.getAvailableProcesses();
            var spacesToState = 7;
            if (processes.length > 0) {
                _StdOut.putText("PID    State");
                _StdOut.advanceLine();
                _StdOut.putText("------------");
                _StdOut.advanceLine();
            }
            TSOS.PCB.getAvailableProcesses().forEach(function (ps) {
                var pidStr = "" + ps.pid;
                var spaces = "";
                for (var i = pidStr.length; i < spacesToState; i++)
                    spaces += " ";
                _StdOut.putText(pidStr + spaces + ps.state);
                _StdOut.advanceLine();
            });
        };
        Shell.prototype.shellRunall = function (args) {
            TSOS.PCB.getAvailableProcesses().forEach(function (ps) {
                ps.ready();
            });
            TSOS.Control.updateProcessDisplay();
        };
        Shell.prototype.shellQuantum = function (args) {
            if (args.length < 1) {
                _StdOut.putText("Usage: \0quantum <number>\f   Please supply a quantum number");
                return;
            }
            var num = Number(args[0]);
            if (isNaN(num) || num <= 0) {
                _StdOut.putText("Invalid quantum number specified.");
                return;
            }
            _Scheduler.quantum = num;
        };
        Shell.prototype.shellFormat = function (args) {
            var currDiskProcs = TSOS.PCB.getProcessByState([_State.READY, _State.RUNNING], TSOS.PCB.sortByPreemptTime)
                .filter(function (proc) { return !proc.inMemory; });
            if (currDiskProcs.length > 0) {
                _StdOut.putText("Cannot format disk while processes are running.");
                return;
            }
            var format = args.length > 0 ? args[0] : '';
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(FILESYS_IRQ, { command: 'format', file: format, data: '' }));
            _OsShell.hidePrompt = true;
        };
        Shell.prototype.shellCreate = function (args) {
            if (args.length < 1) {
                _StdOut.putText("Usage: \0create <filename>\f   Please supply a filename");
                return;
            }
            var filename = args[0];
            // Check for invalid characters
            if (filename.match(/[~%#&*\[\]\\:<>?!/'",]/g)) {
                _StdOut.putText("Filename contains invalid characters.");
                return;
            }
            // Cannot end a file with a period
            if (filename.indexOf('.') === filename.length - 1) {
                _StdOut.putText("Filename cannot end with a period.");
                return;
            }
            if (filename.length > 55) {
                _StdOut.putText("Filename is too long. Must be 55 characters or less.");
                return;
            }
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(FILESYS_IRQ, { command: 'create', file: filename, data: '' }));
            _OsShell.hidePrompt = true;
        };
        Shell.prototype.shellWrite = function (args) {
            if (args.length < 2) {
                _StdOut.putText("Usage: \0write <filename> \"data\"\f   Please supply a filename and data");
                return;
            }
            var filename = args[0];
            if (filename.indexOf('~') === 0) {
                _StdOut.putText("This file cannot be edited.");
                return;
            }
            var data = "";
            for (var i = 1; i < args.length; i++) {
                data += args[i];
                if (i != args.length - 1)
                    data += " ";
            }
            if (data[0] != "\"" && data[data.length - 1] != "\"") {
                _StdOut.putText("Invalid data - Usage: \0write <filename> \"data\"\f.");
                return;
            }
            data = data.substring(1, data.length - 1);
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(FILESYS_IRQ, { command: 'write', file: filename, data: data }));
            _OsShell.hidePrompt = true;
        };
        Shell.prototype.shellRead = function (args) {
            if (args.length < 1) {
                _StdOut.putText("Usage: \0read <filename>\f   Please supply a filename");
                return;
            }
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(FILESYS_IRQ, { command: 'read', file: args[0], data: '' }));
            _OsShell.hidePrompt = true;
        };
        Shell.prototype.shellDelete = function (args) {
            if (args.length < 1) {
                _StdOut.putText("Usage: \0delete <filename>\f   Please supply a filename");
                return;
            }
            var filename = args[0];
            if (filename.indexOf('~') === 0) {
                _StdOut.putText("This file cannot be deleted.");
                return;
            }
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(FILESYS_IRQ, { command: 'del', file: filename, data: '' }));
            _OsShell.hidePrompt = true;
        };
        Shell.prototype.shellLs = function (args) {
            var params = args.length > 0 ? args[0] : '';
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(FILESYS_IRQ, { command: 'list', file: params, data: '' }));
            _OsShell.hidePrompt = true;
        };
        Shell.prototype.shellGetSchedule = function (args) {
            _StdOut.putText("Current Schedule: \0" + _Scheduler.scheduleType + "\f");
        };
        Shell.prototype.shellSetSchedule = function (args) {
            if (args.length < 1) {
                _StdOut.putText("Usage: \0setschedule <rr | fcfs | priority>\f   Please supply an algorithm");
                return;
            }
            var valid = ['rr', 'fcfs', 'priority'];
            var algo = args[0].toLowerCase();
            if (valid.indexOf(algo) < 0) {
                _StdOut.putText("Usage: \0setschedule <rr | fcfs | priority>\f   Please supply a valid algorithm");
                return;
            }
            switch (algo) {
                case 'rr':
                    _Scheduler.scheduleType = TSOS.Scheduler.Type.ROUND_ROBIN;
                    break;
                case 'fcfs':
                    _Scheduler.scheduleType = TSOS.Scheduler.Type.FCFS;
                    break;
                case 'priority':
                    _Scheduler.scheduleType = TSOS.Scheduler.Type.PRIORITY;
                    break;
            }
            TSOS.Control.updateScheduleDisplay();
            _StdOut.putText("Schedule changed to \0" + _Scheduler.scheduleType + "\f");
        };
        return Shell;
    }());
    TSOS.Shell = Shell;
})(TSOS || (TSOS = {}));
