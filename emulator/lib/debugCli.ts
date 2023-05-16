import colors from "colors";
import readline from "readline";
import fs from "fs";
import { printError } from "./consoleError.js";
import { CPUStatus } from "./types.js";

colors.enable();

let cmdHistory: string[] = [];

const COMMANDS = [
	"b",
	"breakpoint",
	"remove",
	"remove all",
	"rm",
	"rm all",
	"list breakpoints",
	"ls b",
	"ins card",
	"ins char",
	"insert card",
	"insert char",
	"dis video",
	"disable video",
	"en video",
	"enable video",
	"next instruction",
	"next jump",
	"next return",
	"ni",
	"nj",
	"nr",
	"res",
	"restart",
	"run",
	"red key",
	"redirect keyboard",
	"emem dump",
	"emem watch",
	"external memory dump",
	"external memory watch",
	"imem dump",
	"imem watch",
	"internal memory dump",
	"internal memory watch",
	"stack watch",
	"vmem dump",
	"video memory dump",
	"help",
	"exit"
];

const DEBUG_HELP = `
All available commands:

${"Breakpoints".green}
	${"b".cyan} ${"<address>".yellow}			Set a new breakpoint
	${"breakpoint".cyan} ${"<address>".yellow}		Set a new breakpoint
	${"remove".cyan} ${"<brkId>".yellow}			Remove a breakpoint
	${"remove all".cyan}			Remove all breakpoints
	${"rm".cyan} ${"<brkId>".yellow}			Remove a breakpoint
	${"rm all".cyan}				Remove all breakpoint
	${"list breakpoints".cyan}		Lists all breakpoints
	${"ls b".cyan}				Lists all breakpoints

${"Devices".green}
	${"ins card".cyan} ${"<fileName>".yellow} 		Insert the virtual card into the card slot
	${"ins char".cyan} ${"<fileName>".yellow} 		Insert the virtual char map into the char map slot
	${"insert card".cyan} ${"<fileName>".yellow} 		Insert the virtual card into the card slot
	${"insert char".cyan} ${"<fileName>".yellow} 		Insert the virtual char map into the char map slot
	${"dis video".cyan}			Disable video output
	${"disable video".cyan}			Disable video output
	${"en video".cyan}			Enable video output
	${"enable video".cyan}			Enable video ouptut

${"Execution flow".green}
	${"next instruction".cyan}	Execute the next instruction
	${"next jump".cyan}		Execute until JMP instruction
	${"next return".cyan}		Execute until RET instruction
	${"ni".cyan}			Execute the next instruction
	${"nj".cyan}			Execute until JMP instruction
	${"nr".cyan}			Execute until RET instruction
	${"res".cyan}			Restart the CPU
	${"restart".cyan}			Restart the CPU
	${"run".cyan}			Continue the execution of the emulator

${"Interrupts".green}
	${"red key".cyan}			Redirect keyboard input from the terminal to the emulator
	${"redirect keyboard".cyan}	Redirect keyboard input from the terminal to the emulator

${"Memory".green}
	${"emem dump".cyan} ${"<fileName>".yellow} 				Save the content in the external memory into a file
	${"emem watch".cyan} ${"<address>".yellow} ${"<length>".yellow} 			Show the content of the external memory from address
	${"external memory dump".cyan} ${"<fileName>".yellow} 		Save the content in the external memory into a file
	${"external memory watch".cyan} ${"<address>".yellow} ${"<length>".yellow}	Show the content of the external memory from address
	${"imem dump".cyan} ${"<fileName>".yellow} 				Save the content in RAM into a file
	${"imem watch".cyan} ${"<address>".yellow} ${"<length>".yellow}			Show the content of the internal memory from address
	${"internal memory dump".cyan} ${"<fileName>".yellow} 		Save the content in RAM into a file
	${"internal memory watch".cyan} ${"<address>".yellow} ${"<length>".yellow}	Show the content of the internal memory from address
	${"stack watch".cyan} ${"<addrRelativeToSP>".yellow} ${"<length>".yellow}		Show the content of the stack	
	${"vmem dump".cyan} ${"<fileName>".yellow}				Save the content of the video memory as an image
	${"video memory dump".cyan} ${"<fileName>".yellow}			Save the content of the video memory as an image

${"Others".green}
	${"help".cyan}		Show this list
	${"exit".cyan}		Exit from emulator
`;

export function printDebugHelp() {
	console.log(DEBUG_HELP);
}

export function initDebug() {
	console.clear();
	process.stdout.write(
		`Welcome to the ANC16 debugger
For more information type ${"help".cyan}
To start type ${"run".cyan}
`
	);

	for (let i = 0; i < process.stdout.columns; i++) process.stdout.write("─");
	let str = "";
	let cursor: number;
	process.stdin.setRawMode(true);
	process.stdin.on("keypress", (chr, key: readline.Key) => {
		// if (key.name === "tab") {
		// 	str = setHints(str);
		// 	return;
		// }
		if (key.name === "enter" || key.name === "return") {
			if (cmdHistory[cmdHistory.length - 1] !== str)
				cmdHistory.push(str);
			cursor = cmdHistory.length - 1;
			str = "";
			return;
		}
		if (key.name === "backspace") {
			str = str.substring(0, str.length - 1);
			return;
		}
		// if (key.name === "up") {
		// 	let value = cmdHistory[cursor];
		// 	if (value !== undefined) {
		// 		str = value;
		// 		process.stdout.write(value);
		// 		process.stdout.clearLine(1);
		// 		process.stdout.cursorTo(0);
		// 		cursor--;
		// 	}
		// }
		str += chr;
		showHints(str);
	});


}

function getSimilarCommands(str: string) {
	let splittedStr = str.split(" ");
	let cmds: string[] = [];

	for (let cmd of COMMANDS) {
		let splittedCmd = cmd.split(" ");
		if (splittedStr.length > splittedCmd.length) continue;
		let i = 0;
		let match = true;
		for (; i < splittedStr.length - 1; i++) {
			if (splittedStr[i] !== splittedCmd[i]) {
				match = false;
				break
			}
		}
		if (!match) continue;
		if (splittedCmd[i].startsWith(splittedStr[i])) {
			let hint = splittedCmd.slice(0, i + 1).join(" ");
			if (!cmds.includes(hint)) cmds.push(hint);
		}
	}

	return cmds;
}

function showHints(str: string) {
	let cmds = getSimilarCommands(str);
	if (cmds.length !== 1) return;
	let cmd = cmds[0].substring(str.length - 1);
	process.stdout.write(cmd.gray);
	process.stdout.moveCursor(-cmd.length, 0);
}

function setHints(str: string) {
	let cmds = getSimilarCommands(str);
	if (cmds.length !== 1) return;
	let cmd = cmds[0];
	process.stdout.write(cmd);
	return cmd;
}

export async function debugAsk(message: string, onAccept: () => void, onDecline: () => void) {
	process.stdout.write(message + ` [${"Y".green}/${"n".red}] `);
	let line = await getLineDebug();
	if (line === "" || line.toLowerCase() === "y") {
		onAccept();
		return;
	}
	if (line.toLowerCase() === "n") {
		onDecline();
		return;
	}
	process.stdout.moveCursor(0, -1);
	process.stdout.clearLine(0);
	printError("input error");
}

export function getLineDebug() {
	const rl = readline.createInterface(
		{
			input: process.stdin,
			output: process.stdout
		}
	);

	return new Promise<string>(resolve => {
		rl.on("line", line => {
			rl.close();
			resolve(line);
		});
	});
}

export function debugCPUStats(cpuStatus: CPUStatus) {
	console.clear();
	let width = process.stdout.columns;
	const registers = "REGISTERS";
	const stack = "STACK"
	const regPadding = width / 4 - (registers.length / 2);
	const stackPadding = width / 4 - (stack.length / 2);
	const compressed = process.stdout.rows < 20;
	for (let i = 0; i < regPadding; i++)
		process.stdout.write(" ".bgGreen);
	process.stdout.write(registers.bgGreen);
	for (let i = 0; i < regPadding; i++)
		process.stdout.write(" ".bgGreen);

	for (let i = 0; i < stackPadding; i++)
		process.stdout.write(" ".bgBlue);
	process.stdout.write(stack.bgBlue);
	for (let i = 0; i < stackPadding - 1; i++)
		process.stdout.write(" ".bgBlue);

	writeRegister(cpuStatus, width, compressed);
	writeStack(cpuStatus, process.stdout.columns, compressed);
	process.stdout.cursorTo(0, compressed ? 12 : 17);
}

function writeRegister(cpuStatus: CPUStatus, width: number, compressed: boolean) {
	process.stdout.cursorTo(0, 1);
	process.stdout.write("GPRs");

	process.stdout.cursorTo(2, compressed ? 2 : 3);
	process.stdout.write(" A ".bgWhite.black + " : ");
	process.stdout.write(cpuStatus.a);

	for (let i = 0; i < width / 2 - 30; i++)
		process.stdout.write(" ");
	process.stdout.write(" B ".bgWhite.black + " : ");
	process.stdout.write(cpuStatus.b);

	console.log(compressed ? "" : "\n");

	process.stdout.cursorTo(2, compressed ? 3 : 4);
	process.stdout.write(" I ".bgWhite.black + " : ");
	process.stdout.write(cpuStatus.i);

	for (let i = 0; i < width / 2 - 30; i++)
		process.stdout.write(" ");
	process.stdout.write(" J ".bgWhite.black + " : ");
	process.stdout.write(cpuStatus.j);

	console.log(compressed ? "" : "\n");

	process.stdout.write("Special registers");

	process.stdout.cursorTo(2, compressed ? 5 : 8);
	process.stdout.write(" PC ".bgWhite.black + " : ");
	process.stdout.write(cpuStatus.pc);

	for (let i = 0; i < width / 2 - 35; i++)
		process.stdout.write(" ");
	process.stdout.write(" IR ".bgWhite.black + " : ");
	process.stdout.write(cpuStatus.ir);
	if (cpuStatus.currentInstruction !== undefined) process.stdout.write(" (" + cpuStatus.currentInstruction + ")  ");

	process.stdout.cursorTo(2, compressed ? 6 : 9);
	process.stdout.write(" SP ".bgBlue + " : ");
	process.stdout.write(cpuStatus.sp);

	for (let i = 0; i < width / 2 - 35; i++)
		process.stdout.write(" ");
	process.stdout.write(" DR ".bgWhite.black + " : ");
	process.stdout.write(cpuStatus.dr);

	process.stdout.cursorTo(2, compressed ? 7 : 10);
	process.stdout.write(" SR ".bgWhite.black + " : ");
	process.stdout.write(cpuStatus.sr);

	console.log(compressed ? "" : "\n");

	process.stdout.write("Memory table");

	process.stdout.cursorTo(2, compressed ? 9 : 14);
	process.stdout.write(" IMLI ".bgWhite.black + " : ");
	process.stdout.write(cpuStatus.imli);

	for (let i = 0; i < width / 2 - 35; i++)
		process.stdout.write(" ");
	process.stdout.write(" IMHI ".bgWhite.black + " : ");
	process.stdout.write(cpuStatus.imhi);

	process.stdout.cursorTo(2, compressed ? 10 : 15);
	process.stdout.write(" EMLI ".bgWhite.black + " : ");
	process.stdout.write(cpuStatus.emli);

	for (let i = 0; i < width / 2 - 35; i++)
		process.stdout.write(" ");
	process.stdout.write(" EMHI ".bgWhite.black + " : ");
	process.stdout.write(cpuStatus.emhi);
}

export function memHex(mem: Uint8Array, addressFrom: number, addressTo: number, columns = 16, ascii = true, cursorX = 0, cursorY = 0) {
	process.stdout.cursorTo(cursorX, cursorY);
	process.stdout.write("        ");
	for (let i = 0; i < columns; i++) process.stdout.write(i.toString(16).toUpperCase().padStart(2, "0") + " ");
	if (ascii) process.stdout.write("        Ascii");
	process.stdout.cursorTo(cursorX, ++cursorY);
	process.stdout.write("───────".green);
	for (let i = 0; i < columns; i++) process.stdout.write("───".green);
	if (ascii) {
		process.stdout.write("─────────".green);
		for (let i = 0; i < columns; i++) process.stdout.write("─".green);
	}
	process.stdout.cursorTo(cursorX, ++cursorY);

	mem = mem.subarray(addressFrom, addressTo);

	for (let i = 0; i < mem.length; i += columns) {
		process.stdout.write(("0x" + (addressFrom + i).toString(16).toUpperCase().padStart(4, "0")).yellow + "  ");
		for (let j = 0; j < columns; j++) {
			if (mem[i + j] === undefined) {
				process.stdout.write("   ");
				continue;
			}
			process.stdout.write(mem[i + j].toString(16).toUpperCase().padStart(2, "0") + " ");
		}
		process.stdout.write("        ");
		for (let j = 0; j < columns; j++) {
			if (mem[i + j] === undefined) break;
			let ascii = String.fromCharCode(mem[i + j]).match(/^[\d\w]$/i);
			if (ascii === null) {
				process.stdout.write(".".gray);
				continue;
			}
			process.stdout.write(ascii[0]);

		}
		process.stdout.cursorTo(cursorX, ++cursorY);
	}

}

function writeStack(cpuStatus: CPUStatus, width: number, compressed: boolean) {
	process.stdout.cursorTo(width / 2 + 1, 1);
	let sp = Number(cpuStatus.sp);
	let imli = Number(cpuStatus.imli);
	let sys = cpuStatus.sr.includes("s");

	if (sp < imli && sys || sp === 0) {
		process.stdout.write("Cannot read the stack".red);
		return;
	}
	memHex(
		cpuStatus.iMem,
		compressed ?
			sp - 8 < imli ? imli : sp - 8
			: sp - 13 < imli ? imli : sp - 13,
		sp,
		8,
		false,
		width / 2 + 1,
		1
	);

}

export async function updateDebugCPUStats(cpuStatus: CPUStatus) {
	const compressed = process.stdout.rows < 20;
	writeRegister(cpuStatus, process.stdout.columns, compressed);
	writeStack(cpuStatus, process.stdout.columns, compressed);
	process.stdout.cursorTo(0, compressed ? 12 : 16);
}