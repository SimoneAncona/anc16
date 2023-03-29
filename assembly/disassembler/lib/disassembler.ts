import { Ins, getMnemonicAddressing } from "./isa";
import { Error, HEADER_ERROR, printExit } from "./localError";

type Labels = Array<{ name: string, address: number }>;
let codeA = -1;

export function disassemble(buffer: Uint8Array, options: { useHeader: boolean, comments: boolean, zeros: boolean }): string {
	let out: string = "";
	let labels: Labels = [];
	let index = 0;
	if (options.useHeader) {
		index = handleHeader(buffer, labels, options.zeros) - 1;
		out += "ORG 0x" + codeA.toString(16).toUpperCase() + "\n"; 
	}

	for (; index < buffer.length;) {
		let label = handleLabel(index, labels);
		if (label !== null) out += label + "\n";
		if (index !== buffer.length - 1) {
			let opc = buffer[index] << 8 | buffer[index + 1];
			if (opc != 0) {
				let ins = getMnemonicAddressing(opc);
				if (ins !== null) {
					index += 2;
					let i = handleIns(ins, buffer, index);
					out += "\t" + i.ins + "\n";
					index = i.next;
					continue;
				} else if (printable(buffer[index])) {
					let lastIndex = index;
					let str = "";
					let currentLabel = getLabel(index, labels);
					for (;
						index < buffer.length
						&& printable(buffer[index])
						&& currentLabel === getLabel(index, labels)
						; index++
					) {
						str += String.fromCharCode(buffer[index]);
					}

					if (str.length > 3) {
						out += "\t\"" + str + "\"\n";
						continue;
					}
					index = lastIndex;
				}
			} else {
				let lastIndex = index;
				index += 2;
				let currentLabel = getLabel(index, labels);
				for (; index < buffer.length && buffer[index] === 0 && currentLabel === getLabel(index, labels); index++);

				if (index - lastIndex === 2) {
					out += "\tWORD 0\n";
					continue;
				}
				out += "\tRESERVE " + (index - lastIndex) + "\n";
				continue;
			}
		}
		out += "\tBYTE 0x" + (buffer[index]).toString(16).toUpperCase() + "\n";
		index++;
	}
	return out;
}

function printable(num: number): boolean {
	return num >= 0x20 && num <= 0x7E;
}

function handleLabel(index: number, labels: Labels) {
	for (let lb of labels) {
		if (lb.address === index) return lb.name + ":";
	}
	return null;
}

function getLabel(index: number, labels: Labels) {
	let low = false;
	for (let lb of labels) {
		if (lb.address <= index) low = true;
		if (lb.address > index && low) return lb.name;
	}
}

function handleIns(ins: Ins, buffer: Uint8Array, index: number): { ins: string, next: number } {
	let str = ins.mnemonic;
	switch(ins.addressing) {
		case "absolute": {
			str += " 0x" + (buffer[index] << 8 | buffer[index + 1]).toString(16).toUpperCase();
			index += 2;
			break;
		}
		case "absoluteIndexed": {
			str += " 0x" + (buffer[index] << 8 | buffer[index + 1]).toString(16).toUpperCase() + ", I";
			index += 2;
			break;
		}
		case "accumulatorRegister": {
			str += " A";
			break;
		}
		case "accumulatorHighRegister": {
			str += " AH";
			break;
		}
		case "accumulatorLowRegister": {
			str += " AL";
			break;
		}
		case "baseRegister": {
			str += " B";
			break;
		}
		case "baseHighRegister": {
			str += " BH";
			break;
		}
		case "baseLowRegister": {
			str += " BL";
			break;
		}
		case "immediate1": {
			str += " # BYTE 0x" + (buffer[index]).toString(16).toUpperCase();
			index += 1;
			break;
		}
		case "immediate2": {
			str += " # WORD 0x" + (buffer[index] << 8 | buffer[index + 1]).toString(16).toUpperCase();
			index += 2;
			break;
		}
		case "implied": { break; }
		case "indexRegister": {
			str += " I";
			break;
		}
		case "indirect": {
			str += " [0x" + (buffer[index] << 8 | buffer[index + 1]).toString(16).toUpperCase() + "]";
			index += 2;
			break;
		}
		case "indirectIndexed": {
			str += " [0x" + (buffer[index] << 8 | buffer[index + 1]).toString(16).toUpperCase() + "], I";
			index += 2;
			break;
		}
		case "relative": {
			str += " * 0x" + (buffer[index]).toString(16).toUpperCase();
			index += 1;
			break;
		}
		case "relativeUsingJ": {
			str += " * J";
			break;
		}
		case "zeroPage": {
			str += " % 0x" + (buffer[index]).toString(16).toUpperCase();
			index += 1;
			break;
		}
		case "zeroPageIndexed": {
			str += " % 0x" + (buffer[index]).toString(16).toUpperCase() + ", I";
			index += 1;
			break;
		}
	}
	return { ins: str, next: index };
}

function handleHeader(buffer: Uint8Array, labels: Labels, withZeros: boolean): number {
	if (buffer.length < 11 || (buffer.length > 11 && buffer.length < 15)) {
		const err: Error = {
			message: "The standard header is corrupted",
			type: HEADER_ERROR,
			offset: 0
		};
		printExit(err);
	}
	let size = buffer[6];
	if (
		String.fromCharCode(buffer[0]) != "A" ||
		String.fromCharCode(buffer[1]) != "N" ||
		String.fromCharCode(buffer[2]) != "C" ||
		String.fromCharCode(buffer[3]) != "1" ||
		String.fromCharCode(buffer[4]) != "6"
	) {
		const err: Error = {
			message: "Unrecognized header",
			type: HEADER_ERROR,
			offset: 0
		};
		printExit(err);
	}
	if (size == 11)
		return size;
	
	let codeAddr = (buffer[15] << 8 | buffer[16]);
	codeA = codeAddr;
	labels.push({ name: "_code", address: withZeros ? codeAddr + size : size });

	let i = 17;
	while (i < size) {
		let name = "";
		let addr = 0;
		for (; buffer[i] != 0; i++)
			name += String.fromCharCode(buffer[i]);
		
		i++;
		addr = buffer[i] << 8 | buffer[i + 1];
		i += 2;
		labels.push({ name: name, address: withZeros ? (addr + size) : (addr - codeAddr) + size });
	}
	return i;
}