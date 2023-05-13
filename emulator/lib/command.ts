import { EmulatorOptions, ParamFlag } from "./types.js";
import colors from "colors";
import fs from "fs";
import { printError } from "./consoleError.js";
import { exit } from "process";
colors.enable();

const PARAM_FALGS = [
	"-c",
	"--card"
];

const FLAGS = [
	"-d",
	"--debug-mode",
	"--help",
	"--no-video",
	"--no-audio",
	"-w",
	"--watch-mode"
].concat(PARAM_FALGS);

export function processArguments(argv: string[]): {
	emuOptions: EmulatorOptions
	osRom: Uint8Array,
	charMap: Uint8Array
} {
	let flags = getFlags(argv);
	if (flags.includes("--help") || argv.length < 3) {
		printHelp();
		process.exit(0);
	}

	let paramFlags = getParamFlags(argv);
	let args = getArguments(argv);

	return {
		emuOptions: getEmulatorOptions(flags, paramFlags),
		osRom: getBinaryFile(args[0]),
		charMap: getBinaryFile(args[1])
	}
}

function getEmulatorOptions(flags: string[], paramFlags: ParamFlag[]) {
	let opt: EmulatorOptions;
	const debug = () => flags.includes("-d") || flags.includes("--debug-mode");
	const watch = () => flags.includes("-w") || flags.includes("--watch-mode");

	opt = {
		mode: debug() ? "debug" : watch() ? "watch" : "run",
		video: !flags.includes("--no-video"),
		audio: !flags.includes("--no-audio"),
		cardFile: paramFlags.length === 0 ? null : getBinaryFile(paramFlags[0].value)
	}

	return opt;
}

function getFlags(argv: string[]) {
	let flags: string[] = [];

	for (let i = 0; i < argv.length; i++) {
		if (argv[i].startsWith("-")) {
			if (!FLAGS.includes(argv[i])) {
				printError("unknown option '" + argv[i] + "'.\nType '--help' for more information.");
				exit(1);
			}

			if (
				(
					argv[i] === "-d"
					|| argv[i] === "--debug-mode"
				) && (
					flags.includes("-w")
					|| flags.includes("--watch-mode")
				) || (
					argv[i] === "-w"
					|| argv[i] === "--watch-mode"
				) && (
					flags.includes("-d")
					|| flags.includes("--debug-mode")
				)
			) {
				printError("cannot set debug mode and watch mode simultaneously");
				exit(1);
			}
			if (!PARAM_FALGS.includes(argv[i])) {
				flags.push(argv[i]);
				argv.splice(i, 1);
				i--;
			}
		}
	}

	return flags;
}

function getParamFlags(argv: string[]) {
	let paramFlags: ParamFlag[] = [];

	for (let i = 0; i < argv.length; i++) {
		if (PARAM_FALGS.includes(argv[i])) {
			if (i === argv.length - 1) {
				printError(argv[i] + " requires the file name parameters after");
				exit(1);
			}
			if (paramFlags.length != 0) {
				printError("the card option has been already defined");
				exit(1);
			}

			paramFlags.push({ name: argv[i], value: argv[i + 1] });
			argv.splice(i, 2);
			i--;
		}
	}

	return paramFlags;
}

function getArguments(argv: string[]) {
	if (argv.length < 4) {
		printError("you must specify the os rom file and the char map file");
		exit(1);
	}

	if (argv.length > 4) {
		printError("too many arguments specified");
		exit(1);
	}

	return argv.slice(2);
}

function getBinaryFile(fileName: string) {
	try {
		return fs.readFileSync(fileName) as Uint8Array;
	} catch {
		printError("the file '" + fileName + "' does not exit");
		exit(1);
	}
}

const HELP = `
Usage:
	emulator osRomFile charMapFile ${"[Options...]".yellow}
Options:
	${"-c".cyan} ${"<cardFile>".yellow}		Insert the card in the virtual card slot
	${"--card".cyan} ${"<cardFile>".yellow}	Insert the card in the virtual card slot
	${"-d".cyan}			Run in debug mode
	${"--debug-mode".cyan}		Run in debug mode
	${"--help".cyan}			Shows this list
	${"--no-audio".cyan}		Disable audio output
	${"--no-video".cyan}		Disable video output
	${"-w".cyan}			Run in CPU info watch mode
	${"--watch-mode".cyan}		Run in CPU info watch mode
`;

function printHelp() {
	console.log(HELP);
}