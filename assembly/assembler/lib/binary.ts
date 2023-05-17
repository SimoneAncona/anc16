import { Label } from "./types";

export function setBinary(labels: Label[]) {
	for (let lb of labels) {
		lb.binary = new Uint8Array(lb.size as number);
		let i = 0;
		let j = 0;
		for (; i < lb.data.length; i++) {
			if (lb.data[i].size === 1) {
				// @ts-ignore
				lb.binary[j] = lb.data[i].value;
				j++;
			} else {
				// @ts-ignore
				lb.binary[j] = lb.data[i].value >> 8;
				// @ts-ignore
				lb.binary[j + 1] = lb.data[i].value & 0x00FF;
				j += 2;
			}
		}
	}
}

export function getBinary(labels: Label[]): Uint8Array {
	let size = 0;
	for (let i = 1; i < labels.length; i++) {
		size += (labels[i].address as number) - (labels[i - 1].address as number);
	}
	size += labels[labels.length - 1].size as number;
	let buffer = new Uint8Array(size);
	buffer.fill(0);
	for (let lb of labels) {
		buffer.set(lb.binary, (lb.address as number) - (labels[0].address as number));
	}
	return buffer;
}