import { Register8 } from "./registers.js";
import { AVC64Modes } from "./types.js";
import { updateVideo } from "./video.js";

const MEMORY_SIZE = 0x10000;
const CHAR_MAP = 0x0000;
const CHAR_MAP_SIZE = 8192
const VIDEO_MEM = 0x2000;
const VIDEO_MEM_SIZE = 57344;
const VIDEO_MODE_SP = 0x0;
const VIDEO_MODE_TX = 0x1;
const VIDEO_MODE_CL = 0x2;
const VIDEO_MODE_CX = 0x3;
const VIDEO_MODE_CY = 0x4;
const VIDEO_MODE_D1 = 0x5;
const VIDEO_MODE_D2 = 0x6;
const VIDEO_MODE_D3 = 0x7;
const VIDEO_MODE_D4 = 0x8;
const VIDEO_MODE_NOP = 0x9;
const VIDEO_WIDTH = 256;
const VIDEO_HEIGHT = 224;

export class AVC64 {
    // Registers
    private d1: Register8;  // data1 stored
    private d2: Register8;  // data2 stored
    private d3: Register8;  // data3 stored
    private d4: Register8;  // data4 stored
    private x: Register8;   // x coordinate
    private y: Register8;   // y coordinate

    // memory
    private mem: Uint8Array;

    constructor() {
        this.d1 = new Register8();
        this.d2 = new Register8();
        this.d3 = new Register8();
        this.d4 = new Register8();
        this.x = new Register8();
        this.y = new Register8();
        this.mem = new Uint8Array(MEMORY_SIZE);
        this.videoLoop();
    }

    convertXY() {
        return (this.x.get() + this.y.get() * VIDEO_WIDTH) + VIDEO_MEM;
    }

    read(mode: number) {
        switch (mode) {
            case VIDEO_MODE_SP:
                return this.mem[this.convertXY()];
        }
    }

    write(data: number, mode: number) {
        switch (mode) {
            case VIDEO_MODE_SP:
                this.mem[this.convertXY()] = this.d1.get();
                break;
            case VIDEO_MODE_TX:
                throw "Not implemented";
                break;
            case VIDEO_MODE_CL:
                for (let i = VIDEO_MEM; i < MEMORY_SIZE; i++) this.mem[i] = this.d1.get();
                break;
            case VIDEO_MODE_CX:
                this.x.set(data);
                break;
            case VIDEO_MODE_CY:
                this.y.set(data);
                break;
            case VIDEO_MODE_D1:
                this.d1.set(data);
                break;
            case VIDEO_MODE_D2:
                this.d2.set(data);
                break;
            case VIDEO_MODE_D3:
                this.d3.set(data);
                break;
            case VIDEO_MODE_D4:
                this.d4.set(data);
                break;
        }
    }

    getVideoMemory() {
        return this.mem.subarray(VIDEO_MEM, VIDEO_MEM + VIDEO_MEM_SIZE);
    }

    videoLoop() {
        setInterval(() => updateVideo(this.getVideoMemory()), 5);
    }
}