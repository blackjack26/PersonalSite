var TSOS;
(function (TSOS) {
    var Memory = /** @class */ (function () {
        function Memory(addresses) {
            if (addresses === void 0) { addresses = new Array(_MemorySize); }
            this.addresses = addresses;
        }
        Memory.prototype.init = function () {
            // Initialize all bytes to have 0x0 as their value
            for (var i = 0; i < this.addresses.length; i++) {
                this.addresses[i] = 0x0;
            }
        };
        /**
         * Makes sure an address is within the memory bounds
         * @param addr {number} the physical address in memory
         * @returns {boolean} true if the address is within the bounds
         * TODO: move to MMU
         */
        Memory.prototype.withinBounds = function (addr) {
            return addr >= 0 && addr < this.addresses.length;
        };
        /**
         * Sets the value at the specified address
         * @param addr {number} the physical address in memory
         * @param value {number} the value to put at the address
         */
        Memory.prototype.setAddressValue = function (addr, value) {
            this.addresses[addr] = value;
        };
        /**
         * Gets the value at a specified address
         * @param addr {number} the physical address in memory
         * @returns {number} the decimal value of the address content
         */
        Memory.prototype.getAddressValue = function (addr) {
            return this.addresses[addr];
        };
        Object.defineProperty(Memory.prototype, "memorySize", {
            get: function () {
                return this.addresses.length;
            },
            enumerable: true,
            configurable: true
        });
        return Memory;
    }());
    TSOS.Memory = Memory;
})(TSOS || (TSOS = {}));
