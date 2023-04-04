export class Register8 {
	private value: Uint8Array;

	constructor() {
		this.value = new Uint8Array(1);
	}

	get() {
		return this.value[0];
	}

	set(value: number) {
		this.value[0] = value;
	}
}

export class Register16 {
	private value: Uint16Array;

	constructor() {
		this.value = new Uint16Array(1);
	}

	get() {
		return this.value[0];
	}

	set(value: number) {
		this.value[0] = value;
	}
}

export class Register16HighLow {
	private value: Uint16Array;

	constructor() {
		this.value = new Uint16Array(1);
	}

	get() {
		return this.value[0];
	}

	set(value: number) {
		this.value[0] = value;
	}

	getHigh() {
		return (this.value[0] & 0xFF00) >> 8;
	}

	getLow() {
		return this.value[0] & 0x00FF; 
	}

	setHigh(value: number) {
		this.value[0] = this.value[0] & 0x00FF | ((value & 0x00FF) << 8);
	}

	setLow(value: number) {
		this.value[0] = this.value[0] & 0xFF00 | (value & 0x00FF);
	}
}

export class StatusRegister {
	private value: Uint8Array;

	constructor() {
		this.value = new Uint8Array(1);
	}

	get() {
		return this.value[0];
	}

	set(value: number) {
		this.value[0] = value;
	}

	getN() {
		return this.value[0] >> 7;
	}

	getO() {
		return this.value[0] >> 6 & 0x01;
	}

	getI() {
		return this.value[0] >> 5 & 0x01;
	}

	getD() {
		return this.value[0] >> 4 & 0x01;
	}

	getS() {
		return this.value[0] >> 3 & 0x01;
	}

	getZ() {
		return this.value[0] >> 1 & 0x01;
	}

	getC() {
		return this.value[0] & 0x01;
	}

	setN(value: boolean) {
		value ? this.setBit(7) : this.clearBit(7);
	}

	setO(value: boolean) {
		value ? this.setBit(6) : this.clearBit(6);
	}

	setI(value: boolean) {
		value ? this.setBit(5) : this.clearBit(5);
	}
	setD(value: boolean) {
		value ? this.setBit(4) : this.clearBit(4);
	}

	setS(value: boolean) {
		value ? this.setBit(3) : this.clearBit(3);
	}

	setZ(value: boolean) {
		value ? this.setBit(1) : this.clearBit(1);
	}

	setC(value: boolean) {
		value ? this.setBit(0) : this.clearBit(0);
	}

	private clearBit(position: number) {
		this.value[0] = this.value[0] & (~(1 << position));
	}

	private setBit(position: number) {
		this.value[0] = this.value[0] | (1 << position);
	}
}