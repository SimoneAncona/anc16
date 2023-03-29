import isa from "../../data/anc16_isa.json"

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

export type Ins = { mnemonic: string, addressing: Addressing };
export function getMnemonicAddressing(opcode: number): Ins | null {
	for (let ins of isa) {
		for (let opc of ins.opcodes) {
			if (Number(opc.opcode) === opcode) {
				if (opc.addressingMode === "immediate") 
					return { mnemonic: ins.mnemonic, addressing: opc.addressingMode + opc.argNBytes as Addressing };
				return { mnemonic: ins.mnemonic, addressing: opc.addressingMode as Addressing };
			}
		}
	}
	return null;
}