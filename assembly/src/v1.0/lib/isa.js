"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpcode = void 0;
const anc16_isa_json_1 = __importDefault(require("../../../../data/anc16_isa.json"));
function getOpcode(mnemonic, addressing) {
    for (let ins of anc16_isa_json_1.default) {
        if (ins.mnemonic.toLowerCase() == mnemonic.toLowerCase()) {
            for (let opc of ins.opcodes) {
                if (opc.addressingMode === addressing)
                    return Number(opc.opcode);
            }
            ;
        }
    }
    ;
    return null;
}
exports.getOpcode = getOpcode;
