import { LocalSymbol, SymbolTable } from "./types";

export let symbolTable: SymbolTable;
symbolTable = [];


export function getSymbol(name: string): LocalSymbol | null {
	for (let s of symbolTable) {
		if (s.name === name) return s;
	}
	return null;
}