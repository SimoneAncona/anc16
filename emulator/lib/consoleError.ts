import * as colors from "colors";
colors.enable();

export function printError(message: string) {
	process.stdout.write("Error ".red);
	console.log(message + "\n");
}