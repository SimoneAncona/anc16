import { Error, printStackExit, printExit, lineToString, UNEXPECTED_END_OF_LINE, UNEXPECTED_TOKEN, GENERIC_SYNTAX_ERROR, SYMBOL_NOT_DEFINED } from "./localError";
import { getSymbol } from "./symbols";
import { Line, Rule, RuleInterface, SyntaxRule, Token } from "./types";

// SYNTAX RULES ----------------------------------------------

export const syntaxRules: SyntaxRule[] = [
	{
		specific: true,
		after: "(",
		canFindOnly: ["number", "identifier"],
		canFindSpecific: ["-", "+", "$", "(", ")"],
		pair: true,
		closure: ")"
	},
	{
		specific: true,
		after: ")",
		canFindOnly: [],
		canFindSpecific: [",", ")", "-", "+", "*", "/", "\n"],
		pair: false
	},
	{
		specific: false,
		after: "number",
		canFindOnly: [],
		canFindSpecific: ["-", "+", "*", "/", "\n", ")", ","],
		pair: false
	},
	{
		specific: true,
		after: "reserve",
		canFindOnly: ["number", "identifier"],
		canFindSpecific: [],
		pair: false
	},
	{
		specific: true,
		after: "word",
		canFindOnly: ["number", "identifier"],
		canFindSpecific: [],
		pair: false
	},
	{
		specific: true,
		after: "byte",
		canFindOnly: ["number", "identifier"],
		canFindSpecific: [],
		pair: false
	},
	{
		specific: true,
		after: "import",
		canFindOnly: ["identifier", "string"],
		canFindSpecific: [],
		pair: false
	},
	{
		specific: true,
		after: "use",
		canFindOnly: ["identifier"],
		canFindSpecific: ["stdcall", "manualcall"],
		pair: false
	},
	{
		specific: true,
		after: "if",
		canFindOnly: [],
		canFindSpecific: ["used", "not"],
		pair: true,
		closure: "endif"
	},
	{
		specific: true,
		after: "used",
		canFindOnly: ["identifier"],
		canFindSpecific: [],
		pair: false
	},
	{
		specific: true,
		after: "not",
		canFindOnly: [],
		canFindSpecific: ["used"],
		pair: false
	},
	{
		specific: true,
		after: "global",
		canFindOnly: ["identifier"],
		canFindSpecific: [],
		pair: false
	},
	{
		specific: true,
		after: "local",
		canFindOnly: ["identifier"],
		canFindSpecific: [],
		pair: false
	},
	{
		specific: true,
		after: "sizeof",
		canFindOnly: ["identifier"],
		canFindSpecific: [],
		pair: false
	},
	{
		specific: true,
		after: "+",
		canFindOnly: ["number", "identifier"],
		canFindSpecific: ["(", "$", "-", "+"],
		pair: false
	},
	{
		specific: true,
		after: "-",
		canFindOnly: ["number", "identifier"],
		canFindSpecific: ["(", "$", "-", "+"],
		pair: false
	},
	{
		specific: true,
		after: "*",
		canFindOnly: ["number", "identifier"],
		canFindSpecific: ["(", "$", "-", "+", "j"],
		pair: false
	},
	{
		specific: true,
		after: "/",
		canFindOnly: ["number", "identifier"],
		canFindSpecific: ["(", "$", "-", "+"],
		pair: false
	},
	{
		specific: true,
		after: "#",
		canFindOnly: ["number", "identifier"],
		canFindSpecific: ["(", "$", "word", "byte", "sizeof"],
		pair: false
	},
	{
		specific: true,
		after: "as",
		canFindOnly: ["number", "identifier"],
		canFindSpecific: ["(", "$", "-", "+"],
		pair: false
	},
	{
		specific: true,
		after: "endif",
		canFindOnly: [],
		canFindSpecific: ["\n"],
		pair: false
	},
	{
		specific: true,
		after: "elif",
		canFindOnly: [],
		canFindSpecific: ["used", "not"],
		pair: true,
		closure: "endif"
	},
	{
		specific: true,
		after: "call",
		canFindOnly: ["identifier"],
		canFindSpecific: [],
		pair: false,
	},
	{
		specific: true,
		after: "syscall",
		canFindOnly: ["identifier"],
		canFindSpecific: [],
		pair: false,
	},
	{
		specific: false,
		after: "instruction",
		canFindOnly: ["number", "identifier"],
		canFindSpecific: ["#", "word", "byte", "\n", "(", "*", "[", "%", "a", "b", "ah", "al", "bh", "bl", "i", "j"],
		pair: false
	}
];

export function checkSyntaxRule(lines: Line[]) {
	let errorStack: Error[];
	errorStack = [];

	for (let line of lines) {
		let tokens = line.tokens;
		for (let i = 0; i < tokens.length; i++) {
			for (let syntaxRule of syntaxRules) {

				if (syntaxRule.specific && syntaxRule.after === tokens[i].value || syntaxRule.after === tokens[i].type) {
					if (i === tokens.length - 1 && !(syntaxRule.canFindSpecific.includes("\n"))) {
						const err: Error = {
							type: UNEXPECTED_END_OF_LINE,
							message: "Unexpected the end of the line",
							otherInfo: true,
							fromColumn: tokens[i].column,
							toColumn: tokens[i].column + tokens[i].value.length,
							fromLine: line.lineNumber,
							toLine: line.lineNumber,
							sourceLines: [lineToString(line)],
							moduleName: line.fromModule
						};
						errorStack.push(err);
					} else {
						let found = false;
						for (let specific of syntaxRule.canFindSpecific) {
							if (tokens.length === i + 1 && specific === "\n") {
								found = true;
								break;
							}
							if (tokens[i + 1] != undefined && specific === tokens[i + 1].value) {
								found = true;
								break;
							}
						}
						if (!found) {
							if (i !== tokens.length - 1) {
								found = false;
								for (let generic of syntaxRule.canFindOnly) {
									if (generic === tokens[i + 1].type) {
										found = true;
										break;
									}
								}
							}
							if (!found) {
								let suggestion = "";
								if (
									(tokens[i + 1].value === "sizeof" || tokens[i + 1].value === "$") &&
									tokens[i].type === "instruction"
								)
									suggestion = ". Did you mean '" + tokens[i].value + " # " + tokens[i + 1].value + "...'?";
								const err: Error = {
									type: UNEXPECTED_TOKEN,
									message: "Unexpected token '" + tokens[i + 1].value + "' after '" + tokens[i].value + "'" + suggestion,
									otherInfo: true,
									fromColumn: tokens[i + 1].column,
									toColumn: tokens[i + 1].column + tokens[i + 1].value.length,
									fromLine: line.lineNumber,
									toLine: line.lineNumber,
									moduleName: line.fromModule,
									sourceLines: [lineToString(line)]
								};
								errorStack.push(err);
							}
						}
					}
				}
			}
		}
	}

	if (errorStack.length !== 0)
		printStackExit(errorStack);
}

export function matchRule(line: Line, ruleInterface: RuleInterface): Rule | null {
	if (line.tokens.length == 0) return null;

	let match = true;
	let i = 0;
	let args: Token[];

	args = [];

	// match the rule
	if (ruleInterface.rule.length === line.tokens.length) {	// match the length
		ruleInterface.rule.forEach(expression => {
			if (expression.genericToken) {
				if (!expression.tokenTypes.includes(line.tokens[i].type)) {
					match = false;
				}
				if (expression.isArgument) {
					args.push({
						type: line.tokens[i].type,
						column: line.tokens[i].column,
						value: line.tokens[i].value
					});
				}
			} else {
				if (expression.value !== line.tokens[i].value) {
					match = false;
				}
			}
			i++;
		});
	} else match = false;

	if (match) {
		return {
			name: ruleInterface.name,
			args: args,
			line: line,
			handleRule: ruleInterface.handleRule
		}
	}

	if ("onlyFor" in ruleInterface) {
		if (line.tokens[0].value === ruleInterface.onlyFor) {
			handleGenericSyntaxError(line);
		}
	}

	return null;
}

export function matchRules(line: Line, ruleInterfaceList: RuleInterface[]): Rule | null {
	if (line.tokens.length == 0) return null;
	let onlyForRestriction = true;
	for (let ruleInt of ruleInterfaceList) {
		let match = true;
		let i = 0;
		let args: Token[];

		args = [];

		// check for onlyForRestriction. onlyForRestriction is set to true only if there is at least one rule without the onlyFor property for the starting keyword
		if (
			ruleInt.rule.length > 0 &&
			(
				line.tokens[0].type === "reserved" ||
				line.tokens[0].type === "instruction"
			) &&
			ruleInt.onlyFor === undefined
			&&
			!ruleInt.rule[0].genericToken
			&&
			ruleInt.rule[0].value === line.tokens[0].value
		) onlyForRestriction = false;

		// match the rule
		if (ruleInt.rule.length === line.tokens.length) {	// match the length
			ruleInt.rule.forEach(expression => {
				if (expression.genericToken) {
					if (!expression.tokenTypes.includes(line.tokens[i].type)) {
						match = false;
					}
					if (expression.isArgument) {
						args.push({
							type: line.tokens[i].type,
							column: line.tokens[i].column,
							value: line.tokens[i].value
						});
					}
				} else {
					if (expression.value !== line.tokens[i].value) {
						match = false;
					}
				}
				i++;
			});
		} else match = false;

		if (match) {
			return {
				name: ruleInt.name,
				args: args,
				line: line,
				handleRule: ruleInt.handleRule
			}
		}
	};

	if (onlyForRestriction) {
		let isErr = false;

		for (let ruleInt of ruleInterfaceList) {
			if (
				ruleInt.rule.length > 0
				&&
				!ruleInt.rule[0].genericToken
				&&
				line.tokens[0].value === ruleInt.rule[0].value
			) {
				isErr = true;
				break;
			}
		}

		if (isErr) {
			handleGenericSyntaxError(line);
		}
	}
	return null;
}


export function handleGenericSyntaxError(line: Line) {
	if (line.tokens[0].value === "use") {
		let i = 3;
		for (; i < line.tokens.length; i++) {
			if (line.tokens[i].type === "identifier") {
				if (getSymbol(line.tokens[i].value) === null) {
					const err: Error = {
						type: SYMBOL_NOT_DEFINED,
						message: "'" + line.tokens[i].value + "' is not defined",
						otherInfo: true,
						fromColumn: line.tokens[i].column,
						toColumn: line.tokens[i].column + line.tokens[i].value.length,
						fromLine: line.lineNumber,
						toLine: line.lineNumber,
						moduleName: line.fromModule,
						sourceLines: [lineToString(line)]
					};
					printExit(err);
				}
			}
		}
	}
	const err: Error = {
		type: GENERIC_SYNTAX_ERROR,
		message: "Generic syntax error. Check the documentation for '" + line.tokens[0].value + "'.",
		otherInfo: true,
		fromColumn: 1,
		fromLine: line.lineNumber,
		toColumn: line.tokens[line.tokens.length - 1].column + line.tokens[line.tokens.length - 1].value.length,
		toLine: line.lineNumber,
		moduleName: line.fromModule,
		sourceLines: [lineToString(line)]
	}
	printExit(err);
}