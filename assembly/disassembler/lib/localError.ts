import * as colors from "colors";
import { exit } from "process";
colors.enable();

type LocalErrorName = "FileNotFound" | "FileAlreadyExist" | "SyntaxError" | "ReferenceError" | "SymbolError" | "FSError" | "ValueError" | "HeaderError";

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
	FS_ERROR: LocalErrorType = { name: "FSError", code: 0x0600 },
	HEADER_ERROR: LocalErrorType = {name: "HeaderError", code: 0x0700}

export type Error = {
	type: LocalErrorType,
	message: string,
	offset?: number
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

}

export function print(err: Error) {
	let fixedDigitCode = err.type.code.toString();
	while (fixedDigitCode.length < 5) fixedDigitCode = "0" + fixedDigitCode;

	let errorString =
		`
> ${("ERR" + fixedDigitCode).yellow} ${err.type.name.red}${err.offset !== undefined ? " @ offset: " + err.offset.toString().cyan: ""}:
	${err.message}

`;

	console.error(errorString);
}

export function printExit(err: Error) {
	print(err);
	exit(1);
}
