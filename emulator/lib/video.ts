import { Canvas } from "canvas";
const WIDTH = 240;
const HEIGHT = 180;
const RESOLUTION = WIDTH * HEIGHT;
const canvas = new Canvas(WIDTH, HEIGHT);
let ctx = canvas.getContext("2d");

export function updateVideo(memory: Uint8ClampedArray) {
	if (memory.length != RESOLUTION) throw "Invalid video memory segment";
	let vm = ctx.createImageData(WIDTH, HEIGHT);
	
	for (let i = 0; i < vm.data.length; i += 4) {
		let color8bit = memory[i / 4];
		let red = color8bit & 0b11100000;
		let green = color8bit & 0b00011100;
		let blue = color8bit & 0b00000011;

		red >>= 5;
		green >>= 2;

		vm.data[i] = red * 36;
		vm.data[i + 1] = green * 36;
		vm.data[i + 2] = blue * 85;
		vm.data[i + 3] = 255;
	}

	ctx.putImageData(vm, 0, 0);
}