var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var TSOS;
(function (TSOS) {
    var DeviceDriverFileSystem = /** @class */ (function (_super) {
        __extends(DeviceDriverFileSystem, _super);
        function DeviceDriverFileSystem() {
            var _this = _super.call(this) || this;
            _this.hideOutput = false;
            _this.driverEntry = _this.krnFSDriverEntry;
            _this.isr = _this.fileSystemISR;
            return _this;
        }
        DeviceDriverFileSystem.prototype.krnFSDriverEntry = function () {
            this.status = 'loaded';
        };
        DeviceDriverFileSystem.prototype.fileSystemISR = function (params) {
            var command = params.command, file = params.file, data = params.data;
            _OsShell.hidePrompt = false;
            if (command === "format") {
                _StdOut.putText("Formatting...");
                if (!_Disk.format(file === '--quick' || file === '-q')) {
                    _StdOut.putText("The disk could not be formatted.");
                    _StdOut.advanceLine();
                    _OsShell.putPrompt();
                }
                else {
                    _StdOut.putText("The disk was formatted!");
                    _StdOut.advanceLine();
                    _OsShell.putPrompt();
                }
                TSOS.PCB.getAvailableProcesses().filter(function (proc) { return !proc.inMemory; })
                    .forEach(function (proc) {
                    proc.remove(true);
                });
                return;
            }
            // Disk must be formatted for these commands
            if (_Disk.formatted) {
                this[command](file, data);
            }
            else {
                _StdOut.putText("The disk needs to be formatted to perform this operation.");
                _StdOut.advanceLine();
                _OsShell.putPrompt();
            }
        };
        DeviceDriverFileSystem.prototype.create = function (filename) {
            // Check if file already exists
            if (this.fileExists(filename)) {
                _StdOut.putText('File not created: A file with this name already exists.');
                _StdOut.advanceLine();
                _OsShell.putPrompt();
                return false;
            }
            var dirTSB = _Disk.mbr.getNextDir();
            var dataTSB = _Disk.mbr.getNextData();
            dataTSB.cf = true;
            var d = new Date();
            var month = TSOS.Utils.toHexDigit(d.getMonth(), 2);
            var date = TSOS.Utils.toHexDigit(d.getDate(), 2);
            var hour = TSOS.Utils.toHexDigit(d.getHours(), 2);
            var min = TSOS.Utils.toHexDigit(d.getMinutes(), 2);
            var data = "" + month + date + hour + min + '0000' + TSOS.Utils.stringToHex(filename) + "00";
            dirTSB.data = this.padData(data);
            dirTSB.nextAddr = dataTSB.key.replace(/:/g, '');
            dirTSB.cf = true;
            dirTSB.write();
            dataTSB.write();
            _Disk.mbr.updateNextDir();
            _Disk.mbr.updateNextData();
            _Disk.mbr.write();
            TSOS.Control.updateDiskDisplay();
            if (!this.hideOutput) {
                _StdOut.putText("File \"" + filename + "\" created.");
                _StdOut.advanceLine();
                _OsShell.putPrompt();
            }
            return true;
        };
        DeviceDriverFileSystem.prototype.read = function (filename) {
            var tsb = this.fileExists(filename);
            if (!tsb) {
                _StdOut.putText('Cannot read from file: File does not exist.');
                _StdOut.advanceLine();
                _OsShell.putPrompt();
                return false;
            }
            tsb = tsb.getNextAddr(); // get tsb in data section
            while (tsb != null) {
                _StdOut.putText(TSOS.Utils.hexToString(tsb.data));
                tsb = tsb.getNextAddr();
                if (tsb.key.replace(/:/g, '') === '000')
                    tsb = null;
            }
            _StdOut.advanceLine();
            _OsShell.putPrompt();
            return true;
        };
        DeviceDriverFileSystem.prototype.write = function (filename, data, isHex) {
            if (isHex === void 0) { isHex = false; }
            var tsb = this.fileExists(filename);
            if (!tsb) {
                _StdOut.putText('Cannot write to file: File does not exist.');
                _StdOut.advanceLine();
                _OsShell.putPrompt();
                return false;
            }
            var dataHex = data;
            if (!isHex) {
                dataHex = TSOS.Utils.stringToHex(data) + '00';
            }
            var dataSize = _Disk.bytes - 2;
            var numBlocks = Math.ceil((dataHex.length / 2) / dataSize);
            // Make sure there is enough room in FS
            if (!_Disk.hasBlocksAvailable(numBlocks)) {
                _StdOut.putText('There is not enough room in the file system. Please remove some files.');
                _StdOut.advanceLine();
                _OsShell.putPrompt();
                return false;
            }
            var filedata = tsb.data;
            var sizeInBytes = dataHex.length / 2;
            filedata = filedata.substring(0, 8) + TSOS.Utils.toHexDigit(sizeInBytes, 4) + filedata.substring(12);
            tsb.data = filedata;
            tsb.write();
            tsb = tsb.getNextAddr(); // get tsb in data section
            while (numBlocks > 0) {
                var size = Math.min(dataHex.length / 2, dataSize);
                tsb.data = dataHex.substring(0, size * 2);
                if (size < dataSize * 2) {
                    for (var i = 0; i < dataSize - size; i++) {
                        tsb.data += '00';
                    }
                }
                tsb.write();
                dataHex = dataHex.substring(size * 2);
                numBlocks--;
                // If more blocks are needed, reference new block
                if (numBlocks > 0) {
                    var nextData = tsb.isConnected() ? tsb.getNextAddr() : tsb.disk.mbr.getNextData();
                    tsb.nextAddr = nextData.key.replace(/:/g, '');
                    tsb.write();
                    // New TSB
                    tsb = nextData;
                    tsb.cf = true;
                    tsb.write();
                    tsb.disk.mbr.updateNextData();
                    tsb.disk.mbr.write();
                }
                else if (tsb.isConnected()) {
                    // Clear connected memory
                    tsb.getNextAddr().clear();
                    // Update pointer
                    tsb.nextAddr = tsb.defaultAddr;
                    tsb.write();
                    // Update MBR
                    tsb.disk.mbr.updateNextData();
                    tsb.disk.mbr.write();
                }
            }
            TSOS.Control.updateDiskDisplay();
            if (!this.hideOutput) {
                _StdOut.putText("Successfully wrote to file \"" + filename + "\".");
                _StdOut.advanceLine();
                _OsShell.putPrompt();
            }
            return true;
        };
        DeviceDriverFileSystem.prototype.del = function (filename) {
            var tsb = this.fileExists(filename);
            if (!tsb) {
                _StdOut.putText('Cannot delete file: File does not exist.');
                _StdOut.advanceLine();
                _OsShell.putPrompt();
                return false;
            }
            tsb.clear();
            tsb.disk.mbr.updateNextData();
            tsb.disk.mbr.updateNextDir();
            tsb.disk.mbr.write();
            TSOS.Control.updateDiskDisplay();
            if (!this.hideOutput) {
                _StdOut.putText("Successfully deleted file \"" + filename + "\".");
                _StdOut.advanceLine();
                _OsShell.putPrompt();
            }
            return true;
        };
        DeviceDriverFileSystem.prototype.list = function (param) {
            var all = param === '-l';
            var msg = '';
            for (var s = 0; s < _Disk.sectors; s++) {
                for (var b = 0; b < _Disk.blocks; b++) {
                    var tsb = new TSOS.Disk.TSB(0, s, b, _Disk);
                    if (tsb.cf) {
                        var filename = TSOS.Utils.hexToString(tsb.data.substring(12));
                        if (!all && filename.indexOf('.') === 0) {
                            continue;
                        }
                        if (all) {
                            var dateStr = tsb.data.substring(0, 8);
                            var month = moment(TSOS.Utils.toDecimal(dateStr.substr(0, 2)) + 1, 'MM').format('MMM');
                            var date = TSOS.Utils.toDecimal(dateStr.substr(2, 2));
                            var hour = TSOS.Utils.toDecimal(dateStr.substr(4, 2));
                            var min = TSOS.Utils.toDecimal(dateStr.substr(6, 2));
                            var size = TSOS.Utils.toDecimal(tsb.data.substring(8, 12));
                            msg = size + "B " + month + " " + date + " " + hour + ":" + min + " " + filename;
                            _StdOut.putText(msg);
                            _StdOut.advanceLine();
                        }
                        else {
                            msg += filename + " ";
                        }
                    }
                }
            }
            if (!all) {
                _StdOut.putText(msg.substring(0, msg.length - 1));
                _StdOut.advanceLine();
            }
            _OsShell.putPrompt();
        };
        /**
         * Roll data onto the disk
         * @param {number} pid
         * @param {string[]} program array split into hex code strings (2 characters)
         */
        DeviceDriverFileSystem.prototype.rollIn = function (pid, program) {
            this.hideOutput = true;
            var pcb = TSOS.PCB.getProcess(pid);
            if (pcb.inMemory) {
                program = [];
                for (var i = 0; i < 256; i++) {
                    program.push(TSOS.Utils.toHexDigit(_MMU.getAddressValue(i, pcb.base), 2));
                }
            }
            var dataSize = _Disk.bytes - 2;
            var sizeNeeded = Math.ceil(program.length / dataSize);
            // Check for space on disk
            if (!_Disk.hasBlocksAvailable(sizeNeeded)) {
                _StdOut.putText("Not enough space available on the disk.");
                _StdOut.advanceLine();
                _OsShell.putPrompt();
                this.hideOutput = false;
                if (pcb.state === _State.NEW)
                    pcb.remove();
                return;
            }
            var filename = "~p" + pid + ".swp";
            // Create swap file for process
            if (!this.create(filename)) {
                // Should never happen
                _StdOut.putText("Duplicate write for process [PID: " + pid + "].");
                _StdOut.advanceLine();
                _OsShell.putPrompt();
                this.hideOutput = false;
                if (pcb.state === _State.NEW)
                    pcb.remove();
                return;
            }
            // Write to swap file
            if (!this.write(filename, program.join(''), true)) {
                _StdOut.putText("Failed to create swap file for process [PID: " + pid + "].");
                _StdOut.advanceLine();
                _OsShell.putPrompt();
                this.del(filename);
                this.hideOutput = false;
                if (pcb.state === _State.NEW)
                    pcb.remove();
                return;
            }
            if (pcb.inMemory) {
                // Deallocate memory
                _MMU.freeSegment(pcb.base);
            }
            pcb.inMemory = false;
            this.hideOutput = false;
            if (pcb.state === _State.NEW) {
                pcb.state = _State.RESIDENT;
                TSOS.Control.updateProcessDisplay();
            }
        };
        DeviceDriverFileSystem.prototype.rollOut = function (pid, data) {
            this.hideOutput = true;
            var pcb = TSOS.PCB.getProcess(pid);
            var filename = "~p" + pid + ".swp";
            if (pcb.inMemory) {
                _StdOut.putText("Process [PID: " + pid + "] is already in memory.");
                _StdOut.advanceLine();
                _OsShell.putPrompt();
                this.hideOutput = false;
                return;
            }
            var tsb = this.fileExists(filename);
            if (!tsb) {
                _StdOut.putText("Could not find file for process [PID: " + pid + "].");
                _StdOut.advanceLine();
                _OsShell.putPrompt();
                this.hideOutput = false;
                return;
            }
            tsb = tsb.getNextAddr(); // get tsb in data section
            var programCodes = [];
            while (tsb != null) {
                programCodes = programCodes.concat(tsb.data.match(/.{1,2}/g));
                tsb = tsb.getNextAddr();
                if (tsb.key.replace(/:/g, '') === '000')
                    tsb = null;
            }
            programCodes = programCodes.slice(0, 256);
            // Write into memory
            if (!_MMU.load(programCodes, pcb, true)) {
                _StdOut.putText("Failed to roll out process [PID: " + pid + "].");
                _StdOut.advanceLine();
                _OsShell.putPrompt();
                this.hideOutput = false;
                return;
            }
            // Remove swap file
            this.del(filename);
            if (data == 'start') {
                pcb.ready();
                _CPU.startProcess(pcb);
            }
            TSOS.Control.updateDiskDisplay();
            TSOS.Control.updateProcessDisplay();
            TSOS.Control.updateMemoryDisplay();
            this.hideOutput = false;
        };
        // Helpers
        DeviceDriverFileSystem.prototype.fileExists = function (filename) {
            for (var s = 0; s < _Disk.sectors; s++) {
                for (var b = 0; b < _Disk.blocks; b++) {
                    var tsb = new TSOS.Disk.TSB(0, s, b, _Disk);
                    if (tsb.cf && TSOS.Utils.hexToString(tsb.data.substring(12)) === filename) {
                        return tsb;
                    }
                }
            }
            return null;
        };
        DeviceDriverFileSystem.prototype.padData = function (data) {
            // bytes - 2 (excludes cf and addr portion of data)
            while (data.length / 2 < _Disk.bytes - 2) {
                data += '00';
            }
            return data;
        };
        return DeviceDriverFileSystem;
    }(TSOS.DeviceDriver));
    TSOS.DeviceDriverFileSystem = DeviceDriverFileSystem;
})(TSOS || (TSOS = {}));
