import { exit } from "process";
import { printError } from "./consoleError";
import { updateVideo } from "./video";

const MEMORY_SIZE = 0xFFFF;

const EMEM_OS_START = 0;
const EMEM_OS_SIZE = 8192;
const EMEM_CHR_START = EMEM_OS_SIZE;
const EMEM_CHR_SIZE = 5888;
const EMEM_CARD_SLOT_START = 0x3700;
const EMEM_CARD_SLOT_SIZE = 8253;
const EMEM_VIDEO_START = 0x573D;
const EMEM_VIDEO_SIZE = 43200;
const EMEM_KEYBOARD = 0xFFFD;
const EMEM_MOUSE = 0xFFFE;
const EMEM_AUDIO = 0xFFFF;

export class ExternalMemoryConstroller {
	private memory: Uint8ClampedArray;

	constructor() {
		this.memory = new Uint8ClampedArray(MEMORY_SIZE);
	}

	getFullMemory() {
		return this.memory;
	}

	setCard(binary: Uint8Array) {
		if (binary.length > EMEM_CARD_SLOT_SIZE) {
			printError("the card binary file exceeds " + EMEM_CARD_SLOT_SIZE + " bytes");
			exit(1);
		}

		this.memory.set(binary, EMEM_CARD_SLOT_START);
	}

	setOs(binary: Uint8Array) {
		if (binary.length > EMEM_OS_SIZE) {
			printError("the os rom binary file exceeds " + EMEM_OS_SIZE + " bytes");
			exit(1);
		}

		this.memory.set(binary, EMEM_OS_START);
	}

	setChar(binary: Uint8Array) {
		if (binary.length > EMEM_CHR_SIZE) {
			printError("the char map binary file exceeds " + EMEM_CHR_SIZE + " bytes");
			exit(1);
		}

		this.memory.set(binary, EMEM_CHR_START);
	}

	getVideoMemory() {
		return this.memory.subarray(EMEM_VIDEO_START, EMEM_VIDEO_START + EMEM_VIDEO_SIZE);
	}
}