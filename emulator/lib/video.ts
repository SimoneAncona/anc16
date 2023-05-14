import { Canvas } from "simply2d";
let canvas: Canvas;

export function initVideo() { 
    canvas = new Canvas("ANC16", 256, 224);
}

export function updateVideo(buffer: Uint8Array) { 
    canvas.loadRawData(buffer, 8);
}