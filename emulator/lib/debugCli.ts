import * as colors from "colors";
import * as readline from "readline";

colors.enable();

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
	"stop",
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
	${"stop".cyan}			Stop the execution

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
	${"help"}		Show this list
	${"exit"}		Exit from emulator
`;

function printDebugHelp() {
	console.log(DEBUG_HELP);
}

export function initDebug() {
	console.clear();
	process.stdout.write(
		`
Welcome to the ANC16 debugger
For more information type ${"help".cyan}
To start type ${"run".cyan}
`
	);

	for (let i = 0; i < process.stdout.columns; i++) process.stdout.write("━");
	let str = "";
	process.stdin.on("keypress", (chr, key: readline.Key) => {
		// if (key.name === "tab") {
		// 	str = setHints(str);
		// 	return;
		// }
		if (key.name === "enter" || key.name === "return") {
			str = "";
			return;
		}
		if (key.name === "backspace") {
			str = str.substring(0, str.length - 1);
			return;
		}
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

// function setHints(str: string) {
// 	let cmds = getSimilarCommands(str);
// 	if (cmds.length !== 1) return;
// 	let s = cmds[0];
// 	let cmd = cmds[0].substring(str.length);
// 	process.stdout.write(cmd);
// 	process.stdout.moveCursor(-3, 0);
// 	return s;
// }

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