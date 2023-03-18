export class HeaderSetter {
	private headerOptions: {
		magic: "ANC16",
		version: number,
		authFlags: {
			accessVideoMem: boolean,
			accessFileSystem: boolean,
			highPrivileges: boolean
		},
		symbolTable: Array<{ symbol: string, address: number }>
		entryPoint: number
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
			symbolTable: [],
			entryPoint: 0
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

	generateHeader(): Uint8Array {
		return new Uint8Array();
	}
}