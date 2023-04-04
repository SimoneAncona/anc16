import { type } from "os"

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
	ar: string
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