import { symbolToString } from "./debug";
import { evalExpressions } from "./expressions";
import { INDENTATION_ERROR, lineToString, printExit, Error, REDEFINITION, GENERIC_SYNTAX_ERROR, $_REFERENCE_TO_NULL, FILE_NOT_FOUND } from "./localError";
import { matchRule, matchRules } from "./rules";
import { getSymbol, symbolTable } from "./symbols";
import { Label, Line, Rule, RuleInterface, Token } from "./types";
import path from "path";
import * as mod from "./files";
import { parse } from "./parser";
import fs from "fs";

let stdcall = false;

// handlers
function useId(tokens: Token[], scope: string[], source: Line[], line: Line) {
	let sym = getSymbol(tokens[0].value);
	if (sym !== null) {
		let sLine = "";
		for (let line of source) {
			if (line.lineNumber === line.lineNumber) {
				sLine = lineToString(line);
			}
		}
		const err: Error = {
			type: REDEFINITION,
			message: "Redefinition of " + symbolToString(sym),
			otherInfo: true,
			fromColumn: 1,
			toColumn: 100,
			fromLine: line.lineNumber,
			toLine: line.lineNumber,
			moduleName: line.fromModule,
			sourceLines: [sLine]
		}
		printExit(err);
	}
	symbolTable.push({
		name: tokens[0].value,
		type: "number",
		value: "0",
		scope: scope,
		isConst: true
	});

	let last: string = null;
	source.forEach(line => {
		line.tokens.forEach(tk => {
			if (tk.type === "identifier" && tk.value === tokens[0].value) {
				if (!(last === "used" || last === "use")) {
					tk.type = "number";
					tk.value = "0";
				}
			}
			last = tk.value;
		})
	});
}

function useAs(tokens: Token[], scope: string[], source: Line[], line: Line) {
	let sym = getSymbol(tokens[0].value);
	if (sym !== null) {
		let sLine = "";
		for (let ln of source) {
			if (ln.lineNumber === line.lineNumber) {
				sLine = lineToString(line);
			}
		}
		const err: Error = {
			type: REDEFINITION,
			message: "Redefinition of " + symbolToString(sym),
			otherInfo: true,
			fromColumn: 1,
			toColumn: 100,
			fromLine: line.lineNumber,
			toLine: line.lineNumber,
			moduleName: line.fromModule,
			sourceLines: [sLine]
		}
		printExit(err);
	}
	symbolTable.push({
		name: tokens[0].value,
		type: tokens[1].type === "string" ? "string" : "number",
		value: tokens[1].value,
		scope: scope,
		isConst: true
	});

	let last: string = null;
	source.forEach(line => {
		line.tokens.forEach(tk => {
			if (tk.type === "identifier" && tk.value === tokens[0].value) {
				if (!(last === "used" || last === "use")) {
					tk.type = tokens[1].type === "string" ? "string" : "number";
					tk.value = tokens[1].value;
				}
			}
			last = tk.value;
		})
	});
}

function useStdcall() {
	stdcall = true;
}

function removeNextEndif(lines: Line[], scope: string[], lineNumberStart: number, removeTillNextEndif = false) {
	let i = 0;
	for (; i < lines.length; i++) {
		if (lines[i].lineNumber === lineNumberStart && (lines[i].fromModule === undefined || scope[0] === lines[i].fromModule)) {
			lines.splice(i, 1);
			break;
		}
	}
	let endifCount = 0;
	for (; i < lines.length;) {
		if (lines[i].tokens.length > 0 && lines[i].tokens[0].value === "endif") {
			if (endifCount === 0) {
				lines.splice(i, 1);
				break;
			}
			endifCount--;
		}
		if (lines[i].tokens.length > 0 && lines[i].tokens[0].value === "elif") {
			if (endifCount === 0) {
				let rule = matchRules(lines[i], preProcessorRules);
				if (removeTillNextEndif)
					rule.handleRule(rule.args, scope, lines, lines[i]);
				else
					removeNextEndif(lines, scope, lines[i].lineNumber, true);
				break;
			}
		}
		else if (lines[i].tokens.length > 0 && lines[i].tokens[0].value === "if") {
			endifCount++;
		}
		if (removeTillNextEndif) lines.splice(i, 1);
		else i++;
	}

}

function ifUsed(tokens: Token[], scope: string[], source: Line[], line: Line) {
	if (getSymbol(tokens[0].value) === null) {
		removeNextEndif(source, scope, line.lineNumber, true);
	} else {
		removeNextEndif(source, scope, line.lineNumber)
	}
}

function ifNotUsed(tokens: Token[], scope: string[], source: Line[], line: Line) {
	if (getSymbol(tokens[0].value) !== null) {
		removeNextEndif(source, scope, line.lineNumber, true);
	} else {
		removeNextEndif(source, scope, line.lineNumber);
	}
}

function ifUsedStdcall(tokens: Token[], scope: string[], source: Line[], line: Line) {
	if (!stdcall) {
		removeNextEndif(source, scope, line.lineNumber);
	} else {
		removeNextEndif(source, scope, line.lineNumber, false);
	}
}

function ifNotUsedStdcall(tokens: Token[], scope: string[], source: Line[], line: Line) {
	if (stdcall) {
		removeNextEndif(source, scope, line.lineNumber);
	} else {
		removeNextEndif(source, scope, line.lineNumber, false);
	}
}

function importHandler(tokens: Token[], scope: string[], source: Line[], line: Line) {
	let p: string;
	if (tokens[0].type === "identifier")
		p = path.resolve(mod.getCWD() + "\\" + tokens[0].value + ".anc16");
	else
		p = path.resolve(mod.getCWD() + "\\" + tokens[0].value.substring(1, tokens[0].value.length - 1));

	if (!fs.existsSync(p)) {
		const err: Error = {
			type: FILE_NOT_FOUND,
			message: "The module '" + path.basename(p) + "' was not found",
			otherInfo: true,
			fromColumn: 0,
			toColumn: 100,
			fromLine: line.lineNumber,
			toLine: line.lineNumber,
			moduleName: line.fromModule,
			sourceLines: [lineToString(source[line.lineNumber - 1])]
		};
		printExit(err);
	}
	if (mod.modulePoolContains(p)) return;
	let sourceString = mod.read(p);
	mod.appendModule(p);
	let modLines = parse(sourceString, path.parse(p).name);

	let last: string = null;
	source.forEach(line => {
		line.tokens.forEach(tk => {
			symbolTable.forEach(symbol => {
				if (tk.type === "identifier" && tk.value === symbol.name) {
					if (!(last === "used" || last === "use")) {
						tk.type = symbol.type;
						tk.value = symbol.value;
					}
				}
				last = tk.value;
			});
		});
	});

	modLines.forEach(line => {
		source.push(line);
	});
}

const importRule: RuleInterface = {
	name: "import",
	rule: [
		{ genericToken: false, value: "import" },
		{ genericToken: true, tokenTypes: ["identifier"], isArgument: true }
	],
	onlyFor: "import",
	handleRule: importHandler
};


const preProcessorRules: RuleInterface[] = [
	{
		name: "use",
		rule: [
			{ genericToken: false, value: "use" },
			{ genericToken: true, tokenTypes: ["identifier"], isArgument: true }
		],
		onlyFor: "use",
		handleRule: useId
	},
	{
		name: "useAs",
		rule: [
			{ genericToken: false, value: "use" },
			{ genericToken: true, tokenTypes: ["identifier"], isArgument: true },
			{ genericToken: false, value: "as" },
			{ genericToken: true, tokenTypes: ["string", "number"], isArgument: true },
		],
		onlyFor: "use",
		handleRule: useAs
	},
	{
		name: "use",
		rule: [
			{ genericToken: false, value: "use" },
			{ genericToken: false, value: "stdcall" }
		],
		onlyFor: "use",
		handleRule: useStdcall
	},
	{
		name: "ifUsed",
		rule: [
			{ genericToken: false, value: "if" },
			{ genericToken: false, value: "used" },
			{ genericToken: true, tokenTypes: ["identifier"], isArgument: true },
		],
		onlyFor: "if",
		handleRule: ifUsed
	},
	{
		name: "ifUsedStdcall",
		rule: [
			{ genericToken: false, value: "if" },
			{ genericToken: false, value: "used" },
			{ genericToken: false, value: "stdcall" },
		],
		onlyFor: "if",
		handleRule: ifUsedStdcall
	},
	{
		name: "ifNotUsed",
		rule: [
			{ genericToken: false, value: "if" },
			{ genericToken: false, value: "not" },
			{ genericToken: false, value: "used" },
			{ genericToken: true, tokenTypes: ["identifier"], isArgument: true },
		],
		onlyFor: "if",
		handleRule: ifNotUsed
	},
	{
		name: "ifNotUsedStdcall",
		rule: [
			{ genericToken: false, value: "if" },
			{ genericToken: false, value: "not" },
			{ genericToken: false, value: "used" },
			{ genericToken: false, value: "stdcall" },
		],
		onlyFor: "if",
		handleRule: ifNotUsedStdcall
	},
	{
		name: "elifUsed",
		rule: [
			{ genericToken: false, value: "elif" },
			{ genericToken: false, value: "used" },
			{ genericToken: true, tokenTypes: ["identifier"], isArgument: true },
		],
		onlyFor: "elif",
		handleRule: ifUsed
	},
	{
		name: "elifUsedStdcall",
		rule: [
			{ genericToken: false, value: "elif" },
			{ genericToken: false, value: "used" },
			{ genericToken: false, value: "stdcall" },
		],
		onlyFor: "elif",
		handleRule: ifUsedStdcall
	},
	{
		name: "elifNotUsed",
		rule: [
			{ genericToken: false, value: "elif" },
			{ genericToken: false, value: "not" },
			{ genericToken: false, value: "used" },
			{ genericToken: true, tokenTypes: ["identifier"], isArgument: true },
		],
		onlyFor: "elif",
		handleRule: ifNotUsed
	},
	{
		name: "elifNotUsedStdcall",
		rule: [
			{ genericToken: false, value: "if" },
			{ genericToken: false, value: "not" },
			{ genericToken: false, value: "used" },
			{ genericToken: false, value: "stdcall" },
		],
		onlyFor: "elif",
		handleRule: ifNotUsedStdcall
	},
]

// --- PRE PROCESS FUNCTION ---
export function preProcess(lines: Line[], module: string) {
	let rules: Rule[];
	rules = [];
	// check import rule
	lines.forEach(line => {
		let rule = matchRule(line, importRule);
		if (rule != null)
			rules.push(rule);
	});
	rules.forEach(rule => {
		rule.handleRule(rule.args, [module], lines, rule.line);
		for (let i = 0; i < lines.length; i++) {
			if (rule.line === lines[i])
				lines.splice(i, 1);
		}
	});

	rules = [];

	evalExpressions(lines);

	// check pre processor rules
	lines.forEach(line => {
		let rule = matchRules(line, preProcessorRules);
		if (rule !== null)
			rules.push(rule);
	});
	rules.forEach(rule => {
		rule.handleRule(rule.args, [module], lines, rule.line);
		for (let i = 0; i < lines.length; i++) {
			if (rule.line === lines[i])
				lines.splice(i, 1);
		}
	});

	rules = [];

	evalExpressions(lines);
}
// --- ---



// -------------------------------------- MACROS --------------------------------------


function getTillIndetation(lines: Line[], scope: string[], lineNumberStart: number) {
	let i = 0;
	let indentationLevel;
	let retLines: Line[];
	retLines = [];

	for (; i < lines.length; i++) {
		if (lines[i].lineNumber === lineNumberStart && (lines[i].fromModule === undefined || scope[0] === lines[i].fromModule)) {
			indentationLevel = lines[i].indentLevel;
			lines.splice(i, 1);
			break;
		}
	}

	for (; i < lines.length;) {
		if (lines[i].indentLevel <= indentationLevel) break;
		retLines.push(lines[i]);
		lines.splice(i, 1);
	}

	return retLines;
}

const orgRule: RuleInterface = {
	name: "org",
	rule: [
		{ genericToken: false, value: "org" },
		{ genericToken: true, tokenTypes: ["number"], isArgument: true }
	],
	onlyFor: "org",
	handleRule: getOrg
}

function getOrg(tokens: Token[], scope: string[], source: Line[], line: Line) {
	return Number.parseInt(tokens[0].value);
}

function label(tokens: Token[], scope: string[], source: Line[], line: Line) {
	let i = 0;
	let address: number | "unresolved" = "unresolved";
	for (; i < source.length; i++) if (source[i] === line) break;
	if (i !== 0) {
		let rule = matchRule(source[i - 1], orgRule);
		if (rule != null) {
			address = rule.handleRule(rule.args, scope, source, source[i - 1]);
			source.splice(i - 1, 1);
		}
	}
	let lines = getTillIndetation(source, scope, line.lineNumber);
	let lbl: Label = {
		name: tokens[0].value,
		code: lines,
		data: [],
		binary: new Uint8Array,
		subLabels: [],
		isLocal: false,
		size: "unresolved",
		address: address,
		scope: scope
	};
	return lbl;
}

function localLabel(tokens: Token[], scope: string[], source: Line[], line: Line) {
	let i = 0;
	let address: number | "unresolved" = "unresolved";
	for (; i < source.length; i++) if (source[i] === line) break;
	if (i !== 0) {
		let rule = matchRule(source[i - 1], orgRule);
		if (rule != null) {
			address = rule.handleRule(rule.args, scope, source, source[i - 1]);
			source.splice(i - 1, 1);
		}
	}
	let lines = getTillIndetation(source, scope, line.lineNumber);
	let lbl: Label = {
		name: tokens[0].value,
		code: lines,
		data: [],
		binary: new Uint8Array,
		subLabels: [],
		isLocal: true,
		size: "unresolved",
		address: address,
		scope: scope
	};
	return lbl;
}

const labelRules: RuleInterface[] = [
	{
		name: "labelDeclaration",
		rule: [
			{ genericToken: true, tokenTypes: ["identifier"], isArgument: true },
			{ genericToken: false, value: ":" }
		],
		handleRule: label
	},
	{
		name: "globalLabelDeclaration",
		rule: [
			{ genericToken: false, value: "global" },
			{ genericToken: true, tokenTypes: ["identifier"], isArgument: true },
			{ genericToken: false, value: ":" }
		],
		handleRule: label
	},
	{
		name: "localLabelDeclaration",
		rule: [
			{ genericToken: false, value: "local" },
			{ genericToken: true, tokenTypes: ["identifier"], isArgument: true },
			{ genericToken: false, value: ":" }
		],
		handleRule: localLabel
	}
];

function newLineAfterLabel(lines: Line[]) {
	for (let i = 0; i < lines.length; i++) {
		let line = lines[i];
		let j;
		for (j = 0; j < line.tokens.length; j++) {
			if (line.tokens[j].value === ":") break;
		}

		let tokens: Token[] = [];
		for (j++; j < line.tokens.length;) {
			tokens.push(line.tokens[j]);
			line.tokens.splice(j, 1);
		}
		if (tokens.length !== 0)
			lines.splice(i + 1, 0, {
				lineNumber: line.lineNumber,
				fromModule: line.fromModule,
				tokens: tokens,
				indentLevel: line.indentLevel + 1
			});
	}

}

export function getLabels(lines: Line[]): Label[] {
	newLineAfterLabel(lines);
	let rules: Rule[];
	let labels: Label[];
	rules = [];
	labels = [];
	// check import rule
	lines.forEach(line => {
		let rule = matchRules(line, labelRules);
		if (rule != null && line.indentLevel === 0)
			rules.push(rule);
	});
	rules.forEach(rule => {
		labels.push(<Label>rule.handleRule(rule.args, [rule.line.fromModule === undefined ? "_main" : rule.line.fromModule], lines, rule.line));
		for (let i = 0; i < lines.length; i++) {
			if (rule.line === lines[i])
				lines.splice(i, 1);
		}
	});

	// check for sub labels
	labels.forEach(lbl => {
		rules = [];
		lbl.code.forEach(line => {
			let rule = matchRules(line, labelRules);
			if (rule != null)
				rules.push(rule);
		});
		rules.forEach(rule => {
			let l = <Label>rule.handleRule(rule.args, [rule.line.fromModule === undefined ? "_main" : rule.line.fromModule], lbl.code, rule.line);
			l.scope.push(lbl.name);
			lbl.subLabels.push(l);
			for (let i = 0; i < lines.length; i++) {
				if (rule.line === lines[i])
					lines.splice(i, 1);
			}
		});
	})

	lines.forEach(line => {
		if (line.tokens.length > 0) {
			const err: Error = {
				type: INDENTATION_ERROR,
				message: "Expected and indented block",
				otherInfo: true,
				fromColumn: 0,
				toColumn: 100,
				fromLine: line.lineNumber,
				toLine: line.lineNumber,
				moduleName: line.fromModule,
				sourceLines: [lineToString(line)]
			};
			printExit(err);
		}
	})
	return labels;
}