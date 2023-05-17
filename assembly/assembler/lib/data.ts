import { Addressing, getOpcode } from "./isa";
import { UNRECOGNIZED_ADDRESSING_MODE, lineToString, printExit, VALUE_SIZE_OVERFLOW, Error } from "./localError";
import { Line, Data, RuleInterface, Token, Label } from "./types";

const LINE_PADDING_BYTE_OFFSET = 100000;
const CALL_MACRO = `
PSH
JMP __ref__
`;
const SYSCALL_MACRO = `
LDAL # BYTE __ref__
SYS
`;
const STD_SYSCALLS = {
	exit: 0,
	fopen: 1,
	fclose: 2,
	fread: 3,
	fwrite: 4,
	print: 5,
	getl: 6, 
	wait: 7,
	listenKey: 8,
	requestPrivileges: 9,
	malloc: 10,
	dealloc: 11,
	mkdir: 12,
	rm: 13
}

function getSyscall(syscall: string): number {
	for (let s in STD_SYSCALLS) {
		if (s === syscall.toLowerCase()) return (STD_SYSCALLS as any)[s]
	}
	return -1;
}

function fits16bit(value: number) {
	return (
		value == 0 ||
		value < 0 && ((~value) & 0xFFFF) === ~value ||
		(value & 0xFFFF) === value
	)
}

function fits8bit(value: number) {
	return (
		value == 0 ||
		value < 0 && ((~value) & 0xFF) === ~value ||
		(value & 0xFF) === value
	)
}

function opcode(mnemonic: string, addressing: Addressing, line: Line | null): number {
	let opc = getOpcode(mnemonic, addressing);
	if (opc === null) {
		const err: Error = {
			type: UNRECOGNIZED_ADDRESSING_MODE,
			message: `'${mnemonic}' does not support '${addressing}' addressing mode`,
			otherInfo: true,
			fromColumn: 0,
			fromLine: line == null ? 0 : line.lineNumber,
			toColumn: 100,
			toLine: line == null ? 0 : line.lineNumber,
			sourceLines: line == null ? [] : [lineToString(line)],
			moduleName: line == null ? "" : line.fromModule
		};
		printExit(err);
	}
	return opc;
}

function absolute(tokens: Token[], scope: string[], source: Line[], line: Line): Data[] {
	let opc = opcode(tokens[0].value, "absolute", line);
	return [
		{
			token: tokens[0],
			position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[0].column,
			resolve: "value",
			value: opc,
			size: 2,
			forced: true
		},
		tokens[1].type === "identifier" ?
			{
				token: tokens[1],
				position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
				resolve: "symbol",
				symbol: tokens[1].value,
				reference: "absolute",
				size: 2
			}
			:
			{
				token: tokens[1],
				position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
				resolve: "value",
				value: toNumber(tokens[1].value),
				size: 2,
				forced: true
			}
	];
}

function absoluteIndexed(tokens: Token[], scope: string[], source: Line[], line: Line): Data[] {
	let opc = opcode(tokens[0].value, "absoluteIndexed", line);
	return [
		{
			token: tokens[0],
			position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[0].column,
			resolve: "value",
			value: opc,
			size: 2,
			forced: true
		},
		tokens[1].type === "identifier" ?
			{
				token: tokens[1],
				position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
				resolve: "symbol",
				reference: "absolute",
				symbol: tokens[1].value,
				size: 2
			}
			:
			{
				token: tokens[1],
				position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
				resolve: "value",
				value: toNumber(tokens[1].value),
				size: 2,
				forced: true
			}
	];
}

function accumulatorHighRegister(tokens: Token[], scope: string[], source: Line[], line: Line): Data[] {
	let opc = opcode(tokens[0].value, "accumulatorHighRegister", line);
	return [{
		token: tokens[0],
		position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[0].column,
		resolve: "value",
		value: opc,
		size: 2,
		forced: true
	}];
}

function accumulatorLowRegister(tokens: Token[], scope: string[], source: Line[], line: Line): Data[] {
	let opc = opcode(tokens[0].value, "accumulatorLowRegister", line);
	return [{
		token: tokens[0],
		position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[0].column,
		resolve: "value",
		value: opc,
		size: 2,
		forced: true
	}];
}

function accumulatorRegister(tokens: Token[], scope: string[], source: Line[], line: Line): Data[] {
	let opc = opcode(tokens[0].value, "accumulatorRegister", line);
	return [{
		token: tokens[0],
		position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[0].column,
		resolve: "value",
		value: opc,
		size: 2,
		forced: true
	}];
}

function baseHighRegister(tokens: Token[], scope: string[], source: Line[], line: Line): Data[] {
	let opc = opcode(tokens[0].value, "baseHighRegister", line);
	return [{
		token: tokens[0],
		position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[0].column,
		resolve: "value",
		value: opc,
		size: 2,
		forced: true
	}];
}

function baseLowRegister(tokens: Token[], scope: string[], source: Line[], line: Line): Data[] {
	let opc = opcode(tokens[0].value, "baseLowRegister", line);
	return [{
		token: tokens[0],
		position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[0].column,
		resolve: "value",
		value: opc,
		size: 2,
		forced: true
	}];
}

function baseRegister(tokens: Token[], scope: string[], source: Line[], line: Line): Data[] {
	let opc = opcode(tokens[0].value, "baseRegister", line);
	return [{
		token: tokens[0],
		position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[0].column,
		resolve: "value",
		value: opc,
		size: 2,
		forced: true
	}];
}

function indexRegister(tokens: Token[], scope: string[], source: Line[], line: Line): Data[] {
	let opc = opcode(tokens[0].value, "indexRegister", line);
	return [{
		token: tokens[0],
		position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[0].column,
		resolve: "value",
		value: opc,
		size: 2,
		forced: true
	}];
}

function relative(tokens: Token[], scope: string[], source: Line[], line: Line): Data[] {
	let opc = opcode(tokens[0].value, "relative", line);
	return [
		{
			token: tokens[0],
			position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[0].column,
			resolve: "value",
			value: opc,
			size: 2,
			forced: true
		},
		tokens[1].type === "identifier" ?
			{
				token: tokens[1],
				position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
				resolve: "symbol",
				symbol: tokens[1].value,
				reference: "relative",
				size: 1,
			}
			:
			{
				token: tokens[1],
				position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
				resolve: "value",
				value: toNumber(tokens[1].value),
				size: 1,
				forced: true
			}
	];
}

function relativeUsingJ(tokens: Token[], scope: string[], source: Line[], line: Line): Data[] {
	let opc = opcode(tokens[0].value, "relativeUsingJ", line);
	return [{
		token: tokens[0],
		position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[0].column,
		resolve: "value",
		value: opc,
		size: 2,
		forced: true
	}];
}

function immediate(tokens: Token[], scope: string[], source: Line[], line: Line): Data[] {
	return [
		{
			token: tokens[0],
			position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[0].column,
			resolve: "instruction",
			instruction: tokens[0].value,
			size: 2,
		},
		tokens[1].type === "identifier" ?
			{
				token: tokens[1],
				position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
				resolve: "symbol",
				symbol: tokens[1].value,
				reference: "absolute",
				size: 2
			}
			:
			{
				token: tokens[1],
				position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
				resolve: "value",
				value: toNumber(tokens[1].value),
				size: 2,
				forced: false
			}
	];
}

function implied(tokens: Token[], scope: string[], source: Line[], line: Line): Data[] {
	let opc = opcode(tokens[0].value, "implied", line);
	return [{
		token: tokens[0],
		position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[0].column,
		resolve: "value",
		value: opc,
		size: 2,
		forced: true
	}];
}

function indirect(tokens: Token[], scope: string[], source: Line[], line: Line): Data[] {
	let opc = opcode(tokens[0].value, "indirect", line);
	return [
		{
			token: tokens[0],
			position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[0].column,
			resolve: "value",
			value: opc,
			size: 2,
			forced: true
		},
		tokens[1].type === "identifier" ?
			{
				token: tokens[1],
				position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
				resolve: "symbol",
				symbol: tokens[1].value,
				reference: "absolute",
				size: 2
			}
			:
			{
				token: tokens[1],
				position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
				resolve: "value",
				value: toNumber(tokens[1].value),
				size: 2,
				forced: true
			}
	];
}

function indirectIndexed(tokens: Token[], scope: string[], source: Line[], line: Line): Data[] {
	let opc = opcode(tokens[0].value, "indirectIndexed", line);
	return [
		{
			token: tokens[0],
			position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[0].column,
			resolve: "value",
			value: opc,
			size: 2,
			forced: true
		},
		tokens[1].type === "identifier" ?
			{
				token: tokens[1],
				position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
				resolve: "symbol",
				reference: "absolute",
				symbol: tokens[1].value,
				size: 2
			}
			:
			{
				token: tokens[1],
				position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
				resolve: "value",
				value: toNumber(tokens[1].value),
				size: 2,
				forced: true
			}
	];
}

function zeroPage(tokens: Token[], scope: string[], source: Line[], line: Line): Data[] {
	let opc = opcode(tokens[0].value, "zeroPage", line);
	if (tokens[1].type === "number") {
		if (!fits8bit(toNumber(tokens[1].value))) {
			const err: Error = {
				type: VALUE_SIZE_OVERFLOW,
				message: "Zero page addrressing accepts 1 bytes pointers only",
				otherInfo: true,
				fromColumn: 0,
				toColumn: 100,
				fromLine: line.lineNumber,
				toLine: line.lineNumber,
				sourceLines: [lineToString(line)],
				moduleName: line.fromModule
			}
			printExit(err);
		}
	}
	return [
		{
			token: tokens[0],
			position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[0].column,
			resolve: "value",
			value: opc,
			size: 2,
			forced: true
		},
		tokens[1].type === "identifier" ?
			{
				token: tokens[1],
				position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
				resolve: "symbol",
				reference: "zeroPage",
				symbol: tokens[1].value,
				size: 2
			}
			:
			{
				token: tokens[1],
				position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
				resolve: "value",
				value: toNumber(tokens[1].value),
				size: 1,
				forced: true
			}
	];
}

function zeroPageIndexed(tokens: Token[], scope: string[], source: Line[], line: Line): Data[] {
	let opc = opcode(tokens[0].value, "zeroPageIndexed", line);
	if (tokens[1].type === "number") {
		if (!fits8bit(toNumber(tokens[1].value))) {
			const err: Error = {
				type: VALUE_SIZE_OVERFLOW,
				message: "Zero page addrressing accepts 1 bytes pointers only",
				otherInfo: true,
				fromColumn: 0,
				toColumn: 100,
				fromLine: line.lineNumber,
				toLine: line.lineNumber,
				sourceLines: [lineToString(line)],
				moduleName: line.fromModule
			}
			printExit(err);
		}
	}
	return [
		{
			token: tokens[0],
			position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[0].column,
			resolve: "value",
			value: opc,
			size: 2,
			forced: true
		},
		tokens[1].type === "identifier" ?
			{
				token: tokens[1],
				position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
				resolve: "symbol",
				reference: "zeroPage",
				symbol: tokens[1].value,
				size: 2
			}
			:
			{
				token: tokens[1],
				position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
				resolve: "value",
				value: toNumber(tokens[1].value),
				size: 1,
				forced: true
			}
	];
}

const addressingRules: RuleInterface[] = [
	{
		name: "accumulatorHighRegister",
		rule: [
			{ genericToken: true, tokenTypes: ["instruction"], isArgument: true },
			{ genericToken: false, value: "ah" }
		],
		handleRule: accumulatorHighRegister
	},
	{
		name: "accumulatorLowRegister",
		rule: [
			{ genericToken: true, tokenTypes: ["instruction"], isArgument: true },
			{ genericToken: false, value: "al" }
		],
		handleRule: accumulatorLowRegister
	},
	{
		name: "accumulatorRegister",
		rule: [
			{ genericToken: true, tokenTypes: ["instruction"], isArgument: true },
			{ genericToken: false, value: "a" }
		],
		handleRule: accumulatorRegister
	},
	{
		name: "baseHighRegister",
		rule: [
			{ genericToken: true, tokenTypes: ["instruction"], isArgument: true },
			{ genericToken: false, value: "bh" }
		],
		handleRule: baseHighRegister
	},
	{
		name: "baseLowRegister",
		rule: [
			{ genericToken: true, tokenTypes: ["instruction"], isArgument: true },
			{ genericToken: false, value: "bl" }
		],
		handleRule: baseLowRegister
	},
	{
		name: "baseRegister",
		rule: [
			{ genericToken: true, tokenTypes: ["instruction"], isArgument: true },
			{ genericToken: false, value: "b" }
		],
		handleRule: baseRegister
	},
	{
		name: "indexRegister",
		rule: [
			{ genericToken: true, tokenTypes: ["instruction"], isArgument: true },
			{ genericToken: false, value: "i" }
		],
		handleRule: indexRegister
	},
	{
		name: "relative",
		rule: [
			{ genericToken: true, tokenTypes: ["instruction"], isArgument: true },
			{ genericToken: false, value: "*" },
			{ genericToken: true, tokenTypes: ["identifier", "number"], isArgument: true }
		],
		handleRule: relative
	},
	{
		name: "relativeUsingJ",
		rule: [
			{ genericToken: true, tokenTypes: ["instruction"], isArgument: true },
			{ genericToken: false, value: "*" },
			{ genericToken: false, value: "j" },
		],
		handleRule: relativeUsingJ
	},
	{
		name: "immediate",
		rule: [
			{ genericToken: true, tokenTypes: ["instruction"], isArgument: true },
			{ genericToken: false, value: "#" },
			{ genericToken: true, tokenTypes: ["identifier", "number"], isArgument: true }
		],
		handleRule: immediate
	},
	{
		name: "indirect",
		rule: [
			{ genericToken: true, tokenTypes: ["instruction"], isArgument: true },
			{ genericToken: false, value: "[" },
			{ genericToken: true, tokenTypes: ["identifier", "number"], isArgument: true },
			{ genericToken: false, value: "]" },
		],
		handleRule: indirect
	},
	{
		name: "indirectIndexed",
		rule: [
			{ genericToken: true, tokenTypes: ["instruction"], isArgument: true },
			{ genericToken: false, value: "[" },
			{ genericToken: true, tokenTypes: ["identifier", "number"], isArgument: true },
			{ genericToken: false, value: "]" },
			{ genericToken: false, value: "," },
			{ genericToken: false, value: "i" }
		],
		handleRule: indirectIndexed
	},
	{
		name: "zeroPage",
		rule: [
			{ genericToken: true, tokenTypes: ["instruction"], isArgument: true },
			{ genericToken: false, value: "%" },
			{ genericToken: true, tokenTypes: ["identifier", "number"], isArgument: true },
		],
		handleRule: zeroPage
	},
	{
		name: "zeroPageIndexed",
		rule: [
			{ genericToken: true, tokenTypes: ["instruction"], isArgument: true },
			{ genericToken: false, value: "%" },
			{ genericToken: true, tokenTypes: ["identifier", "number"], isArgument: true },
			{ genericToken: false, value: "," },
			{ genericToken: false, value: "i" }
		],
		handleRule: zeroPageIndexed
	},
	{
		name: "absolute",
		rule: [
			{ genericToken: true, tokenTypes: ["instruction"], isArgument: true },
			{ genericToken: true, tokenTypes: ["identifier", "number"], isArgument: true }
		],
		handleRule: absolute
	},
	{
		name: "absoluteIndexed",
		rule: [
			{ genericToken: true, tokenTypes: ["instruction"], isArgument: true },
			{ genericToken: true, tokenTypes: ["identifier", "number"], isArgument: true },
			{ genericToken: false, value: "," },
			{ genericToken: false, value: "i" },
		],
		handleRule: absoluteIndexed
	},
	{
		name: "implied",
		rule: [
			{ genericToken: true, tokenTypes: ["instruction"], isArgument: true },
		],
		handleRule: implied
	},
];

function toNumber(str: string): number {
	let negative = str.startsWith("-");
	if (negative) str = str.substring(1);
	let value =
		str.startsWith("0b") ?
			Number.parseInt(str.substring(2), 2) :
			str.startsWith("0o") ?
				Number.parseInt(str.substring(2), 8) :
				Number.parseInt(str);
	if (negative) value = -value;
	return value;
}

export function setData(labels: Label[]) {
    
}