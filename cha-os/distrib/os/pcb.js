/**
 * The Process Control Block (PCB) manages the information
 * for a particular process.
 */
var TSOS;
(function (TSOS) {
    var PCB = (function () {
        function PCB(PC, IR, Acc, Xreg, Yreg, Zflag, base, limit, state) {
            if (PC === void 0) { PC = 0; }
            if (IR === void 0) { IR = null; }
            if (Acc === void 0) { Acc = 0; }
            if (Xreg === void 0) { Xreg = 0; }
            if (Yreg === void 0) { Yreg = 0; }
            if (Zflag === void 0) { Zflag = 0; }
            if (base === void 0) { base = 0; }
            if (limit === void 0) { limit = 0; }
            if (state === void 0) { state = _State.NEW; }
            this.PC = PC;
            this.IR = IR;
            this.Acc = Acc;
            this.Xreg = Xreg;
            this.Yreg = Yreg;
            this.Zflag = Zflag;
            this.base = base;
            this.limit = limit;
            this.state = state;
            this.isTerminating = false;
            this.pid = PCB.processCounter;
            PCB.processList[PCB.processCounter] = this;
            PCB.processCounter++;
            TSOS.Control.createNewProcessDisplay();
        }
        /**
         * Sets a PCB from RESIDENT to READY
         * @returns {boolean}
         */
        PCB.prototype.ready = function () {
            if (this.state == _State.RESIDENT) {
                this.state = _State.READY;
                return true;
            }
            return false;
        };
        /**
         * Sets a PCB from READY to RUNNING
         * @returns {boolean}
         */
        PCB.prototype.start = function () {
            if (this.state == _State.READY) {
                this.state = _State.RUNNING;
                return true;
            }
            return false;
        };
        /**
         * Sets a PCB from RUNNING to READY
         * @returns {boolean}
         */
        PCB.prototype.preempt = function () {
            if (this.state == _State.RUNNING) {
                this.state = _State.READY;
                return true;
            }
            return false;
        };
        /**
         * Sets a PCB from RUNNING or READY to TERMINATED
         * @returns {boolean}
         */
        PCB.prototype.stop = function () {
            if (this.state == _State.RUNNING || this.state == _State.READY) {
                this.state = _State.TERMINATED;
                this.PC = 0;
                this.IR = null;
                this.Acc = 0;
                this.IR = 0;
                this.Xreg = 0;
                this.Yreg = 0;
                this.Zflag = 0;
                TSOS.Control.removeProcessDisplay(this.pid);
                return true;
            }
            return false;
        };
        PCB.getProcess = function (pid) {
            return this.processList[pid];
        };
        PCB.getReadyProcesses = function () {
            return this.processList.filter(function (process) { return process.state === _State.READY; });
        };
        PCB.getAvailableProcesses = function () {
            return this.processList.filter(function (process) { return process.state !== _State.TERMINATED; });
        };
        PCB.processCounter = 0;
        PCB.processList = [];
        return PCB;
    }());
    TSOS.PCB = PCB;
})(TSOS || (TSOS = {}));
