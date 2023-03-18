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
exports.modulePoolContains = exports.appendModule = exports.write = exports.read = exports.getCWD = exports.setCWD = void 0;
const localError = __importStar(require("./localError"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let cwd = "";
let modulePool;
modulePool = [];
function setCWD(fileName) {
    cwd = path.dirname(fs.realpathSync(fileName));
}
exports.setCWD = setCWD;
function getCWD() {
    return cwd;
}
exports.getCWD = getCWD;
function read(fileName) {
    let sourceFile;
    try {
        sourceFile = fs.readFileSync(fileName);
    }
    catch (e) {
        let err;
        if (e.code == "EISDIR") {
            err = {
                type: localError.FS_ERROR,
                message: "Cannot open a directory as a stream",
                otherInfo: false
            };
            localError.printExit(err);
        }
        err = {
            type: localError.FILE_NOT_FOUND,
            message: "The file '" + fileName + "' was not found",
            otherInfo: false
        };
        localError.printExit(err);
    }
    return sourceFile.toString();
}
exports.read = read;
function write(fileName, str) {
    try {
        if (fs.existsSync(fileName))
            fs.writeFileSync(fileName, str);
        else
            fs.writeFileSync(fileName, str, { flag: "wx" });
    }
    catch {
        const err = {
            type: localError.FILE_ALREDY_EXIST,
            message: "The file or the directory '" + fileName + "' already exist",
            otherInfo: false
        };
        localError.printExit(err);
    }
}
exports.write = write;
function appendModule(modulePath) {
    modulePool.push(path.resolve(modulePath));
}
exports.appendModule = appendModule;
function modulePoolContains(modulePath) {
    let p = path.resolve(modulePath);
    modulePool.forEach(m => {
        if (m === p)
            return true;
    });
    return false;
}
exports.modulePoolContains = modulePoolContains;
