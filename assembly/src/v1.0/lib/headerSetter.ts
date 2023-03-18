function setHeader() {
	let header = {
		magic: "ANC16",
		version: 1,
		authFlags: {
			accessVideoMem: false,
			accessFileSystem: false,
			highPrivileges: false
		},
		entryPoint: 0
	}
}