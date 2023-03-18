let ctx
let cpu

window.onload = () => {
	ctx = document.getElementById("system-screen").getContext("2d", {
		alpha: false
	})

	cpu = new ANC16()
}


class RegInt16 {
	r = new Int16Array(1)

	get() {
		return this.r[0]
	}

	set(value) {
		this.r[0] = value
	}
}

class RegInt16HighLow extends RegInt16 {

	getHigh() {
		return this.r[0] >> 8
	}

	getLow() {
		return this.r[0] & 0x00FF
	}

	setHigh(value) {
		this.r[0] &= 0x00FF
		this.r[0] |= value << 8
	}

	setLow(value) {
		this.r[0] &= 0xFF00
		this.r[0] |= value
	}
}

class RegInt8 {
	r = new Int8Array(1)

	get() {
		return this.r[0]
	}

	set(value) {
		this.r[0] = value
	}
}

class RegUint8 {
	r = new Uint8ClampedArray(1)

	get() {
		return this.r[0]
	}

	set(value) {
		this.r[0] = value
	}
}

class Flags8 {
	r = new Uint8ClampedArray(8)

	getN() {
		return this.r[7]
	}

	getO() {
		return this.r[6]
	}

	getI() {
		return this.r[5]
	}

	getD() {
		return this.r[4]
	}

	getZ() {
		return this.r[1]
	}

	getC() {
		return this.r[0]
	}

	setN(value) {
		this.r[7] = value
	}

	setO(value) {
		this.r[6] = value
	}

	setI(value) {
		this.r[5] = value
	}

	setD(value) {
		this.r[4] = value
	}

	setZ(value) {
		this.r[1] = value
	}

	setC(value) {
		this.r[0] = value
	}

	set(value) {
		this.r[7] = value[0];
		this.r[6] = value[1];
		this.r[5] = value[2];
		this.r[4] = value[3];
		this.r[3] = value[4];
		this.r[2] = value[5];
		this.r[1] = value[6];
		this.r[0] = value[7];
	}
}

class Bus {
	b
	constructor(len) {
		this.b = new Uint8ClampedArray(len)
	}
}

function removeSpeed() {
	a = document.getElementById("commands").children;
	for(let i = 0; i < a.length; i++) {
		a[i].classList.remove("selected")
	}
}

class ANC16 {
	iMem = new Uint8ClampedArray(65536)
	eMem = new Uint8ClampedArray(65536)

	MINTIMEOUTDELAYMHZ = 0.00025			// 4 ms of delay using setTimeout
	BASEFREQMHZ = 0.5	// not the real value, just for emulation
	freqMhz = this.BASEFREQMHZ

	sleepTime = 4	// 4 ms is the minimum delay supported
	multiplier = this.freqMhz / this.MINTIMEOUTDELAYMHZ

	screenFreqHz = 25

	a = new RegInt16HighLow()	// Accumulator
	b = new RegInt16HighLow()	// Base register
	i = new RegInt16()			// Index register
	j = new RegInt8()			// "Jump to" register

	pc = new RegInt16()			// Program counter
	ir = new RegInt16()			// Instruction register
	sp = new RegInt16()			// Stack pointer
	sr = new Flags8()			// Status register
	dr = new RegUint8()			// Decremental register
	mli = new RegInt16()		// Memory lower index
	mhi = new RegInt16()		// Memory higher index

	// abus = new Bus(17)			// Address bus
	// dbus = new Bus(16)			// Data bus
	// cbus = new Bus(2)			// Control bus

	// ioabus = new Bus(16)			// IO address bus
	// iodbus = new Bus(8)			// IO data bus
	#vm = ctx.createImageData(240, 180)	// video memory
	#updateScreen
	#updateCpu
	operand = 0		// for instructions
	argbytes = 0	// for instructions
	addressing = ""
	address1 = 0
	address2 = 0

	#isa

	#firmware = new Uint8ClampedArray([
		0x80, 0x55, 0x01, 0x00, 0x80, 0x53, 0x00, 0x00, 0x00, 0x3E, 0x80, 0x72,
		0x00, 0x00, 0x00, 0x04, 0x00, 0x06, 0x80, 0x26, 0x20, 0x0C, 0x40, 0x12,
		0xF2, 0x80, 0x53, 0x00, 0x00, 0x80, 0x54, 0x00, 0x00, 0x80, 0x55, 0x00,
		0x00, 0x40, 0x1C, 0x00, 0x80, 0x58, 0x00, 0x00, 0x80, 0x32, 0x20, 0x04,
		0x41, 0x4E, 0x43
	])

	#DR_INR_VCT 	= 0x2000
	#EIRQ_VCT 		= 0x2002
	#OS_ENTRY_VCT 	= 0x2004
	#NMI_VCT 		= 0x2006
	#BRK_VCT 		= 0x2008
	#PCOOR_VCT 		= 0x200A
	#SPOOR_VCT 		= 0x200C
	#SYS_STACK_PTR 	= 0x3000
	#ROM_START 		= 0xFE00

	constructor() {
		for(let i = 0; i < this.#firmware.length; i++) {
			this.iMem[this.#ROM_START + i] = this.#firmware[i]
		}

		this.#isa = [
			{hex: 0x0014, func: this.ADA, addr: this.baseReg, bytes: 0},
			{hex: 0x4004, func: this.ADA, addr: this.immediate, bytes: 1},
			{hex: 0x4005, func: this.ADA, addr: this.zpg, bytes: 2},
			{hex: 0x4006, func: this.ADA, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x8004, func: this.ADA, addr: this.absolute, bytes: 2},
			{hex: 0x8005, func: this.ADA, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x8006, func: this.ADA, addr: this.indirect, bytes: 2},
			{hex: 0x8007, func: this.ADA, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x8033, func: this.ADA, addr: this.immediate, bytes: 2},
			{hex: 0x0015, func: this.ADB, addr: this.accumulator, bytes: 0},
			{hex: 0x4007, func: this.ADB, addr: this.immediate, bytes: 1},
			{hex: 0x4008, func: this.ADB, addr: this.zpg, bytes: 2},
			{hex: 0x4009, func: this.ADB, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x8008, func: this.ADB, addr: this.absolute, bytes: 2},
			{hex: 0x8009, func: this.ADB, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x800A, func: this.ADB, addr: this.indirect, bytes: 2},
			{hex: 0x800B, func: this.ADB, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x8034, func: this.ADB, addr: this.immediate, bytes: 2},
			{hex: 0x0016, func: this.ANA, addr: this.baseReg, bytes: 0},
			{hex: 0x0018, func: this.ANA, addr: this.indexReg, bytes: 0},
			{hex: 0x400A, func: this.ANA, addr: this.immediate, bytes: 1},
			{hex: 0x400B, func: this.ANA, addr: this.zpg, bytes: 2},
			{hex: 0x400C, func: this.ANA, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x800C, func: this.ANA, addr: this.absolute, bytes: 2},
			{hex: 0x800D, func: this.ANA, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x800E, func: this.ANA, addr: this.indirect, bytes: 2},
			{hex: 0x800F, func: this.ANA, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x8035, func: this.ANA, addr: this.immediate, bytes: 2},
			{hex: 0x0017, func: this.ANB, addr: this.accumulator, bytes: 0},
			{hex: 0x0019, func: this.ANB, addr: this.indexReg, bytes: 0},
			{hex: 0x400D, func: this.ANB, addr: this.immediate, bytes: 1},
			{hex: 0x400E, func: this.ANB, addr: this.zpg, bytes: 2},
			{hex: 0x400F, func: this.ANB, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x8010, func: this.ANB, addr: this.absolute, bytes: 2},
			{hex: 0x8011, func: this.ANB, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x8012, func: this.ANB, addr: this.indirect, bytes: 2},
			{hex: 0x8013, func: this.ANB, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x8036, func: this.ANB, addr: this.immediate, bytes: 2},
			{hex: 0x0002, func: this.ARET, addr: this.implied, bytes: 0},
			{hex: 0x3FFF, func: this.BRK, addr: this.implied, bytes: 0},
			{hex: 0x0010, func: this.CLC, addr: this.implied, bytes: 0},
			{hex: 0x0012, func: this.CLD, addr: this.implied, bytes: 0},
			{hex: 0x0013, func: this.CLI, addr: this.implied, bytes: 0},
			{hex: 0x0011, func: this.CLO, addr: this.implied, bytes: 0},
			{hex: 0x001A, func: this.CMAH, addr: this.bhReg, bytes: 0},
			{hex: 0x403F, func: this.CMAH, addr: this.immediate, bytes: 1},
			{hex: 0x4040, func: this.CMAH, addr: this.zpg, bytes: 1},
			{hex: 0x4041, func: this.CMAH, addr: this.zpgIndexed, bytes: 1},
			{hex: 0x8014, func: this.CMAH, addr: this.absolute, bytes: 1},
			{hex: 0x8015, func: this.CMAH, addr: this.absoluteIndexed, bytes: 1},
			{hex: 0x8016, func: this.CMAH, addr: this.indirect, bytes: 1},
			{hex: 0x8017, func: this.CMAH, addr: this.indirectIndexed, bytes: 1},
			{hex: 0x001B, func: this.CMBH, addr: this.ahReg, bytes: 0},
			{hex: 0x4042, func: this.CMBH, addr: this.immediate, bytes: 1},
			{hex: 0x4043, func: this.CMBH, addr: this.zpg, bytes: 1},
			{hex: 0x4044, func: this.CMBH, addr: this.zpgIndexed, bytes: 1},
			{hex: 0x8018, func: this.CMBH, addr: this.absolute, bytes: 1},
			{hex: 0x8019, func: this.CMBH, addr: this.absoluteIndexed, bytes: 1},
			{hex: 0x801A, func: this.CMBH, addr: this.indirect, bytes: 1},
			{hex: 0x801B, func: this.CMBH, addr: this.indirectIndexed, bytes: 1},
			{hex: 0x001C, func: this.CMPA, addr: this.baseReg, bytes: 0},
			{hex: 0x001E, func: this.CMPA, addr: this.indexReg, bytes: 0},
			{hex: 0x4045, func: this.CMPA, addr: this.zpg, bytes: 2},
			{hex: 0x4046, func: this.CMPA, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x801C, func: this.CMPA, addr: this.absolute, bytes: 2},
			{hex: 0x801D, func: this.CMPA, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x801E, func: this.CMPA, addr: this.indirect, bytes: 2},
			{hex: 0x801F, func: this.CMPA, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x8024, func: this.CMPA, addr: this.immediate, bytes: 2},
			{hex: 0x001D, func: this.CMPB, addr: this.accumulator, bytes: 0},
			{hex: 0x001F, func: this.CMPB, addr: this.indexReg, bytes: 0},
			{hex: 0x4047, func: this.CMPB, addr: this.zpg, bytes: 2},
			{hex: 0x4048, func: this.CMPB, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x8020, func: this.CMPB, addr: this.absolute, bytes: 2},
			{hex: 0x8021, func: this.CMPB, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x8022, func: this.CMPB, addr: this.indirect, bytes: 2},
			{hex: 0x8023, func: this.CMPB, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x8025, func: this.CMPB, addr: this.immediate, bytes: 2},
			{hex: 0x0020, func: this.CMPI, addr: this.accumulator, bytes: 0},
			{hex: 0x4049, func: this.CMPI, addr: this.zpg, bytes: 2},
			{hex: 0x8026, func: this.CMPI, addr: this.immediate, bytes: 2},
			{hex: 0x8027, func: this.CMPI, addr: this.absolute, bytes: 2},
			{hex: 0x8028, func: this.CMPI, addr: this.indirect, bytes: 2},
			{hex: 0x0003, func: this.CPUID, addr: this.implied, bytes: 0},
			{hex: 0x0008, func: this.DEA, addr: this.implied, bytes: 0},
			{hex: 0x0009, func: this.DEB, addr: this.implied, bytes: 0},
			{hex: 0x000A, func: this.DEI, addr: this.implied, bytes: 0},
			{hex: 0x000B, func: this.DEJ, addr: this.implied, bytes: 0},
			{hex: 0x0004, func: this.INA, addr: this.implied, bytes: 0},
			{hex: 0x0005, func: this.INB, addr: this.implied, bytes: 0},
			{hex: 0x0006, func: this.INI, addr: this.implied, bytes: 0},
			{hex: 0x0007, func: this.INJ, addr: this.implied, bytes: 0},
			{hex: 0x0021, func: this.JCC, addr: this.relativeJ, bytes: 1},
			{hex: 0x4010, func: this.JCC, addr: this.relative, bytes: 1},
			{hex: 0x8029, func: this.JCC, addr: this.immediate, bytes: 2},
			{hex: 0x0025, func: this.JCS, addr: this.relativeJ, bytes: 1},
			{hex: 0x4014, func: this.JCS, addr: this.relative, bytes: 1},
			{hex: 0x802D, func: this.JCS, addr: this.immediate, bytes: 2},
			{hex: 0x0056, func: this.JMP, addr: this.accumulator, bytes: 0},
			{hex: 0x0057, func: this.JMP, addr: this.baseReg, bytes: 0},
			{hex: 0x0058, func: this.JMP, addr: this.indexReg, bytes: 0},
			{hex: 0x8031, func: this.JMP, addr: this.immediate, bytes: 2},
			{hex: 0x8032, func: this.JMP, addr: this.absolute, bytes: 2},
			{hex: 0x0024, func: this.JNC, addr: this.relativeJ, bytes: 1},
			{hex: 0x4013, func: this.JNC, addr: this.relative, bytes: 1},
			{hex: 0x802C, func: this.JNC, addr: this.immediate, bytes: 2},
			{hex: 0x0028, func: this.JNS, addr: this.relativeJ, bytes: 1},
			{hex: 0x4017, func: this.JNS, addr: this.relative, bytes: 1},
			{hex: 0x8030, func: this.JNS, addr: this.immediate, bytes: 2},
			{hex: 0x0022, func: this.JOC, addr: this.relativeJ, bytes: 1},
			{hex: 0x4011, func: this.JOC, addr: this.relative, bytes: 1},
			{hex: 0x802A, func: this.JOC, addr: this.immediate, bytes: 2},
			{hex: 0x0026, func: this.JOS, addr: this.relativeJ, bytes: 1},
			{hex: 0x4015, func: this.JOS, addr: this.relative, bytes: 1},
			{hex: 0x802E, func: this.JOS, addr: this.immediate, bytes: 2},
			{hex: 0x0023, func: this.JZC, addr: this.relativeJ, bytes: 1},
			{hex: 0x4012, func: this.JZC, addr: this.relative, bytes: 1},
			{hex: 0x802B, func: this.JZC, addr: this.immediate, bytes: 2},
			{hex: 0x0027, func: this.JZS, addr: this.relativeJ, bytes: 1},
			{hex: 0x4016, func: this.JZS, addr: this.relative, bytes: 1},
			{hex: 0x802F, func: this.JZS, addr: this.immediate, bytes: 2},
			{hex: 0x0001, func: this.KILL, addr: this.implied, bytes: 0},
			{hex: 0x3FFD, func: this.KILL, addr: this.implied, bytes: 0},
			{hex: 0x8086, func: this.KILL, addr: this.absolute, bytes: 2},
			{hex: 0x8037, func: this.LDA, addr: this.absolute, bytes: 2},
			{hex: 0x8038, func: this.LDA, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x8039, func: this.LDA, addr: this.indirect, bytes: 2},
			{hex: 0x803A, func: this.LDA, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x8053, func: this.LDA, addr: this.immediate, bytes: 2},
			{hex: 0x4018, func: this.LDAH, addr: this.immediate, bytes: 1},
			{hex: 0x803B, func: this.LDAH, addr: this.absolute, bytes: 1},
			{hex: 0x803C, func: this.LDAH, addr: this.absoluteIndexed, bytes: 1},
			{hex: 0x803D, func: this.LDAH, addr: this.indirect, bytes: 1},
			{hex: 0x803E, func: this.LDAH, addr: this.indirectIndexed, bytes: 1},
			{hex: 0x4019, func: this.LDAL, addr: this.immediate, bytes: 1},
			{hex: 0x803F, func: this.LDAL, addr: this.absolute, bytes: 1},
			{hex: 0x8040, func: this.LDAL, addr: this.absoluteIndexed, bytes: 1},
			{hex: 0x8041, func: this.LDAL, addr: this.indirect, bytes: 1},
			{hex: 0x8042, func: this.LDAL, addr: this.indirectIndexed, bytes: 1},
			{hex: 0x8043, func: this.LDB, addr: this.absolute, bytes: 2},
			{hex: 0x8044, func: this.LDB, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x8045, func: this.LDB, addr: this.indirect, bytes: 2},
			{hex: 0x8046, func: this.LDB, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x8054, func: this.LDB, addr: this.immediate, bytes: 2},
			{hex: 0x401A, func: this.LDBH, addr: this.immediate, bytes: 1},
			{hex: 0x8047, func: this.LDBH, addr: this.absolute, bytes: 1},
			{hex: 0x8048, func: this.LDBH, addr: this.absoluteIndexed, bytes: 1},
			{hex: 0x8049, func: this.LDBH, addr: this.indirect, bytes: 1},
			{hex: 0x804A, func: this.LDBH, addr: this.indirectIndexed, bytes: 1},
			{hex: 0x401B, func: this.LDBL, addr: this.immediate, bytes: 1},
			{hex: 0x804B, func: this.LDBL, addr: this.absolute, bytes: 1},
			{hex: 0x804C, func: this.LDBL, addr: this.absoluteIndexed, bytes: 1},
			{hex: 0x804D, func: this.LDBL, addr: this.indirect, bytes: 1},
			{hex: 0x804E, func: this.LDBL, addr: this.indirectIndexed, bytes: 1},
			{hex: 0x808A, func: this.LDD, addr: this.absolute, bytes: 2},
			{hex: 0x808B, func: this.LDD, addr: this.indirect, bytes: 2},
			{hex: 0x808C, func: this.LDD, addr: this.immediate, bytes: 2},
			{hex: 0x804F, func: this.LDI, addr: this.absolute, bytes: 2},
			{hex: 0x8050, func: this.LDI, addr: this.indirect, bytes: 2},
			{hex: 0x8055, func: this.LDI, addr: this.immediate, bytes: 2},
			{hex: 0x401C, func: this.LDJ, addr: this.immediate, bytes: 1},
			{hex: 0x404A, func: this.LDJ, addr: this.zpg, bytes: 1},
			{hex: 0x8051, func: this.LDJ, addr: this.absolute, bytes: 1},
			{hex: 0x8052, func: this.LDJ, addr: this.indirect, bytes: 1},
			{hex: 0x8056, func: this.LDS, addr: this.absolute, bytes: 2},
			{hex: 0x8057, func: this.LDS, addr: this.indirect, bytes: 2},
			{hex: 0x8058, func: this.LDS, addr: this.immediate, bytes: 2},
			{hex: 0x404B, func: this.LMHI, addr: this.zpg, bytes: 2},
			{hex: 0x404C, func: this.LMHI, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x808D, func: this.LMHI, addr: this.absolute, bytes: 2},
			{hex: 0x808E, func: this.LMHI, addr: this.indirect, bytes: 2},
			{hex: 0x808F, func: this.LMHI, addr: this.immediate, bytes: 2},
			{hex: 0x404D, func: this.LMLI, addr: this.zpg, bytes: 2},
			{hex: 0x404E, func: this.LMLI, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x8090, func: this.LMLI, addr: this.absolute, bytes: 2},
			{hex: 0x8091, func: this.LMLI, addr: this.indirect, bytes: 2},
			{hex: 0x8092, func: this.LMLI, addr: this.immediate, bytes: 2},
			{hex: 0x000C, func: this.MSB, addr: this.accumulator, bytes: 0},
			{hex: 0x000D, func: this.MSB, addr: this.baseReg, bytes: 0},
			{hex: 0x0000, func: this.NOP, addr: this.implied, bytes: 0},
			{hex: 0x0029, func: this.NOP, addr: this.implied, bytes: 0},
			{hex: 0x002A, func: this.NOP, addr: this.implied, bytes: 0},
			{hex: 0x002B, func: this.NOP, addr: this.implied, bytes: 0},
			{hex: 0x002C, func: this.NOP, addr: this.implied, bytes: 0},
			{hex: 0x002F, func: this.NOP, addr: this.implied, bytes: 0},
			{hex: 0x0030, func: this.NOP, addr: this.implied, bytes: 0},
			{hex: 0x0033, func: this.NOP, addr: this.implied, bytes: 0},
			{hex: 0x0034, func: this.NOP, addr: this.implied, bytes: 0},
			{hex: 0x0035, func: this.NOP, addr: this.implied, bytes: 0},
			{hex: 0x005F, func: this.NOP, addr: this.implied, bytes: 0},
			{hex: 0x3FFC, func: this.NOP, addr: this.implied, bytes: 0},
			{hex: 0x4000, func: this.NOP, addr: this.immediate, bytes: 1},
			{hex: 0x4023, func: this.NOP, addr: this.immediate, bytes: 1},
			{hex: 0x4038, func: this.NOP, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x4053, func: this.NOP, addr: this.immediate, bytes: 1},
			{hex: 0x7FFF, func: this.NOP, addr: this.immediate, bytes: 1},
			{hex: 0x8000, func: this.NOP, addr: this.absolute, bytes: 2},
			{hex: 0x8076, func: this.NOP, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x8078, func: this.NOP, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x80FE, func: this.NOP, addr: this.absolute, bytes: 2},
			{hex: 0x80A9, func: this.NOP, addr: this.absolute, bytes: 2},
			{hex: 0x0036, func: this.ORA, addr: this.baseReg, bytes: 0},
			{hex: 0x0038, func: this.ORA, addr: this.indexReg, bytes: 0},
			{hex: 0x401D, func: this.ORA, addr: this.immediate, bytes: 1},
			{hex: 0x401E, func: this.ORA, addr: this.zpg, bytes: 2},
			{hex: 0x401F, func: this.ORA, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x8059, func: this.ORA, addr: this.absolute, bytes: 2},
			{hex: 0x805A, func: this.ORA, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x805B, func: this.ORA, addr: this.indirect, bytes: 2},
			{hex: 0x805C, func: this.ORA, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x8061, func: this.ORA, addr: this.immediate, bytes: 2},
			{hex: 0x0037, func: this.ORB, addr: this.accumulator, bytes: 0},
			{hex: 0x0039, func: this.ORB, addr: this.indexReg, bytes: 0},
			{hex: 0x4020, func: this.ORB, addr: this.immediate, bytes: 1},
			{hex: 0x4021, func: this.ORB, addr: this.zpg, bytes: 2},
			{hex: 0x4022, func: this.ORB, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x805D, func: this.ORB, addr: this.absolute, bytes: 2},
			{hex: 0x805E, func: this.ORB, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x805F, func: this.ORB, addr: this.indirect, bytes: 2},
			{hex: 0x8060, func: this.ORB, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x8062, func: this.ORB, addr: this.immediate, bytes: 2},
			{hex: 0x003A, func: this.PSH, addr: this.accumulator, bytes: 0},
			{hex: 0x003B, func: this.PSH, addr: this.baseReg, bytes: 0},
			{hex: 0x003C, func: this.PSH, addr: this.ahReg, bytes: 0},
			{hex: 0x003D, func: this.PSH, addr: this.alReg, bytes: 0},
			{hex: 0x005E, func: this.PSHI, addr: this.implied, bytes: 0},
			{hex: 0x4001, func: this.PSH, addr: this.immediate, bytes: 1},
			{hex: 0x4002, func: this.PSH, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x4003, func: this.PSH, addr: this.zpg, bytes: 2},
			{hex: 0x8001, func: this.PSH, addr: this.absolute, bytes: 2},
			{hex: 0x8002, func: this.PSH, addr: this.indirect, bytes: 2},
			{hex: 0x8003, func: this.PSH, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x003E, func: this.READ, addr: this.accumulator, bytes: 0},
			{hex: 0x003F, func: this.READ, addr: this.baseReg, bytes: 0},
			{hex: 0x4024, func: this.READ, addr: this.zpg, bytes: 2},
			{hex: 0x4025, func: this.READ, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x8063, func: this.READ, addr: this.absolute, bytes: 2},
			{hex: 0x8064, func: this.READ, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x3FFE, func: this.REST, addr: this.implied, bytes: 0},
			{hex: 0x80FF, func: this.RET, addr: this.implied, bytes: 0},
			{hex: 0x000F, func: this.SED, addr: this.implied, bytes: 0},
			{hex: 0x000E, func: this.SEI, addr: this.implied, bytes: 0},
			{hex: 0x0040, func: this.SHL, addr: this.accumulator, bytes: 0},
			{hex: 0x0041, func: this.SHL, addr: this.baseReg, bytes: 0},
			{hex: 0x0042, func: this.SHL, addr: this.indexReg, bytes: 0},
			{hex: 0x0043, func: this.SHR, addr: this.accumulator, bytes: 0},
			{hex: 0x0044, func: this.SHR, addr: this.baseReg, bytes: 0},
			{hex: 0x0045, func: this.SHR, addr: this.indexReg, bytes: 0},
			{hex: 0x404F, func: this.SMHI, addr: this.zpg, bytes: 2},
			{hex: 0x4050, func: this.SMHI, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x8093, func: this.SMHI, addr: this.absolute, bytes: 2},
			{hex: 0x8094, func: this.SMHI, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x8095, func: this.SMHI, addr: this.indirect, bytes: 2},
			{hex: 0x8096, func: this.SMHI, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x4051, func: this.SMLI, addr: this.zpg, bytes: 2},
			{hex: 0x4052, func: this.SMLI, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x8097, func: this.SMLI, addr: this.absolute, bytes: 2},
			{hex: 0x8098, func: this.SMLI, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x8099, func: this.SMLI, addr: this.indirect, bytes: 2},
			{hex: 0x809A, func: this.SMLI, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x4026, func: this.STA, addr: this.zpg, bytes: 2},
			{hex: 0x4027, func: this.STA, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x8065, func: this.STA, addr: this.absolute, bytes: 2},
			{hex: 0x8066, func: this.STA, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x8067, func: this.STA, addr: this.indirect, bytes: 2},
			{hex: 0x8068, func: this.STA, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x4028, func: this.STAH, addr: this.zpg, bytes: 2},
			{hex: 0x4029, func: this.STAH, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x8069, func: this.STAH, addr: this.absolute, bytes: 2},
			{hex: 0x806A, func: this.STAH, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x806B, func: this.STAH, addr: this.indirect, bytes: 2},
			{hex: 0x806C, func: this.STAH, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x402A, func: this.STB, addr: this.zpg, bytes: 2},
			{hex: 0x402B, func: this.STB, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x806D, func: this.STB, addr: this.absolute, bytes: 2},
			{hex: 0x806E, func: this.STB, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x806F, func: this.STB, addr: this.indirect, bytes: 2},
			{hex: 0x8070, func: this.STB, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x402C, func: this.STBH, addr: this.zpg, bytes: 2},
			{hex: 0x402D, func: this.STBH, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x8071, func: this.STBH, addr: this.absolute, bytes: 2},
			{hex: 0x8072, func: this.STBH, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x8073, func: this.STBH, addr: this.indirect, bytes: 2},
			{hex: 0x8074, func: this.STBH, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x402E, func: this.STI, addr: this.zpg, bytes: 2},
			{hex: 0x8075, func: this.STI, addr: this.absolute, bytes: 2},
			{hex: 0x8077, func: this.STI, addr: this.indirect, bytes: 2},
			{hex: 0x402F, func: this.STJ, addr: this.zpg, bytes: 2},
			{hex: 0x8079, func: this.STJ, addr: this.absolute, bytes: 2},
			{hex: 0x807A, func: this.STJ, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x807B, func: this.STJ, addr: this.indirect, bytes: 2},
			{hex: 0x807C, func: this.STJ, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x80A7, func: this.STPC, addr: this.absolute, bytes: 2},
			{hex: 0x80A8, func: this.STSR, addr: this.absolute, bytes: 2},
			{hex: 0x0046, func: this.SUA, addr: this.baseReg, bytes: 0},
			{hex: 0x0048, func: this.SUA, addr: this.indexReg, bytes: 0},
			{hex: 0x4030, func: this.SUA, addr: this.immediate, bytes: 1},
			{hex: 0x4031, func: this.SUA, addr: this.zpg, bytes: 2},
			{hex: 0x4032, func: this.SUA, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x807D, func: this.SUA, addr: this.absolute, bytes: 2},
			{hex: 0x807E, func: this.SUA, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x807F, func: this.SUA, addr: this.indirect, bytes: 2},
			{hex: 0x8080, func: this.SUA, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x809B, func: this.SUA, addr: this.immediate, bytes: 2},
			{hex: 0x0047, func: this.SUB, addr: this.accumulator, bytes: 0},
			{hex: 0x0049, func: this.SUB, addr: this.indexReg, bytes: 0},
			{hex: 0x4033, func: this.SUB, addr: this.immediate, bytes: 1},
			{hex: 0x4034, func: this.SUB, addr: this.zpg, bytes: 2},
			{hex: 0x4035, func: this.SUB, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x8081, func: this.SUB, addr: this.absolute, bytes: 2},
			{hex: 0x8082, func: this.SUB, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x8083, func: this.SUB, addr: this.indirect, bytes: 2},
			{hex: 0x8084, func: this.SUB, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x809C, func: this.SUB, addr: this.immediate, bytes: 2},
			{hex: 0x004A, func: this.TAB, addr: this.implied, bytes: 0},
			{hex: 0x002E, func: this.TABH, addr: this.implied, bytes: 0},
			{hex: 0x005A, func: this.TABL, addr: this.implied, bytes: 0},
			{hex: 0x005B, func: this.TAD, addr: this.implied, bytes: 0},
			{hex: 0x0031, func: this.TAHJ, addr: this.implied, bytes: 0},
			{hex: 0x004B, func: this.TAI, addr: this.implied, bytes: 0},
			{hex: 0x005C, func: this.TAMH, addr: this.implied, bytes: 0},
			{hex: 0x005D, func: this.TAML, addr: this.implied, bytes: 0},
			{hex: 0x004C, func: this.TBA, addr: this.implied, bytes: 0},
			{hex: 0x002D, func: this.TBAH, addr: this.implied, bytes: 0},
			{hex: 0x0059, func: this.TBAL, addr: this.implied, bytes: 0},
			{hex: 0x0032, func: this.TBHJ, addr: this.implied, bytes: 0},
			{hex: 0x004D, func: this.TBI, addr: this.implied, bytes: 0},
			{hex: 0x004E, func: this.TIS, addr: this.implied, bytes: 0},
			{hex: 0x004F, func: this.TSB, addr: this.implied, bytes: 0},
			{hex: 0x8085, func: this.WRTE, addr: this.absolute, bytes: 2},
			{hex: 0x8087, func: this.WRTE, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x0050, func: this.WRTI, addr: this.ahReg, bytes: 0},
			{hex: 0x0051, func: this.WRTI, addr: this.bhReg, bytes: 0},
			{hex: 0x4036, func: this.WRTI, addr: this.immediate, bytes: 1},
			{hex: 0x4037, func: this.WRTI, addr: this.zpg, bytes: 2},
			{hex: 0x8088, func: this.WRTI, addr: this.absolute, bytes: 2},
			{hex: 0x8089, func: this.WRTI, addr: this.indirect, bytes: 2},
			{hex: 0x0052, func: this.XORA, addr: this.baseReg, bytes: 0},
			{hex: 0x0054, func: this.XORA, addr: this.indexReg, bytes: 0},
			{hex: 0x4039, func: this.XORA, addr: this.immediate, bytes: 1},
			{hex: 0x403A, func: this.XORA, addr: this.zpg, bytes: 2},
			{hex: 0x403B, func: this.XORA, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x809D, func: this.XORA, addr: this.absolute, bytes: 2},
			{hex: 0x809E, func: this.XORA, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x809F, func: this.XORA, addr: this.indirect, bytes: 2},
			{hex: 0x80A0, func: this.XORA, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x80A5, func: this.XORA, addr: this.immediate, bytes: 2},
			{hex: 0x0053, func: this.XORB, addr: this.accumulator, bytes: 0},
			{hex: 0x0055, func: this.XORB, addr: this.indexReg, bytes: 0},
			{hex: 0x403C, func: this.XORB, addr: this.immediate, bytes: 1},
			{hex: 0x403D, func: this.XORB, addr: this.zpg, bytes: 2},
			{hex: 0x403E, func: this.XORB, addr: this.zpgIndexed, bytes: 2},
			{hex: 0x80A1, func: this.XORB, addr: this.absolute, bytes: 2},
			{hex: 0x80A2, func: this.XORB, addr: this.absoluteIndexed, bytes: 2},
			{hex: 0x80A3, func: this.XORB, addr: this.indirect, bytes: 2},
			{hex: 0x80A4, func: this.XORB, addr: this.indirectIndexed, bytes: 2},
			{hex: 0x80A6, func: this.XORB, addr: this.immediate, bytes: 2},
		]

		this.reset()
	}

	reset = () => {
		this.pc.set(0xFE00)
		this.a.set(0)
		this.b.set(0)
		this.i.set(0)
		this.j.set(0)
		this.ir.set(0)
		this.sp.set(0)
		this.dr.set(0)
		this.mli.set(0)
		this.mhi.set(0)
		this.updateInfo()
	}

	start = () => {	
		this.stop()
		this.loop()
	}

	stop = () => {
		clearInterval(this.#updateCpu)
		clearInterval(this.#updateScreen)
	}

	clear = async () => {
		for(let i = 0x4100; i < 0xe9bf; i++)
			this.eMem[i] = 0;
	}

	#screenHandler = () => {
		for(let i = 0; i < this.#vm.data.length; i += 4) {
			let c8bit = this.eMem[i / 4 + 0x4100]
			let red 	= c8bit & 0b11100000
			let green	= c8bit & 0b00011100
			let blue 	= c8bit & 0b00000011

			red >>= 5
			green >>= 2

			this.#vm.data[i + 0] = red * 32
			this.#vm.data[i + 1] = green * 32
			this.#vm.data[i + 2] = blue * 64
			this.#vm.data[i + 3] = 255
		}
		ctx.putImageData(this.#vm, 0, 0)
	}

	// upload rom
	upload = () => {
		let input = document.createElement('input');
		input.type = 'file';
		input.accept = ".bin, .rom";
		input.onchange = _ => {
			let file = Array.from(input.files)[0];
			file.arrayBuffer().then(
				(e) => {
					let rom = new Uint8Array(e);
					for(let i = 0; i < rom.length; i++){
						this.iMem[i] = rom[i];
					}
				}
			)
		};
		input.click();
	}

	updateFrq = (freq) => {
		this.freqMhz = freq
		this.sleepTime = 1 / freq / 1000
		this.multiplier = 1
		if(freq > this.MINTIMEOUTDELAYMHZ) {
			this.multiplier = freq / this.MINTIMEOUTDELAYMHZ
		}
		this.stop()
		this.loop()
	}

	loop = () => {
		this.#updateScreen = setInterval(this.#screenHandler, 1 / this.screenFreqHz * 1000)
		this.#updateCpu = setInterval(() => {
			for(let i = 0; i < this.multiplier; i++) {
				this.updateInfo()
				this.decode(
					this.fetch(this.pc.get(), 2)
				)
			}
		}, this.sleepTime)
	}

	toUnsigned(value, bytes) {
		if (bytes == 1) return (value >>> 0) & 0x000000FF
		if (bytes == 2) return (value >>> 0) & 0x0000FFFF
	}

	toSigned(value, bytes) {
		if (bytes == 1) return ~(~value & 0x000000FF)
		if (bytes == 2) return ~(~value & 0x0000FFFF)
	}

	fetch(address, bytes) {
		if (bytes == 1) return this.iMem[this.toUnsigned(address, 2)]
		if (bytes == 2) return this.iMem[this.toUnsigned(address, 2)] << 8 | this.iMem[this.toUnsigned(address, 2) + 1]
	}

	write(address, data, bytes) {
		if (bytes == 1) this.iMem[address] = data
		if (bytes == 2) {
			this.iMem[address] = data >> 8
			this.iMem[address + 1] = data & 0x000000FF
		}
	}

	decode(opcode) {
		this.ir.set(opcode)

		for(let i = 0; i < this.#isa.length; i++) {
			if(this.#isa[i].hex == opcode) {
				this.operand = this.#isa[i].addr(this, this.#isa[i].bytes)
				this.argbytes = this.#isa[i].bytes
				this.addressing = this.#isa[i].addr.name
				this.address1 = this.iMem[this.pc.get() + 2]
				this.address2 = this.iMem[this.pc.get() + 2] << 8 & this.iMem[this.pc.get() + 3]
				this.#isa[i].func(this)
			}
		}
	}

	updateInfo = () => {
		document.getElementById("reg-input-ah").value = this.toUnsigned(this.a.getHigh(), 1).toString(16).toUpperCase()
		document.getElementById("reg-input-al").value = this.toUnsigned(this.a.getLow(), 1).toString(16).toUpperCase()

		document.getElementById("reg-input-bh").value = this.toUnsigned(this.b.getHigh(), 1).toString(16).toUpperCase()
		document.getElementById("reg-input-bl").value = this.toUnsigned(this.b.getLow(), 1).toString(16).toUpperCase()

		document.getElementById("reg-input-i").value = this.toUnsigned(this.i.get(), 2).toString(16).toUpperCase()
		document.getElementById("reg-input-j").value = this.toUnsigned(this.j.get(), 1).toString(16).toUpperCase()

		document.getElementById("reg-input-pc").value = this.toUnsigned(this.pc.get(), 2).toString(16).toUpperCase()
		document.getElementById("reg-input-ir").value = this.toUnsigned(this.ir.get(), 2).toString(16).toUpperCase()
		document.getElementById("reg-input-sp").value = this.toUnsigned(this.sp.get(), 2).toString(16).toUpperCase()
		document.getElementById("reg-input-dr").value = this.toUnsigned(this.dr.get(), 2).toString(16).toUpperCase()
		document.getElementById("reg-input-mli").value = this.toUnsigned(this.mli.get(), 2).toString(16).toUpperCase()
		document.getElementById("reg-input-mhi").value = this.toUnsigned(this.mhi.get(), 2).toString(16).toUpperCase()

		let sr = ""
		if(this.sr.getN()) sr += "N "
		else sr += "n "
		if(this.sr.getO()) sr += "O "
		else sr += "o "
		if(this.sr.getI()) sr += "I "
		else sr += "i "
		if(this.sr.getD()) sr += "D "
		else sr += "d "
		sr += "0 1 "
		if(this.sr.getZ()) sr += "Z "
		else sr += "z "
		if(this.sr.getC()) sr += "C "
		else sr += "c "

		document.getElementById("reg-input-sr").value = sr
		document.getElementById("clk-input").value = this.freqMhz + " MHz"
	}

	incPc1 = () => {
		this.pc.set(this.pc.get() + 1)
	}

	incPc2 = () => {
		this.pc.set(this.pc.get() + 2)
	}

	// addressing modes

	absolute = (cpu, bytes) => {
		cpu.incPc2()	// skip the instruction
		let x = cpu.fetch(cpu.pc.get(), 2)
		x = cpu.fetch(x, bytes)
		cpu.incPc2()	// skip the 16 bit address
		return x
	}

	absoluteIndexed = (cpu, bytes) => {
		cpu.incPc2()
		let x = cpu.fetch(cpu.pc.get(), 2)
		x = cpu.fetch(x + cpu.i.get(), bytes)
		cpu.incPc2()
		return x
	}

	relative = (cpu, b) => {	// used only by JMPs
		cpu.incPc2()
		let x = cpu.toSigned(cpu.fetch(cpu.pc.get(), 1), 1) + cpu.toUnsigned(cpu.pc.get(), 2) - 2
		cpu.incPc1()
		return x
	}

	relativeJ = (cpu, b) => {
		let x = cpu.toUnsigned(cpu.pc.get()) + cpu.j.get()
		cpu.incPc2()
		return x
	}

	indirect = (cpu, bytes) => {
		let x = cpu.fetch(cpu.absolute(cpu, bytes), bytes)
		return x
	}

	indirectIndexed = (cpu, bytes) => {
		let x = cpu.fetch(cpu.absolute(cpu, bytes) + cpu.i.get(), bytes)
		return x
	}

	implied = (cpu, b) => {
		cpu.incPc2()
	}

	immediate = (cpu, bytes) => {
		cpu.incPc2()
		let x = cpu.fetch(cpu.pc.get(), bytes)
		if(bytes == 1)
			cpu.incPc1()
		else
			cpu.incPc2()
		return x
	}

	zpg = (cpu, bytes) => {
		cpu.incPc2()
		let x = cpu.fetch(cpu.pc.get(), 1)
		x = cpu.fetch(x, bytes)
		cpu.incPc1()
		return x
	}

	zpgIndexed = (cpu, bytes) => {
		cpu.incPc2()
		let x = cpu.fetch(cpu.pc.get(), 1)
		x = cpu.fetch(x + cpu.i.get(), bytes)
		cpu.incPc1()
		return x
	}

	baseReg = (cpu, b) => {
		cpu.incPc2()
		return cpu.b.get()
	}

	bhReg = (cpu, b) => {
		cpu.incPc2()
		return cpu.b.getHigh()
	}

	// #blReg = (b) => {
	// 	cpu.incPc2()
	// 	return cpu.b.getLow()
	// }

	accumulator = (cpu, b) => {
		cpu.incPc2()
		return cpu.a.get()
	}

	ahReg = (cpu, b) => {
		cpu.incPc2()
		return cpu.a.getHigh()
	}

	alReg = (cpu, b) => {
		cpu.incPc2()
		return cpu.a.getLow()
	}

	indexReg = (cpu, b) => {
		cpu.incPc2()
		return cpu.i.get()
	}

	// other

	// op: true -> sum; op: false -> sub
	carry = (n1, n2,  op = true, bytes = 1) => {
		if(this.toUnsigned(n1, bytes) + (op ? this.toUnsigned(n2, bytes) : this.toUnsigned(-n2, bytes)) >= 2 ** (8 * bytes)) return true
		return false
	}

	// op: true -> sum; op: false -> sub
	overflow = (n1, n2, op = true, bytes = 1) => {
		if(n1 + (op ? n2 : -n2) > 2 ** (8 * bytes) / 2 - 1 || n1 + (op ? n2 : -n2) < -(2 ** (8 * bytes) / 2)) return true
		return false
	}

	push = () => {
		let addr = fetch(this.#SYS_STACK_PTR, 2)
		this.write(addr, this.pc.get(), 2)
		this.write(addr, this.sr.get(), 1)
		this.write(this.#SYS_STACK_PTR, addr + 3)
	}

	// instructions

	ADA = (cpu) => {
		cpu.sr.setO(cpu.overflow(cpu.a.get(), cpu.operand))
		cpu.sr.setC(cpu.carry(cpu.a.get(), cpu.operand))
		cpu.a.set(cpu.a.get() + cpu.operand)
		cpu.sr.setN(cpu.a.get() < 0)
		cpu.sr.setZ(cpu.a.get() == 0)
	}

	ADB = (cpu) => {
		cpu.sr.setO(cpu.overflow(cpu.b.get(), cpu.operand))
		cpu.sr.setC(cpu.carry(cpu.b.get(), cpu.operand))
		cpu.b.set(cpu.b.get() + cpu.operand)
		cpu.sr.setN(cpu.b.get() < 0)
		cpu.sr.setZ(cpu.b.get() == 0)
	}

	ANA = (cpu) => {	// FIXME: check and with AH and AL
		cpu.a.set(cpu.a.get() & cpu.operand)
		cpu.sr.setN(cpu.a.get() < 0)
		cpu.sr.setZ(cpu.a.get() == 0)
	}

	ANB = (cpu) => {	// FIXME: check and with BH and BL
		cpu.b.set(cpu.b.get() & cpu.operand)
		cpu.sr.setN(cpu.b.get() < 0)
		cpu.sr.setZ(cpu.b.get() == 0)
	}

	ARET = (cpu) => {
		cpu.sr.setZ(cpu.toUnsigned(cpu.a.get()) == 0x80FF)
	}

	BRK = (cpu) => {
		cpu.push()
		cpu.pc.set(cpu.fetch(cpu.#BRK_VCT, 2))
	}

	CLC = (cpu) => {
		cpu.sr.setC(false)
	}

	CLD = (cpu) => {
		cpu.sr.setD(false)
	}

	CLI = (cpu) => {
		cpu.sr.setI(false)
	}

	CLO = (cpu) => {
		cpu.sr.setO(false)
	}

	CMAH = (cpu) => {
		let c = cpu.a.getHigh();
		if (c > cpu.operand) {
			cpu.sr.setC(true);
			cpu.sr.setZ(false);
		}
		else if (c == cpu.operand) {
			cpu.sr.setC(true);
			cpu.sr.setZ(true);
		}
		else {
			cpu.sr.setC(false);
			cpu.sr.setZ(false);
		}
	}

	CMBH = (cpu) => {
		let c = cpu.b.getHigh();
		if (c > cpu.operand) {
			cpu.sr.setC(true);
			cpu.sr.setZ(false);
		}
		else if (c == cpu.operand) {
			cpu.sr.setC(true);
			cpu.sr.setZ(true);
		}
		else {
			cpu.sr.setC(false);
			cpu.sr.setZ(false);
		}
	}

	CMPA = (cpu) => {
		let c = cpu.a.get();
		if (c > cpu.operand) {
			cpu.sr.setC(true);
			cpu.sr.setZ(false);
		}
		else if (c == cpu.operand) {
			cpu.sr.setC(true);
			cpu.sr.setZ(true);
		}
		else {
			cpu.sr.setC(false);
			cpu.sr.setZ(false);
		}
	}

	CMPB = (cpu) => {
		let c = cpu.b.get();
		if (c > cpu.operand) {
			cpu.sr.setC(true);
			cpu.sr.setZ(false);
		}
		else if (c == cpu.operand) {
			cpu.sr.setC(true);
			cpu.sr.setZ(true);
		}
		else {
			cpu.sr.setC(false);
			cpu.sr.setZ(false);
		}
	}

	CMPI = (cpu) => {
		let c = cpu.i.get();
		if (c > cpu.operand) {
			cpu.sr.setC(true);
			cpu.sr.setZ(false);
		}
		else if (c == cpu.operand) {
			cpu.sr.setC(true);
			cpu.sr.setZ(true);
		}
		else {
			cpu.sr.setC(false);
			cpu.sr.setZ(false);
		}
	}

	CPUID = (cpu) => {
		cpu.a.setLow(1)
		cpu.a.setHigh(0)
	}

	DEA = (cpu) => {
		cpu.a.set(cpu.a.get() - 1)
		cpu.sr.setN(cpu.a.get() < 0)
		cpu.sr.setZ(cpu.a.get() == 0)
	}

	DEB = (cpu) => {
		cpu.b.set(cpu.b.get() - 1)
		cpu.sr.setN(cpu.b.get() < 0)
		cpu.sr.setZ(cpu.b.get() == 0)
	}

	DEI = (cpu) => {
		cpu.a.set(cpu.i.get() - 1)
		cpu.sr.setN(cpu.i.get() < 0)
		cpu.sr.setZ(cpu.i.get() == 0)
	}

	DEJ = (cpu) => {
		cpu.a.set(cpu.j.get() - 1)
		cpu.sr.setN(cpu.j.get() < 0, 1)
		cpu.sr.setZ(cpu.j.get() == 0)
	}

	INA = (cpu) => {
		cpu.a.set(cpu.a.get() + 1)
		cpu.sr.setN(cpu.a.get() < 0)
		cpu.sr.setZ(cpu.a.get() == 0)
	}

	INB = (cpu) => {
		cpu.b.set(cpu.b.get() + 1)
		cpu.sr.setN(cpu.b.get() < 0)
		cpu.sr.setZ(cpu.b.get() == 0)
	}

	INI = (cpu) => {
		cpu.i.set(cpu.i.get() + 1)
		cpu.sr.setN(cpu.i.get() < 0)
		cpu.sr.setZ(cpu.i.get() == 0)
	}

	INJ = (cpu) => {
		cpu.j.set(cpu.j.get() + 1)
		cpu.sr.setN(cpu.j.get() < 0, 1)
		cpu.sr.setZ(cpu.j.get() == 0)
	}

	JCC = (cpu) => {
		if(!cpu.sr.getC()) cpu.pc.set(cpu.operand)
	}

	JCS = (cpu) => {
		if(cpu.sr.getC()) cpu.pc.set(cpu.operand)
	}

	JMP = (cpu) => {
		cpu.pc.set(cpu.operand)
	}

	JNC = (cpu) => {
		if(!cpu.sr.getN()) cpu.pc.set(cpu.operand)
	}

	JNS = (cpu) => {
		if(cpu.sr.getN()) cpu.pc.set(cpu.operand)
	}

	JOC = (cpu) => {
		if(!cpu.sr.getO()) cpu.pc.set(cpu.operand)
	}

	JOS = (cpu) => {
		if(cpu.sr.getO()) cpu.pc.set(cpu.operand)
	}

	JSP = (cpu) => {
		
	}

	JZC = (cpu) => {
		if(!cpu.sr.getZ()) cpu.pc.set(cpu.operand)
	}

	JZS = (cpu) => {
		if(cpu.sr.getS()) cpu.pc.set(cpu.operand)
	}

	KILL = (cpu) => {
		cpu.stop()
	}

	LDA = (cpu) => {
		cpu.a.set(cpu.operand)
		cpu.sr.setN(cpu.a.get() < 0)
		cpu.sr.setZ(cpu.a.get() == 0)
	}

	LDAH = (cpu) => {
		cpu.a.setHigh(cpu.operand)
		cpu.sr.setN(cpu.toSigned(cpu.a.getHigh() < 0, 1))
		cpu.sr.setZ(cpu.a.getHigh() == 0)
	}

	LDAL = (cpu) => {
		cpu.a.setLow(cpu.operand)
		cpu.sr.setN(cpu.toSigned(cpu.a.getLow() < 0, 1))
		cpu.sr.setZ(cpu.a.getLow() == 0)
	}

	LDB = (cpu) => {
		cpu.b.set(cpu.operand)
		cpu.sr.setN(cpu.b.get() < 0)
		cpu.sr.setZ(cpu.b.get() == 0)
	}

	LDBH = (cpu) => {
		cpu.b.setHigh(cpu.operand)
		cpu.sr.setN(cpu.toSigned(cpu.b.getHigh() < 0, 1))
		cpu.sr.setZ(cpu.b.getHigh() == 0)
	}

	LDBL = (cpu) => {
		cpu.b.setLow(cpu.operand)
		cpu.sr.setN(cpu.toSigned(cpu.b.getLow() < 0, 1))
		cpu.sr.setZ(cpu.b.getLow() == 0)
	}

	LDD = (cpu) => {
		cpu.dr.set(cpu.operand)
		cpu.sr.setN(cpu.dr.get() < 0)
		cpu.sr.setZ(cpu.dr.get() == 0)
	}

	LDI = (cpu) => {
		cpu.i.set(cpu.operand)
		cpu.sr.setN(cpu.i.get() < 0)
		cpu.sr.setZ(cpu.i.get() == 0)
	}

	LDJ = (cpu) => {
		cpu.j.set(cpu.operand)
		cpu.sr.setN(cpu.j.get() < 0)
		cpu.sr.setZ(cpu.j.get() == 0)
	}

	LDS = (cpu) => {
		cpu.sp.set(cpu.operand)
		cpu.sr.setN(cpu.sp.get() < 0)
		cpu.sr.setZ(cpu.sp.get() == 0)
	}

	LMHI = (cpu) => {
		if (cpu.toUnsigned(cpu.pc, 2) >= 0x3000) return
		cpu.mhi.set(cpu.operand)
		cpu.sr.setN(cpu.mhi.get() < 0)
		cpu.sr.setZ(cpu.mhi.get() == 0)
	}

	LMLI = (cpu) => {
		if (cpu.toUnsigned(cpu.pc, 2) >= 0x3000) return
		cpu.mli.set(cpu.operand)
		cpu.sr.setN(cpu.mli.get() < 0)
		cpu.sr.setZ(cpu.mli.get() == 0)
	}

	MSB = (cpu) => {
		cpu.sr.setZ(cpu.operand >> 7)
	}

	NOP = (cpu) => {
		return
	}

	ORA = (cpu) => {	// FIXME: caution to AL and AH
		cpu.a.set(cpu.a.get() | cpu.operand)
		cpu.sr.setN(cpu.a.get() < 0)
		cpu.sr.setZ(cpu.a.get() == 0)
	}

	ORB = (cpu) => {	// FIXME: caution to BL and BH
		cpu.b.set(cpu.b.get() | cpu.operand)
		cpu.sr.setN(cpu.b.get() < 0)
		cpu.sr.setZ(cpu.b.get() == 0)
	}

	PSH = (cpu) => {
		
	}

	PSHI = (cpu) => {	// this op code does not exist but is used to push PC and SR
		cpu.push()
	}

	READ = (cpu) => {
		// FIXME: check me
		if (cpu.addressing == "accumulator") {
			cpu.b.setHigh(cpu.eMem[cpu.a.get()]);
		}
		else if(cpu.addressing == "base") {
			cpu.a.setHigh(cpu.eMem[cpu.b.get()]);
		}
		else if (cpu.addressing == "zpg") {
			cpu.a.setHigh(cpu.eMem[cpu.address1]);
		}
		else if (cpu.addressing == "zpgIndexed") {
			cpu.a.setHigh(cpu.eMem[cpu.address1 + cpu.i.get()]);
		}
		else if (cpu.addressing == "absolute") {
			cpu.a.setHigh(cpu.eMem[cpu.address2]);
		}
		else if (cpu.addressing == "absoulteIndexed") {
			cpu.a.setHigh(cpu.eMem[cpu.address2 + cpu.i.get()]);
		}
	}

	REST = (cpu) => {
		cpu.reset()
	}

	RET = (cpu) => {	// FIXME: set SR
		let ssp = cpu.fetch(cpu.#SYS_STACK_PTR, 2) 
		cpu.pc.set(cpu.fetch(ssp - 3, 2))
		cpu.sr.set(cpu.fetch(ssp - 1, 1))
		cpu.write(cpu.#SYS_STACK_PTR, ssp - 3, 2)
		
	}

	SED = (cpu) => {
		cpu.sr.setD(true)
	}

	SEI = (cpu) => {
		cpu.sr.setI(true)
	}

	SHL = (cpu) => {
		if (cpu.addressing == "accumulator") {
			cpu.a.set(cpu.a.get() << 1);
		}
		else if (cpu.addressing == "base") {
			cpu.b.set(cpu.b.get() << 1);
		}
		else if (cpu.addressing == "index") {
			cpu.i.set(cpu.i.get() << 1);
		}
		// TODO: change sr
	}

	SHR = (cpu) => {
		if (cpu.addressing == "accumulator") {
			cpu.a.set(cpu.a.get() >> 1);
		}
		else if (cpu.addressing == "base") {
			cpu.b.set(cpu.b.get() >> 1);
		}
		else if (cpu.addressing == "index") {
			cpu.i.set(cpu.i.get() >> 1);
		}
		// TODO: change sr
	}

	// TODO: store
	SMHI = (cpu) => {
		
	}

	SMLI = (cpu) => {
		
	}

	STA = (cpu) => {
		
	}

	STAH = (cpu) => {
		
	}

	STB = (cpu) => {
		
	}

	STBH = (cpu) => {
		
	}

	STI = (cpu) => {
		
	}

	STJ = (cpu) => {
		
	}

	STPC = (cpu) => {
		
	}

	STSR = (cpu) => {
		
	}

	SUA = (cpu) => {
		
	}

	SUB = (cpu) => {
		
	}

	TAB = (cpu) => {
		cpu.b.set(cpu.a.get())
		cpu.sr.setN(cpu.b.get() < 0)
		cpu.sr.setZ(cpu.b.get() == 0)
	}

	TABH = (cpu) => {
		cpu.b.setHigh(cpu.a.getHigh())
		cpu.sr.setN(cpu.toSigned(cpu.b.getHigh()) < 0)
		cpu.sr.setZ(cpu.b.getHigh() == 0)
	}

	TABL = (cpu) => {
		cpu.b.setLow(cpu.a.getLow())
		cpu.sr.setN(cpu.toSigned(cpu.b.getLow()) < 0)
		cpu.sr.setZ(cpu.b.getLow() == 0)
	}

	TAD = (cpu) => {
		cpu.dr.set(cpu.a.get())
		cpu.sr.setN(cpu.toSigned(cpu.dr.get()) < 0)
		cpu.sr.setZ(cpu.dr.get() == 0)
	}

	TAHJ = (cpu) => {
		cpu.j.set(cpu.a.get())
		cpu.sr.setN(cpu.j.get() < 0)
		cpu.sr.setZ(cpu.j.get() == 0)
	}

	TAI = (cpu) => {
		cpu.i.set(cpu.a.get())
		cpu.sr.setN(cpu.i.get() < 0)
		cpu.sr.setZ(cpu.i.get() == 0)
	}

	TAMH = (cpu) => {
		if (cpu.pc.get() < 0x3000) {
			cpu.mhi.set(cpu.a.get())
			cpu.sr.setN(cpu.mhi.get() < 0)
			cpu.sr.setZ(cpu.mhi.get() == 0)
		}
	}

	TAML = (cpu) => {
		if (cpu.pc.get() < 0x3000) {
			cpu.mli.set(cpu.a.get())
			cpu.sr.setN(cpu.mli.get() < 0)
			cpu.sr.setZ(cpu.mli.get() == 0)
		}
	}

	TBA = (cpu) => {
		cpu.a.set(cpu.b.get())
		cpu.sr.setN(cpu.a.get() < 0)
		cpu.sr.setZ(cpu.a.get() == 0)
	}

	TBAH = (cpu) => {
		cpu.a.setHigh(cpu.b.getHigh())
		cpu.sr.setN(cpu.a.getHigh() < 0)
		cpu.sr.setZ(cpu.a.getHigh() == 0)
	}

	TBAL = (cpu) => {
		cpu.a.setLow(cpu.b.getLow())
		cpu.sr.setN(cpu.a.getLow() < 0)
		cpu.sr.setZ(cpu.a.getLow() == 0)
	}

	TBHJ = (cpu) => {
		cpu.j.set(cpu.b.getHigh())
		cpu.sr.setN(cpu.j.get() < 0)
		cpu.sr.setZ(cpu.j.get() == 0)
	}

	TBI = (cpu) => {
		cpu.i.set(cpu.b.get())
		cpu.sr.setN(cpu.i.get() < 0)
		cpu.sr.setZ(cpu.i.get() == 0)
	}

	TIS = (cpu) => {
		
	}

	TSB = (cpu) => {
		
	}

	WRTE = (cpu) => {
		if (cpu.addressing == "absolute") {
			cpu.eMem[cpu.address2] = cpu.a.getHigh();
		} else {
			cpu.eMem[cpu.address2 + cpu.toUnsigned(cpu.i.get(), 2)] = cpu.a.getHigh();
		}
	}

	WRTI = (cpu) => {
		
	}

	XORA = (cpu) => {
		
	}

	XORB = (cpu) => {
		
	}
	
}