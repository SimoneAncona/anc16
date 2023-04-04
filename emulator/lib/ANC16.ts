import { Register16, Register16HighLow, Register8, StatusRegister } from "./registers";
import { CPUStatus } from "./types";

// Constants
const MEMORY_SIZE = 0xFFFF;
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
	private eMem: Uint8ClampedArray;
	private iMem: Uint8ClampedArray;

	constructor(externalMemory: Uint8ClampedArray) {
		if (externalMemory.length != MEMORY_SIZE) throw "Memory must be 64KB";
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

		this.eMem = externalMemory;
		this.iMem = new Uint8ClampedArray(MEMORY_SIZE);

		// Setting up the firmware
		for (let i = INTERNAL_ROM_START; i < this.iMem.length && i < FIRMWARE.length + INTERNAL_ROM_START; i++) {
			this.iMem[i] = FIRMWARE[i - INTERNAL_ROM_START];
		}

		this.reset();
	}

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


	// For debug mode
	getCpuStatus() {
		let cpuStatus: CPUStatus;

		return cpuStatus;
	}
}