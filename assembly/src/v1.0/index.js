"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
const assembler = __importStar(require("./lib/assembler"));
const colors = __importStar(require("colors"));
const mod = __importStar(require("./lib/files"));
const path = __importStar(require("path"));
colors.enable();
const help = `
Usage:
	command.js sourceFile ${"[outputFile]".yellow}
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
const version = `
Assembly standard version: ${"2.0".green}
ANC16 ISA version: ${"1.0".green}
Assembler version: ${"1.0".green}
`;
if (process.argv.length < 3) {
    console.log(help);
    (0, process_1.exit)(0);
}
if (process.argv[2] === "--help") {
    console.log(help);
    (0, process_1.exit)(0);
}
if (process.argv[2] === "--version" || process.argv[2] === "-v") {
    console.log(version);
    (0, process_1.exit)(0);
}
let sourceFileName = process.argv[2];
let outFileName = "a.bin";
if (process.argv.length == 4) {
    outFileName = process.argv[3];
}
let sourceFile = mod.read(sourceFileName);
mod.setCWD(sourceFileName);
mod.appendModule(mod.getCWD() + "\\" + path.basename(sourceFileName));
let assembled = assembler.assemble(sourceFile.toString());
mod.write(outFileName, assembled);
