import isa from "./anc16_isa.json";
import { AddressingMode, Instruction } from "./types.js";

export function getInfo(opcode: number) {
    for (let ins of isa) {
        for (let opc of ins.opcodes) {
            if (Number.parseInt(opc.opcode) === opcode) return {
                mnemonic: ins.mnemonic.toLowerCase() as Instruction,
                addressing: opc.addressingMode as AddressingMode === "immediate" ? (opc.addressingMode + opc.argNBytes as AddressingMode) : opc.addressingMode as AddressingMode,
                needPrivileges: ins.needPrivileges
            };
        }
    }
    return null;
}