function add(n1: number, n2: number, bits: 8 | 16) {
	let ar;
	if (bits === 8) ar = new Uint8Array(3);
	else ar = new Uint16Array(3);
	ar[0] = n1;
	ar[1] = n2;
	ar[2] = ar[0] + ar[1];
	let msb1 = msbit(ar[0], bits); 
	let msb2 = msbit(ar[1], bits);
	let msbr = msbit(ar[2], bits); 
	return {
		result: ar[2],
		overflow: msb1 === msb2 ? msbr !== msb1 : false,
		carry: ar[2] < ar[0] + ar[1],
		zero: ar[2] === 0,
		negative: msbr
	}
}

function and(n1: number, n2: number, bits: 8 | 16) {
	let res = n1 & n2;
	return {
		result: res,
		negative: msbit(res, bits),
		zero: res === 0
	}
}

function or(n1: number, n2: number, bits: 8 | 16) {
	let res = n1 | n2;
	return {
		result: res,
		negative: msbit(res, bits),
		zero: res === 0
	}
}

function xor(n1: number, n2: number, bits: 8 | 16) {
	let res = n1 ^ n2;
	return {
		result: res,
		negative: msbit(res, bits),
		zero: res === 0
	}
}

export function add16bits(n1: number, n2: number) {
	return add(n1, n2, 16);
}

export function add8bits(n1: number, n2: number) {
	return add(n1, n2, 8);
}

export function msbit(n: number, bits: 8 | 16) {
	return (n >> bits - 1) === 1;
}

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

	toHexString() {
		return this.value[0].toString(16).padStart(2, '0').toUpperCase();
	}
	
	add(operand: number) {
		let op = add8bits(this.get(), operand);
		this.set(op.result);
		return op;
	}

	sub(operand: number) {
		let op = add8bits(this.get(), -operand);
		this.set(op.result);
		return op;
	}

	and(operand: number) {
		let op = and(this.get(), operand, 8);
		this.set(op.result);
		return op;
	}

	or(operand: number) {
		let op = or(this.get(), operand, 8);
		this.set(op.result);
		return op;
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

	toHexString() {
		return this.value[0].toString(16).padStart(4, '0').toUpperCase();
	}

	add(operand: number) {
		let op = add16bits(this.get(), operand);
		this.set(op.result);
		return op;
	}

	sub(operand: number) {
		let op = add16bits(this.get(), -operand);
		this.set(op.result);
		return op;
	}

	and(operand: number) {
		let op = and(this.get(), operand, 16);
		this.set(op.result);
		return op;
	}

	or(operand: number) {
		let op = or(this.get(), operand, 16);
		this.set(op.result);
		return op;
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

	toHexString() {
		let high = this.getHigh().toString(16).padStart(2, '0').toUpperCase();
		let low = this.getLow().toString(16).padStart(2, '0').toUpperCase();

		return high.red + low.blue;
	}

	add(operand: number) {
		let op = add16bits(this.get(), operand);
		this.set(op.result);
		return op;
	}

	sub(operand: number) {
		let op = add16bits(this.get(), -operand);
		this.set(op.result);
		return op;
	}

	addHigh(operand: number) {
		let op = add8bits(this.getHigh(), operand);
		this.setHigh(op.result);
		return op;
	}

	addLow(operand: number) {
		let op = add8bits(this.getLow(), operand);
		this.setLow(op.result);
		return op;
	}

	subHigh(operand: number) {
		let op = add8bits(this.getHigh(), -operand);
		this.setHigh(op.result);
		return op;
	}

	subLow(operand: number) {
		let op = add8bits(this.getLow(), -operand);
		this.setLow(op.result);
		return op;
	}

	and(operand: number) {
		let op = and(this.get(), operand, 16);
		this.set(op.result);
		return op;
	}

	or(operand: number) {
		let op = or(this.get(), operand, 16);
		this.set(op.result);
		return op;
	}

	andLow(operand: number) {
		let op = and(this.getLow(), operand, 8);
		this.setLow(op.result);
		return op;
	}

	orLow(operand: number) {
		let op = or(this.getLow(), operand, 8);
		this.setLow(op.result);
		return op;
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
		return Boolean(this.value[0] >> 7);
	}

	getO() {
		return Boolean(this.value[0] >> 6 & 0x01);
	}

	getI() {
		return Boolean(this.value[0] >> 5 & 0x01);
	}

	getD() {
		return Boolean(this.value[0] >> 4 & 0x01);
	}

	getS() {
		return Boolean(this.value[0] >> 3 & 0x01);
	}

	getZ() {
		return Boolean(this.value[0] >> 1 & 0x01);
	}

	getC() {
		return Boolean(this.value[0] & 0x01);
	}

	setN(value: boolean) {
		value ? this.setbits(7) : this.clearbits(7);
	}

	setO(value: boolean) {
		value ? this.setbits(6) : this.clearbits(6);
	}

	setI(value: boolean) {
		value ? this.setbits(5) : this.clearbits(5);
	}
	setD(value: boolean) {
		value ? this.setbits(4) : this.clearbits(4);
	}

	setS(value: boolean) {
		value ? this.setbits(3) : this.clearbits(3);
	}

	setZ(value: boolean) {
		value ? this.setbits(1) : this.clearbits(1);
	}

	setC(value: boolean) {
		value ? this.setbits(0) : this.clearbits(0);
	}

	private clearbits(position: number) {
		this.value[0] = this.value[0] & (~(1 << position));
	}

	private setbits(position: number) {
		this.value[0] = this.value[0] | (1 << position);
	}

	toString() {
		let str = "";
		str += this.getN() ? "N ".green : "n ".red;
		str += this.getO() ? "O ".green : "o ".red;
		str += this.getI() ? "I ".green : "i ".red;
		str += this.getD() ? "D ".green : "d ".red;
		str += this.getS() ? "S ".green : "s ".red;
		str += "1 ";
		str += this.getZ() ? "Z ".green : "z ".red;
		str += this.getC() ? "C ".green : "c ".red;
		return str;
	}
}