import { Register8 } from "./registers.js";
import { AVC64Modes } from "./types.js";

const MEMORY_SIZE = 0x10000;
const CHAR_MAP = 0x0000;
const CHAR_MAP_SIZE = 8192
const VIDEO_MEM = 0x2000;
const VIDEO_MEM_SIZE = 57344

export class AVC64 {
    // Registers
    private d: Register8;   // data stored
    private x: Register8;   // x coordinate
    private y: Register8;   // y coordinate

    // memory
    private mem: Uint8Array;

    constructor() {
        this.d = new Register8();
        this.x = new Register8();
        this.y = new Register8();
        this.mem = new Uint8Array(MEMORY_SIZE);
    }

    setData(data: number) {
        this.d.set(data);
    }

    setX(x: number) {
        this.x.set(x);
    }

    setY(y: number) {
        this.y.set(y);
    }

    getVideoMemory() {
        return this.mem.subarray(VIDEO_MEM, VIDEO_MEM + VIDEO_MEM_SIZE);
    }
}