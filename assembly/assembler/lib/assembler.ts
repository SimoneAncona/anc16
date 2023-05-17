import { Error, SYMBOL_NOT_DEFINED, UNDEFINED_PTR_REFERENCE, UNRECOGNIZED_ADDRESSING_MODE, VALUE_SIZE_OVERFLOW, lineToString, printExit } from "./localError";
import * as colors from "colors";
import { HeaderSetter } from "./headerSetter";
import { parse } from "./parser";
import { getLabels, preProcess } from "./preProcessor";
import { setData } from "./data";
import { getBinary, setBinary } from "./binary";

colors.enable();

// --- MAIN FUNCTION ---
export function assemble
	(
		sourceString: string,
		moduleName = "_main",
		options = {
			useHeader: false,
			zerosToCode: false,
			setSymbolRef: false,
			symbolRefFile: false,
			accessFileSystem: false,
			accessVideoMem: false,
			highPrivileges: false
		}
	): {
		bin: Uint8Array,
		ref: string
	} {
	console.time("Assembly finished in");
	let lines = parse(sourceString, moduleName);
	preProcess(lines, moduleName);
	let labels = getLabels(lines);
	if (labels.length == 0) {
		process.stdout.write("! ".yellow);
		console.log("Empty source");
		console.timeEnd("Assembly finished in");
	}
	let symbolRef: Array<{ symbol: string, address: Uint8Array }> = [];
	let ref = "";

	setData(labels);
	for (let lb of labels) {
		if (lb.address === "unresolved") unresolvedAddress(lb.name);
		let addrTemp = new Uint8Array(2);
		addrTemp[0] = lb.address as number >> 8;
		addrTemp[1] = lb.address as number & 0x00FF;
		symbolRef.push({ symbol: lb.name, address: addrTemp });
		if (options.symbolRefFile) {
			ref += "USE " + lb.name + " AS 0x" + (lb.address as number).toString(16).toUpperCase() + "\n";
		}
	}
	setBinary(labels);

	let bin = getBinary(labels);
	if (options.useHeader) {
		let headerSettings = new HeaderSetter()
			.setAccessFileSystem(options.accessFileSystem)
			.setAccessVideoMem(options.accessVideoMem)
			.setHighPrivileges(options.highPrivileges)
			.setVersion(1);

		if (options.setSymbolRef)
			headerSettings.setSymbolTable(symbolRef);

		let header = headerSettings.generateHeader();

		let tempBin = new Uint8Array(bin.length + header.length);
		tempBin.set(header, 0);
		tempBin.set(bin, header.length);
		bin = tempBin;
	}
	if (options.zerosToCode) {
		let zeros = new Uint8Array(labels[0].address as number);
		let tempBin = new Uint8Array(bin.length + zeros.length);
		tempBin.set(zeros, 0);
		tempBin.set(bin, zeros.length);
		bin = tempBin
	}
	process.stdout.write("✓ ".green);
	console.timeEnd("Assembly finished in");
	return { bin: bin, ref: ref };
}
// --- ---

function unresolvedAddress(lbname: string) {
	const err: Error = {
		type: UNDEFINED_PTR_REFERENCE,
		message: "Cannot resolve the address of '" + lbname + "'",
		otherInfo: false
	};
	printExit(err);
}
