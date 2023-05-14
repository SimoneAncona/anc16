import { ANC16 } from "./ANC16.js";
import { AVC64 } from "./AVC64.js";
import { printError } from "./consoleError.js";
import { debugAsk, debugCPUStats, getLineDebug, initDebug, printDebugHelp, updateDebugCPUStats } from "./debugCli.js";
import { ExternalMemoryController } from "./memoryController.js";
import { Breakpoint, EmulatorParams } from "./types.js";

const FAST_CONSOLE_CYCLE = 100;

export class Emulator {
	private memoryController: ExternalMemoryController;
	private cpu: ANC16;
	private gpu: AVC64;

	// debug
	private breakpoints: Breakpoint[];
	private currentId: number;

	constructor(params: EmulatorParams) {
		this.memoryController = new ExternalMemoryController();
		this.memoryController.setOs(params.osRom);
		this.memoryController.setChar(params.charMap);
		this.gpu = new AVC64();
		this.memoryController.setVideoChip(this.gpu);
		this.cpu = new ANC16(this.memoryController);
		this.cpu.reset();
		this.breakpoints = [];
		this.currentId = 1;

		if (params.emuOptions.video) {
			this.memoryController.enableVideoOutput();
		}

		if (params.emuOptions.cardFile !== null) {
			this.memoryController.setCard(params.emuOptions.cardFile);
		}


		if (params.emuOptions.mode === "debug") {
			initDebug();
			this.debugCliLoop();
		}
	}

	private async debugCliLoop() {
		while (true) {
			process.stdout.write("> ");
			const line = await getLineDebug();
			await this.decodeDebugCommand(line);
		}
	}

	private async decodeDebugCommand(str: string) {
		const jumps = ["jmp", "jeq", "jne", "jns", "jnc", "jos", "joc", "jcc", "jcs"];
		let cnt = 0;
		str = str.trim();
		try {
			switch (str) {
				case "": return
				case "help":
					printDebugHelp();
					return;
				case "exit":
					await debugAsk("Do you really want to exit?", () => process.exit(0), () => { });
					return;
				case "res": case "restart":
					this.cpu.reset();
					return;
				case "run":
					debugCPUStats(this.cpu.getCpuStatus());
					cnt = 0;
					while (true) {
						this.cpu.nextInstruction();
						if (cnt % FAST_CONSOLE_CYCLE === 0) updateDebugCPUStats(this.cpu.getCpuStatus());
						cnt++;
						if (this.checkBreakpoints(this.cpu.getCurrentAddress())) break;
					}
					updateDebugCPUStats(this.cpu.getCpuStatus());
					return;
				case "ni": case "next instruction":
					this.cpu.nextInstruction();
					debugCPUStats(this.cpu.getCpuStatus());
					return;
				case "nj": case "next jump":
					debugCPUStats(this.cpu.getCpuStatus());
					cnt = 0;
					do {
						this.cpu.nextInstruction();
						if (cnt % FAST_CONSOLE_CYCLE === 0) updateDebugCPUStats(this.cpu.getCpuStatus());
						cnt++;
						if (this.checkBreakpoints(this.cpu.getCurrentAddress())) break;
					} while (!jumps.includes(this.cpu.getCurrentInstruction()));
					updateDebugCPUStats(this.cpu.getCpuStatus());
					return;
				case "nr": case "next return":
					debugCPUStats(this.cpu.getCpuStatus());
					cnt = 0;
					do {
						this.cpu.nextInstruction();
						if (cnt % FAST_CONSOLE_CYCLE === 0) updateDebugCPUStats(this.cpu.getCpuStatus());
						cnt++;
						if (this.checkBreakpoints(this.cpu.getCurrentAddress())) break;
					} while (this.cpu.getCurrentInstruction() !== "ret");
					updateDebugCPUStats(this.cpu.getCpuStatus());
					return;
				case "remove all": case "rm all":
					this.breakpoints = [];
					return;
				case "ls b": case "list breakpoints":
					this.showBreakpoints();
					return;
					
			}
		} catch (e) {
			console.log(("\n" + e).red);
			return;
		}

		if (str.startsWith("b") || str.startsWith("breakpoint")) {
			this.addBreakpoint(str);
			return;
		}

		if (str.startsWith("rm") || str.startsWith("remove")) {
			this.removeBreakpoint(str);
			return;
		}

		if (str.startsWith("emem watch") || str.startsWith("external memory watch")) {
			this.watch("e", str);
			return;
		}

		if (str.startsWith("imem watch") || str.startsWith("internal memory watch")) {
			this.watch("i", str);
			return;
		}

		printError("unrecognized command. Type 'help' for more information");

	}

	watch(memory: "e" | "i", str: string) {
		let argv = str.split(" ");
		let address = Number(argv[argv.length - 2]);
		let length = Number(argv[argv.length - 1]);
		if (this.numberGuard(address, "The address must be a number")) return;
		if (this.numberGuard(length, "The length must be a number")) return;
		console.clear();
		let mem = memory === "e" ? this.memoryController.getFullMemory() : this.cpu.getFullMemory();
		process.stdout.write("\t00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F\t\tAscii\n");
		process.stdout.write("────────────────────────────────────────────────────────────────────────────────\n".green);

		mem = mem.subarray(address, address + length);

		for (let i = 0; i < mem.length; i += 16) {
			process.stdout.write(("0x" + (address + i).toString(16).toUpperCase().padStart(4, "0")).yellow + "\t");
			for (let j = 0; j < 16; j++) {
				if (mem[i + j] === undefined) {
					process.stdout.write("   ");
					continue;
				}
				process.stdout.write(mem[i + j].toString(16).toUpperCase().padStart(2, "0") + " ");
			}
			process.stdout.write("\t")
			for (let j = 0; j < 16; j++) {
				let ascii = String.fromCharCode(mem[i + j]).match(/^[\d\w]$/i);
				if (ascii === null) {
					process.stdout.write(".".gray);
					continue;
				}
				process.stdout.write(ascii[0]);

			}
			process.stdout.write("\n")
		}

	}

	showBreakpoints() {
		console.clear();
		process.stdout.write("ID\tAddress\n".green);
		process.stdout.write("───────────────\n".green);
		for (let b of this.breakpoints) {
			console.log(b.id + "\t0x" + b.address.toString(16));
		}
	}

	checkBreakpoints(address: number) {
		for (let b of this.breakpoints) {
			if (b.address === address) {
				return true;
			}
		}
		return false;
	}

	removeBreakpoint(str: string) {
		let id = Number(str.split(" ")[1]);
		if (Number.isNaN(id)) {
			console.log("The id must be a number");
			return;
		}

		for (let i = 0; i < this.breakpoints.length; i++) {
			if (this.breakpoints[i].id === id) {
				this.breakpoints.splice(i, 1);
			}
		}
	}

	addBreakpoint(str: string) {
		let addr = Number(str.split(" ")[1])
		if (Number.isNaN(addr)) {
			console.log("The address must be a number");
			return;
		}
		this.breakpoints.push({id: this.currentId, address: addr});
		console.log("Added breakpoint at 0x" + addr.toString(16) + " with id " + this.currentId);
		this.currentId++;
	}

	numberGuard(num: number, message: string) {
		if (Number.isNaN(num)) {
			console.log(message);
			return true;
		}
		return false;
	}

}