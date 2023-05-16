export type CPUStatus = {
	a: string,
	b: string,
	i: string,
	j: string,
	pc: string,
	ir: string,
	currentInstruction: string,
	sp: string,
	dr: string,
	sr: string,
	imli: string,
	imhi: string,
	emli: string,
	emhi: string,
	ar: string,

	iMem: Uint8Array;
}

export type EmulatorOptions = {
	mode: "watch" | "debug" | "run",
	video: boolean,
	audio: boolean,
	cardFile: null | Uint8Array
}

export type EmulatorParams = {
	emuOptions: EmulatorOptions
	osRom: Uint8Array,
	charMap: Uint8Array
}

export type ParamFlag = {
	name: string,
	value: string
}

export type AVC64Modes = "singlePixel" | "texture" | "clear" | "nop";
export type AddressingMode = "absolute" |
	"absoluteIndexed" |
	"accumulatorRegister" |
	"accumulatorHighRegister" |
	"accumulatorLowRegister" |
	"baseRegister" |
	"baseHighRegister" |
	"baseLowRegister" |
	"immediate" |
	"immediate1" |
	"immediate2" |
	"implied" |
	"indexRegister" |
	"indirect" |
	"indirectIndexed" |
	"relative" |
	"relativeUsingJ" |
	"zeroPage" |
	"zeroPageIndexed"
	;

export type Instruction = "ada" | "adb" | "ana" | "anb" | "aret" | "clc" | "cld" | "cli" | "clo" | "cls" | "cmah" | "cmbh" | "cmpa" | "cmpb" | "cmpi" | "cpuid" | "dea" | "deb" | "dei" | "dej" | "ina" | "inb" | "ini" | "inj" | "jcc" | "jcs" | "jeq" | "jmp" | "jnc" | "jne" | "jns" | "joc" | "jos" | "kill" | "lda" | "ldah" | "ldal" | "ldb" | "ldbh" | "ldbl" | "lddr" | "ldi" | "ldj" | "ldsp" | "ldsr" | "lemh" | "leml" | "limh" | "liml" | "msb" | "nop" | "ora" | "orb" | "pop" | "psh" | "read" | "rest" | "ret" | "sed" | "sei" | "semh" | "seml" | "ses" | "shl" | "shr" | "simh" | "siml" | "sta" | "stah" | "stb" | "stbh" | "sti" | "stj" | "stpc" | "stsr" | "sua" | "sub" | "sys" | "tab" | "tabh" | "tabl" | "tadr" | "taemh" | "taeml" | "tahj" | "tai" | "taimh" | "taiml" | "tba" | "tbah" | "tbal" | "tbhj" | "tbi" | "tisp" | "tspb" | "wrte" | "wrti" | "xora" | "xorb";

export type Breakpoint = { id: number, address: number }