import isa from "../../../data/anc16_isa.json"

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
	"immediate1" |
	"immediate2" |
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
				let immSize = 0;
				if (addressing === "immediate1") immSize = 1;
				else if (addressing === "immediate2") immSize = 2;
				if (opc.addressingMode === "immediate" && opc.argNBytes === immSize) return Number(opc.opcode);
			};
		}
	};
	return null;
}