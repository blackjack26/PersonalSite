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
    var Cpu = (function () {
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
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
            var code = _MMU.getAddressValue(this.currentProcess.PC, 0);
            this.executeOpCode(code);
            if (this.isExecuting && code != 0x00)
                this.currentProcess.IR = _MMU.getAddressValue(this.currentProcess.PC, 0);
            this.updateDisplay();
        };
        /**
         * Sync the information from the current process
         */
        Cpu.prototype.sync = function () {
            var _a = this.currentProcess, PC = _a.PC, IR = _a.IR, Acc = _a.Acc, Xreg = _a.Xreg, Yreg = _a.Yreg, Zflag = _a.Zflag;
            this.PC = PC;
            this.IR = IR;
            this.Acc = Acc;
            this.Xreg = Xreg;
            this.Yreg = Yreg;
            this.Zflag = Zflag;
        };
        Cpu.prototype.updateDisplay = function () {
            this.sync();
            TSOS.Control.updateProcessDisplay();
            TSOS.Control.updateMemoryDisplay();
            TSOS.Control.updateCpuDisplay();
        };
        Cpu.prototype.beginExecution = function (pcb) {
            if (pcb.start()) {
                this.currentProcess = pcb;
                this.currentProcess.start();
                this.isExecuting = true;
                this.currentProcess.IR = _MMU.getAddressValue(this.currentProcess.PC, 0);
                this.updateDisplay();
                return true;
            }
            return false;
        };
        Cpu.prototype.stopExecution = function () {
            if (this.currentProcess.stop()) {
                this.reset();
                this.updateDisplay();
                this.currentProcess = null;
                return true;
            }
            return false;
        };
        Cpu.prototype.loadAccWithConst = function () {
            this.currentProcess.Acc = _MMU.getAddressValue(this.next(), 0);
        };
        Cpu.prototype.loadAccFromMem = function () {
            this.currentProcess.Acc = _MMU.getAddressValue(this.nextTwo(), 0);
        };
        Cpu.prototype.storeAccInMem = function () {
            _MMU.setAddressValue(this.nextTwo(), this.currentProcess.Acc, 0);
        };
        Cpu.prototype.addWithCarry = function () {
            this.currentProcess.Acc += _MMU.getAddressValue(this.nextTwo(), 0);
            // The largest the accumulator will go is 0xFF
            this.currentProcess.Acc %= 0x100;
        };
        Cpu.prototype.loadXregWithConst = function () {
            this.currentProcess.Xreg = _MMU.getAddressValue(this.next(), 0);
        };
        Cpu.prototype.loadXregFromMem = function () {
            this.currentProcess.Xreg = _MMU.getAddressValue(this.nextTwo(), 0);
        };
        Cpu.prototype.loadYregWithConst = function () {
            this.currentProcess.Yreg = _MMU.getAddressValue(this.next(), 0);
        };
        Cpu.prototype.loadYregFromMem = function () {
            this.currentProcess.Yreg = _MMU.getAddressValue(this.nextTwo(), 0);
        };
        Cpu.prototype.breakSystemCall = function () {
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(SYSTEMCALL_IRQ, 1 /* EXIT_PROCESS */));
            this.currentProcess.isTerminating = true;
        };
        Cpu.prototype.compareMemToXreg = function () {
            var equal = this.currentProcess.Xreg == _MMU.getAddressValue(this.nextTwo(), 0);
            this.currentProcess.Zflag = equal ? 1 : 0;
        };
        Cpu.prototype.branchIfZero = function () {
            var shift = this.next();
            if (this.currentProcess.Zflag == 0) {
                this.currentProcess.PC += _MMU.getAddressValue(shift, 0);
            }
        };
        Cpu.prototype.incrementValue = function () {
            var addr = this.nextTwo();
            var newVal = _MMU.getAddressValue(addr, 0) + 1;
            _MMU.setAddressValue(addr, newVal, 0);
        };
        Cpu.prototype.writeToConsole = function () {
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(SYSTEMCALL_IRQ, 0 /* WRITE_CONSOLE */));
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
            this.currentProcess.PC = (this.currentProcess.PC + 1) % _FixedSegmentLength;
            return this.currentProcess.PC;
        };
        /**
         * Gets the value at the next two address locations and returns
         * the combined number (flipped little-endian)
         */
        Cpu.prototype.nextTwo = function () {
            var n1 = TSOS.Utils.toHexDigit(_MMU.getAddressValue(this.next(), 0), 2);
            var n2 = TSOS.Utils.toHexDigit(_MMU.getAddressValue(this.next(), 0), 2);
            // n2 then n1 because of little-endian style
            return TSOS.Utils.toDecimal(n2 + n1);
        };
        return Cpu;
    }());
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
