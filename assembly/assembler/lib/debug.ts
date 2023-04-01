import { symbolTable } from "./symbols";
import { Label, Line, LocalSymbol } from "./types";

export function symbolToString(sym: LocalSymbol, showValue = false) {
	return sym.scope.join(".").cyan + ".".green + sym.name.green + (showValue ? ": " + sym.value : "");
}

export function debugSymbolTable() {
	symbolTable.forEach(sym => {
		console.log(symbolToString(sym, true))
	})
}

export function debugLines(lines: Line[]) {
	lines.forEach(line => {
		for (let i = 0; i < line.indentLevel; i++) process.stdout.write("\t");
		line.tokens.forEach(token => {
			if (token.type === "identifier") {
				process.stdout.write(token.value.magenta);
			}
			else if (token.type === "number") {
				process.stdout.write(token.value.yellow)
			}
			else if (token.type === "reserved") {
				process.stdout.write(token.value.cyan)
			}
			else if (token.type === "string") {
				process.stdout.write(token.value.green)
			}
			else {
				process.stdout.write(token.value)
			}
			process.stdout.write(" ");
		});
		console.log("");
	})
}

export function debugLabels(labels: Label[]) {
	labels.forEach(l => {
		console.log("symbol: " + l.scope.join(".").cyan + ".".green + l.name.green);
		console.log("address: " + (l.address === "unresolved" ? "unresolved".red : String(l.address).green));
		console.log("size: " + (l.size === "unresolved" ? "unresolved".red : String(l.size).green));
		l.subLabels.forEach(sl => {
			console.log("├→\tsymbol: " + sl.scope.join(".").cyan + ".".green + sl.name.green);
			console.log("├→\taddress: " + (sl.address === "unresolved" ? "unresolved".red : String(sl.address).green));
			console.log("└→\tsize: " + (sl.size === "unresolved" ? "unresolved".red : String(sl.size).green));
		});
		console.log("\n");
	})
}

export function debugData(labels: Label[]) {
	for (let l of labels) {
		console.log(l.name.cyan);
		for (let d of l.data) {
			console.log(d);
		}
		for (let sl of l.subLabels) {
			console.log("\t - " + sl.name.cyan);
			for (let d of sl.data) {
				console.log(d);
			}
		}
	}
}

export function debugLabelDataHexDump(labels: Label[]) {
	const hexDump = (label: Label, isSub = false) => {
		console.log((isSub ? "\t" : "") + label.name.cyan + " @ " + String(label.address).cyan + " : " + String(label.size).cyan);
		let i = 0;
		process.stdout.write(isSub ? "\t" : "");
		for (let data of label.data) {
			if (data.resolve === "value") {
				let hex = data.value.toString(16).toUpperCase();
				let len = hex.length;
				for (let j = 0; j < (data.size * 2) - len; j++) {
					hex = "0" + hex;
				}
				let bytes = [];
				for (let j = 0; j < hex.length; j += 2) {
					bytes.push(hex.substring(j, j + 2));
				}
				hex = bytes.join(" ");
				process.stdout.write(hex + " ");
				i += bytes.length;
				if (i % 8 === 0) {
					console.log();
					process.stdout.write(isSub ? "\t" : "");
				}
			} else if (data.resolve === "symbol") {
				process.stdout.write(data.symbol.green + " ");
			} else if (data.resolve === "instruction") {
				process.stdout.write(data.instruction.toUpperCase().red + " ");
			} else if (data.resolve === "size") {
				process.stdout.write(data.symbol.magenta + " ");
			} else if (data.resolve === "currentAddress") {
				process.stdout.write("$ ");
			} else {
				process.stdout.write(data.expression.yellow + " ")
			}
		}
		console.log();
	}

	for (let lb of labels) {
		hexDump(lb);
		for (let subLb of lb.subLabels) {
			hexDump(subLb, true);
		}
	}
}

export function debugLabelHexDump(lables: Label[]) {
	const hexDump = (lb: Label) => {
		console.log(lb.name.cyan);
		let i = 0;
		for (let b of lb.binary) {
			let s = b.toString(16).toUpperCase();
			if (s.length == 1) s = "0" + s;
			process.stdout.write(s + " ");
			i++;
			if (i % 8 === 0) {
				console.log();
			}
		}
		console.log()
	}

	for (let lb of lables) hexDump(lb);
}