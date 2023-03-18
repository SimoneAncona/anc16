import isa from "../../../../data/anc16_isa.json"
import { printExit, LocalError } from "./localError";

// addressing rules
export type Addressing =
	"absolute" |
	"absoluteIndexed" |
	"accumulatorRegister" |
	"accumulatorHighRegister" |
	"accumulatorLowRegister" |
	"baseRegister" |
	"baseHighRegister" |
	"baseLowRegister" |
	"immediate" |
	"implied" |
	"indexRegister" |
	"indirect" |
	"indirectIndexed" |
	"relative" |
	"relativeUsingJ" |
	"zeroPage" |
	"zeroPageIndexed"
	;

export function getOpcode(mnemonic: string, addressing: Addressing): number {
	for (let ins of isa) {
		if (ins.mnemonic.toLowerCase() == mnemonic.toLowerCase()) {
			for (let opc of ins.opcodes) {
				if (opc.addressingMode === addressing) return Number(opc.opcode);
			};
		}
	};
	return null;
}