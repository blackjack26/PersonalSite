/**
 * The Memory Management Unit (MMU), manages how the memory is
 * stored and which segment of the memory is used to store it in.
 */
var TSOS;
(function (TSOS) {
    var MMU = /** @class */ (function () {
        function MMU(segmentLength) {
            if (segmentLength === void 0) { segmentLength = _FixedSegmentLength; }
            this.segmentLength = segmentLength;
            this.numSegments = Math.floor(_Memory.memorySize / this.segmentLength);
            this.segmentUsed = [false, false, false];
        }
        MMU.prototype.clearMemory = function () {
            _Memory.init();
            TSOS.Control.updateMemoryDisplay();
        };
        /**
         * Loads the given program and assigns it to the given PCB
         * @param {string[]} program - an array of hex strings
         * @param {TSOS.PCB} pcb - the PCB to assign the program to
         * @param {boolean} rollOut - If the process is being rolled out
         */
        MMU.prototype.load = function (program, pcb, rollOut) {
            if (rollOut === void 0) { rollOut = false; }
            // map codes to Hex strings and the parse a number
            var programCodes = program
                .map(function (code) { return Number('0x' + code); });
            var segment = this.getAvailableSegment();
            if (segment != -1) {
                if (!rollOut) {
                    TSOS.Control.createNewProcessDisplay(pcb.pid);
                }
                pcb.base = segment * 0x100;
                pcb.limit = pcb.base + _FixedSegmentLength;
                pcb.inMemory = true;
                for (var i = pcb.base; i < programCodes.length + pcb.base; i++) {
                    _Memory.setAddressValue(i, programCodes[i - pcb.base]);
                }
                pcb.state = _State.RESIDENT;
                TSOS.Control.updateProcessDisplay();
                return true;
            }
            else if (_Disk.formatted && !rollOut) {
                // Load onto disk
                TSOS.Control.createNewProcessDisplay(pcb.pid);
                pcb.inMemory = false;
                // Load onto disk
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(FILESYS_IRQ, { command: 'rollIn', file: pcb.pid, data: program }));
                TSOS.Control.updateProcessDisplay();
                return true;
            }
            return false;
        };
        MMU.prototype.getAvailableSegment = function () {
            for (var i = 0; i < this.segmentUsed.length; i++) {
                if (!this.segmentUsed[i]) {
                    this.segmentUsed[i] = true;
                    return i;
                }
            }
            return -1;
        };
        MMU.prototype.setAddressValue = function (addr, value, base) {
            if (base === void 0) { base = 0; }
            // Modulo is used to wrap the address value asked for within the segment
            // If the address goes out of range, wrap to beginning of segment
            // Also a value cannot be more than 0xFF, so wrap when >= 0x100
            _Memory.setAddressValue(addr % _FixedSegmentLength + base, value % 0x100);
        };
        MMU.prototype.getAddressValue = function (addr, base) {
            if (base === void 0) { base = 0; }
            // Modulo is used to wrap the address value asked for within the segment
            // If the address goes out of range, wrap to beginning of segment
            return _Memory.getAddressValue(addr % _FixedSegmentLength + base);
        };
        MMU.prototype.freeSegment = function (base) {
            if (base === void 0) { base = 0; }
            this.segmentUsed[base / 0x100] = false;
        };
        MMU.prototype.segmentAvailable = function (base) {
            if (base === void 0) { base = 0; }
            return this.segmentUsed[base / 0x100];
        };
        MMU.prototype.hasSegmentsAvailable = function () {
            for (var i = 0; i < this.segmentUsed.length; i++) {
                if (!this.segmentUsed[i]) {
                    return true;
                }
            }
            return false;
        };
        return MMU;
    }());
    TSOS.MMU = MMU;
})(TSOS || (TSOS = {}));
