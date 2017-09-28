/**
 * The Memory Management Unit (MMU), manages how the memory is
 * stored and which segment of the memory is used to store it in.
 */
var TSOS;
(function (TSOS) {
    var MMU = (function () {
        function MMU(segmentLength) {
            if (segmentLength === void 0) { segmentLength = _FixedSegmentLength; }
            this.segmentLength = segmentLength;
            this.numSegments = Math.floor(_Memory.memorySize / this.segmentLength);
        }
        /**
         * Loads the given program and assigns it to the given PCB
         * @param {string[]} program - an array of hex strings
         * @param {TSOS.PCB} pcb - the PCB to assign the program to
         */
        MMU.prototype.load = function (program, pcb) {
            // map codes to Hex strings and the parse a number
            var programCodes = program
                .map(function (code) { return Number('0x' + code); });
            pcb.base = 0;
            pcb.limit = pcb.base + _FixedSegmentLength;
            for (var i = pcb.base; i < programCodes.length; i++) {
                _Memory.setAddressValue(i, programCodes[i]);
            }
            pcb.state = _State.RESIDENT;
            TSOS.Control.updateProcessDisplay();
        };
        MMU.prototype.setAddressValue = function (addr, value, segment) {
            if (segment === void 0) { segment = 0; }
            // Modulo is used to wrap the address value asked for within the segment
            // If the address goes out of range, wrap to beginning of segment
            // Also a value cannot be more than 0xFF, so wrap when >= 0x100
            _Memory.setAddressValue(addr % _FixedSegmentLength + segment * _FixedSegmentLength, value % 0x100);
        };
        MMU.prototype.getAddressValue = function (addr, segment) {
            if (segment === void 0) { segment = 0; }
            // Modulo is used to wrap the address value asked for within the segment
            // If the address goes out of range, wrap to beginning of segment
            return _Memory.getAddressValue(addr % _FixedSegmentLength + segment * _FixedSegmentLength);
        };
        return MMU;
    }());
    TSOS.MMU = MMU;
})(TSOS || (TSOS = {}));
