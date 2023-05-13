import { ANC16 } from "./ANC16.js";
import { AVC64 } from "./AVC64.js";
import { printError } from "./consoleError.js";
import { debugAsk, debugCPUStats, getLineDebug, initDebug, printDebugHelp, updateDebugCPUStats } from "./debugCli.js";
import { ExternalMemoryController } from "./memoryController.js";
import { EmulatorParams } from "./types.js";

export class Emulator {
	private memoryController: ExternalMemoryController;
	private cpu: ANC16;
	private gpu: AVC64;
	private runStatus: boolean;

	constructor(params: EmulatorParams) {
		this.memoryController = new ExternalMemoryController();
		this.memoryController.setOs(params.osRom);
		this.memoryController.setChar(params.charMap);
		this.gpu = new AVC64();
		this.memoryController.setVideoChip(this.gpu);
		this.cpu = new ANC16(this.memoryController);
		this.cpu.reset();

		if (params.emuOptions.video) {
			this.memoryController.enableVideoOutput();
		}

		if (params.emuOptions.cardFile !== null) {
			this.memoryController.setCard(params.emuOptions.cardFile);
		}

		process.stdout.on("resize", () => {
			if (this.runStatus) {
				debugCPUStats(this.cpu.getCpuStatus());
			}
		});

		if (params.emuOptions.mode === "debug") {
			initDebug();
			this.debugCliLoop();
		}
	}

	private async debugCliLoop() {
		while (true) {
			if (this.runStatus) {
				updateDebugCPUStats(this.cpu.getCpuStatus());
			} else {
				process.stdout.write("> ");
				const line = await getLineDebug();
				await this.decodeDebugCommand(line);
			}
		}
	}

	private async decodeDebugCommand(str: string) {
		switch (str) {
			case "help":
				printDebugHelp();
				break;
			case "exit":
				await debugAsk("Do you really want to exit?", () => process.exit(0), () => { });
				break;
			case "res": case "reset":
				this.cpu.reset();
				break;
			case "run":
				this.runStatus = true;
				debugCPUStats(this.cpu.getCpuStatus());
				break;
			default:
				printError("unrecognized command. Type 'help' for more information");
				break;
		}
	}
}