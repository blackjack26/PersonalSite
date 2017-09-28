///<reference path="../globals.ts" />
///<reference path="../os/canvastext.ts" />
/* ------------
 Control.ts

 Requires globals.ts.

 Routines for the hardware simulation, NOT for our client OS itself.
 These are static because we are never going to instantiate them, because they represent the hardware.
 In this manner, it's A LITTLE BIT like a hypervisor, in that the Document environment inside a browser
 is the "bare metal" (so to speak) for which we write code that hosts our client OS.
 But that analogy only goes so far, and the lines are blurred, because we are using TypeScript/JavaScript
 in both the host and client environments.

 This (and other host/simulation scripts) is the only place that we should see "web" code, such as
 DOM manipulation and event handling, and so on.  (Index.html is -- obviously -- the only place for markup.)

 This code references page numbers in the text book:
 Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
 ------------ */
//
// Control Services
//
var TSOS;
(function (TSOS) {
    var Control = (function () {
        function Control() {
        }
        Control.hostInit = function () {
            // This is called from index.html's onLoad event via the onDocumentLoad function pointer.
            // Get a global reference to the canvas.  TODO: Should we move this stuff into a Display Device Driver?
            _Canvas = document.getElementById('display');
            // Get a global reference to the drawing context.
            _DrawingContext = _Canvas.getContext('2d');
            // Enable the added-in canvas text functions (see canvastext.ts for provenance and details).
            TSOS.CanvasTextFunctions.enable(_DrawingContext); // Text functionality is now built in to the HTML5 canvas. But this is old-school, and fun, so we'll keep it.
            // Clear the log text box.
            // Use the TypeScript cast to HTMLInputElement
            document.getElementById('taHostLog').innerHTML = '';
            // Set focus on the start button.
            // Use the TypeScript cast to HTMLInputElement
            document.getElementById('btnStartOS').focus();
            // Check for our testing and enrichment core, which
            // may be referenced here (from index.html) as function Glados().
            if (typeof Glados === 'function') {
                // function Glados() is here, so instantiate Her into
                // the global (and properly capitalized) _GLaDOS variable.
                _GLaDOS = new Glados();
                _GLaDOS.init();
            }
        };
        Control.hostLog = function (msg, source) {
            if (source === void 0) { source = '?'; }
            // Note the OS CLOCK.
            var clock = _OSclock;
            // Note the REAL clock in milliseconds since January 1, 1970.
            var now = new Date().getTime();
            // Build the log string.
            var str = '({ clock:' + clock + ', source:' + source + ', msg:' + msg + ', now:' + now + ' })' + '<br>';
            // Update the log console.
            var taLog = document.getElementById('taHostLog');
            taLog.innerHTML = str + taLog.innerHTML;
            // TODO in the future: Optionally update a log database or some streaming service.
        };
        //
        // Host Events
        //
        Control.hostUpdateStatus = function (status) {
            var msgEl = document.getElementById('status-message');
            msgEl.textContent = status;
            // Show message (opacity only 0 on initial load), adds fade effect
            msgEl.parentElement.style.opacity = '1';
        };
        Control.hostBtnStartOS_click = function (btn) {
            // Disable the (passed-in) start button...
            btn.disabled = true;
            // .. enable the Halt and Reset buttons ...
            document.getElementById('btnHaltOS').disabled = false;
            document.getElementById('btnReset').disabled = false;
            document.getElementById('btnSingleStep').disabled = false;
            // .. set focus on the OS console display ...
            document.getElementById('display').focus();
            document.getElementById('display').addEventListener("focusout", function () {
                clearInterval(_Console.cursorBlink);
            });
            document.getElementById('display').addEventListener("focusin", function () {
                clearInterval(_Console.cursorBlink);
                _Console.startCursorBlink();
            });
            // ... Create and initialize the CPU (because it's part of the hardware)  ...
            _CPU = new TSOS.Cpu(); // Note: We could simulate multi-core systems by instantiating more than one instance of the CPU here.
            _CPU.init(); //       There's more to do, like dealing with scheduling and such, but this would be a start. Pretty cool.
            // Initialize memory
            _Memory = new TSOS.Memory();
            _Memory.init();
            TSOS.Control.initMemoryDisplay();
            _MMU = new TSOS.MMU();
            TSOS.Control.initProcessDisplay();
            // ... then set the host clock pulse ...
            _hardwareClockID = setInterval(TSOS.Devices.hostClockPulse, CPU_CLOCK_INTERVAL);
            // .. and call the OS Kernel Bootstrap routine.
            _Kernel = new TSOS.Kernel();
            _Kernel.krnBootstrap(); // _GLaDOS.afterStartup() will get called in there, if configured.
        };
        Control.hostBtnHaltOS_click = function (btn) {
            Control.hostLog('Emergency halt', 'host');
            Control.hostLog('Attempting Kernel shutdown.', 'host');
            // Call the OS shutdown routine.
            _Kernel.krnShutdown();
            // Stop the interval that's simulating our clock pulse.
            clearInterval(_hardwareClockID);
            // TODO: Is there anything else we need to do here?
        };
        Control.hostBtnReset_click = function (btn) {
            // The easiest and most thorough way to do this is to reload (not refresh) the document.
            location.reload(true);
            // That boolean parameter is the 'forceget' flag. When it is true it causes the page to always
            // be reloaded from the server. If it is false or not specified the browser may reload the
            // page from its cache, which is not what we want.
        };
        Control.hostBtnSingleStep_click = function (btn) {
            _SingleStep = !_SingleStep;
            document.getElementById('stepDisplay').textContent = _SingleStep ? 'ON' : 'OFF';
            document.getElementById('btnNextStep').disabled = !_SingleStep;
            if (_SingleStep)
                document.getElementById('btnSingleStep').classList.add('is-info');
            else
                document.getElementById('btnSingleStep').classList.remove('is-info');
            _ShouldStep = false;
        };
        Control.hostBtnStep_click = function (btn) {
            _ShouldStep = true;
        };
        Control.getProgramInput = function () {
            return document.getElementById('taProgramInput').value;
        };
        Control.initMemoryDisplay = function () {
            var memTable = document.getElementById('memoryTable');
            var body = memTable.createTBody();
            for (var i = 0; i < _MemorySize / 8; i++) {
                var row = body.insertRow(i);
                row.insertCell(0).textContent = TSOS.Utils.toHexDigit(i * 8, 3, true);
                for (var j = 0; j < 8; j++) {
                    row.insertCell(j + 1).textContent =
                        TSOS.Utils.toHexDigit(_Memory.getAddressValue(i * 8 + j), 2);
                }
            }
        };
        Control.updateMemoryDisplay = function () {
            var memTable = document.getElementById('memoryTable');
            var memHighlightCount = 0;
            for (var i = 0; i < _MemorySize / 8; i++) {
                var row = memTable.rows.item(i);
                row.cells.item(0).textContent = TSOS.Utils.toHexDigit(i * 8, 3, true);
                for (var j = 0; j < 8; j++) {
                    var cell = row.cells.item(j + 1);
                    var val = _Memory.getAddressValue(i * 8 + j);
                    cell.textContent = TSOS.Utils.toHexDigit(val, 2);
                    // Current instruction, highlight
                    if (_CPU.isExecuting && !_CPU.currentProcess.isTerminating &&
                        _CPU.IR != null && i * 8 + j == _CPU.PC) {
                        cell.classList.add('selected-code');
                        memHighlightCount = this.getMemShift(val);
                    }
                    else if (memHighlightCount > 0) {
                        memHighlightCount--;
                        cell.classList.add('selected-mem');
                    }
                    else {
                        cell.classList.remove('selected-code', 'selected-mem');
                    }
                }
            }
            if (document.getElementsByClassName('selected-code').length > 0)
                document.getElementsByClassName('selected-code')[0].scrollIntoView();
        };
        Control.initProcessDisplay = function () {
            var headers = ['PID', 'PC', 'IR', 'ACC', 'X', 'Y', 'Z', 'State'];
            var procTable = document.getElementById('processTable');
            var headRow = procTable.createTHead().insertRow();
            for (var i = 0; i < headers.length; i++) {
                headRow.insertCell().textContent = headers[i];
            }
            procTable.createTBody();
            document.getElementById('processLabel').textContent = 'No Processes Loaded :(';
        };
        Control.createNewProcessDisplay = function () {
            var procTable = document.getElementById('processTable');
            var row = procTable.tBodies.item(0).insertRow();
            for (var i = 0; i < 8; i++) {
                row.insertCell(i);
            }
            this.updateProcessDisplay();
            var noProcesses = document.getElementById('processLabel');
            if (noProcesses) {
                noProcesses.remove();
            }
        };
        Control.updateProcessDisplay = function () {
            var procTable = document.getElementById('processTable');
            var body = procTable.tBodies.item(0);
            var processes = TSOS.PCB.getAvailableProcesses();
            for (var i = 0; i < processes.length; i++) {
                var _a = processes[i], pid = _a.pid, PC = _a.PC, IR = _a.IR, Acc = _a.Acc, Xreg = _a.Xreg, Yreg = _a.Yreg, Zflag = _a.Zflag, state = _a.state;
                var row = body.rows.item(i);
                row.cells.item(0).textContent = TSOS.Utils.toHex(pid);
                row.cells.item(1).textContent = TSOS.Utils.toHexDigit(PC, 3);
                row.cells.item(2).textContent = IR === 0 || IR != null ? TSOS.Utils.toHexDigit(IR, 2) : '-';
                row.cells.item(3).textContent = TSOS.Utils.toHexDigit(Acc, 2);
                row.cells.item(4).textContent = TSOS.Utils.toHexDigit(Xreg, 2);
                row.cells.item(5).textContent = TSOS.Utils.toHexDigit(Yreg, 2);
                row.cells.item(6).textContent = Zflag.toString();
                row.cells.item(7).textContent = state.toString();
            }
        };
        Control.removeProcessDisplay = function (pid) {
            var procTable = document.getElementById('processTable');
            procTable.tBodies.item(0).rows.item(0).remove();
        };
        Control.initCpuDisplay = function () {
            var headers = ['PC', 'IR', 'ACC', 'X', 'Y', 'Z'];
            var cpuTable = document.getElementById('cpuTable');
            var headRow = cpuTable.createTHead().insertRow();
            for (var i = 0; i < headers.length; i++) {
                headRow.insertCell().textContent = headers[i];
            }
            var bodyRow = cpuTable.createTBody().insertRow();
            var PC = _CPU.PC, Acc = _CPU.Acc, Xreg = _CPU.Xreg, Yreg = _CPU.Yreg, Zflag = _CPU.Zflag;
            bodyRow.insertCell(0).textContent = TSOS.Utils.toHexDigit(PC, 3);
            bodyRow.insertCell(1).textContent = '-';
            bodyRow.insertCell(2).textContent = TSOS.Utils.toHexDigit(Acc, 2);
            bodyRow.insertCell(3).textContent = TSOS.Utils.toHexDigit(Xreg, 2);
            bodyRow.insertCell(4).textContent = TSOS.Utils.toHexDigit(Yreg, 2);
            bodyRow.insertCell(5).textContent = Zflag.toString();
        };
        Control.updateCpuDisplay = function () {
            var cpuTable = document.getElementById('cpuTable');
            var row = cpuTable.tBodies.item(0).rows.item(0);
            var PC = _CPU.PC, IR = _CPU.IR, Acc = _CPU.Acc, Xreg = _CPU.Xreg, Yreg = _CPU.Yreg, Zflag = _CPU.Zflag;
            row.cells.item(0).textContent = TSOS.Utils.toHexDigit(PC, 3);
            row.cells.item(1).textContent = IR === 0 || IR != null ? TSOS.Utils.toHexDigit(IR, 2) : '-';
            row.cells.item(2).textContent = TSOS.Utils.toHexDigit(Acc, 2);
            row.cells.item(3).textContent = TSOS.Utils.toHexDigit(Xreg, 2);
            row.cells.item(4).textContent = TSOS.Utils.toHexDigit(Yreg, 2);
            row.cells.item(5).textContent = Zflag.toString();
        };
        Control.getMemShift = function (op) {
            switch (op) {
                case 0xA9:
                case 0xA2:
                case 0xA0:
                case 0xD0:
                    return 1;
                case 0x8D:
                case 0xAD:
                case 0x6D:
                case 0xAE:
                case 0xAC:
                case 0xEC:
                    return 2;
                case 0xEA:
                case 0x00:
                case 0xEE:
                case 0xFF:
                default:
                    return 0;
            }
        };
        return Control;
    }());
    TSOS.Control = Control;
})(TSOS || (TSOS = {}));
