/**
 * The Process Control Block (PCB) manages the information
 * for a particular process.
 */
var TSOS;
(function (TSOS) {
    var PCB = /** @class */ (function () {
        function PCB(PC, IR, Acc, Xreg, Yreg, Zflag, base, limit, state) {
            if (PC === void 0) { PC = 0; }
            if (IR === void 0) { IR = null; }
            if (Acc === void 0) { Acc = 0; }
            if (Xreg === void 0) { Xreg = 0; }
            if (Yreg === void 0) { Yreg = 0; }
            if (Zflag === void 0) { Zflag = 0; }
            if (base === void 0) { base = -1; }
            if (limit === void 0) { limit = -1; }
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
            this.redirectOutput = '';
            this.preemptTime = 0;
            this.runTime = 0;
            this.waitTime = 0;
            this.inMemory = true;
            this.priority = -1;
            this.pid = PCB.processCounter;
            this.preemptTime = _OSclock;
            PCB.processList[PCB.processCounter] = this;
            PCB.processCounter++;
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
                this.syncWithCPU();
                this.preemptTime = _OSclock;
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
                this.syncWithCPU();
                this.remove();
                this.turnaroundTime = this.runTime + this.waitTime;
                this.displayStats();
                return true;
            }
            return false;
        };
        PCB.prototype.remove = function (format) {
            if (format === void 0) { format = false; }
            this.state = _State.TERMINATED;
            TSOS.Control.removeProcessDisplay(this.pid);
            if (this.inMemory) {
                _MMU.freeSegment(this.base);
            }
            else if (!format) {
                var filename = "~p" + this.pid + ".swp";
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(FILESYS_IRQ, { command: 'del', file: filename, data: '' }));
            }
        };
        PCB.prototype.syncWithCPU = function () {
            var PC = _CPU.PC, IR = _CPU.IR, Acc = _CPU.Acc, Xreg = _CPU.Xreg, Yreg = _CPU.Yreg, Zflag = _CPU.Zflag;
            this.PC = PC;
            this.IR = IR;
            this.Acc = Acc;
            this.Xreg = Xreg;
            this.Yreg = Yreg;
            this.Zflag = Zflag;
        };
        PCB.prototype.displayStats = function () {
            _StdOut.advanceLine();
            _StdOut.putText("Process [PID " + this.pid + "] stats");
            _StdOut.advanceLine();
            _StdOut.putText("Wait time: \0" + this.waitTime + " cycle(s)\f");
            _StdOut.advanceLine();
            _StdOut.putText("Turnaround time: \0" + this.turnaroundTime + " cycle(s)\f");
            _StdOut.advanceLine();
            _OsShell.putPrompt();
        };
        PCB.getProcess = function (p) {
            return this.processList.filter(function (pcb) { return pcb.pid == p; })[0];
        };
        PCB.getProcessByState = function (states, sort) {
            if (sort === void 0) { sort = this.sortByPID; }
            return this.processList.filter(function (process) { return states.indexOf(process.state) >= 0; })
                .sort(function (a, b) { return sort(a, b); });
        };
        PCB.sortByPID = function (a, b) {
            return a.pid < b.pid ? -1 : a.pid === b.pid ? 0 : 1;
        };
        PCB.sortByPreemptTime = function (a, b) {
            return a.preemptTime < b.preemptTime ? -1 : a.preemptTime === b.preemptTime ? 0 : 1;
        };
        PCB.sortByPriority = function (a, b) {
            return a.priority < b.priority ? -1 : a.priority === b.priority ? 0 : 1;
        };
        PCB.getAvailableProcesses = function () {
            return this.processList.filter(function (process) { return process.state !== _State.NEW && process.state !== _State.TERMINATED; })
                .sort(function (a, b) { return a.pid < b.pid ? -1 : a.pid === b.pid ? 0 : 1; });
        };
        PCB.removeAllProcesses = function () {
            PCB.getAvailableProcesses().forEach(function (ps) {
                if (!_CPU.stopProcess(ps.pid))
                    ps.remove();
            });
        };
        PCB.processCounter = 0;
        PCB.processList = [];
        return PCB;
    }());
    TSOS.PCB = PCB;
})(TSOS || (TSOS = {}));
