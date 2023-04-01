import * as colors from "colors";
import { exit } from "process";
import { Line } from "./types";
colors.enable();

type LocalErrorName = "FileNotFound" | "FileAlreadyExist" | "SyntaxError" | "ReferenceError" | "SymbolError" | "FSError" | "ValueError";

type LocalErrorType = {
	name: LocalErrorName,
	code: number
}

export const
	FILE_NOT_FOUND: LocalErrorType = { name: "FileNotFound", code: 0x0000 },
	FILE_ALREDY_EXIST: LocalErrorType = { name: "FileAlreadyExist", code: 0x0100 },
	UNRECOGNIZED_TOKEN: LocalErrorType = { name: "SyntaxError", code: 0x0200 },
	INVALID_IDENTIFIER: LocalErrorType = { name: "SyntaxError", code: 0x0201 },
	GENERIC_SYNTAX_ERROR: LocalErrorType = { name: "SyntaxError", code: 0x0202 },
	UNEXPECTED_END_OF_LINE: LocalErrorType = { name: "SyntaxError", code: 0x0203 },
	UNEXPECTED_TOKEN: LocalErrorType = { name: "SyntaxError", code: 0x0204 },
	INDENTATION_ERROR: LocalErrorType = { name: "SyntaxError", code: 0x0205 },
	REDEFINITON: LocalErrorType = { name: "SymbolError", code: 0x0300 },
	SYMBOL_NOT_DEFINED: LocalErrorType = { name: "SymbolError", code: 0x0301 },
	LOCAL_SYMBOL_ACCESS: LocalErrorType = { name: "SymbolError", code: 0x0302 },
	$_REFERENCE_TO_NULL: LocalErrorType = { name: "ReferenceError", code: 0x0400 },
	UNDEFINED_PTR_REFERENCE: LocalErrorType = { name: "ReferenceError", code: 0x0401 },
	INVALID_LABEL_ORIGIN: LocalErrorType = { name: "ReferenceError", code: 0x0402 },
	LABEL_ORIGIN_OVERLAP: LocalErrorType = { name: "ReferenceError", code: 0x0403 },
	VALUE_SIZE_OVERFLOW: LocalErrorType = { name: "ValueError", code: 0x500 },
	UNRECOGNIZED_ADDRESSING_MODE: LocalErrorType = { name: "ValueError", code: 0x501 },
	FS_ERROR: LocalErrorType = { name: "FSError", code: 0x0600 }

export type Error = {
	type: LocalErrorType,
	message: string,
	otherInfo: false,
	// fromLine?: number | undefined,
	// fromColumn?: number | undefined,
	// toLine?: number | undefined,
	// toColumn?: number | undefined,
	// source?: string | undefined,
	moduleName?: string | undefined
} | {
	type: LocalErrorType,
	message: string,
	otherInfo: true,
	fromLine: number,
	fromColumn: number,
	toLine: number,
	toColumn: number,
	sourceLines: string[],
	moduleName: string | undefined
}

export type Note = {
	message: string,
	otherInfo: false,
	moduleName?: string | undefined
} | {
	message: string,
	otherInfo: true,
	fromLine: number,
	fromColumn: number,
	toLine: number,
	toColumn: number,
	sourceLines: string[],
	moduleName: string | undefined
}

export function note(note: Note) {
	let module = "_main";
	if (note.moduleName !== undefined) module = note.moduleName;
	let noteString =
		`
> ${"Note".cyan}${note.otherInfo ? " @ line: " + note.fromLine.toString().cyan + ", column: " + note.fromColumn.toString().cyan : ""}, module: ${module.green}:
	${note.message}

`;
	if (note.otherInfo) {
		if (note.sourceLines.length == 1) {

			noteString += `\t${(note.fromLine).toString().cyan} | `;
			for (let i = 0; i < note.sourceLines[0].length; i++) {
				if (i < note.fromColumn - 1 || i > note.toColumn) noteString += note.sourceLines[0][i];
				else noteString += note.sourceLines[0][i].cyan;
			}

		} else {

			for (let i = 0; i < note.sourceLines.length; i++) {
				noteString += `\t${(i + note.fromLine).toString().cyan} | `;
				if (i == 0) {
					for (let j = 0; j < note.sourceLines[i].length; j++) {
						if (j < note.fromColumn) noteString += note.sourceLines[i][j];
						else noteString += note.sourceLines[i][j].cyan;
					}
				} else if (i == note.sourceLines.length - 1) {
					for (let j = 0; j < note.sourceLines[i].length; j++) {
						if (j > note.toColumn) noteString += note.sourceLines[i][j];
						else noteString += note.sourceLines[i][j].cyan;
					}
				} else {
					noteString += note.sourceLines[i].cyan
				}
			}

		}
	}

	console.log(noteString);
}

export function print(err: Error) {
	let fixedDigitCode = err.type.code.toString();
	while (fixedDigitCode.length < 5) fixedDigitCode = "0" + fixedDigitCode;
	let module = "_main";
	if (err.moduleName !== undefined) module = err.moduleName;
	let errorString =
		`
> ${("ERR" + fixedDigitCode).yellow} ${err.type.name.red}${err.otherInfo ? " @ line: " + err.fromLine.toString().cyan + ", column: " + err.fromColumn.toString().cyan : ""}, module: ${module.green}:
	${err.message}

`;
	if (err.otherInfo) {
		if (err.sourceLines.length == 1) {

			errorString += `\t${(err.fromLine).toString().cyan} | `;
			for (let i = 0; i < err.sourceLines[0].length; i++) {
				if (i < err.fromColumn - 1 || i > err.toColumn) errorString += err.sourceLines[0][i];
				else errorString += err.sourceLines[0][i].red;
			}

		} else {

			for (let i = 0; i < err.sourceLines.length; i++) {
				errorString += `\t${(i + err.fromLine).toString().cyan} | `;
				if (i == 0) {
					for (let j = 0; j < err.sourceLines[i].length; j++) {
						if (j < err.fromColumn) errorString += err.sourceLines[i][j];
						else errorString += err.sourceLines[i][j].red;
					}
				} else if (i == err.sourceLines.length - 1) {
					for (let j = 0; j < err.sourceLines[i].length; j++) {
						if (j > err.toColumn) errorString += err.sourceLines[i][j];
						else errorString += err.sourceLines[i][j].red;
					}
				} else {
					errorString += err.sourceLines[i].red
				}
			}

		}
	}

	console.error(errorString);
}

export function printExit(err: Error) {
	print(err);
	exit(1);
}

export function printStackExit(errs: Error[]) {
	console.error("Found " + errs.length.toString().red + (errs.length == 1 ? " error" : " errors"));

	errs.forEach(err => {
		print(err);
		console.error("______________________________________________");
	});

	console.error("Found " + errs.length.toString().red + (errs.length == 1 ? " error" : " errors"));

	exit(1);
}

export function lineToString(line: Line): string {
	let str = "";
	for (let i = 0; i < line.indentLevel; i++) str += "\t";
	line.tokens.forEach(tk => str += tk.value + " ");
	return str;
}