import { getInfo } from "./isa.js";
import { ExternalMemoryController } from "./memoryController.js";
import { Register16, Register16HighLow, Register8, StatusRegister, add16bit } from "./registers.js";
import { AddressingMode, CPUStatus, Instruction } from "./types.js";

// Constants
const MEMORY_SIZE = 0x10000;
const FIRMWARE = new Uint8ClampedArray([
	0x80, 0x55, 0x01, 0x00, 0x80, 0x53, 0x00, 0x00, 0x00, 0x3e, 0x80, 0x72, 0x00,
	0x00, 0x00, 0x04, 0x00, 0x06, 0x80, 0x26, 0x20, 0x13, 0x40, 0x12, 0xf2, 0x80,
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

	constructor(externalMemory: ExternalMemoryController) {
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
		this.ir.set(0); this.sp.set(0);
		this.dr.set(0); this.sr.set(0b00111100);	// n o I D S 1 z c

		// Memory table
		this.imli.set(0); this.imhi.set(0);
		this.emli.set(0); this.emhi.set(0);
		this.ar.set(0);
	}

	private fetchDecode() {
		let opc = this.iMem[this.pc.get()] << 8 | this.iMem[this.pc.get() + 1];
		let ins = getInfo(opc);
		this.currentInstruction = ins.mnemonic;
		this.privileged = ins.needPrivileges;
		this.addressing = ins.addressing;
		switch (this.addressing) {
			case "absolute": case "absoluteIndexed": case "immediate2": case "indirect": case "indirectIndexed":
				this.argument = this.iMem[add16bit(this.pc.get(), 2).result] << 8 | this.iMem[add16bit(this.pc.get(), 3).result];
				this.argsize = 16;
				this.pc.add(4);
				break;
			case "relative": case "zeroPage": case "zeroPageIndexed": case "immediate1":
				this.argument = this.iMem[add16bit(this.pc.get(), 2).result];
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
		switch (this.addressing) {
			case "immediate1": case "immediate2":
				return this.argument;
			case "absolute":
				return wordSize ? this.iMem[this.argument] << 8 | this.iMem[add16bit(this.argument, 1).result] : this.iMem[this.argument];
		}
	}

	// instructions
	private ada() {
		switch (this.addressing) {
			case "accumulatorHighRegister": case "baseHighRegister":
				let res = this.a.addHigh(this.getOperand());
				this.sr.setO(res.overflow);
				this.sr.setC(res.carry);
				this.sr.setZ(res.zero);
				break;
			case "accumulatorLowRegister": case "baseLowRegister":
		}
		this.a.add(this.getOperand())
	}

	private adb() {

	}

	private ana() {

	}

	private anb() {

	}

	private aret() {

	}

	private clc() {

	}

	private cld() {

	}

	private cli() {

	}

	private clo() {

	}

	private cls() {

	}

	private cmah() {

	}

	private cmbh() {

	}

	private cmpa() {

	}

	private cmpb() {

	}

	private cmpi() {

	}

	private cpuid() {

	}

	private dea() {

	}

	private deb() {

	}

	private dei() {

	}

	private dej() {

	}

	private ina() {

	}

	private inb() {

	}

	private ini() {

	}

	private inj() {

	}

	private jcc() {

	}

	private jcs() {

	}

	private jeq() {

	}

	private jmp() {

	}

	private jnc() {

	}

	private jne() {

	}

	private jns() {

	}

	private joc() {

	}

	private jos() {

	}

	private kill() {

	}

	private lda() {

	}

	private ldah() {

	}

	private ldal() {

	}

	private ldb() {

	}

	private ldbh() {

	}

	private ldbl() {

	}

	private lddr() {

	}

	private ldi() {

	}

	private ldj() {

	}

	private ldsp() {

	}

	private ldsr() {

	}

	private lemh() {

	}

	private leml() {

	}

	private limh() {

	}

	private liml() {

	}

	private msb() {

	}

	private nop() {

	}

	private ora() {

	}

	private orb() {

	}

	private pop() {

	}

	private psh() {

	}

	private read() {

	}

	private rest() {

	}

	private ret() {

	}

	private sed() {

	}

	private sei() {

	}

	private semh() {

	}

	private seml() {

	}

	private ses() {

	}

	private shl() {

	}

	private shr() {

	}

	private simh() {

	}

	private siml() {

	}

	private sta() {

	}

	private stah() {

	}

	private stb() {

	}

	private stbh() {

	}

	private sti() {

	}

	private stj() {

	}

	private stpc() {

	}

	private stsr() {

	}

	private sua() {

	}

	private sub() {

	}

	private sys() {

	}

	private tab() {

	}

	private tabh() {

	}

	private tabl() {

	}

	private tadr() {

	}

	private taemh() {

	}

	private taeml() {

	}

	private tahj() {

	}

	private tai() {

	}

	private taimh() {

	}

	private taiml() {

	}

	private tba() {

	}

	private tbah() {

	}

	private tbal() {

	}

	private tbhj() {

	}

	private tbi() {

	}

	private tisp() {

	}

	private tspb() {

	}

	private wrte() {

	}

	private wrti() {

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

			currentInstruction: ""
		}

		return cpuStatus;
	}
}