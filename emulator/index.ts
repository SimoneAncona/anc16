import { processArguments } from "./lib/command";
import { Emulator } from "./lib/emu";
import { EmulatorParams } from "./lib/types";

let emuParams: EmulatorParams;
let emu: Emulator;
emuParams = processArguments(process.argv);
emu = new Emulator(emuParams);
