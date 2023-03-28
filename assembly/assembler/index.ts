import { argv, exit } from "process";
import * as assembler from "./lib/assembler";
import * as colors from "colors";
import * as mod from "./lib/files";
import * as path from "path";

colors.enable();

const help =
	`
Usage:
	assembler sourceFile ${"[outputFile]".yellow}
Flags:
	${"-h".cyan}		Set the standard header for executable files in ANC16
	${"--h-draw".cyan}	Set authorization 'accessVideoMem' header flag
	${"--h-fs".cyan}		Set authorization 'accessFileSystem' header flag
	${"--h-privileges".cyan}	Set authorization 'highPrivileges' header flag
	${"--h-symbol-ref".cyan}	Save the symbol table in the header
	${"--help".cyan}	\tShow this list
	${"--ref".cyan}		Add a label references output file
	${"-v".cyan}		Show the version
	${"--version".cyan}	Show the version
	${"-z".cyan}		Fill with zeros from address 0x0000 to the address of _code
`;

const version =
	`
Assembly standard version: ${"2.0".green}
ANC16 ISA version: ${"1.0".green}
Assembler version: ${"1.0.4-pr".green}
`

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
let outFileName = "a.bin";

if (process.argv.length == 4) {
	outFileName = process.argv[3];
}

let sourceFile = mod.read(sourceFileName);
mod.setCWD(sourceFileName);
mod.appendModule(mod.getCWD() + "\\" + path.basename(sourceFileName));
let assembled = assembler.assemble(sourceFile.toString(), "_main", {
	useHeader: isSet("-h"),
	zerosToCode: isSet("-z"),
	setSymbolRef: isSet("--h-symbol-ref"),
	accessFileSystem: isSet("--h-fs"),
	accessVideoMem: isSet("--h-draw"),
	highPrivileges: isSet("--h-privileges"),
	symbolRefFile: isSet("--ref")
});
mod.write(outFileName, assembled.bin);
if (assembled.ref != "") {
	let enc = new TextEncoder();
	mod.write(outFileName.split(".")[0] + ".ref.anc16", enc.encode(assembled.ref));
}