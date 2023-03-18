"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var anc16_isa_json_1 = __importDefault(require("./anc16_isa.json"));
var err = false;
var avAddr = [
    "absolute",
    "absoluteIndexed",
    "accumulatorRegister",
    "accumulatorHighRegister",
    "accumulatorLowRegister",
    "baseRegister",
    "baseHighRegister",
    "baseLowRegister",
    "immediate",
    "implied",
    "indexRegister",
    "indirect",
    "indirectIndexed",
    "relative",
    "relativeUsingJ",
    "zeroPage",
    "zeroPageIndexed"
];
var needPrivileges = [
    "CLD",
    "CLI",
    "CLS",
    "KILL",
    "LDDR",
    "LIMH",
    "LIML",
    "LEMH",
    "LEML",
    "REST",
    "SED",
    "SEI",
    "SES",
    "TADR",
    "TAEMH",
    "TAEML",
    "TAIMH",
    "TAIML"
];
var allIns = ['ADA', 'ADB', 'ANA', 'ANB', 'ARET', 'CLC', 'CLD', 'CLI', 'CLO', 'CLS', 'CMAH', 'CMBH', 'CMPA', 'CMPB', 'CMPI', 'CPUID', 'DEA', 'DEB', 'DEI', 'DEJ', 'INA', 'INB', 'INI', 'INJ', 'JCC', 'JCS', 'JEQ', 'JMP', 'JNC', 'JNE', 'JNS', 'JOC', 'JOS', 'KILL', 'LDA', 'LDAH', 'LDAL', 'LDB', 'LDBH', 'LDBL', 'LDDR', 'LDI', 'LDJ', 'LDSP', 'LIMH', 'LIML', 'LEMH', 'LEML', 'LDSR', 'MSB', 'NOP', 'ORA', 'ORB', 'PSH', 'READ', 'REST', 'RET', 'SED', 'SEI', 'SEMH', 'SEML', 'SES', 'SHL', 'SHR', 'SIMH', 'SIML', 'STAH', 'STB', 'STBH', 'STI', 'STJ', 'STPC', 'STSR', 'SUA', 'SUB', 'SYS', 'TAB', 'TABH', 'TABL', 'TADR', 'TAEMH', 'TAEML', 'TAHJ', 'TAI', 'TAIMH', 'TAIML', 'TBA', 'TBAH', 'TBAL', 'TBHJ', 'TBI', 'TISP', 'TSPB', 'WRTE', 'WRTI', 'XORA', 'XORB'];
function printError(mnemonic, message) {
    console.error("ERROR: " + mnemonic + "\n\t" + message + "\n");
    err = true;
}
function checkForSameOpcode() {
    var opcodes = [];
    var instructs = [];
    anc16_isa_json_1["default"].forEach(function (ins) {
        checkForCorrectMnemonicFormat(ins.mnemonic);
        ins.opcodes.forEach(function (opcode) {
            if (opcodes.includes(opcode.opcode)) {
                printError(ins.mnemonic, "Op code must be unique. " + opcode.opcode + " already assigned to " + instructs[opcodes.indexOf(opcode.opcode)]);
            }
            checkForCorrectOpcodeFormat(ins.mnemonic, opcode.opcode);
            opcodes.push(opcode.opcode);
            instructs.push(ins.mnemonic);
        });
    });
}
function checkForCorrectMnemonicFormat(mnemonic) {
    if (mnemonic.toUpperCase() !== mnemonic) {
        printError(mnemonic, "Instructions must have capital letters: " + mnemonic + " -> " + mnemonic.toUpperCase());
    }
}
function checkForCorrectOpcodeFormat(mnemonic, opcode) {
    if (!opcode.startsWith("0x")) {
        printError(mnemonic, "opcodes must be hex values: " + opcode);
        return;
    }
    if (opcode.length < 6) {
        printError(mnemonic, "too few digits opcode " + opcode);
        return;
    }
    if (opcode.length > 6) {
        printError(mnemonic, "too many digits opcode " + opcode);
        return;
    }
}
function checkAddrressingErrors() {
    anc16_isa_json_1["default"].forEach(function (ins) {
        var addr = [];
        ins.opcodes.forEach(function (opc) {
            if (!avAddr.includes(opc.addressingMode)) {
                printError(ins.mnemonic, "Unrecognized addressing mode: " + opc.addressingMode);
            }
            else if (addr.includes(opc.addressingMode + opc.argNBytes) && opc.addressingMode !== "implied" && ins.mnemonic !== "NOP") {
                printError(ins.mnemonic, "Cannot have two or more equal addrressing in the same instruction with same argument size");
            }
            else if ((opc.addressingMode === "absolute" ||
                opc.addressingMode === "absoluteIndexed" ||
                opc.addressingMode === "indirect" ||
                opc.addressingMode === "indirectIndexed") && opc.argNBytes != 2) {
                printError(ins.mnemonic, "Incompatible argNByte for this addressing mode: " + opc.addressingMode + ". argNByte must be 2");
            }
            else if ((opc.addressingMode === "zeroPage" ||
                opc.addressingMode === "zeroPageIndexed" ||
                opc.addressingMode === "relative") && opc.argNBytes != 1) {
                printError(ins.mnemonic, "Incompatible argNByte for this addressing mode: " + opc.addressingMode + ". argNByte must be 1");
            }
            else if ((opc.addressingMode === "accumulatorHighRegister" ||
                opc.addressingMode === "accumulatorLowRegister" ||
                opc.addressingMode === "baseHighRegister" ||
                opc.addressingMode === "baseLowRegister" ||
                opc.addressingMode === "baseRegister" ||
                opc.addressingMode === "implied" ||
                opc.addressingMode === "indexRegister" ||
                opc.addressingMode === "relativeUsingJ") && opc.argNBytes != 0) {
                printError(ins.mnemonic, "Incompatible argNByte for this addressing mode: " + opc.addressingMode + ". argNByte must be 0");
            }
            else if (opc.opcode.startsWith("0x0") && opc.argNBytes != 0) {
                printError(ins.mnemonic, "Incompatible argNByte for opcode format: " + opc.opcode + ". argNByte must be 0");
            }
            else if (opc.opcode.startsWith("0x4") && opc.argNBytes != 1) {
                printError(ins.mnemonic, "Incompatible argNByte for opcode format: " + opc.opcode + ". argNByte must be 1");
            }
            else if (opc.opcode.startsWith("0x8") && opc.argNBytes != 2 && ins.mnemonic != "RET") {
                printError(ins.mnemonic, "Incompatible argNByte for opcode format: " + opc.opcode + ". argNByte must be 2");
            }
            else
                addr.push(opc.addressingMode + opc.argNBytes);
        });
    });
}
function checkMissingIns() {
    anc16_isa_json_1["default"].forEach(function (ins) {
        if (allIns.includes(ins.mnemonic)) {
            allIns.splice(allIns.indexOf(ins.mnemonic), 1);
        }
    });
    if (allIns.length != 0) {
        allIns.forEach(function (ins) {
            printError(ins, "The instruction is not present in the JSON database");
        });
    }
}
function countOpcForMnemonic() {
    anc16_isa_json_1["default"].forEach(function (ins) {
        console.log(ins.mnemonic + ": " + ins.opcodes.length);
    });
}
function countOpcodes() {
    var cnt = 0;
    anc16_isa_json_1["default"].forEach(function (ins) {
        cnt += ins.opcodes.length;
    });
    return cnt;
}
function checkPrivileges() {
    anc16_isa_json_1["default"].forEach(function (ins) {
        if (ins.needPrevileges && !(needPrivileges.includes(ins.mnemonic))) {
            printError(ins.mnemonic, "Must not need privileges");
        }
        else if (!ins.needPrevileges && needPrivileges.includes(ins.mnemonic))
            printError(ins.mnemonic, "Must need privileges");
    });
}
checkForSameOpcode();
checkAddrressingErrors();
checkPrivileges();
checkMissingIns();
if (!err) {
    countOpcForMnemonic();
    console.log("Parsed " + countOpcodes() + " opcodes");
    console.log("All claer");
}
else {
    process.exit(1);
}
