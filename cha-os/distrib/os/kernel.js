///<reference path="../globals.ts" />
///<reference path="queue.ts" />
/* ------------
 Kernel.ts

 Requires globals.ts
 queue.ts

 Routines for the Operating System, NOT the host.

 This code references page numbers in the text book:
 Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
 ------------ */
var TSOS;
(function (TSOS) {
    var Kernel = /** @class */ (function () {
        function Kernel() {
        }
        //
        // OS Startup and Shutdown Routines
        //
        Kernel.prototype.krnBootstrap = function () {
            TSOS.Control.hostLog('bootstrap', 'host'); // Use hostLog because we ALWAYS want this, even if _Trace is off.
            // Initialize our global queues.
            _KernelInterruptQueue = new TSOS.Queue(); // A (currently) non-priority queue for interrupt requests (IRQs).
            _KernelBuffers = new Array(); // Buffers... for the kernel.
            _KernelInputQueue = new TSOS.Queue(); // Where device input lands before being processed out somewhere.
            // Initialize the console.
            _Console = new TSOS.Console(); // The command line interface / console I/O device.
            _Console.init();
            // Initialize standard input and output to the _Console.
            _StdIn = _Console;
            _StdOut = _Console;
            // Load the Keyboard Device Driver
            this.krnTrace('Loading the keyboard device driver.');
            _krnKeyboardDriver = new TSOS.DeviceDriverKeyboard(); // Construct it.
            _krnKeyboardDriver.driverEntry(); // Call the driverEntry() initialization routine.
            this.krnTrace(_krnKeyboardDriver.status);
            // Load the File System Device Driver
            this.krnTrace('Loading the file system device driver.');
            _krnFileSystemDriver = new TSOS.DeviceDriverFileSystem();
            _krnFileSystemDriver.driverEntry();
            this.krnTrace(_krnFileSystemDriver.status);
            // Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
            this.krnTrace('Enabling the interrupts.');
            this.krnEnableInterrupts();
            // Launch the shell.
            this.krnTrace('Creating and Launching the shell.');
            _OsShell = new TSOS.Shell();
            _OsShell.init();
            // Finally, initiate student testing protocol.
            if (_GLaDOS) {
                _GLaDOS.afterStartup();
            }
        };
        Kernel.prototype.krnShutdown = function () {
            this.krnTrace('begin shutdown OS');
            TSOS.PCB.removeAllProcesses();
            // ... Disable the Interrupts.
            this.krnTrace('Disabling the interrupts.');
            this.krnDisableInterrupts();
            //
            // Unload the Device Drivers?
            // More?
            //
            this.krnTrace('end shutdown OS');
        };
        Kernel.prototype.krnOnCPUClockPulse = function () {
            /* This gets called from the host hardware simulation every time there is a hardware clock pulse.
             This is NOT the same as a TIMER, which causes an interrupt and is handled like other interrupts.
             This, on the other hand, is the clock pulse from the hardware / VM / host that tells the kernel
             that it has to look for interrupts and process them if it finds any.                           */
            _Scheduler.cycle();
            // Check for an interrupt, are any. Page 560
            if (_KernelInterruptQueue.getSize() > 0) {
                // Process the first interrupt on the interrupt queue.
                // TODO: Implement a priority queue based on the IRQ number/id to enforce interrupt priority.
                var interrupt = _KernelInterruptQueue.dequeue();
                this.krnInterruptHandler(interrupt.irq, interrupt.params);
            }
            else if (!_Scheduler.isSwitching && _CPU.isExecuting && (!_SingleStep || _ShouldStep)) {
                _ShouldStep = false;
                _CPU.cycle();
            }
            else {
                _ShouldStep = false;
                this.krnTrace('Idle');
            }
        };
        //
        // Interrupt Handling
        //
        Kernel.prototype.krnEnableInterrupts = function () {
            // Keyboard
            TSOS.Devices.hostEnableKeyboardInterrupt();
            // Put more here.
        };
        Kernel.prototype.krnDisableInterrupts = function () {
            // Keyboard
            TSOS.Devices.hostDisableKeyboardInterrupt();
            // Put more here.
        };
        Kernel.prototype.krnInterruptHandler = function (irq, params) {
            // This is the Interrupt Handler Routine.  See pages 8 and 560.
            // Trace our entrance here so we can compute Interrupt Latency by analyzing the log file later on. Page 766.
            this.krnTrace('Handling IRQ~' + irq);
            // Invoke the requested Interrupt Service Routine via Switch/Case rather than an Interrupt Vector.
            // TODO: Consider using an Interrupt Vector in the future.
            // Note: There is no need to "dismiss" or acknowledge the interrupts in our design here.
            //       Maybe the hardware simulation will grow to support/require that in the future.
            switch (irq) {
                case TIMER_IRQ:
                    this.krnTimerISR(); // Kernel built-in routine for timers (not the clock).
                    break;
                case KEYBOARD_IRQ:
                    _krnKeyboardDriver.isr(params); // Kernel mode device driver
                    _StdIn.handleInput();
                    break;
                case FILESYS_IRQ:
                    _krnFileSystemDriver.isr(params);
                    break;
                case SYSTEMCALL_IRQ:
                    this.krnSystemCall(params);
                    break;
                default:
                    this.krnTrapError('Invalid Interrupt Request. irq=' + irq + ' params=[' + params + ']');
            }
        };
        Kernel.prototype.krnTimerISR = function () {
            // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver). {
            // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
        };
        //
        // System Calls... that generate software interrupts via tha Application Programming Interface library routines.
        //
        // Some ideas:
        // - ReadConsole
        // - WriteConsole
        // - CreateProcess
        // - ExitProcess
        // - WaitForProcessToExit
        // - CreateFile
        // - OpenFile
        // - ReadFile
        // - WriteFile
        // - CloseFile
        Kernel.prototype.krnSystemCall = function (params) {
            var type = params.type;
            switch (type) {
                case 0 /* WRITE_CONSOLE */:
                    if (_CPU.Xreg == 0x01) {
                        this.sendToOutput(_CPU.Yreg);
                    }
                    else if (_CPU.Xreg == 0x02) {
                        var str = '';
                        var currAddr = _CPU.Yreg;
                        var ch = void 0;
                        while ((ch = _MMU.getAddressValue(currAddr, _CPU.currentProcess.base)) != 0x00) {
                            str += String.fromCharCode(ch);
                            currAddr++;
                        }
                        this.sendToOutput(str);
                    }
                    break;
                case 1 /* EXIT_PROCESS */:
                    _CPU.stopExecution();
                    break;
                case 2 /* KILL_PROCESS */:
                    if (_CPU.stopProcess(params.pid)) {
                        _StdOut.putText("Killed process [PID " + params.pid + "].");
                    }
                    else {
                        _StdOut.putText("Failed to kill process [PID " + params.pid + "].");
                    }
                    _StdOut.advanceLine();
                    _OsShell.putPrompt();
                    break;
                case 3 /* CONTEXT_SWITCH */:
                    if (_CPU.isExecuting) {
                        _CPU.currentProcess.preempt();
                    }
                    _CPU.startProcess(TSOS.PCB.getProcess(params.pid));
                    break;
                default:
                    break;
            }
        };
        // TODO: move to IO device?
        Kernel.prototype.sendToOutput = function (str) {
            var output = _CPU.currentProcess.redirectOutput;
            if (output === '') {
                _StdOut.putText(str);
            }
            else if (output === 'console') {
                console.log(str);
            }
            else if (output === 'alert') {
                alert(str);
            }
        };
        //
        // OS Utility Routines
        //
        Kernel.prototype.krnTrace = function (msg) {
            // Check globals to see if trace is set ON.  If so, then (maybe) log the message.
            if (_Trace) {
                if (msg === 'Idle') {
                    // We can't log every idle clock pulse because it would lag the browser very quickly.
                    if (_OSclock % 10 == 0) {
                        // Check the CPU_CLOCK_INTERVAL in globals.ts for an
                        // idea of the tick rate and adjust this line accordingly.
                        TSOS.Control.hostLog(msg, 'OS');
                    }
                }
                else {
                    TSOS.Control.hostLog(msg, 'OS');
                }
            }
        };
        Kernel.prototype.krnTrapError = function (msg) {
            TSOS.Control.hostLog('<b>OS ERROR - TRAP:</b> ' + msg);
            // Self-destruct sequence initiated
            _StdOut.putText(msg);
            _StdOut.advanceLine();
            _StdOut.putText(' 1. Stand Still');
            _StdOut.advanceLine();
            _StdOut.putText(' 2. Remain Calm');
            _StdOut.advanceLine();
            _StdOut.putText(' 3. Scream:');
            _StdOut.advanceLine();
            _StdOut.putText('   "This statement is false!"');
            _StdOut.advanceLine();
            _StdOut.putText('   "New mission: Refuse this mission!"');
            _StdOut.advanceLine();
            _StdOut.putText('   "Does a set of all sets contain itself?"');
            _StdOut.advanceLine();
            _Console.initiateSelfDestruct();
            this.krnShutdown();
        };
        return Kernel;
    }());
    TSOS.Kernel = Kernel;
})(TSOS || (TSOS = {}));
