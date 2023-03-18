window.onload = function () {
	let a = document.getElementsByClassName("anc16");
	for (let i = 0; i < a.length; i++) {
		a[i].innerHTML = assemblyFormat(a[i].innerHTML);
	}
}

assemblyFormat = (str) => {
	const directives = /\b(ORG|USE|STDCALL|SYSLIB|CALL|AS|IMPORT|BYTE|WORD|SYSCALL|RESERVE|SIZEOF)\b/g;	// also predefined instructions
	const instructions = /\b(ADA|ADB|ANA|ANB|BRK|CLC|CLD|CLI|CLO|CMAH|CMBH|CMPA|CMPB|CMPI|CPUID|DEA|DEB|DEI|DEJ|INA|INB|INI|INJ|JCC|JCS|JMP|JNC|JNS|JOC|JOS|JZC|JZS|LDA|LDAH|LDAL|LDB|LDBH|LDBL|LDD|LDI|LDJ|LDS|LMHI|LMLI|MSB|NOP|ORA|ORB|READ|REST|RET|SED|SEI|SHL|SHR|SMHI|SMLI|STA|STAH|STB|STBH|STI|STJ|SUA|SUB|TAB|TABH|TABL|TAD|TAHJ|TAI|TAMH|TAML|TBA|TBAH|TBAL|TBHJ|TBI|TIS|TSB|WRTE|WRTI|XORA|XORB)\b/g;
	const illegalIns = /\b(ARET|JSP|KILL|PSH|STPC|STSR)\b/g;
	const numbers = /(x[0-9A-Fa-f]+|[0-9]+|0b[0-1]+|0o[0-7]+)\b/g;
	//const comments = /;.+(?=(<br>|\n))/g;
	const labels = /.+(?=(:))/g;
	//const string = /".+"/g;

	const spanStart = "<span style=\"";
	const spanEnd = "<span/>";

	const dirColor = "color: var(--code-color2)\">";
	const insColor = "color: var(--code-color1)\">";
	const illColor = "color: var(--code-color3)\">";
	const numColor = "color: var(--dark1)\">";
	const commColor = "color: var(--code-color4)\">";
	const lblColor = "color: var(--code-color5)\">";
	const otherColor = "color: var(--dark1)\">";
	const stringColor = "color: var(--code-color6)\">";

	str = str.split(/([ ]|<br>|\n|\t|")/g);

	let isComment = false;
	let isString = false;

	for (let i = 0; i < str.length; i++) {
		if (str[i] == "<br>" || str[i] == "\n") {
			isComment = false; continue;
		}

		if (str[i] == "\"") {
			isString = !isString;
			str[i] = spanStart + stringColor + str[i] + spanEnd;
			continue;
		}

		if (str[i] == ";") {
			isComment = true;
			str[i] = spanStart + commColor + str[i] + spanEnd;
			continue;
		}

		if (isComment) {
			str[i] = spanStart + commColor + str[i] + spanEnd;
			continue;
		};

		if (isString) {
			str[i] = spanStart + stringColor + str[i] + spanEnd;
			continue;
		}

		if (str[i].match(directives)) {
			str[i] = spanStart + dirColor + str[i] + spanEnd;
			continue;
		}

		if (str[i].match(instructions)) {
			str[i] = spanStart + insColor + str[i] + spanEnd;
			continue;
		}

		if (str[i].match(illegalIns)) {
			str[i] = spanStart + illColor + str[i] + spanEnd;
			continue;
		}

		if (str[i].match(numbers)) {
			str[i] = spanStart + numColor + str[i] + spanEnd;
			continue;
		}

		if (str[i].match(labels)) {
			str[i] = spanStart + lblColor + str[i] + spanEnd;
			continue;
		}

		str[i] = spanStart + otherColor + str[i] + spanEnd;
	}

	for (let i = 0; i < str.length; i++) {
		if (str[i] == " ") str.splice(i, 1);
	}

	return str.join("");
}