import * as colors from "colors";
import * as disassembler from "./lib/disassembler"
import { exit } from "process";
import * as fs from "fs";
import { Error, FILE_NOT_FOUND, printExit } from "./lib/localError";
colors.enable();

const help =
	`
Usage:
	disassembler sourceFile ${"[outputFile]".yellow}
Flags:
	${"-c".cyan}		Generate auto comments
	${"-h".cyan}		Set if the input file contains an header
	${"--help".cyan}	\tShow this list
	${"-v".cyan}		Show the version
	${"--version".cyan}	Show the version
	${"-z".cyan}		Set if the input file contains zeros from 0x0000 to _code
`;

const version =
	`
Assembly standard version: ${"2.0".green}
ANC16 ISA version: ${"1.0".green}
Disassembler version: ${"1.0.0-pr".green}
`;

if (process.argv.length < 3) {
	console.log(help);
	exit(0);
}

if (process.argv[2] === "--help") {
	console.log(help);
	exit(0);
}

if (process.argv[2] === "--version" || process.argv[2] === "-v") {
	console.log(version);
	exit(0);
}

let flags: string[] = [];
for (let i = 0; i < process.argv.length;) {
	if (process.argv[i].startsWith("-") && !flags.includes(process.argv[i])) {
		flags.push(process.argv[i]);
		process.argv.splice(i, 1);
	} else i++;
}

const isSet = (flag: string) => flags.includes(flag);

let sourceFileName = process.argv[2];
let outFileName = "a.anc16";

if (process.argv.length == 4) {
	outFileName = process.argv[3];
}

let buffer;
try {
	buffer = fs.readFileSync(sourceFileName);
} catch {
	const err: Error = {
		type: FILE_NOT_FOUND,
		message: "Source file not found",
	};
	printExit(err);
}

let out = disassembler.disassemble(buffer, {
	useHeader: isSet("-h"),
	comments: isSet("-c"),
	zeros: isSet("-z")
})

if (fs.existsSync(outFileName))
	fs.writeFileSync(outFileName, out);
else
	fs.writeFileSync(outFileName, out, { flag: "wx" });