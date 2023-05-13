import { exit } from "process";
import { printError } from "./consoleError.js";
import { initVideo, updateVideo } from "./video.js";
import { AVC64 } from "./AVC64.js";

const MEMORY_SIZE = 0x10000;

const EMEM_OS_START = 0;
const EMEM_OS_SIZE = 16384;
const EMEM_CARD_SLOT_START = 0x4000;
const EMEM_CARD_SLOT_SIZE = 49145;
const EMEM_VIDEO_CHIP_START = 0xFFF9;
const EMEM_VIDEO_CHIP_SIZE = 4;
const EMEM_KEYBOARD = 0xFFFD;
const EMEM_MOUSE = 0xFFFE;
const EMEM_AUDIO = 0xFFFF;

export class ExternalMemoryController {
	private memory: Uint8Array;
	private gpu: AVC64;

	constructor() {
		this.memory = new Uint8Array(MEMORY_SIZE);
		initVideo();
	}

	getFullMemory() {
		return this.memory;
	}

	setCard(binary: Uint8Array) {
		if (binary.length > EMEM_CARD_SLOT_SIZE) {
			printError("The card binary file exceeds " + EMEM_CARD_SLOT_SIZE + " bytes");
			exit(1);
		}

		this.memory.set(binary, EMEM_CARD_SLOT_START);
	}

	setOs(binary: Uint8Array) {
		if (binary.length > EMEM_OS_SIZE) {
			printError("The OS rom binary file exceeds " + EMEM_OS_SIZE + " bytes");
			exit(1);
		}

		this.memory.set(binary, EMEM_OS_START);
	}

	setChar(binary: Uint8Array) {
		
	}

	setVideoChip(avc: AVC64) {
		this.gpu = avc;
	}

	getVideoMemory() {
		return this.gpu.getVideoMemory();
	}

	enableVideoOutput() {
		
	}

	setMemory(data: number, address: number) {

	}
}