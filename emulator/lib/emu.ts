import { ANC16 } from "./ANC16";
import { getLineDebug, initDebug, printDebugHelp } from "./debugCli";
import { ExternalMemoryConstroller } from "./memoryController";
import { EmulatorParams } from "./types";

export class Emulator {
	private memoryController: ExternalMemoryConstroller;
	private cpu: ANC16;

	constructor(params: EmulatorParams) {
		this.memoryController = new ExternalMemoryConstroller();
		this.memoryController.setOs(params.osRom);
		this.memoryController.setChar(params.charMap);
		this.cpu = new ANC16(this.memoryController.getFullMemory());

		if (params.emuOptions.cardFile !== null) {
			this.memoryController.setCard(params.emuOptions.cardFile);
		}

		if (params.emuOptions.mode === "debug") {
			initDebug();
			this.debugCliLoop();
		}
	}

	private async debugCliLoop() {
		while (true) {
			process.stdout.write("> ");
			const line = await getLineDebug();
			this.decodeDebugCommand(line);
		}
	}

	private decodeDebugCommand(str: string) {
		switch (str) {
			case "help":
				printDebugHelp();
				break;
		}
	}
}