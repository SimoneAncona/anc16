import * as localError from "./localError";
import * as fs from "fs";
import * as path from "path";

let cwd = "";
let modulePool: string[];
modulePool = [];

export function setCWD(fileName: string) {
	cwd = path.dirname(fs.realpathSync(fileName));
}

export function getCWD() {
	return cwd;
}

export function read(fileName: string): string {
	let sourceFile;
	try {
		sourceFile = fs.readFileSync(fileName);
	} catch (e) {
		let err: localError.Error;
		if (e.code == "EISDIR") {
			err = {
				type: localError.FS_ERROR,
				message: "Cannot open a directory as a stream",
				otherInfo: false
			};
			localError.printExit(err);
		}
		err = {
			type: localError.FILE_NOT_FOUND,
			message: "The file '" + fileName + "' was not found",
			otherInfo: false
		};
		localError.printExit(err);
	}

	return sourceFile.toString();
}

export function write(fileName: string, buff: Uint8Array): void {
	try {
		if (fs.existsSync(fileName))
			fs.writeFileSync(fileName, buff);
		else
			fs.writeFileSync(fileName, buff, { flag: "wx" });
	} catch {
		const err: localError.Error = {
			type: localError.FILE_ALREDY_EXIST,
			message: "The file or the directory '" + fileName + "' already exist",
			otherInfo: false
		};
		localError.printExit(err);
	}

}

export function appendModule(modulePath: string) {
	modulePool.push(path.resolve(modulePath));
}

export function modulePoolContains(modulePath: string) {
	let p = path.resolve(modulePath);
	modulePool.forEach(m => {
		if (m === p) return true;
	});
	return false;
}