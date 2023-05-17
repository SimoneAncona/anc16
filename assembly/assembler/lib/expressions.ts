import { $_REFERENCE_TO_NULL, GENERIC_SYNTAX_ERROR, lineToString, printExit, Error } from "./localError";
import { Line } from "./types";

export function evalExpressions(lines: Line[], preProcess = true) {
	const PRE_PROC_DIR = [
		"use",
		"import",
		"if",
	]
	for (let line of lines) {
		let i = 0;
		if (preProcess && line.tokens[0] !== undefined && PRE_PROC_DIR.includes(line.tokens[0].value)) {
			for (let token of line.tokens) {
				if (token.type === "number" || token.value === "(" || token.value === "$") {
					let j = i;
					let exp = "";

					for (; j < line.tokens.length; j++) {
						if (line.tokens[j].value === "$" && preProcess) {
							const err: Error = {
								type: $_REFERENCE_TO_NULL,
								message: "Cannot resolve $ address value",
								otherInfo: true,
								fromColumn: line.tokens[j].column,
								toColumn: line.tokens[j].column,
								fromLine: line.lineNumber,
								toLine: line.lineNumber,
								moduleName: line.fromModule,
								sourceLines: [lineToString(line)]
							};
							printExit(err);
						}
						if (
							!(
								line.tokens[j].type == "number" ||
								line.tokens[j].value == "(" ||
								line.tokens[j].value == ")" ||
								line.tokens[j].value == "+" ||
								line.tokens[j].value == "-" ||
								line.tokens[j].value == "*" ||
								line.tokens[j].value == "/"
							)
						) break;
						exp += line.tokens[j].value;
					}
					let value;
					try {
						value = String(Math.floor(Number(eval(exp))));
					} catch {
						const err: Error = {
							type: GENERIC_SYNTAX_ERROR,
							message: "An error occurred while evaluating math expression",
							otherInfo: true,
							fromColumn: line.tokens[i].column,
							toColumn: line.tokens[j].column,
							fromLine: line.lineNumber,
							toLine: line.lineNumber,
							sourceLines: [lineToString(line)],
							moduleName: line.fromModule
						};
						printExit(err);
					}
					line.tokens[i] = {
						column: line.tokens[i].column,
						value: value,
						type: "number"
					};
					line.tokens.splice(i + 1, j - (i + 1));
				}
				i++;
			}
		}
	}
}