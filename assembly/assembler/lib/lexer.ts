import { INVALID_IDENTIFIER, UNRECOGNIZED_TOKEN, lineToString, printStackExit, Error } from "./localError";
import { Line, Token, TokenRegex } from "./types";

const SPECIAL_REGEXP = "\\+|-|\\*|\\/|\\$|,|:|#|\\(|\\)|\\.|\\[|\\]|%";
const SPACES = " |$|\\t";
const tokenTypes: TokenRegex[] = [
	{ name: "string", regularExpression: /".*"/gmi },
	{ name: "reserved", regularExpression: /\b(use|used|as|stdcall|import|org|word|byte|if|else|elif|endif|sizeof|reserve|call|syscall|local|global|not|syslib|a|b|ah|al|bh|bl|i|j)\b/gmi },
	{ name: "instruction", regularExpression: new RegExp(`\\b(ada|adb|ana|anb|aret|clc|cld|cli|clo|cls|cmah|cmbh|cmpa|cmpb|cmpi|cpuid|dea|deb|dei|dej|ina|inb|ini|inj|jcc|jcs|jeq|jmp|jnc|jne|jns|joc|jos|kill|lda|ldah|ldal|ldb|ldbh|ldbl|lddr|ldi|ldj|ldsp|limh|liml|lemh|leml|ldsr|msb|nop|ora|orb|pop|psh|read|rest|ret|sed|sei|semh|seml|ses|shl|shr|simh|siml|sta|stah|stal|stb|stbh|stbl|sti|stj|stpc|stsr|sua|sub|sys|tab|tabh|tabl|tadr|taemh|taeml|tahj|tai|taimh|taiml|tba|tbah|tbal|tbhj|tbi|tisp|tspb|wrte|wrti|xora|xorb)(?=${SPECIAL_REGEXP + "|" + SPACES})`, "gmi") },
	{ name: "number", regularExpression: new RegExp(`\\b(\\-?(0x[0-9a-fA-F]+|\\d+|0o[0-7]+|0b[0-1]+))(?=${SPECIAL_REGEXP + "|" + SPACES})`, "gmi") },
	{ name: "identifier", regularExpression: new RegExp(`\\b[a-zA-Z_][a-zA-Z0-9_]*(?=${SPECIAL_REGEXP + "|" + SPACES})`, "gmi") },
	{ name: "special", regularExpression: new RegExp(SPECIAL_REGEXP, "gmi") },
	{ name: "other", regularExpression: /\S+/gm },
]

export function scan(sourceString: string, moduleName: string) {
    return tokenMap(sourceString, moduleName);
}

function tokenMap(sourceString: string, moduleName: string): Line[] {
	sourceString = sourceString.replace(/;.*/gmi, "");		// removing all comments
	const sourceLines = sourceString.split("\n");			// split in lines
	let lines: Line[];
	lines = [];
	let lineCnt = 1;

	sourceLines.forEach(line => {
		if (line.length != 0) {			// removing blank lines
			let tokenLine: Line;
			let tokens: Token[];
			let indentLevel = 0;
			let space = true;

			tokens = [];

			while (line[0] == " " || line[0] == "\t") {	// indentation level
				if (line[0] == "\t") indentLevel++;
				else {
					space = !space;
					if (space) indentLevel++;
				}
				line = line.slice(1);
			}

			tokenTypes.forEach(tokenType => {	// parse the line
				let temp = Array.from(line.matchAll(tokenType.regularExpression));	// math all regular expression

				temp.forEach(tempToken => {	// check if already exist in tokens (different reg exps can give same results)
					let exists = false;

					tokens.forEach(token => {
						if (tempToken.index + 1 === token.column || tempToken.index + 1 > token.column && tempToken.index + 1 < token.column + token.value.length) {
							exists = true;
						}
					});

					if (!exists && tempToken[0] !== "") {	// if does not exist
						tokens.push({	// push a new token
							type: tokenType.name,
							value: tokenType.name == "reserved" ? tempToken[0].toLowerCase() : tempToken[0],
							column: tempToken.index + 1
						});
					}
				});
			})

			tokenLine = {
				indentLevel: indentLevel,
				tokens: tokens.sort((a, b) => (a.column > b.column) ? 1 : -1),
				lineNumber: lineCnt,
				fromModule: moduleName
			}
			lines.push(tokenLine);
			lineCnt++;
		}
	});

	// check for unrecognized tokens
	let isErr = false;
	let errStack: Error[] = [];
	lines.forEach(line => {
		line.tokens.forEach(token => {
			if (token.type === "other") {
				const err: Error = {
					type: token.value.length > 1 ? INVALID_IDENTIFIER : UNRECOGNIZED_TOKEN,
					message: token.value.length > 1 ? token.value[0] === "\"" || token.value[0] == "'" ? "Unterminated string" : "Invalid identifier name" : "Unrecognized token",
					otherInfo: true,
					fromColumn: token.column,
					fromLine: line.lineNumber,
					toColumn: token.column + token.value.length,
					toLine: line.lineNumber,
					sourceLines: [lineToString(line)],
					moduleName: moduleName
				};
				errStack.push(err);
				isErr = true;
			}
		});
		lineCnt++;
	});
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].tokens.length === 0) lines.splice(i, 1);
	}
	if (isErr) {
		printStackExit(errStack);
	}
	return lines;
}