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
    var Disk = /** @class */ (function () {
        function Disk(tracks, sectors, blocks, bytes, formatted, storage) {
            if (tracks === void 0) { tracks = 4; }
            if (sectors === void 0) { sectors = 8; }
            if (blocks === void 0) { blocks = 8; }
            if (bytes === void 0) { bytes = 64; }
            if (formatted === void 0) { formatted = false; }
            if (storage === void 0) { storage = sessionStorage; }
            this.tracks = tracks;
            this.sectors = sectors;
            this.blocks = blocks;
            this.bytes = bytes;
            this.formatted = formatted;
            this.storage = storage;
            this.storage.clear();
            this.mbr = new Disk.MBR('001', '100', this);
        }
        /**
         * Formats the disk and initializes all track, sectors, and blocks.
         * @param {boolean} quick If true, only first 4 bytes of each block is initialized
         * @returns {boolean} false if an error has occurred
         */
        Disk.prototype.format = function (quick) {
            if (quick === void 0) { quick = false; }
            // Can't do a quick format if rest of disk isn't initialized
            if (!this.formatted && quick)
                return false;
            for (var t = 0; t < this.tracks; t++) {
                for (var s = 0; s < this.sectors; s++) {
                    for (var b = 0; b < this.blocks; b++) {
                        var tsb = new Disk.TSB(t, s, b, this);
                        if (quick)
                            tsb.formatQuick();
                        else
                            tsb.formatFull();
                        tsb.write();
                    }
                }
            }
            // Master boot record (MBR)
            this.mbr = new Disk.MBR('001', '100', this);
            this.mbr.write();
            // Only initialize disk display once
            if (!this.formatted) {
                this.formatted = true;
                TSOS.Control.initDiskDisplay();
            }
            else {
                TSOS.Control.updateDiskDisplay();
            }
            return true;
        };
        Disk.prototype.write = function (tsb, value) {
            if (tsb instanceof Disk.TSB)
                this.storage.setItem(tsb.key, value);
            else if (typeof tsb == 'string')
                this.storage.setItem(tsb, value);
            // if (this.formatted) {
            //     TSOS.Control.updateDiskDisplay();
            // }
        };
        Disk.prototype.read = function (tsb) {
            if (tsb instanceof Disk.TSB)
                return this.storage.getItem(tsb.key);
            else if (typeof tsb == 'string')
                return this.storage.getItem(tsb);
        };
        Disk.prototype.hasBlocksAvailable = function (num) {
            for (var t = 1; t < this.tracks; t++) {
                for (var s = 0; s < this.sectors; s++) {
                    for (var b = 0; b < this.blocks; b++) {
                        var tsb = new Disk.TSB(t, s, b, this);
                        if (!tsb.cf) {
                            num--;
                        }
                        if (num === 0)
                            return true;
                    }
                }
            }
            return false;
        };
        return Disk;
    }());
    TSOS.Disk = Disk;
    (function (Disk) {
        var TSB = /** @class */ (function () {
            function TSB(track, sector, block, disk) {
                if (track === void 0) { track = -1; }
                if (sector === void 0) { sector = -1; }
                if (block === void 0) { block = -1; }
                if (disk === void 0) { disk = _Disk; }
                this.track = track;
                this.sector = sector;
                this.block = block;
                this.disk = disk;
                this.defaultAddr = '000';
                this.cf = false;
                this.nextAddr = this.defaultAddr;
                this.key = Disk.TSB.getKey(track, sector, block);
                // If disk is formatted, set the appropriate values
                if (this.disk.formatted) {
                    var d = this.disk.read(this);
                    this.cf = d[0] === '1';
                    this.nextAddr = d.substring(1, 4);
                    this.data = d.substring(4);
                }
            }
            TSB.prototype.formatQuick = function () {
                this.cf = false;
                this.nextAddr = this.defaultAddr;
            };
            TSB.prototype.formatFull = function () {
                this.formatQuick();
                // start at 2 since bytes 0 and 1 are already updated in quick format
                var value = '';
                for (var d = 2; d < this.disk.bytes; d++) {
                    value += '00';
                }
                this.data = value;
            };
            TSB.prototype.write = function () {
                this.disk.write(this, this.getValue());
            };
            TSB.prototype.clear = function () {
                var next = this.isConnected() ? this.getNextAddr() : null;
                this.formatFull();
                this.write();
                if (next != null) {
                    next.clear();
                }
            };
            TSB.prototype.getValue = function () {
                return (this.cf ? '1' : '0') + this.nextAddr + this.data;
            };
            TSB.prototype.getNextAddr = function () {
                return new TSB(Number(this.nextAddr.charAt(0)), Number(this.nextAddr.charAt(1)), Number(this.nextAddr.charAt(2)));
            };
            /**
             * See if this TSB is connected to another one on the disk
             * @returns {boolean}
             */
            TSB.prototype.isConnected = function () {
                return this.nextAddr !== this.defaultAddr;
            };
            TSB.getKey = function (track, sector, block) {
                return track + ":" + sector + ":" + block;
            };
            TSB.parseAddr = function (addr) {
                var track = Number(addr[0]);
                var sector = Number(addr[1]);
                var block = Number(addr[2]);
                return new TSB(track, sector, block, _Disk);
            };
            return TSB;
        }());
        Disk.TSB = TSB;
        var MBR = /** @class */ (function (_super) {
            __extends(MBR, _super);
            function MBR(nextDir, nextData, disk) {
                if (nextDir === void 0) { nextDir = '001'; }
                if (nextData === void 0) { nextData = '100'; }
                if (disk === void 0) { disk = _Disk; }
                var _this = _super.call(this, 0, 0, 0, disk) || this;
                _this.nextDir = nextDir;
                _this.nextData = nextData;
                _this.disk = disk;
                _this.unavailable = 'BED';
                return _this;
            }
            MBR.prototype.write = function () {
                var mbrData = this.disk.read(this);
                this.disk.write(this, "" + this.nextDir + this.nextData + mbrData.substring(6));
            };
            MBR.prototype.getNextDir = function () {
                if (this.nextDir === this.unavailable)
                    return null;
                return TSB.parseAddr(this.nextDir);
            };
            MBR.prototype.updateNextDir = function () {
                for (var s = 0; s < this.disk.sectors; s++) {
                    for (var b = 0; b < this.disk.blocks; b++) {
                        // Skip the MBR
                        if (s === 0 && b === 0)
                            continue;
                        var tsb = new Disk.TSB(0, s, b, this.disk);
                        if (!tsb.cf) {
                            this.nextDir = tsb.key.replace(/:/g, '');
                            return;
                        }
                    }
                }
                this.nextDir = this.unavailable; // BED means nothing available
            };
            MBR.prototype.getNextData = function () {
                if (this.nextData === this.unavailable)
                    return null;
                return TSB.parseAddr(this.nextData);
            };
            MBR.prototype.updateNextData = function () {
                for (var t = 1; t < this.disk.tracks; t++) {
                    for (var s = 0; s < this.disk.sectors; s++) {
                        for (var b = 0; b < this.disk.blocks; b++) {
                            var tsb = new Disk.TSB(t, s, b, this.disk);
                            if (!tsb.cf) {
                                this.nextData = tsb.key.replace(/:/g, '');
                                return;
                            }
                        }
                    }
                }
                this.nextData = this.unavailable; // BED means nothing available
            };
            return MBR;
        }(TSB));
        Disk.MBR = MBR;
    })(Disk = TSOS.Disk || (TSOS.Disk = {}));
})(TSOS || (TSOS = {}));
