///<reference path="../globals.ts" />
/* ------------
 CPU.ts

 Requires global.ts.

 Routines for the host CPU simulation, NOT for the OS itself.
 In this manner, it's A LITTLE BIT like a hypervisor,
 in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
 that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
 TypeScript/JavaScript in both the host and client environments.

 This code references page numbers in the text book:
 Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
 ------------ */
var TSOS;
(function (TSOS) {
    var Cpu = /** @class */ (function () {
        function Cpu(PC, IR, Acc, Xreg, Yreg, Zflag, isExecuting) {
            if (PC === void 0) { PC = 0; }
            if (IR === void 0) { IR = null; }
            if (Acc === void 0) { Acc = 0; }
            if (Xreg === void 0) { Xreg = 0; }
            if (Yreg === void 0) { Yreg = 0; }
            if (Zflag === void 0) { Zflag = 0; }
            if (isExecuting === void 0) { isExecuting = false; }
            this.PC = PC;
            this.IR = IR;
            this.Acc = Acc;
            this.Xreg = Xreg;
            this.Yreg = Yreg;
            this.Zflag = Zflag;
            this.isExecuting = isExecuting;
        }
        Cpu.prototype.init = function () {
            this.reset();
            TSOS.Control.initCpuDisplay();
        };
        Cpu.prototype.reset = function () {
            this.PC = 0;
            this.Acc = 0;
            this.IR = null;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.isExecuting = false;
        };
        Cpu.prototype.cycle = function () {
            _Kernel.krnTrace('CPU cycle');
            _Scheduler.bursts++;
            var toggledStep = false;
            var code = _MMU.getAddressValue(this.PC, this.currentProcess.base);
            if (!_SingleStep) {
                var nextPCs_1 = [this.PC];
                for (var i = 1; i <= TSOS.Control.getMemShift(code); i++) {
                    nextPCs_1.push((this.PC + i) % _FixedSegmentLength);
                }
                nextPCs_1 = nextPCs_1.map(function (pc) { return TSOS.Utils.toHexDigit(pc, 2); });
                if (_Breakpoints.some(function (bp) { return nextPCs_1.indexOf(bp) > -1; })) {
                    TSOS.Control.singleStep(true);
                    toggledStep = true;
                }
            }
            if (!toggledStep) {
                this.executeOpCode(code);
                if (this.isExecuting && code != 0x00)
                    this.IR = _MMU.getAddressValue(this.PC, this.currentProcess.base);
                this.updateDisplay();
                _Scheduler.updateStats();
            }
        };
        /**
         * Sync the information from the current process
         */
        Cpu.prototype.syncWithPCB = function () {
            var _a = this.currentProcess, PC = _a.PC, IR = _a.IR, Acc = _a.Acc, Xreg = _a.Xreg, Yreg = _a.Yreg, Zflag = _a.Zflag;
            this.PC = PC;
            this.IR = IR;
            this.Acc = Acc;
            this.Xreg = Xreg;
            this.Yreg = Yreg;
            this.Zflag = Zflag;
        };
        Cpu.prototype.updateDisplay = function () {
            TSOS.Control.updateProcessDisplay();
            TSOS.Control.updateMemoryDisplay();
            TSOS.Control.updateCpuDisplay();
        };
        Cpu.prototype.startProcess = function (pcb) {
            // If not in memory, swap
            if (!pcb.inMemory) {
                // If nothing available, roll in then roll out
                if (!_MMU.hasSegmentsAvailable()) {
                    var rollInPid = this.currentProcess != null ? this.currentProcess.pid : 0;
                    _KernelInterruptQueue.enqueue(new TSOS.Interrupt(FILESYS_IRQ, { command: 'rollIn', file: rollInPid, data: '' }));
                }
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(FILESYS_IRQ, { command: 'rollOut', file: pcb.pid, data: 'start' }));
                return true;
            }
            else {
                if (pcb.start()) {
                    this.currentProcess = pcb;
                    this.currentProcess.start();
                    this.syncWithPCB();
                    this.isExecuting = true;
                    this.IR = _MMU.getAddressValue(this.PC, this.currentProcess.base);
                    this.updateDisplay();
                    _Scheduler.isSwitching = false;
                    return true;
                }
                return false;
            }
        };
        /**
         * Stops execution of the current process
         */
        Cpu.prototype.stopExecution = function () {
            if (this.currentProcess != null) {
                this.stopProcess(this.currentProcess.pid);
            }
        };
        Cpu.prototype.stopProcess = function (pid) {
            var success = false;
            if (this.currentProcess && this.currentProcess.pid === pid) {
                this.currentProcess.isTerminating = true;
                this.currentProcess.stop();
                this.updateDisplay();
                this.currentProcess = null;
                success = true;
            }
            else {
                var proc = TSOS.PCB.getProcess(pid);
                success = proc.stop();
            }
            if (this.currentProcess == null) {
                this.isExecuting = false;
            }
            // const diskProcesses = PCB.getAvailableProcesses().filter(proc => !proc.inMemory);
            // if (diskProcesses.length > 0) {
            //     const proc = diskProcesses[0];
            //     _KernelInterruptQueue.enqueue(new TSOS.Interrupt(FILESYS_IRQ, { command: 'rollOut', file: proc.pid, data: '' }));
            // }
            return success;
        };
        Cpu.prototype.loadAccWithConst = function () {
            this.Acc = _MMU.getAddressValue(this.next(), this.currentProcess.base);
        };
        Cpu.prototype.loadAccFromMem = function () {
            this.Acc = _MMU.getAddressValue(this.nextTwo(), this.currentProcess.base);
        };
        Cpu.prototype.storeAccInMem = function () {
            _MMU.setAddressValue(this.nextTwo(), this.Acc, this.currentProcess.base);
        };
        Cpu.prototype.addWithCarry = function () {
            this.Acc += _MMU.getAddressValue(this.nextTwo(), this.currentProcess.base);
            // The largest the accumulator will go is 0xFF
            this.Acc %= 0x100;
        };
        Cpu.prototype.loadXregWithConst = function () {
            this.Xreg = _MMU.getAddressValue(this.next(), this.currentProcess.base);
        };
        Cpu.prototype.loadXregFromMem = function () {
            this.Xreg = _MMU.getAddressValue(this.nextTwo(), this.currentProcess.base);
        };
        Cpu.prototype.loadYregWithConst = function () {
            this.Yreg = _MMU.getAddressValue(this.next(), this.currentProcess.base);
        };
        Cpu.prototype.loadYregFromMem = function () {
            this.Yreg = _MMU.getAddressValue(this.nextTwo(), this.currentProcess.base);
        };
        Cpu.prototype.breakSystemCall = function () {
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(SYSTEMCALL_IRQ, { type: 1 /* EXIT_PROCESS */ }));
            this.currentProcess.isTerminating = true;
        };
        Cpu.prototype.compareMemToXreg = function () {
            var equal = this.Xreg == _MMU.getAddressValue(this.nextTwo(), this.currentProcess.base);
            this.Zflag = equal ? 1 : 0;
        };
        Cpu.prototype.branchIfZero = function () {
            var shift = this.next();
            if (this.Zflag == 0) {
                this.PC += _MMU.getAddressValue(shift, this.currentProcess.base);
            }
        };
        Cpu.prototype.incrementValue = function () {
            var addr = this.nextTwo();
            var newVal = _MMU.getAddressValue(addr, this.currentProcess.base) + 1;
            _MMU.setAddressValue(addr, newVal, this.currentProcess.base);
        };
        Cpu.prototype.writeToConsole = function () {
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(SYSTEMCALL_IRQ, { type: 0 /* WRITE_CONSOLE */ }));
        };
        Cpu.prototype.executeOpCode = function (opCode) {
            switch (opCode) {
                case 0xA9:
                    this.loadAccWithConst();
                    break;
                case 0xAD:
                    this.loadAccFromMem();
                    break;
                case 0x8D:
                    this.storeAccInMem();
                    break;
                case 0x6D:
                    this.addWithCarry();
                    break;
                case 0xA2:
                    this.loadXregWithConst();
                    break;
                case 0xAE:
                    this.loadXregFromMem();
                    break;
                case 0xA0:
                    this.loadYregWithConst();
                    break;
                case 0xAC:
                    this.loadYregFromMem();
                    break;
                case 0xEA:
                    // Do Nothing
                    break;
                case 0x00:
                    this.breakSystemCall();
                    break;
                case 0xEC:
                    this.compareMemToXreg();
                    break;
                case 0xD0:
                    this.branchIfZero();
                    break;
                case 0xEE:
                    this.incrementValue();
                    break;
                case 0xFF:
                    this.writeToConsole();
                    break;
                default:
                    _StdOut.putText('Invalid op code ' + TSOS.Utils.toHexDigit(opCode, 2, true) +
                        ' [Mem: ' + TSOS.Utils.toHexDigit(_CPU.PC, 3, true) + ']. Terminating...');
                    this.breakSystemCall();
                    break;
            }
            this.next();
            TSOS.Control.updateCpuDisplay();
            TSOS.Control.updateMemoryDisplay();
        };
        /**
         *
         * @returns {number}
         */
        Cpu.prototype.next = function () {
            this.PC = (this.PC + 1) % _FixedSegmentLength;
            return this.PC;
        };
        /**
         * Gets the value at the next two address locations and returns
         * the combined number (flipped little-endian)
         */
        Cpu.prototype.nextTwo = function () {
            var n1 = TSOS.Utils.toHexDigit(_MMU.getAddressValue(this.next(), this.currentProcess.base), 2);
            var n2 = TSOS.Utils.toHexDigit(_MMU.getAddressValue(this.next(), this.currentProcess.base), 2);
            // n2 then n1 because of little-endian style
            return TSOS.Utils.toDecimal(n2 + n1);
        };
        return Cpu;
    }());
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
