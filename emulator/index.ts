import { processArguments } from "./lib/command.js";
import { Emulator } from "./lib/emu.js";
import { EmulatorParams } from "./lib/types.js";

let emuParams: EmulatorParams;
let emu: Emulator;
emuParams = processArguments(process.argv);
emu = new Emulator(emuParams);
