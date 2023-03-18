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
exports.assemble = void 0;
const localError = __importStar(require("./localError"));
const colors = __importStar(require("colors"));
const mod = __importStar(require("./files"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const isa_1 = require("./isa");
colors.enable();
const LINE_PADDING_BYTE_OFFSET = 100000;
const CALL_MACRO = `
PSH
JMP __ref__
`;
const SYSCALL_MACRO = `
LDAL __ref__
SYS
`;
const STD_SYSCALLS = {
    print: 2
};
const tokenTypes = [
    { name: "string", regularExpression: /".*"/gmi },
    { name: "reserved", regularExpression: /\b(use|used|as|stdcall|import|org|word|byte|if|else|elif|endif|sizeof|reserve|call|syscall|local|global|not|syslib)\b/gmi },
    { name: "instruction", regularExpression: /\b(ada|adb|ana|anb|aret|clc|cld|cli|clo|cls|cmah|cmbh|cmpa|cmpb|cmpi|cpuid|dea|deb|dei|dej|ina|inb|ini|inj|jcc|jcs|jeq|jmp|jnc|jne|jns|joc|jos|kill|lda|ldah|ldal|ldb|ldbh|ldbl|lddr|ldi|ldj|ldsp|limh|liml|lemh|leml|ldsr|msb|nop|ora|orb|psh|read|rest|ret|sed|sei|semh|seml|ses|shl|shr|simh|siml|stah|stb|stbh|sti|stj|stpc|stsr|sua|sub|sys|tab|tabh|tabl|tadr|taemh|taeml|tahj|tai|taimh|taiml|tba|tbah|tbal|tbhj|tbi|tisp|tspb|wrte|wrti|xora|xorb)(?=\+|-|\*|\/|\$|,|:|#|\(|\)|\.| |$|\t)/gmi },
    { name: "number", regularExpression: /\b(\-?(0x[0-9a-fA-F]+|\d+|0o[0-7]+|0b[0-1]+))(?=\+|-|\*|\/|\$|,|:|#|\(|\)|\.| |$|\t)/gmi },
    { name: "identifier", regularExpression: /\b[a-zA-Z_][a-zA-Z0-9_]*(?=\+|-|\*|\/|\$|,|:|#|\(|\)|\.| |$|\t)/gm },
    { name: "special", regularExpression: /(\+|-|\*|\/|\$|,|:|#|\(|\)|\.)/gmi },
    { name: "other", regularExpression: /\S+/gm },
];
function getSyscall(syscall) {
    for (let s in STD_SYSCALLS) {
        if (s === syscall.toLowerCase())
            return STD_SYSCALLS[s];
    }
    return -1;
}
function lineToString(line) {
    let str = "";
    for (let i = 0; i < line.indentLevel; i++)
        str += "\t";
    line.tokens.forEach(tk => str += tk.value + " ");
    return str;
}
function parse(sourceString, moduleName) {
    let lines;
    lines = tokenMap(sourceString, moduleName);
    checkSyntaxRule(lines);
    preProcess(lines, moduleName);
    return lines;
}
function assemble(sourceString, moduleName = "_main") {
    console.time("Assembly finished in");
    let lines = parse(sourceString, moduleName);
    let labels = getLabels(lines);
    setData(labels);
    setBinary(labels);
    process.stdout.write("✓ ".green);
    console.timeEnd("Assembly finished in");
    return "";
}
exports.assemble = assemble;
function tokenMap(sourceString, moduleName) {
    sourceString = sourceString.replace(/;.*/gmi, "");
    const sourceLines = sourceString.split("\n");
    let lines;
    lines = [];
    let lineCnt = 1;
    sourceLines.forEach(line => {
        if (line.length != 0) {
            let tokenLine;
            let tokens;
            let indentLevel = 0;
            let space = true;
            tokens = [];
            while (line[0] == " " || line[0] == "\t") {
                if (line[0] == "\t")
                    indentLevel++;
                else {
                    space = !space;
                    if (space)
                        indentLevel++;
                }
                line = line.slice(1);
            }
            tokenTypes.forEach(tokenType => {
                let temp = Array.from(line.matchAll(tokenType.regularExpression));
                temp.forEach(tempToken => {
                    let exists = false;
                    tokens.forEach(token => {
                        if (tempToken.index + 1 === token.column || tempToken.index + 1 > token.column && tempToken.index + 1 < token.column + token.value.length) {
                            exists = true;
                        }
                    });
                    if (!exists && tempToken[0] !== "") {
                        tokens.push({
                            type: tokenType.name,
                            value: tokenType.name == "reserved" ? tempToken[0].toLowerCase() : tempToken[0],
                            column: tempToken.index + 1
                        });
                    }
                });
            });
            tokenLine = {
                indentLevel: indentLevel,
                tokens: tokens.sort((a, b) => (a.column > b.column) ? 1 : -1),
                lineNumber: lineCnt,
                fromModule: moduleName
            };
            lines.push(tokenLine);
            lineCnt++;
        }
    });
    let isErr = false;
    let errStack = [];
    lines.forEach(line => {
        line.tokens.forEach(token => {
            if (token.type === "other") {
                const err = {
                    type: token.value.length > 1 ? localError.INVALID_IDENTIFIER : localError.UNRECOGNIZED_TOKEN,
                    message: token.value.length > 1 ? token.value[0] === "\"" || token.value[0] == "'" ? "Unterminated string" : "Invalid identifier name" : "Unrecognized token",
                    otherInfo: true,
                    fromColumn: token.column,
                    fromLine: line.lineNumber,
                    toColumn: token.column + token.value.length,
                    toLine: line.lineNumber,
                    sourceLines: [lineToString(line)]
                };
                errStack.push(err);
                isErr = true;
            }
        });
        lineCnt++;
    });
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].tokens.length === 0)
            lines.splice(i, 1);
    }
    if (isErr) {
        localError.printStackExit(errStack);
    }
    return lines;
}
const syntaxRules = [
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
        canFindSpecific: ["-", "+", "*", "/", "\n"],
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
        canFindSpecific: ["(", "$"],
        pair: false
    },
    {
        specific: true,
        after: "-",
        canFindOnly: ["number", "identifier"],
        canFindSpecific: ["(", "$"],
        pair: false
    },
    {
        specific: true,
        after: "*",
        canFindOnly: ["number", "identifier"],
        canFindSpecific: ["(", "$"],
        pair: false
    },
    {
        specific: true,
        after: "/",
        canFindOnly: ["number", "identifier"],
        canFindSpecific: ["(", "$"],
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
        canFindSpecific: ["(", "$"],
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
    }
];
function checkSyntaxRule(lines) {
    let errorStack;
    errorStack = [];
    for (let line of lines) {
        let tokens = line.tokens;
        for (let i = 0; i < tokens.length; i++) {
            for (let syntaxRule of syntaxRules) {
                if (syntaxRule.after === tokens[i].value) {
                    if (i === tokens.length - 1 && !(syntaxRule.canFindSpecific.includes("\n"))) {
                        const err = {
                            type: localError.UNEXPECTED_END_OF_LINE,
                            message: "Unexpected the end of the line",
                            otherInfo: true,
                            fromColumn: tokens[i].column,
                            toColumn: tokens[i].column + tokens[i].value.length,
                            fromLine: line.lineNumber,
                            toLine: line.lineNumber,
                            sourceLines: [lineToString(line)]
                        };
                        errorStack.push(err);
                    }
                    else {
                        let found = false;
                        for (let specific of syntaxRule.canFindSpecific) {
                            if (tokens.length === i + 1 && specific === "\n") {
                                found = true;
                                break;
                            }
                            if (specific === tokens[i + 1].value) {
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
                                const err = {
                                    type: localError.UNEXPECTED_TOKEN,
                                    message: "Unexpected token '" + tokens[i + 1].value + "' after '" + tokens[i].value + "'",
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
        localError.printStackExit(errorStack);
}
function matchRule(line, ruleInterface) {
    if (line.tokens.length == 0)
        return null;
    let match = true;
    let i = 0;
    let args;
    args = [];
    if (ruleInterface.rule.length === line.tokens.length) {
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
            }
            else {
                if (expression.value !== line.tokens[i].value) {
                    match = false;
                }
            }
            i++;
        });
    }
    else
        match = false;
    if (match) {
        return {
            name: ruleInterface.name,
            args: args,
            line: line,
            handleRule: ruleInterface.handleRule
        };
    }
    if ("onlyFor" in ruleInterface) {
        if (line.tokens[0].value === ruleInterface.onlyFor) {
            handleGenericSyntaxError(line);
        }
    }
    return null;
}
function matchRules(line, ruleInterfaceList) {
    if (line.tokens.length == 0)
        return null;
    let onlyForRestriction = true;
    for (let ruleInt of ruleInterfaceList) {
        let match = true;
        let i = 0;
        let args;
        args = [];
        if (ruleInt.rule.length > 0 &&
            (line.tokens[0].type === "reserved" ||
                line.tokens[0].type === "instruction") &&
            ruleInt.onlyFor === undefined
            &&
                !ruleInt.rule[0].genericToken
            &&
                ruleInt.rule[0].value === line.tokens[0].value)
            onlyForRestriction = false;
        if (ruleInt.rule.length === line.tokens.length) {
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
                }
                else {
                    if (expression.value !== line.tokens[i].value) {
                        match = false;
                    }
                }
                i++;
            });
        }
        else
            match = false;
        if (match) {
            return {
                name: ruleInt.name,
                args: args,
                line: line,
                handleRule: ruleInt.handleRule
            };
        }
    }
    ;
    if (onlyForRestriction) {
        let isErr = false;
        for (let ruleInt of ruleInterfaceList) {
            if (ruleInt.rule.length > 0
                &&
                    !ruleInt.rule[0].genericToken
                &&
                    line.tokens[0].value === ruleInt.rule[0].value) {
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
function handleGenericSyntaxError(line) {
    if (line.tokens[0].value === "use") {
        let i = 3;
        for (; i < line.tokens.length; i++) {
            if (line.tokens[i].type === "identifier") {
                if (getSymbol(line.tokens[i].value) === null) {
                    const err = {
                        type: localError.SYMBOL_NOT_DEFINED,
                        message: "'" + line.tokens[i].value + "' is not defined",
                        otherInfo: true,
                        fromColumn: line.tokens[i].column,
                        toColumn: line.tokens[i].column + line.tokens[i].value.length,
                        fromLine: line.lineNumber,
                        toLine: line.lineNumber,
                        moduleName: line.fromModule,
                        sourceLines: [lineToString(line)]
                    };
                    localError.printExit(err);
                }
            }
        }
    }
    const err = {
        type: localError.GENERIC_SYNTAX_ERROR,
        message: "Generic syntax error. Check the documentation for '" + line.tokens[0].value + "'.",
        otherInfo: true,
        fromColumn: 1,
        fromLine: line.lineNumber,
        toColumn: line.tokens[line.tokens.length - 1].column + line.tokens[line.tokens.length - 1].value.length,
        toLine: line.lineNumber,
        moduleName: line.fromModule,
        sourceLines: [lineToString(line)]
    };
    localError.printExit(err);
}
function evalExpressions(lines) {
    for (let line of lines) {
        let i = 0;
        for (let token of line.tokens) {
            if (token.type === "number" || token.value === "(") {
                let j = i;
                let exp = "";
                for (; j < line.tokens.length; j++) {
                    if (line.tokens[j].value === "$") {
                        const err = {
                            type: localError.$_REFERENCE_TO_NULL,
                            message: "Cannot resolve $ address value",
                            otherInfo: true,
                            fromColumn: line.tokens[j].column,
                            toColumn: line.tokens[j].column,
                            fromLine: line.lineNumber,
                            toLine: line.lineNumber,
                            moduleName: line.fromModule,
                            sourceLines: [lineToString(line)]
                        };
                        localError.printExit(err);
                    }
                    if (!(line.tokens[j].type == "number" ||
                        line.tokens[j].value == "(" ||
                        line.tokens[j].value == ")" ||
                        line.tokens[j].value == "+" ||
                        line.tokens[j].value == "-" ||
                        line.tokens[j].value == "*" ||
                        line.tokens[j].value == "/"))
                        break;
                    exp += line.tokens[j].value;
                }
                let value = String(eval(exp));
                line.tokens[i] = {
                    column: line.tokens[i].column,
                    value: value,
                    type: "number"
                };
                line.tokens.splice(i + 1, j);
            }
            i++;
        }
    }
}
let symbolTable;
symbolTable = [];
let stdcall = false;
function getSymbol(name) {
    for (let s of symbolTable) {
        if (s.name === name)
            return s;
    }
    return null;
}
function useId(tokens, scope, source, line) {
    let sym = getSymbol(tokens[0].value);
    if (sym !== null) {
        let sLine = "";
        for (let line of source) {
            if (line.lineNumber === line.lineNumber) {
                sLine = lineToString(line);
            }
        }
        const err = {
            type: localError.REDEFINITON,
            message: "Redefinition of " + symbolToString(sym),
            otherInfo: true,
            fromColumn: 1,
            toColumn: 100,
            fromLine: line.lineNumber,
            toLine: line.lineNumber,
            moduleName: line.fromModule,
            sourceLines: [sLine]
        };
        localError.printExit(err);
    }
    symbolTable.push({
        name: tokens[0].value,
        type: "number",
        value: "0",
        scope: scope,
        isConst: true
    });
    let last = null;
    source.forEach(line => {
        line.tokens.forEach(tk => {
            if (tk.type === "identifier" && tk.value === tokens[0].value) {
                if (!(last === "used" || last === "use")) {
                    tk.type = "number";
                    tk.value = "0";
                }
            }
            last = tk.value;
        });
    });
}
function useAs(tokens, scope, source, line) {
    let sym = getSymbol(tokens[0].value);
    if (sym !== null) {
        let sLine = "";
        for (let ln of source) {
            if (ln.lineNumber === line.lineNumber) {
                sLine = lineToString(line);
            }
        }
        const err = {
            type: localError.REDEFINITON,
            message: "Redefinition of " + symbolToString(sym),
            otherInfo: true,
            fromColumn: 1,
            toColumn: 100,
            fromLine: line.lineNumber,
            toLine: line.lineNumber,
            moduleName: line.fromModule,
            sourceLines: [sLine]
        };
        localError.printExit(err);
    }
    symbolTable.push({
        name: tokens[0].value,
        type: tokens[1].type === "string" ? "string" : "number",
        value: tokens[1].value,
        scope: scope,
        isConst: true
    });
    let last = null;
    source.forEach(line => {
        line.tokens.forEach(tk => {
            if (tk.type === "identifier" && tk.value === tokens[0].value) {
                if (!(last === "used" || last === "use")) {
                    tk.type = tokens[1].type === "string" ? "string" : "number";
                    tk.value = tokens[1].value;
                }
            }
            last = tk.value;
        });
    });
}
function useStdcall() {
    stdcall = true;
}
function removeNextEndif(lines, scope, lineNumberStart, removeTillNextEndif = false) {
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
        if (removeTillNextEndif)
            lines.splice(i, 1);
        else
            i++;
    }
}
function ifUsed(tokens, scope, source, line) {
    if (getSymbol(tokens[0].value) === null) {
        removeNextEndif(source, scope, line.lineNumber, true);
    }
    else {
        removeNextEndif(source, scope, line.lineNumber);
    }
}
function ifNotUsed(tokens, scope, source, line) {
    if (getSymbol(tokens[0].value) !== null) {
        removeNextEndif(source, scope, line.lineNumber, true);
    }
    else {
        removeNextEndif(source, scope, line.lineNumber);
    }
}
function ifUsedStdcall(tokens, scope, source, line) {
    if (!stdcall) {
        removeNextEndif(source, scope, line.lineNumber);
    }
    else {
        removeNextEndif(source, scope, line.lineNumber, false);
    }
}
function ifNotUsedStdcall(tokens, scope, source, line) {
    if (stdcall) {
        removeNextEndif(source, scope, line.lineNumber);
    }
    else {
        removeNextEndif(source, scope, line.lineNumber, false);
    }
}
function importHandler(tokens, scope, source, line) {
    let p;
    if (tokens[0].type === "identifier")
        p = path.resolve(mod.getCWD() + "\\" + tokens[0].value + ".anc16");
    else
        p = path.resolve(mod.getCWD() + "\\" + tokens[0].value.substring(1, tokens[0].value.length - 1));
    if (!fs.existsSync(p)) {
        const err = {
            type: localError.FILE_NOT_FOUND,
            message: "The module '" + path.basename(p) + "' was not found",
            otherInfo: true,
            fromColumn: 0,
            toColumn: 100,
            fromLine: line.lineNumber,
            toLine: line.lineNumber,
            moduleName: line.fromModule,
            sourceLines: [lineToString(source[line.lineNumber - 1])]
        };
        localError.printExit(err);
    }
    if (mod.modulePoolContains(p))
        return;
    let sourceString = mod.read(p);
    mod.appendModule(p);
    let modLines = parse(sourceString, path.parse(p).name);
    let last = null;
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
const importRule = {
    name: "import",
    rule: [
        { genericToken: false, value: "import" },
        { genericToken: true, tokenTypes: ["identifier"], isArgument: true }
    ],
    onlyFor: "import",
    handleRule: importHandler
};
const preProcessorRules = [
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
];
function preProcess(lines, module) {
    let rules;
    rules = [];
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
function getTillIndetation(lines, scope, lineNumberStart) {
    let i = 0;
    let indentationLevel;
    let retLines;
    retLines = [];
    for (; i < lines.length; i++) {
        if (lines[i].lineNumber === lineNumberStart && (lines[i].fromModule === undefined || scope[0] === lines[i].fromModule)) {
            indentationLevel = lines[i].indentLevel;
            lines.splice(i, 1);
            break;
        }
    }
    for (; i < lines.length;) {
        if (lines[i].indentLevel <= indentationLevel)
            break;
        retLines.push(lines[i]);
        lines.splice(i, 1);
    }
    return retLines;
}
const orgRule = {
    name: "org",
    rule: [
        { genericToken: false, value: "org" },
        { genericToken: true, tokenTypes: ["number"], isArgument: true }
    ],
    onlyFor: "org",
    handleRule: getOrg
};
function getOrg(tokens, scope, source, line) {
    return Number.parseInt(tokens[0].value);
}
function label(tokens, scope, source, line) {
    let i = 0;
    let address = "unresolved";
    for (; i < source.length; i++)
        if (source[i] === line)
            break;
    if (i !== 0) {
        let rule = matchRule(source[i - 1], orgRule);
        if (rule != null) {
            address = rule.handleRule(rule.args, scope, source, source[i - 1]);
            source.splice(i - 1, 1);
        }
    }
    let lines = getTillIndetation(source, scope, line.lineNumber);
    let lbl = {
        name: tokens[0].value,
        code: lines,
        data: [],
        binary: new Uint8Array(),
        subLabels: [],
        isLocal: false,
        size: "unresolved",
        address: address,
        scope: scope
    };
    return lbl;
}
function localLabel(tokens, scope, source, line) {
    let i = 0;
    let address = "unresolved";
    for (; i < source.length; i++)
        if (source[i] === line)
            break;
    if (i !== 0) {
        let rule = matchRule(source[i - 1], orgRule);
        if (rule != null) {
            address = rule.handleRule(rule.args, scope, source, source[i - 1]);
            source.splice(i - 1, 1);
        }
    }
    let lines = getTillIndetation(source, scope, line.lineNumber);
    let lbl = {
        name: tokens[0].value,
        code: lines,
        data: [],
        binary: new Uint8Array(),
        subLabels: [],
        isLocal: true,
        size: "unresolved",
        address: address,
        scope: scope
    };
    return lbl;
}
const labelRules = [
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
function newLineAfterLabel(lines) {
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let j;
        for (j = 0; j < line.tokens.length; j++) {
            if (line.tokens[j].value === ":")
                break;
        }
        let tokens = [];
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
function getLabels(lines) {
    newLineAfterLabel(lines);
    let rules;
    let labels;
    rules = [];
    labels = [];
    lines.forEach(line => {
        let rule = matchRules(line, labelRules);
        if (rule != null && line.indentLevel === 0)
            rules.push(rule);
    });
    rules.forEach(rule => {
        labels.push(rule.handleRule(rule.args, [rule.line.fromModule === undefined ? "_main" : rule.line.fromModule], lines, rule.line));
        for (let i = 0; i < lines.length; i++) {
            if (rule.line === lines[i])
                lines.splice(i, 1);
        }
    });
    labels.forEach(lbl => {
        rules = [];
        lbl.code.forEach(line => {
            let rule = matchRules(line, labelRules);
            if (rule != null)
                rules.push(rule);
        });
        rules.forEach(rule => {
            let l = rule.handleRule(rule.args, [rule.line.fromModule === undefined ? "_main" : rule.line.fromModule], lbl.code, rule.line);
            l.scope.push(lbl.name);
            lbl.subLabels.push(l);
            for (let i = 0; i < lines.length; i++) {
                if (rule.line === lines[i])
                    lines.splice(i, 1);
            }
        });
    });
    lines.forEach(line => {
        if (line.tokens.length > 0) {
            const err = {
                type: localError.INDENTATION_ERROR,
                message: "Expected and indented block",
                otherInfo: true,
                fromColumn: 0,
                toColumn: 100,
                fromLine: line.lineNumber,
                toLine: line.lineNumber,
                moduleName: line.fromModule,
                sourceLines: [lineToString(line)]
            };
            localError.printExit(err);
        }
    });
    return labels;
}
function fits16bit(value) {
    return (value == 0 ||
        value < 0 && ((~value) & 0xFFFF) === ~value ||
        (value & 0xFFFF) === value);
}
function fits8bit(value) {
    return (value == 0 ||
        value < 0 && ((~value) & 0xFF) === ~value ||
        (value & 0xFF) === value);
}
function opcode(mnemonic, addressing, line) {
    let opc = (0, isa_1.getOpcode)(mnemonic, addressing);
    if (opc === null) {
        const err = {
            type: localError.UNRECOGNIZED_ADDRESSING_MODE,
            message: `'${mnemonic}' does not support '${addressing}' addressing mode`,
            otherInfo: true,
            fromColumn: 0,
            fromLine: line.lineNumber,
            toColumn: 100,
            toLine: line.lineNumber,
            sourceLines: [lineToString(line)],
            moduleName: line.fromModule
        };
        localError.printExit(err);
    }
    return opc;
}
function absolute(tokens, scope, source, line) {
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
                size: 2
            }
            :
                {
                    token: tokens[1],
                    position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
                    resolve: "value",
                    value: Number(tokens[1].value),
                    size: 2,
                    forced: true
                }
    ];
}
function absoluteIndexed(tokens, scope, source, line) {
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
                symbol: tokens[1].value,
                size: 2
            }
            :
                {
                    token: tokens[1],
                    position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
                    resolve: "value",
                    value: Number(tokens[1].value),
                    size: 2,
                    forced: true
                }
    ];
}
function accumulatorHighRegister(tokens, scope, source, line) {
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
function accumulatorLowRegister(tokens, scope, source, line) {
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
function accumulatorRegister(tokens, scope, source, line) {
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
function baseHighRegister(tokens, scope, source, line) {
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
function baseLowRegister(tokens, scope, source, line) {
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
function baseRegister(tokens, scope, source, line) {
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
function indexRegister(tokens, scope, source, line) {
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
function relative(tokens, scope, source, line) {
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
                size: 2
            }
            :
                {
                    token: tokens[1],
                    position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
                    resolve: "value",
                    value: Number(tokens[1].value),
                    size: 2,
                    forced: true
                }
    ];
}
function relativeUsingJ(tokens, scope, source, line) {
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
function immediate(tokens, scope, source, line) {
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
                size: 2
            }
            :
                {
                    token: tokens[1],
                    position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
                    resolve: "value",
                    value: Number(tokens[1].value),
                    size: 2,
                    forced: false
                }
    ];
}
function implied(tokens, scope, source, line) {
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
function indirect(tokens, scope, source, line) {
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
                size: 2
            }
            :
                {
                    token: tokens[1],
                    position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
                    resolve: "value",
                    value: Number(tokens[1].value),
                    size: 2,
                    forced: true
                }
    ];
}
function indirectIndexed(tokens, scope, source, line) {
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
                symbol: tokens[1].value,
                size: 2
            }
            :
                {
                    token: tokens[1],
                    position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
                    resolve: "value",
                    value: Number(tokens[1].value),
                    size: 2,
                    forced: true
                }
    ];
}
function zeroPage(tokens, scope, source, line) {
    let opc = opcode(tokens[0].value, "zeroPage", line);
    if (tokens[1].type === "number") {
        if (!fits8bit(Number(tokens[1].value))) {
            const err = {
                type: localError.VALUE_SIZE_OVERFLOW,
                message: "Zero page addrressing accepts 1 bytes pointers only",
                otherInfo: true,
                fromColumn: 0,
                toColumn: 100,
                fromLine: line.lineNumber,
                toLine: line.lineNumber,
                sourceLines: [lineToString(line)],
                moduleName: line.fromModule
            };
            localError.printExit(err);
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
                symbol: tokens[1].value,
                size: 2
            }
            :
                {
                    token: tokens[1],
                    position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
                    resolve: "value",
                    value: Number(tokens[1].value),
                    size: 2,
                    forced: true
                }
    ];
}
function zeroPageIndexed(tokens, scope, source, line) {
    let opc = opcode(tokens[0].value, "zeroPageIndexed", line);
    if (tokens[1].type === "number") {
        if (!fits8bit(Number(tokens[1].value))) {
            const err = {
                type: localError.VALUE_SIZE_OVERFLOW,
                message: "Zero page addrressing accepts 1 bytes pointers only",
                otherInfo: true,
                fromColumn: 0,
                toColumn: 100,
                fromLine: line.lineNumber,
                toLine: line.lineNumber,
                sourceLines: [lineToString(line)],
                moduleName: line.fromModule
            };
            localError.printExit(err);
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
                symbol: tokens[1].value,
                size: 2
            }
            :
                {
                    token: tokens[1],
                    position: line.lineNumber * LINE_PADDING_BYTE_OFFSET + tokens[1].column,
                    resolve: "value",
                    value: Number(tokens[1].value),
                    size: 2,
                    forced: true
                }
    ];
}
function call(tokens, scope, source, line) {
    if (!stdcall) {
        const err = {
            type: localError.SYMBOL_NOT_DEFINED,
            message: "'call' is not defined. You should add 'use stdcall'",
            otherInfo: true,
            fromColumn: 0,
            toColumn: 100,
            fromLine: line.lineNumber,
            toLine: line.lineNumber,
            sourceLines: [lineToString(line)],
            moduleName: line.fromModule
        };
        localError.printExit(err);
    }
    let i;
    for (i = 0; i < source.length; i++) {
        if (source[i] === line) {
            source.splice(i, 1);
            let callMacro = parse(CALL_MACRO.replace("__ref__", tokens[0].value), line.fromModule);
            for (let ln of callMacro) {
                ln.lineNumber = line.lineNumber;
                ln.indentLevel = line.indentLevel;
                source.splice(i, 0, ln);
            }
        }
    }
}
function syscall(tokens, scope, source, line) {
    let found = false;
    for (let syscall in STD_SYSCALLS) {
        if (tokens[0].value === syscall) {
            found = true;
            break;
        }
    }
    if (!found) {
        const err = {
            type: localError.SYMBOL_NOT_DEFINED,
            message: `'${tokens[0].value}' is not defined. Check the manual for the std syscalls`,
            otherInfo: true,
            fromColumn: 0,
            toColumn: 100,
            fromLine: line.lineNumber,
            toLine: line.lineNumber,
            sourceLines: [lineToString(line)],
            moduleName: line.fromModule
        };
        localError.printExit(err);
    }
    let i;
    for (i = 0; i < source.length; i++) {
        if (source[i] === line) {
            source.splice(i, 1);
            let callMacro = parse(SYSCALL_MACRO.replace("__ref__", String(getSyscall(tokens[0].value))), line.fromModule);
            for (let ln of callMacro) {
                ln.lineNumber = line.lineNumber;
                ln.indentLevel = line.indentLevel;
                source.splice(i, 0, ln);
            }
        }
    }
}
const macroRules = [
    {
        name: "call",
        rule: [
            { genericToken: false, value: "call" },
            { genericToken: true, tokenTypes: ["identifier"], isArgument: true }
        ],
        handleRule: call,
        onlyFor: "call"
    },
    {
        name: "syscall",
        rule: [
            { genericToken: false, value: "call" },
            { genericToken: true, tokenTypes: ["identifier"], isArgument: true }
        ],
        handleRule: syscall,
        onlyFor: "syscall"
    }
];
const addressingRules = [
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
            { genericToken: false, value: "I" },
        ],
        handleRule: absoluteIndexed
    },
    {
        name: "accumulatorHighRegister",
        rule: [
            { genericToken: true, tokenTypes: ["instruction"], isArgument: true },
            { genericToken: false, value: "AH" }
        ],
        handleRule: accumulatorHighRegister
    },
    {
        name: "accumulatorLowRegister",
        rule: [
            { genericToken: true, tokenTypes: ["instruction"], isArgument: true },
            { genericToken: false, value: "AL" }
        ],
        handleRule: accumulatorRegister
    },
    {
        name: "accumulatorRegister",
        rule: [
            { genericToken: true, tokenTypes: ["instruction"], isArgument: true },
            { genericToken: false, value: "A" }
        ],
        handleRule: accumulatorLowRegister
    },
    {
        name: "baseHighRegister",
        rule: [
            { genericToken: true, tokenTypes: ["instruction"], isArgument: true },
            { genericToken: false, value: "BH" }
        ],
        handleRule: baseHighRegister
    },
    {
        name: "baseLowRegister",
        rule: [
            { genericToken: true, tokenTypes: ["instruction"], isArgument: true },
            { genericToken: false, value: "BL" }
        ],
        handleRule: baseLowRegister
    },
    {
        name: "baseRegister",
        rule: [
            { genericToken: true, tokenTypes: ["instruction"], isArgument: true },
            { genericToken: false, value: "B" }
        ],
        handleRule: baseRegister
    },
    {
        name: "indexRegister",
        rule: [
            { genericToken: true, tokenTypes: ["instruction"], isArgument: true },
            { genericToken: false, value: "I" }
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
            { genericToken: false, value: "J" },
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
        name: "implied",
        rule: [
            { genericToken: true, tokenTypes: ["instruction"], isArgument: true },
        ],
        handleRule: implied
    },
    {
        name: "indirect",
        rule: [
            { genericToken: true, tokenTypes: ["instruction"], isArgument: true },
            { genericToken: false, value: "(" },
            { genericToken: true, tokenTypes: ["identifier", "number"], isArgument: true },
            { genericToken: false, value: ")" },
        ],
        handleRule: indirect
    },
    {
        name: "indirectIndexed",
        rule: [
            { genericToken: true, tokenTypes: ["instruction"], isArgument: true },
            { genericToken: false, value: "(" },
            { genericToken: true, tokenTypes: ["identifier", "number"], isArgument: true },
            { genericToken: false, value: ")" },
            { genericToken: false, value: "," },
            { genericToken: false, value: "I" }
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
            { genericToken: false, value: "I" }
        ],
        handleRule: zeroPageIndexed
    }
];
function handleByteWordCast(label) {
    for (let ln of label.code) {
        for (let i = 0; i < ln.tokens.length; i++) {
            if (ln.tokens[i].value === "word" || ln.tokens[i].value === "byte") {
                if (ln.tokens[i + 1].type === "number") {
                    let value = ln.tokens[i + 1].value.startsWith("0b") ?
                        Number.parseInt(ln.tokens[i + 1].value.substring(2), 2) :
                        ln.tokens[i + 1].value.startsWith("0o") ?
                            Number.parseInt(ln.tokens[i + 1].value.substring(2), 8) :
                            Number.parseInt(ln.tokens[i + 1].value);
                    if ((!fits16bit(value) && ln.tokens[i].value === "word") ||
                        (!fits8bit(value) && ln.tokens[i].value === "byte")) {
                        const err = {
                            type: localError.VALUE_SIZE_OVERFLOW,
                            message: "The given value does not fit in a " + ln.tokens[i].value,
                            otherInfo: true,
                            fromColumn: ln.tokens[i + 1].column,
                            toColumn: ln.tokens[i + 1].column + ln.tokens[i + 1].value.length,
                            fromLine: ln.lineNumber,
                            toLine: ln.lineNumber,
                            sourceLines: [lineToString(ln)],
                            moduleName: ln.fromModule
                        };
                        localError.printExit(err);
                    }
                    label.data.push({
                        token: ln.tokens[i + 1],
                        position: ln.lineNumber * LINE_PADDING_BYTE_OFFSET + ln.tokens[i].column,
                        resolve: "value",
                        value: value,
                        size: ln.tokens[i].value === "word" ? 2 : 1,
                        forced: true
                    });
                    ln.tokens[i + 1].type = "identifier";
                    ln.tokens[i + 1].value = "";
                    ln.tokens.splice(i, 1);
                }
            }
        }
    }
}
function handleReserveBytes(lb) {
    for (let ln of lb.code) {
        for (let i = 0; i < ln.tokens.length; i++) {
            if (ln.tokens[i].value === "reserve" && ln.tokens[i + 1].type === "number") {
                let value = Number(ln.tokens[i + 1].value);
                if (value > 2 ** 15) {
                    const err = {
                        type: localError.VALUE_SIZE_OVERFLOW,
                        message: "Cannot reserve more than 2¹⁵ bytes",
                        otherInfo: true,
                        fromColumn: ln.tokens[i + 1].column,
                        toColumn: ln.tokens[i + 1].column + ln.tokens[i + 1].value.length,
                        fromLine: ln.lineNumber,
                        toLine: ln.lineNumber,
                        sourceLines: [lineToString(ln)],
                        moduleName: ln.fromModule
                    };
                    localError.printExit(err);
                }
                for (let j = 0; j < value; j++) {
                    lb.data.push({
                        token: ln.tokens[i],
                        position: ln.lineNumber * LINE_PADDING_BYTE_OFFSET + ln.tokens[i].column,
                        size: 1,
                        resolve: "value",
                        value: 0,
                        forced: true
                    });
                }
                ln.tokens.splice(i, 2);
            }
        }
    }
}
function handleLiteralStrings(lb) {
    for (let ln of lb.code) {
        for (let i = 0; i < ln.tokens.length; i++) {
            if (ln.tokens[i].type === "string") {
                for (let j = 1; j < ln.tokens[i].value.length - 1; j++) {
                    lb.data.push({
                        token: ln.tokens[i],
                        position: ln.lineNumber * LINE_PADDING_BYTE_OFFSET + ln.tokens[i].column + j,
                        resolve: "value",
                        size: 1,
                        value: ln.tokens[i].value.charCodeAt(j),
                        forced: true
                    });
                }
                ln.tokens.splice(i, 1);
            }
        }
    }
}
function handleMacros(lb) {
    let rules = [];
    for (let ln of lb.code) {
        let rule = matchRules(ln, macroRules);
        if (rule != null) {
            rules.push(rule);
        }
    }
    for (let rule of rules) {
        rule.handleRule(rule.args, lb.scope, lb.code, rule.line);
    }
}
function handleSubLabelAccess(lb) {
    for (let ln of lb.code) {
        for (let i = 0; i < ln.tokens.length; i++) {
            if (ln.tokens[i].type === "identifier" &&
                ln.tokens[i + 1] != undefined && ln.tokens[i + 1].value == "." &&
                ln.tokens[i + 2] != undefined && ln.tokens[i + 2].type == "identifier") {
                ln.tokens[i].value = ln.tokens[i].value + ln.tokens[i + 1].value + ln.tokens[i + 2].value;
                ln.tokens.splice(i + 1, 2);
            }
        }
    }
}
function handleLiteralNumbers(lb) {
    for (let ln of lb.code) {
        for (let tk of ln.tokens) {
            if (tk.type !== "number") {
                if (!(tk.type === "identifier" && tk.value === "")) {
                    const err = {
                        type: localError.UNEXPECTED_TOKEN,
                        message: "Unexpected '" + tk.value + "'",
                        otherInfo: true,
                        fromColumn: tk.column,
                        toColumn: tk.column + tk.value.length,
                        fromLine: ln.lineNumber,
                        toLine: ln.lineNumber,
                        sourceLines: [lineToString(ln)],
                        moduleName: ln.fromModule
                    };
                    localError.printExit(err);
                }
                continue;
            }
            let value = Number(tk.value);
            lb.data.push({
                token: tk,
                resolve: "value",
                position: ln.lineNumber * LINE_PADDING_BYTE_OFFSET + tk.column,
                size: fits8bit(value) ? 1 : 2,
                value: value,
                forced: false
            });
        }
    }
}
function removeNull(label) {
    for (let i = 0; i < label.data.length; i++) {
        if (label.data[i].size === 0) {
            label.data.splice(i, 1);
            i--;
        }
    }
}
function checkLabels(lables) {
    let entry = false;
    let names = [];
    let subNames;
    for (let lb of lables) {
        if (names.includes(lb.name)) {
            const err = {
                type: localError.REDEFINITON,
                message: "Redefinition of '" + lb.name + "'",
                otherInfo: true,
                fromColumn: 0,
                toColumn: 100,
                fromLine: lb.code[0] != undefined ? lb.code[0].lineNumber - 1 : 0,
                toLine: lb.code[0] != undefined ? lb.code[0].lineNumber - 1 : 0,
                sourceLines: [lb.name + ":"],
                moduleName: lb.scope[0]
            };
            localError.printExit(err);
        }
        names.push(lb.name);
        if (lb.name === "_code")
            entry = true;
        subNames = [];
        for (let sublb of lb.subLabels) {
            if (subNames.includes(sublb.name)) {
                const err = {
                    type: localError.REDEFINITON,
                    message: "Redefinition of sublabel '" + sublb.name + "'",
                    otherInfo: true,
                    fromColumn: 1,
                    toColumn: 100,
                    fromLine: sublb.code[0] != undefined ? sublb.code[0].lineNumber - 1 : 0,
                    toLine: sublb.code[0] != undefined ? sublb.code[0].lineNumber - 1 : 0,
                    sourceLines: ["\t" + sublb.name + ":"],
                    moduleName: sublb.scope[0]
                };
                localError.printExit(err);
            }
            subNames.push(sublb.name);
        }
    }
    if (!entry) {
        const err = {
            type: localError.SYMBOL_NOT_DEFINED,
            message: "Undefined reference to _code entry point",
            otherInfo: false
        };
        localError.printExit(err);
    }
}
function setData(labels) {
    checkLabels(labels);
    for (let lb of labels) {
        handleSubLabelAccess(lb);
        handleByteWordCast(lb);
        handleReserveBytes(lb);
        handleLiteralStrings(lb);
        handleMacros(lb);
        for (let sublb of lb.subLabels) {
            handleSubLabelAccess(sublb);
            handleByteWordCast(sublb);
            handleReserveBytes(sublb);
            handleLiteralStrings(sublb);
            handleMacros(sublb);
        }
    }
    for (let lb of labels) {
        let rules = [];
        lb.code.forEach(line => {
            let rule = matchRules(line, addressingRules);
            if (rule != null)
                rules.push(rule);
        });
        rules.forEach(rule => {
            lb.data.push(...rule.handleRule(rule.args, lb.scope, lb.code, rule.line));
            for (let i = 0; i < lb.code.length; i++) {
                if (rule.line === lb.code[i])
                    lb.code.splice(i, 1);
            }
        });
    }
    for (let lb of labels) {
        lb.data = lb.data.sort((a, b) => a.position > b.position ? 1 : -1);
        for (let sublb of lb.subLabels) {
            sublb.data = sublb.data.sort((a, b) => a.position > b.position ? 1 : -1);
        }
    }
    for (let lb of labels) {
        handleLiteralNumbers(lb);
        removeNull(lb);
        for (let sublb of lb.subLabels) {
            handleLiteralNumbers(sublb);
            removeNull(lb);
        }
    }
    debugLabelDataHexDump(labels);
}
function setBinary(labels) {
}
function symbolToString(sym, showValue = false) {
    return sym.scope.join(".").cyan + ".".green + sym.name.green + (showValue ? ": " + sym.value : "");
}
function debugSymbolTable() {
    symbolTable.forEach(sym => {
        console.log(symbolToString(sym, true));
    });
}
function debugLines(lines) {
    lines.forEach(line => {
        for (let i = 0; i < line.indentLevel; i++)
            process.stdout.write("\t");
        line.tokens.forEach(token => {
            if (token.type === "identifier") {
                process.stdout.write(token.value.magenta);
            }
            else if (token.type === "number") {
                process.stdout.write(token.value.yellow);
            }
            else if (token.type === "reserved") {
                process.stdout.write(token.value.cyan);
            }
            else if (token.type === "string") {
                process.stdout.write(token.value.green);
            }
            else {
                process.stdout.write(token.value);
            }
            process.stdout.write(" ");
        });
        console.log("");
    });
}
function debugLabels(labels) {
    labels.forEach(l => {
        console.log("symbol: " + l.scope.join(".").cyan + ".".green + l.name.green);
        console.log("address: " + (l.address === "unresolved" ? "unresolved".red : String(l.address).green));
        console.log("size: " + (l.size === "unresolved" ? "unresolved".red : String(l.size).green));
        l.subLabels.forEach(sl => {
            console.log("├→\tsymbol: " + sl.scope.join(".").cyan + ".".green + sl.name.green);
            console.log("├→\taddress: " + (sl.address === "unresolved" ? "unresolved".red : String(sl.address).green));
            console.log("└→\tsize: " + (sl.size === "unresolved" ? "unresolved".red : String(sl.size).green));
        });
        console.log("\n");
    });
}
function debugData(labels) {
    for (let l of labels) {
        console.log(l.name.cyan);
        for (let d of l.data) {
            console.log(d);
        }
        for (let sl of l.subLabels) {
            console.log("\t - " + sl.name.cyan);
            for (let d of sl.data) {
                console.log(d);
            }
        }
    }
}
function debugLabelDataHexDump(labels) {
    const hexDump = (label, isSub = false) => {
        console.log((isSub ? "\t" : "") + label.name.cyan);
        let i = 0;
        process.stdout.write(isSub ? "\t" : "");
        for (let data of label.data) {
            if (data.resolve === "value") {
                let hex = data.value.toString(16).toUpperCase();
                let len = hex.length;
                for (let j = 0; j < (data.size * 2) - len; j++) {
                    hex = "0" + hex;
                }
                let bytes = [];
                for (let j = 0; j < hex.length; j += 2) {
                    bytes.push(hex.substring(j, j + 2));
                }
                hex = bytes.join(" ");
                process.stdout.write(hex + " ");
                i += bytes.length;
                if (i % 8 === 0) {
                    console.log();
                    process.stdout.write(isSub ? "\t" : "");
                }
            }
            else if (data.resolve === "symbol") {
                process.stdout.write(data.symbol.green + " ");
            }
            else if (data.resolve === "instruction") {
                process.stdout.write(data.instruction.toUpperCase().red + " ");
            }
        }
        console.log();
    };
    for (let lb of labels) {
        hexDump(lb);
        for (let subLb of lb.subLabels) {
            hexDump(subLb, true);
        }
    }
}
