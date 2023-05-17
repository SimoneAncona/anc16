import { scan } from "./lexer";
import { INDENTATION_ERROR, lineToString, printExit, Error } from "./localError";
import { checkSyntaxRule, matchRule, matchRules } from "./rules";
import { Label, Line, Rule, RuleInterface, Token } from "./types";

export function parse(sourceString: string, moduleName: string): Line[] {
	let lines;

	lines = scan(sourceString, moduleName);
	parseNumbers(lines);
	switchToken(lines);
	mName(lines);
	checkSyntaxRule(lines);
	return lines;
}

function mName(lines: Line[]) {
	for (let l of lines) {
		if (l.tokens.length > 0 && l.tokens[0].value === "import") {
			for (let i = 2; i < l.tokens.length - 1; i++) {
				if (l.tokens[i].value === ".") {
					l.tokens[i - 1].value = l.tokens[i - 1].value + ".";
					l.tokens.splice(i, 1);
					if (i < l.tokens.length) {
						l.tokens[i - 1].value = l.tokens[i - 1].value + l.tokens[i].value;
						l.tokens.splice(i, 1);
					}
				}
			}
		}
	}
}

function switchToken(lines: Line[]) {
	for (let l of lines) {
		for (let i = 0; i < l.tokens.length - 1; i++) {
			if (
				l.tokens[i].value == "a" ||
				l.tokens[i].value == "ah" ||
				l.tokens[i].value == "al" ||
				l.tokens[i].value == "b" ||
				l.tokens[i].value == "bh" ||
				l.tokens[i].value == "bl" ||
				l.tokens[i].value == "i" ||
				l.tokens[i].value == "j"
			) {
				if (l.tokens[i + 1].value === ":") l.tokens[i].type = "identifier";
			}
		}
	}
}

function parseNumbers(lines: Line[]) {
	for (let l of lines) {
		for (let i = 1; i < l.tokens.length; i++) {
			if (l.tokens[i].type === "number") {
				if (i == 1 && l.tokens[i - 1].value === "+") {
					l.tokens.splice(i - 1, 1);
				}
				else if (i == 1 && l.tokens[i - 1].value === "-") {
					l.tokens[i].value = "-" + l.tokens[i].value;
					l.tokens.splice(i - 1, 1);
				} else if (l.tokens[i - 1].value === "-" || l.tokens[i - 1].value === "+") {
					let neg = l.tokens[i - 1].value === "-";
					if (
						l.tokens[i - 2].value === "*"
						|| l.tokens[i - 2].value === "/"
					) {
						if (neg) l.tokens[i].value = "-" + l.tokens[i].value;
						l.tokens.splice(i - 1, 1);
					}
				}
			}
		}
	}
}