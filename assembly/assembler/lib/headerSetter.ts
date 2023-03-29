/*
Header format:
0		1		2		3		4		5		6		7
A		N		C		1		6		v_flags	entry	lang	
osId	s_symb					...
							... end_symb ... NUL NUL

v_flags: 8 bit flags	
	0 		1 		2 		3 		4 		5 		6 		7
	| Unused| 		| 	version		|	fsAccess  video    high
entry: entry point address relative to position 0 (where is 'A')
lang: language compiled:
	0 - ANC16 assembly
	1 - C
	2 - C++
	3 - ANC P
	4 - ANC FP
	5 - other
osId: operative system id
	0 - Test
	1 - AncOS
	2 - other
s_symb: starting the symbol table
	symbol name, NUL, 2 bytes address
	symbol name, NUL, 2 bytes address
	symbol name, NUL, 2 bytes address
	...
	symbol name, NUL, 2 bytes address
end_symb: end of symbol table
NUL NUL: end of header

*/

type Language = "ANC16" | "C" | "C++" | "ANCP" | "ANCFP" | "other";
type OS = "test" | "ANC" | "other";

export class HeaderSetter {
	private headerOptions: {
		magic: "ANC16",
		version: number,
		authFlags: {
			accessVideoMem: boolean,
			accessFileSystem: boolean,
			highPrivileges: boolean
		},
		entryPoint: number
		language: Language
		osId: OS
		symbolTable: Array<{ symbol: string, address: Uint8Array }>
	}

	constructor() {
		this.headerOptions = {
			magic: "ANC16",
			version: 1,
			authFlags: {
				accessVideoMem: false,
				accessFileSystem: false,
				highPrivileges: false
			},
			entryPoint: 0,
			language: "ANC16",
			osId: "ANC",
			symbolTable: [],
		}
	}

	setAccessVideoMem(flag: boolean) {
		this.headerOptions.authFlags.accessVideoMem = flag;
		return this;
	}

	setAccessFileSystem(flag: boolean) {
		this.headerOptions.authFlags.accessFileSystem = flag;
		return this;
	}

	setHighPrivileges(flag: boolean) {
		this.headerOptions.authFlags.highPrivileges = flag;
		return this;
	}

	setVersion(version: number) {
		this.headerOptions.version = version;
		return this;
	}

	setSymbolTable(symbolTable: Array<{ symbol: string, address: Uint8Array }>) {
		this.headerOptions.symbolTable = symbolTable;
		return this;
	}

	private getLangCode(lang: Language): number {
		let langDB: Array<{ lang: Language, code: number }> = [
			{ lang: "ANC16", code: 0 },
			{ lang: "C", code: 1 },
			{ lang: "C++", code: 2 },
			{ lang: "ANCP", code: 3 },
			{ lang: "ANCFP", code: 4 },
			{ lang: "other", code: 5 }
		];
		for (let l of langDB) {
			if (l.lang === lang) return l.code;
		}
	}

	private getOS(os: OS) {
		let osDB: Array<{ name: OS, code: number }> = [
			{ name: "test", code: 0 },
			{ name: "ANC", code: 1 },
			{ name: "other", code: 2 },
		];
		for (let o of osDB) {
			if (o.name === os) return o.code;
		}
	}

	generateHeader(): Uint8Array {
		let size = 11;
		let overflow = false;
		for (let s of this.headerOptions.symbolTable) {
			size += s.symbol.length + 1 + 2;
		}
		if (size > 255) {
			size = 11;
			overflow = true;
		}
		let buffer = new Uint8Array(size);
		buffer[0] = "A".charCodeAt(0);
		buffer[1] = "N".charCodeAt(0);
		buffer[2] = "C".charCodeAt(0);
		buffer[3] = "1".charCodeAt(0);
		buffer[4] = "6".charCodeAt(0);
		buffer[5] =
			this.headerOptions.version << 3
			| Number(this.headerOptions.authFlags.accessFileSystem) << 2
			| Number(this.headerOptions.authFlags.accessVideoMem) << 1
			| Number(this.headerOptions.authFlags.highPrivileges);
		buffer[6] = size;
		buffer[7] = this.getLangCode(this.headerOptions.language);
		buffer[8] = this.getOS(this.headerOptions.osId);

		let j = 9;
		if (!overflow) {
			for (let i = 0; i < this.headerOptions.symbolTable.length; i++) {
				let tempA: Array<number> = [];
				for (let k = 0; k < this.headerOptions.symbolTable[i].symbol.length; k++)
					tempA.push(this.headerOptions.symbolTable[i].symbol.charCodeAt(k));
				tempA.push(0);
				buffer.set(tempA, j);
				j += tempA.length;
				buffer.set(this.headerOptions.symbolTable[i].address, j);
				j += 2;
			}
		}

		buffer[j] = 0;
		buffer[j + 1] = 0;

		return buffer;
	}
}