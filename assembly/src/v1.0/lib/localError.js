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
exports.printStackExit = exports.printExit = exports.print = exports.FS_ERROR = exports.UNRECOGNIZED_ADDRESSING_MODE = exports.VALUE_SIZE_OVERFLOW = exports.$_REFERENCE_TO_NULL = exports.REDEFINITON = exports.INDENTATION_ERROR = exports.UNEXPECTED_TOKEN = exports.UNEXPECTED_END_OF_LINE = exports.SYMBOL_NOT_DEFINED = exports.GENERIC_SYNTAX_ERROR = exports.INVALID_IDENTIFIER = exports.UNRECOGNIZED_TOKEN = exports.FILE_ALREDY_EXIST = exports.FILE_NOT_FOUND = void 0;
const colors = __importStar(require("colors"));
const process_1 = require("process");
colors.enable();
exports.FILE_NOT_FOUND = { name: "FileNotFound", code: 0x0000 }, exports.FILE_ALREDY_EXIST = { name: "FileAlreadyExist", code: 0x0100 }, exports.UNRECOGNIZED_TOKEN = { name: "SyntaxError", code: 0x0200 }, exports.INVALID_IDENTIFIER = { name: "SyntaxError", code: 0x0201 }, exports.GENERIC_SYNTAX_ERROR = { name: "SyntaxError", code: 0x0202 }, exports.SYMBOL_NOT_DEFINED = { name: "SymbolError", code: 0x0301 }, exports.UNEXPECTED_END_OF_LINE = { name: "SyntaxError", code: 0x0203 }, exports.UNEXPECTED_TOKEN = { name: "SyntaxError", code: 0x0204 }, exports.INDENTATION_ERROR = { name: "SyntaxError", code: 0x0205 }, exports.REDEFINITON = { name: "SymbolError", code: 0x0300 }, exports.$_REFERENCE_TO_NULL = { name: "ReferenceError", code: 0x0400 }, exports.VALUE_SIZE_OVERFLOW = { name: "ValueError", code: 0x500 }, exports.UNRECOGNIZED_ADDRESSING_MODE = { name: "ValueError", code: 0x501 }, exports.FS_ERROR = { name: "FSError", code: 0x0600 };
function print(err) {
    let fixedDigitCode = err.type.code.toString();
    while (fixedDigitCode.length < 5)
        fixedDigitCode = "0" + fixedDigitCode;
    let module = "_main";
    if (err.moduleName !== undefined)
        module = err.moduleName;
    let errorString = `
> ${("ERR" + fixedDigitCode).yellow} ${err.type.name.red}${err.otherInfo ? " @ line: " + err.fromLine.toString().cyan + ", column: " + err.fromColumn.toString().cyan : ""}, module: ${module.green}:
	${err.message}

`;
    if (err.otherInfo) {
        if (err.sourceLines.length == 1) {
            errorString += `\t${(err.fromLine).toString().cyan} | `;
            for (let i = 0; i < err.sourceLines[0].length; i++) {
                if (i < err.fromColumn - 1 || i > err.toColumn)
                    errorString += err.sourceLines[0][i];
                else
                    errorString += err.sourceLines[0][i].red;
            }
        }
        else {
            for (let i = 0; i < err.sourceLines.length; i++) {
                errorString += `\t${(i + err.fromLine).toString().cyan} | `;
                if (i == 0) {
                    for (let j = 0; j < err.sourceLines[i].length; j++) {
                        if (j < err.fromColumn)
                            errorString += err.sourceLines[i][j];
                        else
                            errorString += err.sourceLines[i][j].red;
                    }
                }
                else if (i == err.sourceLines.length - 1) {
                    for (let j = 0; j < err.sourceLines[i].length; j++) {
                        if (j > err.toColumn)
                            errorString += err.sourceLines[i][j];
                        else
                            errorString += err.sourceLines[i][j].red;
                    }
                }
                else {
                    errorString += err.sourceLines[i].red;
                }
            }
        }
    }
    console.error(errorString);
}
exports.print = print;
function printExit(err) {
    print(err);
    (0, process_1.exit)(1);
}
exports.printExit = printExit;
function printStackExit(errs) {
    console.error("Found " + errs.length.toString().red + (errs.length == 1 ? " error" : " errors"));
    errs.forEach(err => {
        print(err);
        console.error("______________________________________________");
    });
    console.error("Found " + errs.length.toString().red + (errs.length == 1 ? " error" : " errors"));
    (0, process_1.exit)(1);
}
exports.printStackExit = printStackExit;
