import { getInfo } from "./isa.js";
import { ExternalMemoryController } from "./memoryController.js";
import { Register16, Register16HighLow, Register8, StatusRegister, add16bits, add8bits, expandTo16bits, getHigh, getLow, msbit } from "./registers.js";
import { AddressingMode, CPUStatus, Instruction } from "./types.js";

// Constants
const MEMORY_SIZE = 0x10000;
const FIRMWARE = new Uint8ClampedArray([
	0x80, 0x55, 0x01, 0x00, 0x80, 0x53, 0x00, 0x00, 0x00, 0x3e, 0x80, 0x72, 0x00,
	0x00, 0x00, 0x04, 0x00, 0x06, 0x80, 0x26, 0x20, 0x13, 0x40, 0x12, 0xef, 0x80,
	0x53, 0x00, 0x00, 0x80, 0x54, 0x00, 0x00, 0x80, 0x55, 0x00, 0x00, 0x40, 0x1c,
	0x00, 0x80, 0x58, 0x00, 0x00, 0x80, 0x32, 0x20, 0x00, 0x41, 0x4e, 0x43,
]);
const INTERNAL_ROM_START = 0xFE00;	// Where is stored the firmware

// Vectors
const OS_ENTRY_VECTOR = 0x2000;
const DR_INR_VECTOR = 0x2002;
const EIRQ_VECTOR = 0x2004;
const NMI_VECTOR = 0x2006;
const SYS_VECTOR = 0x2008;
const IAOOR_VECTOR = 0x200A;
const EAOOR_VECTOR = 0x200C;
const SPOOR_VECTOR = 0x200E;
const PC_STACK_VECTOR = 0x2010;
const SR_STACK_VECTOR = 0x2012;
const A_STACK_VECTOR = 0x2013;
const B_STACK_VECTOR = 0x2015;

const RET = 0x80FF;

export class ANC16 {
	// GPRs
	private a: Register16HighLow;
	private b: Register16HighLow;
	private i: Register16;
	private j: Register8;

	// Special registers
	private pc: Register16;
	private ir: Register16;
	private sp: Register16;
	private sr: StatusRegister;
	private dr: Register8;

	// Memory table
	private imli: Register16;
	private imhi: Register16;
	private emli: Register16;
	private emhi: Register16;
	private ar: Register16;

	// Memory
	private eMem: Uint8Array;
	private iMem: Uint8Array;

	// debug
	private addressing: AddressingMode;
	private currentInstruction: Instruction;
	private argument: number;
	private argsize: 8 | 16;
	private privileged: boolean;

	private externalBUS: ExternalMemoryController;

	constructor(externalMemory: ExternalMemoryController) {
		this.externalBUS = externalMemory;
		if (externalMemory.getFullMemory().length != MEMORY_SIZE) throw "Memory must be 64KB";
		this.a = new Register16HighLow();
		this.b = new Register16HighLow();
		this.i = new Register16();
		this.j = new Register8();

		this.pc = new Register16();
		this.ir = new Register16();
		this.sp = new Register16();
		this.sr = new StatusRegister();
		this.dr = new Register8();

		this.imli = new Register16();
		this.imhi = new Register16();
		this.emli = new Register16();
		this.emhi = new Register16();
		this.ar = new Register16();

		this.eMem = externalMemory.getFullMemory();
		this.iMem = new Uint8Array(MEMORY_SIZE);

		// Setting up the firmware
		for (let i = INTERNAL_ROM_START; i < this.iMem.length && i < FIRMWARE.length + INTERNAL_ROM_START; i++) {
			this.iMem[i] = FIRMWARE[i - INTERNAL_ROM_START];
		}

		this.reset();
	}

	// reset the cpu
	reset() {
		this.pc.set(INTERNAL_ROM_START);
		// GPRs
		this.a.set(0); this.b.set(0);
		this.i.set(0); this.j.set(0);

		// Special registers
		this.ir.set(this.iMem[INTERNAL_ROM_START] << 8 | this.iMem[INTERNAL_ROM_START + 1]); this.sp.set(0);
		this.dr.set(0); this.sr.set(0b00111100);	// n o I D S 1 z c

		// Memory table
		this.imli.set(0); this.imhi.set(0);
		this.emli.set(0); this.emhi.set(0);
		this.ar.set(0);
	}

	private fetchDecode() {
		let opc = this.iMem[this.pc.get()] << 8 | this.iMem[this.pc.get() + 1];
		let ins = getInfo(opc);
		if (ins === null) {
			this.nmi(1);
			return;
		}
		this.currentInstruction = ins.mnemonic;
		this.ir.set(opc);
		this.privileged = ins.needPrivileges;
		this.addressing = ins.addressing;
		switch (this.addressing) {
			case "absolute": case "absoluteIndexed": case "immediate2": case "indirect": case "indirectIndexed":
				this.argument = this.iMem[add16bits(this.pc.get(), 2).result] << 8 | this.iMem[add16bits(this.pc.get(), 3).result];
				this.argsize = 16;
				this.pc.add(4);
				break;
			case "relative": case "zeroPage": case "zeroPageIndexed": case "immediate1":
				this.argument = this.iMem[add16bits(this.pc.get(), 2).result];
				this.argsize = 8;
				this.pc.add(3);
				break;
			default:
				this.pc.add(2);
				break;
		}

	}

	private execute() {
		this[this.currentInstruction]();
	}

	nextInstruction() {
		this.fetchDecode();
		this.execute();
	}

	getCurrentInstruction() {
		return this.currentInstruction;
	}

	private getOperand(wordSize: boolean = true) {
		let indexed;
		let indirect;
		switch (this.addressing) {
			case "immediate1": case "immediate2": case "immediate":
				return this.argument;
			case "absolute": case "zeroPage":
				return wordSize ? this.iMem[this.argument] << 8 | this.iMem[add16bits(this.argument, 1).result] : this.iMem[this.argument];
			case "accumulatorHighRegister": return this.a.getHigh();
			case "accumulatorLowRegister": return this.a.getLow();
			case "accumulatorRegister": return this.a.get();
			case "baseHighRegister": return this.b.getHigh();
			case "baseLowRegister": return this.b.getLow();
			case "baseRegister": return this.b.get();
			case "indexRegister": return this.i.get();
			case "absoluteIndexed": case "zeroPageIndexed":
				indexed = add16bits(this.argument, this.i.get()).result;
				return wordSize ? this.iMem[indexed] << 8 | this.iMem[add16bits(indexed, 1).result] : this.iMem[indexed];
			case "implied": return;
			case "indirect":
				indirect = this.iMem[this.argument] << 8 | this.iMem[add16bits(this.argument, 1).result];
				return wordSize ? this.iMem[indirect] << 8 | this.iMem[add16bits(indirect, 1).result] : this.iMem[indirect];
			case "indirectIndexed":
				indirect = this.iMem[this.argument] << 8 | this.iMem[add16bits(this.argument, 1).result];
				indexed = add16bits(indirect, this.i.get()).result;
				return wordSize ? this.iMem[indexed] << 8 | this.iMem[add16bits(indexed, 1).result] : this.iMem[indexed];
			case "relative":
				indexed = add16bits(this.argument, this.pc.get()).result;
				return wordSize ? this.iMem[indexed] << 8 | this.iMem[add16bits(indexed, 1).result] : this.iMem[indexed];
			case "relativeUsingJ":
				indexed = add16bits(this.j.get(), this.pc.get()).result;
				return wordSize ? this.iMem[indexed] << 8 | this.iMem[add16bits(indexed, 1).result] : this.iMem[indexed];
		}
	}

	private fetchStack(wordSize = true) {
		if (this.spOORguard()) return;
		return wordSize ? this.iMem[this.sp.get()] << 8 | this.iMem[add16bits(this.sp.get(), 1).result] : this.iMem[this.sp.get()];
	}

	// interrupts
	private pushIrq() {
		this.iMem[PC_STACK_VECTOR] = getHigh(this.pc.get());
		this.iMem[PC_STACK_VECTOR + 1] = getLow(this.pc.get());
		this.iMem[SR_STACK_VECTOR] = this.sr.get();
		this.iMem[A_STACK_VECTOR] = this.a.getHigh();
		this.iMem[A_STACK_VECTOR + 1] = this.a.getLow();
		this.iMem[B_STACK_VECTOR] = this.b.getHigh();
		this.iMem[B_STACK_VECTOR + 1] = this.b.getLow();
	}

	eirq(address: number, data: number) {
		if (this.sr.getI()) {
			this.pushIrq();
			this.b.set(address);
			this.a.setHigh(data);
			this.pc.set(this.iMem[EIRQ_VECTOR] << 8 | this.iMem[EIRQ_VECTOR + 1]);
		}
	}

	private nmi(al: number) {
		this.pushIrq();
		this.a.setLow(al);
		this.pc.set(this.iMem[NMI_VECTOR] << 8 | this.iMem[NMI_VECTOR + 1]);
	}

	private spOutOfRange() {
		if (this.sr.getI()) {
			this.pushIrq();
			this.pc.set(this.iMem[SPOOR_VECTOR] << 8 | this.iMem[SPOOR_VECTOR + 1]);
		}
	}

	private iaOutOfRange() {
		if (this.sr.getI()) {
			this.pushIrq();
			this.pc.set(this.iMem[IAOOR_VECTOR] << 8 | this.iMem[IAOOR_VECTOR + 1]);
		}
	}

	private eaOutOfRange() {
		if (this.sr.getI()) {
			this.pushIrq();
			this.pc.set(this.iMem[EAOOR_VECTOR] << 8 | this.iMem[EAOOR_VECTOR + 1]);
		}
	}

	private sysPrivilegesGuard() {
		if (!this.sr.getS()) {
			this.nmi(2);
			return true;
		}
		return false;
	}

	private spOORguard() {
		if (this.sr.getS()) return false;
		if (this.sp.get() < this.imli.get() || this.sp.get() >= this.imhi.get()) {
			this.spOutOfRange();
			return true;
		}
		return false;
	}

	// memory
	private store(address: number, value: number, size: 8 | 16) {
		if (this.iaOORGuard(address)) {
			return;
		}
		if (size === 8) {
			this.iMem[address] = value;
			return;
		}
		this.iMem[address] = getHigh(value);
		this.iMem[add16bits(address, 1).result] = getLow(value);
	}

	private iaOORGuard(address: number) {
		if (this.sr.getS()) return false;
		if (address < this.imli.get() || address >= this.imhi.get()) {
			this.iaOutOfRange();
			return true;
		}
		return false;
	}

	private eaOORguard(address: number) {
		if (this.sr.getS()) return false;
		if (address < this.emli.get() || address >= this.emhi.get()) {
			this.eaOutOfRange();
			return true;
		}
		return false;
	}

	private getAddress() {
		switch (this.addressing) {
			case "absolute": case "zeroPage":
				return this.argument;
			case "absoluteIndexed": case "zeroPageIndexed":
				return add16bits(this.argument, this.i.get()).result;
			case "indirect":
				return this.iMem[this.argument] << 8 | this.iMem[add16bits(this.argument, 1).result];
			case "indirectIndexed":
				return add16bits(this.iMem[this.argument] << 8 | this.iMem[add16bits(this.argument, 1).result], 1).result;
		}
	}

	// instructions
	private ada() {
		let res;
		switch (this.addressing) {
			case "immediate1":
				res = this.a.addLow(this.getOperand());
				this.sr.setO(res.overflow);
				this.sr.setC(res.carry);
				this.sr.setZ(res.zero);
				this.sr.setN(res.negative);
				break;
			default:
				res = this.a.add(this.getOperand());
				this.sr.setO(res.overflow);
				this.sr.setC(res.carry);
				this.sr.setZ(res.zero);
				this.sr.setN(res.negative);
				break;
		}
	}

	private adb() {
		let res;
		switch (this.addressing) {
			case "immediate1":
				res = this.b.addLow(this.getOperand());
				this.sr.setO(res.overflow);
				this.sr.setC(res.carry);
				this.sr.setZ(res.zero);
				this.sr.setN(res.negative);
				break;
			default:
				res = this.b.add(this.getOperand());
				this.sr.setO(res.overflow);
				this.sr.setC(res.carry);
				this.sr.setZ(res.zero);
				this.sr.setN(res.negative);
				break;
		}
	}

	private ana() {
		let res;
		switch (this.addressing) {
			case "immediate1":
				res = this.a.andLow(this.getOperand());
				this.sr.setZ(res.zero);
				this.sr.setN(res.negative);
				break;
			default:
				res = this.a.and(this.getOperand());
				this.sr.setZ(res.zero);
				this.sr.setN(res.negative);
				break;
		}
	}

	private anb() {
		let res;
		switch (this.addressing) {
			case "immediate1":
				res = this.b.andLow(this.getOperand());
				this.sr.setZ(res.zero);
				this.sr.setN(res.negative);
				break;
			default:
				res = this.b.and(this.getOperand());
				this.sr.setZ(res.zero);
				this.sr.setN(res.negative);
				break;
		}
	}

	private aret() {
		this.sr.setZ(this.a.get() === RET);
	}

	private clc() {
		this.sr.setC(false);
	}

	private cld() {
		if (this.sysPrivilegesGuard()) return;
		this.sr.setD(false);
	}

	private cli() {
		if (this.sysPrivilegesGuard()) return;
		this.sr.setI(false);
	}

	private clo() {
		this.sr.setO(false);
	}

	private cls() {
		if (this.sysPrivilegesGuard()) return;
		this.sr.setS(false);
	}

	private cmah() {
		let res = add8bits(this.a.getHigh(), -this.getOperand());
		this.sr.setC(res.carry);
		this.sr.setN(res.negative);
		this.sr.setZ(res.zero);
	}

	private cmbh() {
		let res = add8bits(this.b.getHigh(), -this.getOperand());
		this.sr.setC(res.carry);
		this.sr.setN(res.negative);
		this.sr.setZ(res.zero);
	}

	private cmpa() {
		let res = add16bits(this.a.get(), -this.getOperand());
		this.sr.setC(res.carry);
		this.sr.setN(res.negative);
		this.sr.setZ(res.zero);
	}

	private cmpb() {
		let res = add16bits(this.b.get(), -this.getOperand());
		this.sr.setC(res.carry);
		this.sr.setN(res.negative);
		this.sr.setZ(res.zero);
	}

	private cmpi() {
		let res = add16bits(this.i.get(), -this.getOperand());
		this.sr.setC(res.carry);
		this.sr.setN(res.negative);
		this.sr.setZ(res.zero);
	}

	private cpuid() {
		this.a.setLow(1);
	}

	private dea() {
		let res = this.a.sub(1);
		this.sr.setN(res.negative);
		this.sr.setZ(res.zero);
	}

	private deb() {
		let res = this.b.sub(1);
		this.sr.setN(res.negative);
		this.sr.setZ(res.zero);
	}

	private dei() {
		let res = this.i.sub(1);
		this.sr.setN(res.negative);
		this.sr.setZ(res.zero);
	}

	private dej() {
		let res = this.j.sub(1);
		this.sr.setN(res.negative);
		this.sr.setZ(res.zero);
	}

	private ina() {
		let res = this.a.add(1);
		this.sr.setN(res.negative);
		this.sr.setZ(res.zero);
	}

	private inb() {
		let res = this.b.add(1);
		this.sr.setN(res.negative);
		this.sr.setZ(res.zero);
	}

	private ini() {
		let res = this.i.add(1);
		this.sr.setN(res.negative);
		this.sr.setZ(res.zero);
	}

	private inj() {
		let res = this.j.add(1);
		this.sr.setN(res.negative);
		this.sr.setZ(res.zero);
	}

	private jcc() {
		if (!this.sr.getC())
			switch (this.addressing) {
				case "absolute":
					this.pc.set(this.argument);
					break;
				case "relative":
					this.pc.add(expandTo16bits(this.argument));
					break;
				case "relativeUsingJ":
					this.pc.add(expandTo16bits(this.j.get()));
					break;
			}
	}

	private jcs() {
		if (this.sr.getC())
			switch (this.addressing) {
				case "absolute":
					this.pc.set(this.argument);
					break;
				case "relative":
					this.pc.add(expandTo16bits(this.argument));
					break;
				case "relativeUsingJ":
					this.pc.add(expandTo16bits(this.j.get()));
					break;
			}
	}

	private jeq() {
		if (this.sr.getZ())
			switch (this.addressing) {
				case "absolute":
					this.pc.set(this.argument);
					break;
				case "relative":
					this.pc.add(expandTo16bits(this.argument));
					break;
				case "relativeUsingJ":
					this.pc.add(expandTo16bits(this.j.get()));
					break;
			}
	}

	private jmp() {

		switch (this.addressing) {
			case "absolute":
				this.pc.set(this.argument);
				break;
			case "relative":
				this.pc.add(expandTo16bits(this.argument));
				break;
			case "relativeUsingJ":
				this.pc.add(expandTo16bits(this.j.get()));
				break;
		}
	}

	private jnc() {
		if (!this.sr.getN())
			switch (this.addressing) {
				case "absolute":
					this.pc.set(this.argument);
					break;
				case "relative":
					this.pc.add(expandTo16bits(this.argument));
					break;
				case "relativeUsingJ":
					this.pc.add(expandTo16bits(this.j.get()));
					break;
			}
	}

	private jne() {
		if (!this.sr.getZ())
			switch (this.addressing) {
				case "absolute":
					this.pc.set(this.argument);
					break;
				case "relative":
					this.pc.add(expandTo16bits(this.argument));
					break;
				case "relativeUsingJ":
					this.pc.add(expandTo16bits(this.j.get()));
					break;
			}
	}

	private jns() {
		if (this.sr.getN())
			switch (this.addressing) {
				case "absolute":
					this.pc.set(this.argument);
					break;
				case "relative":
					this.pc.add(expandTo16bits(this.argument));
					break;
				case "relativeUsingJ":
					this.pc.add(expandTo16bits(this.j.get()));
					break;
			}
	}

	private joc() {
		if (!this.sr.getO())
			switch (this.addressing) {
				case "absolute":
					this.pc.set(this.argument);
					break;
				case "relative":
					this.pc.add(expandTo16bits(this.argument));
					break;
				case "relativeUsingJ":
					this.pc.add(expandTo16bits(this.j.get()));
					break;
			}
	}

	private jos() {
		if (this.sr.getO())
			switch (this.addressing) {
				case "absolute":
					this.pc.set(this.argument);
					break;
				case "relative":
					this.pc.add(expandTo16bits(this.argument));
					break;
				case "relativeUsingJ":
					this.pc.add(expandTo16bits(this.j.get()));
					break;
			}
	}

	private kill() {
		if (this.sysPrivilegesGuard()) return;
		throw "Execution halted";
	}

	private lda() {
		let op = this.getOperand();
		this.a.set(op);
		this.sr.setZ(op === 0);
		this.sr.setN(msbit(op, 16));
	}

	private ldah() {
		let op = this.getOperand();
		this.a.setHigh(op);
		this.sr.setZ(op === 0);
		this.sr.setN(msbit(op, 8));
	}

	private ldal() {
		let op = this.getOperand();
		this.a.setLow(op);
		this.sr.setZ(op === 0);
		this.sr.setN(msbit(op, 8));
	}

	private ldb() {
		let op = this.getOperand();
		this.b.set(op);
		this.sr.setZ(op === 0);
		this.sr.setN(msbit(op, 16));
	}

	private ldbh() {
		let op = this.getOperand();
		this.b.setHigh(op);
		this.sr.setZ(op === 0);
		this.sr.setN(msbit(op, 8));
	}

	private ldbl() {
		let op = this.getOperand();
		this.b.setLow(op);
		this.sr.setZ(op === 0);
		this.sr.setN(msbit(op, 8));
	}

	private lddr() {
		if (this.sysPrivilegesGuard()) return;
		let op = this.getOperand();
		this.dr.set(op);
		this.sr.setZ(op === 0);
		this.sr.setN(msbit(op, 16));
	}

	private ldi() {
		let op = this.getOperand();
		this.i.set(op);
		this.sr.setZ(op === 0);
		this.sr.setN(msbit(op, 16));
	}

	private ldj() {
		let op = this.getOperand();
		this.j.set(op);
		this.sr.setZ(op === 0);
		this.sr.setN(msbit(op, 8));
	}

	private ldsp() {
		let op = this.getOperand();
		this.sp.set(op);
		this.sr.setZ(op === 0);
		this.sr.setN(msbit(op, 16));
	}

	private ldsr() {
		let op = this.getOperand();
		this.sr.set(op);
	}

	private lemh() {
		if (this.sysPrivilegesGuard()) return;
		let op = this.getOperand();
		this.emhi.set(op);
		this.sr.setZ(op === 0);
		this.sr.setN(msbit(op, 16));
	}

	private leml() {
		if (this.sysPrivilegesGuard()) return;
		let op = this.getOperand();
		this.emli.set(op);
		this.sr.setZ(op === 0);
		this.sr.setN(msbit(op, 16));
	}

	private limh() {
		if (this.sysPrivilegesGuard()) return;
		let op = this.getOperand();
		this.imhi.set(op);
		this.sr.setZ(op === 0);
		this.sr.setN(msbit(op, 16));
	}

	private liml() {
		if (this.sysPrivilegesGuard()) return;
		let op = this.getOperand();
		this.imli.set(op);
		this.sr.setZ(op === 0);
		this.sr.setN(msbit(op, 16));
	}

	private msb() {
		this.sr.setZ(msbit(this.getOperand(), 16));
	}

	private nop() {
		return;
	}

	private ora() {
		let res;
		switch (this.addressing) {
			case "immediate1":
				res = this.a.orLow(this.getOperand());
				this.sr.setZ(res.zero);
				this.sr.setN(res.negative);
				break;
			default:
				res = this.a.or(this.getOperand());
				this.sr.setZ(res.zero);
				this.sr.setN(res.negative);
				break;
		}
	}

	private orb() {
		let res;
		switch (this.addressing) {
			case "immediate1":
				res = this.b.orLow(this.getOperand());
				this.sr.setZ(res.zero);
				this.sr.setN(res.negative);
				break;
			default:
				res = this.b.or(this.getOperand());
				this.sr.setZ(res.zero);
				this.sr.setN(res.negative);
				break;
		}
	}

	private pop() {
		switch (this.addressing) {
			case "accumulatorRegister":
				this.sp.sub(2);
				this.a.set(this.fetchStack());
				break;
			case "baseRegister":
				this.sp.sub(2);
				this.b.set(this.fetchStack());
				break;
			case "accumulatorHighRegister":
				this.sp.sub(1);
				this.a.setHigh(this.fetchStack(false));
				break;
			case "accumulatorLowRegister":
				this.sp.sub(1);
				this.a.setLow(this.fetchStack(false));
				break;
		}
	}

	private psh() {
		if (this.spOORguard()) return;
		let op;
		switch (this.addressing) {
			case "accumulatorHighRegister": case "accumulatorLowRegister": case "immediate1":
				this.iMem[this.sp.get()] = this.getOperand(false);
				this.sp.add(1);
				return;
			case "implied":
				this.iMem[this.sp.get()] = this.sr.get();
				this.sp.add(1);
				this.iMem[this.sp.get()] = getHigh(add16bits(this.pc.get(), 4).result);
				this.sp.add(1);
				this.iMem[this.sp.get()] = getLow(add16bits(this.pc.get(), 4).result);
				this.sp.add(1);
				return;
			default:
				op = this.getOperand();
				this.iMem[this.sp.get()] = getHigh(op);
				this.sp.add(1);
				this.iMem[this.sp.get()] = getLow(op);
				this.sp.add(1);
				return;
		}
	}

	private read() {
		let value;
		let address;
		switch (this.addressing) {
			case "accumulatorRegister":
				address = this.a.get();
				if (this.eaOORguard(address)) return;
				value = this.externalBUS.getMemory(this.a.get())
				this.b.setHigh(value);
				break;
			case "baseRegister":
				address = this.b.get();
				if (this.eaOORguard(address)) return;
				value = this.externalBUS.getMemory(this.a.get())
				this.a.setHigh(value);
				break;
			case "absolute": case "zeroPage":
				address = this.argument;
				if (this.eaOORguard(address)) return;
				value = this.externalBUS.getMemory(this.a.get())
				this.a.setHigh(value);
				break;
			case "absoluteIndexed": case "zeroPageIndexed":
				address = add16bits(this.argument, this.i.get()).result;
				if (this.eaOORguard(address)) return;
				value = this.externalBUS.getMemory(this.a.get())
				this.a.setHigh(value);
				break;
		}
		this.sr.setZ(value === 0);
		this.sr.setN(msbit(value, 8));
	}

	private rest() {
		if (this.sysPrivilegesGuard()) return;
		this.reset();
	}

	private ret() {
		this.sp.sub(2);
		this.pc.set(this.fetchStack());
		this.sp.sub(1);
		this.sr.set(this.fetchStack(false));
		return;
	}

	private sed() {
		if (this.sysPrivilegesGuard()) return;
		this.sr.setD(true);
	}

	private sei() {
		if (this.sysPrivilegesGuard()) return;
		this.sr.setI(true);
	}

	private semh() {
		this.store(this.getAddress(), this.emhi.get(), 16);
	}

	private seml() {
		this.store(this.getAddress(), this.emli.get(), 16);
	}

	private ses() {
		if (this.sysPrivilegesGuard()) return;
		this.sr.setS(true);
	}

	private shl() {
		let res;
		switch (this.addressing) {
			case "accumulatorRegister":
				res = this.a.shl();
				break;
			case "baseRegister":
				res = this.b.shl();
				break;
			case "indexRegister":
				res = this.i.shl();
				break;
		}
		this.sr.setC(res.carry);
		this.sr.setZ(res.zero);
		return;
	}

	private shr() {
		let res;
		switch (this.addressing) {
			case "accumulatorRegister":
				res = this.a.shr();
				break;
			case "baseRegister":
				res = this.b.shr();
				break;
			case "indexRegister":
				res = this.i.shr();
				break;
		}
		this.sr.setC(res.carry);
		this.sr.setZ(res.zero);
		return;
	}

	private simh() {
		this.store(this.getAddress(), this.imhi.get(), 16);
	}

	private siml() {
		this.store(this.getAddress(), this.imli.get(), 16);
	}

	private sta() {
		this.store(this.getAddress(), this.a.get(), 16);
	}

	private stah() {
		this.store(this.getAddress(), this.a.getHigh(), 8);
	}

	private stb() {
		this.store(this.getAddress(), this.b.get(), 16);
	}

	private stbh() {
		this.store(this.getAddress(), this.b.getHigh(), 8);
	}

	private sti() {
		this.store(this.getAddress(), this.i.get(), 16);
	}

	private stj() {
		this.store(this.getAddress(), this.j.get(), 8);
	}

	private stpc() {
		this.store(this.getAddress(), this.pc.get(), 16);
	}

	private stsr() {
		this.store(this.getAddress(), this.sr.get(), 8);
	}

	private sua() {
		let res;
		switch (this.addressing) {
			case "immediate1":
				res = this.a.subLow(this.getOperand());
				this.sr.setO(res.overflow);
				this.sr.setC(res.carry);
				this.sr.setZ(res.zero);
				this.sr.setN(res.negative);
				break;
			default:
				res = this.a.sub(this.getOperand());
				this.sr.setO(res.overflow);
				this.sr.setC(res.carry);
				this.sr.setZ(res.zero);
				this.sr.setN(res.negative);
				break;
		}
	}

	private sub() {
		let res;
		switch (this.addressing) {
			case "immediate1":
				res = this.b.subLow(this.getOperand());
				this.sr.setO(res.overflow);
				this.sr.setC(res.carry);
				this.sr.setZ(res.zero);
				this.sr.setN(res.negative);
				break;
			default:
				res = this.b.sub(this.getOperand());
				this.sr.setO(res.overflow);
				this.sr.setC(res.carry);
				this.sr.setZ(res.zero);
				this.sr.setN(res.negative);
				break;
		}
	}

	private sys() {
		this.pushIrq();
		this.pc.set(this.iMem[SYS_VECTOR] << 8 | this.iMem[SYS_VECTOR + 1]);
	}

	private tab() {
		let value = this.a.get();
		this.b.set(value);
		this.sr.setZ(value === 0);
		this.sr.setN(msbit(value, 16));
	}

	private tabh() {
		let value = this.a.getHigh();
		this.b.setHigh(value);
		this.sr.setZ(value === 0);
		this.sr.setN(msbit(value, 8));
	}

	private tabl() {
		let value = this.a.getLow();
		this.b.setLow(value);
		this.sr.setZ(value === 0);
		this.sr.setN(msbit(value, 8));
	}

	private tadr() {
		if (this.sysPrivilegesGuard()) return;
		let value = this.a.get();
		this.dr.set(value);
		this.sr.setZ(value === 0);
		this.sr.setN(msbit(value, 16));
	}

	private taemh() {
		if (this.sysPrivilegesGuard()) return;
		let value = this.a.get();
		this.emhi.set(value);
		this.sr.setZ(value === 0);
		this.sr.setN(msbit(value, 16));
	}

	private taeml() {
		if (this.sysPrivilegesGuard()) return;
		let value = this.a.get();
		this.emli.set(value);
		this.sr.setZ(value === 0);
		this.sr.setN(msbit(value, 16));
	}

	private tahj() {
		let value = this.a.getHigh();
		this.j.set(value);
		this.sr.setZ(value === 0);
		this.sr.setN(msbit(value, 8));
	}

	private tai() {
		let value = this.a.get();
		this.i.set(value);
		this.sr.setZ(value === 0);
		this.sr.setN(msbit(value, 16));
	}

	private taimh() {
		if (this.sysPrivilegesGuard()) return;
		let value = this.a.get();
		this.imhi.set(value);
		this.sr.setZ(value === 0);
		this.sr.setN(msbit(value, 16));
	}

	private taiml() {
		if (this.sysPrivilegesGuard()) return;
		let value = this.a.get();
		this.imli.set(value);
		this.sr.setZ(value === 0);
		this.sr.setN(msbit(value, 16));
	}

	private tba() {
		let value = this.b.get();
		this.a.set(value);
		this.sr.setZ(value === 0);
		this.sr.setN(msbit(value, 16));
	}

	private tbah() {
		let value = this.b.getHigh();
		this.a.setHigh(value);
		this.sr.setZ(value === 0);
		this.sr.setN(msbit(value, 8));
	}

	private tbal() {
		let value = this.b.getLow();
		this.a.setLow(value);
		this.sr.setZ(value === 0);
		this.sr.setN(msbit(value, 8));
	}

	private tbhj() {
		let value = this.b.getHigh();
		this.j.set(value);
		this.sr.setZ(value === 0);
		this.sr.setN(msbit(value, 8));
	}

	private tbi() {
		let value = this.b.get();
		this.i.set(value);
		this.sr.setZ(value === 0);
		this.sr.setN(msbit(value, 16));
	}

	private tisp() {
		let value = this.i.get();
		this.sp.set(value);
		this.sr.setZ(value === 0);
		this.sr.setN(msbit(value, 16));
	}

	private tspb() {
		let value = this.sp.get();
		this.b.set(value);
		this.sr.setZ(value === 0);
		this.sr.setN(msbit(value, 16));
	}

	private wrte() {
		let address = this.getAddress();
		if (this.eaOORguard(address)) return;
		this.externalBUS.setMemory(this.a.getHigh(), address);
	}

	private wrti() {
		if (this.eaOORguard(this.i.get())) return;
		let value;
		switch (this.addressing) {
			case "accumulatorHighRegister":
				value = this.a.getHigh();
				break;
			case "baseHighRegister":
				value = this.b.getHigh();
				break;
			case "immediate1": case "immediate":
				value = this.argument;
				break;
			case "zeroPage": case "absolute":
				value = this.iMem[this.argument];
				break;
			case "indirect":
				value = this.iMem[this.iMem[this.argument] << 8 | this.iMem[add16bits(this.argument, 1).result]];
				break;
		}
		this.externalBUS.setMemory(value, this.i.get());
	}

	private xora() {

	}

	private xorb() {

	}

	// For debug mode
	getCpuStatus() {
		let cpuStatus: CPUStatus;

		cpuStatus = {
			a: this.a.toHexString(),
			b: this.b.toHexString(),
			i: this.i.toHexString(),
			j: this.j.toHexString(),

			pc: this.pc.toHexString(),
			ir: this.ir.toHexString(),
			sp: this.sp.toHexString(),
			dr: this.dr.toHexString(),
			sr: this.sr.toString(),

			imli: this.imli.toHexString(),
			imhi: this.imhi.toHexString(),
			emli: this.emli.toHexString(),
			emhi: this.emhi.toHexString(),
			ar: this.ar.toHexString(),

			currentInstruction: this.currentInstruction,

			iMem: this.iMem
		}

		return cpuStatus;
	}

	getCurrentAddress() {
		return this.pc.get();
	}

	getFullMemory() {
		return this.iMem;
	}
}