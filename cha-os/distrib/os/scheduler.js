var TSOS;
(function (TSOS) {
    var Scheduler = /** @class */ (function () {
        function Scheduler(cpu) {
            this.cpu = cpu;
            this.isSwitching = false;
            this.cpu = cpu;
            this.quantum = _DefaultQuantum;
            this.bursts = 0;
            this.scheduleType = Scheduler.Type.ROUND_ROBIN;
            this.currentPIndex = -1;
        }
        Scheduler.prototype.cycle = function () {
            switch (this.scheduleType) {
                case Scheduler.Type.PRIORITY:
                    this.bursts = 0;
                    this.schedule(TSOS.PCB.sortByPriority);
                    break;
                case Scheduler.Type.FCFS:
                    this.bursts = 0; // keep resetting bursts so it never switches
                    this.schedule(TSOS.PCB.sortByPreemptTime);
                    break;
                case Scheduler.Type.ROUND_ROBIN:
                    this.schedule(TSOS.PCB.sortByPreemptTime);
                    break;
                default:
                    break;
            }
        };
        /**
         * Context switch to the new PID
         * @param pid number the process ID
         */
        Scheduler.prototype.contextSwitch = function (pid) {
            this.isSwitching = true;
            this.bursts = 0;
            _Kernel.krnTrace("Context Switch [Type: " + this.scheduleType.toString() + ", PID: " + pid + "]");
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(SYSTEMCALL_IRQ, { type: 3 /* CONTEXT_SWITCH */, pid: pid }));
        };
        Scheduler.prototype.getNextProcess = function (procs, restart) {
            if (restart === void 0) { restart = false; }
            return restart ? procs[0].pid : procs[1].pid;
        };
        Scheduler.prototype.schedule = function (filter) {
            var activeProcesses = TSOS.PCB.getProcessByState([_State.READY, _State.RUNNING], filter);
            var procLength = activeProcesses.length;
            // Multiple processes, do context switching
            if (procLength > 1) {
                if (this.bursts >= this.quantum) {
                    var nextPid = this.getNextProcess(activeProcesses);
                    if (nextPid != -1)
                        this.contextSwitch(nextPid);
                }
                else if (!this.isSwitching && TSOS.PCB.getProcessByState([_State.RUNNING]).length === 0) {
                    var nextPid = this.getNextProcess(activeProcesses, true);
                    if (nextPid != -1)
                        this.contextSwitch(nextPid);
                }
            }
            else if (procLength === 1) {
                var proc = activeProcesses[0];
                if (proc.state === _State.READY) {
                    _KernelInterruptQueue.enqueue(new TSOS.Interrupt(SYSTEMCALL_IRQ, { type: 3 /* CONTEXT_SWITCH */, pid: proc.pid }));
                }
            }
            else {
                this.bursts = 0;
            }
        };
        Scheduler.prototype.updateStats = function () {
            TSOS.PCB.getProcessByState([_State.READY]).forEach(function (ps) {
                ps.waitTime++;
            });
            _CPU.currentProcess.runTime++;
        };
        Scheduler.Type = {
            ROUND_ROBIN: 'Round Robin',
            FCFS: 'First-come First-served',
            PRIORITY: 'Priority',
        };
        return Scheduler;
    }());
    TSOS.Scheduler = Scheduler;
})(TSOS || (TSOS = {}));
