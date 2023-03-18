from enum import Enum
import sys
import re

STDCALL_SIZE = 25

class Tk(Enum):
	DIR = 0,
	INS = 1,
	ILL = 2,
	NUM = 3,
	LBL = 4
	STR = 5
	OTHER = 6

def error(line: int, msg : str, arg1 = "", arg2 = ""):
	if line < 0:
		s = ""
	else: s = "At line: " + str(line) + "\n"
	print("Error\n" + s + msg.replace("$", str(arg1)).replace("%", str(arg2)))
	exit(0)

def pre_assemble(s: str, is_lib = False) -> list:
	sep = " |\n|,|;|\t|[*]|#|\"|[%]|[(]|[)]"
	tks = re.split(sep, s)
	removed_tks = re.findall(sep, s)
	# splitting

	for i in range(len(removed_tks)):
		tks.insert(i * 2 + 1, removed_tks[i])

	# joining strings

	i = 0
	is_string = False
	temp_str = str()
	while i < len(tks):
		if tks[i] == "\"":
			is_string = not is_string
			del tks[i]
			if is_string:
				temp_str = "\""
			else:
				tks.insert(i, temp_str + "\"")

			continue

		if is_string:
			temp_str += tks[i]
			del tks[i]
			continue

		i += 1

	if is_string: error("Unexpected the end of the file")

	# removing whitespaces

	i = 0
	while i < len(tks):
		if tks[i] == "" or tks[i] == " ":
			del tks[i]
			continue
		i += 1

	# removing comments

	is_comment = False
	i = 0
	while i < len(tks):
		if tks[i] == ";":
			is_comment = True
			del tks[i]
			continue

		if tks[i] == "\n":
			is_comment = False
			i += 1
			continue

		if is_comment:
			del tks[i]
			continue
		
		i += 1

	# tokenization

	dirs = ["USE", "STDCALL", "SYSLIB", "AS", "CALL", "IMPORT", "ORG", "WORD", "BYTE"]
	ins = ["ADA", "ADB", "ANA", "ANB", "BRK", "CLC", "CLD", "CLI", "CLO", "CMAH", "CMBH", "CMPA", "CMPB", "CMPI", "CPUID", "DEA", "DEB", "DEI", "DEJ", "INA", "INB", "INI", "INJ", "JCC", "JCS", "JMP", "JNC", "JNS", "JOC", "JOS", "JZC", "JZS", "LDA", "LDAH", "LDAL", "LDB", "LDBH", "LDBL", "LDD", "LDI", "LDJ", "LDS", "LMHI", "LMLI", "MSB", "NOP", "ORA", "ORB", "READ", "REST", "RET", "SED", "SEI", "SHL", "SHR", "SMHI", "SMLI", "STA", "STAH", "STB", "STBH", "STI", "STJ", "SUA", "SUB", "TAB", "TABH", "TABL", "TAD", "TAHJ", "TAI", "TAMH", "TAML", "TBA", "TBAH", "TBAL", "TBHJ", "TBI", "TIS", "TSB", "WRTE", "WRTI", "XORA", "XORB"]
	ill = ["PSH", "ARET", "KILL", "JSP", "STPC", "STSR"]

	for i in range(len(tks)):
		if tks[i] in dirs:
			tks[i] = {
				"value" : tks[i],
				"token": Tk.DIR,
				"level": 0,
				"line": 0
			}
			continue

		if tks[i] in ins:
			tks[i] = {
				"value" : tks[i],
				"token": Tk.INS,
				"level": 0,
				"line": 0
			}
			continue

		if tks[i] in ill:
			tks[i] = {
				"value" : tks[i],
				"token": Tk.ILL,
				"level": 0,
				"line": 0
			}
			continue

		if re.match("(x[0-9A-Fa-f]+|-?[0-9]+|0b[0-1]+|0o[0-7]+)\\b", tks[i]):
			tks[i] = {
				"value" : tks[i],
				"token": Tk.NUM,
				"level": 0,
				"line": 0
			}
			continue

		if re.match("\".+\"", tks[i]):
			tks[i] = {
				"value" : tks[i],
				"token": Tk.STR,
				"level": 0,
				"line": 0
			}
			continue

		if re.match(".+(?=(:))", tks[i]):
			tks[i] = {
				"value" : tks[i],
				"token": Tk.LBL,
				"level": 0,
				"line": 0
			}
			continue

		tks[i] = {
			"value" : tks[i],
			"token": Tk.OTHER,
			"level": 0,
			"line": 0
		}
		continue

	# preprocessor

	
	use_stdcall = False
	use_syslib = False
	used_constants = []
	
	i = 0
	while i < len(tks):
		if tks[i]["token"] == Tk.DIR:
			if tks[i]["value"] == "IMPORT":
				name = str()
				try:
					name = tks[i + 1]["value"]
				except:
					error("Unexpected the end of the file after IMPORT")

				try:
					f = open(name + ".anc16", "r")
				except:
					error(tks[i]["line"], "Unable to import the library $", name)

				libs.append(pre_assemble(f.read(), True))
				del tks[i]
				del tks[i]
				continue

			if tks[i]["value"] == "USE":
				try:
					if tks[i + 1]["value"] == "STDCALL": 
						use_stdcall = True
						del tks[i]
						del tks[i]
					elif tks[i + 1]["value"] == "SYSLIB": 
						use_syslib = True
						del tks[i]
						del tks[i]
					elif tks[i + 2]["value"] == "AS":
						frm = tks[i + 1] 
						to = []
						j = i + 3

						while tks[j]["value"] != "\n":
							to.append(tks[j])
							del tks[j]

						used_constants.append([frm, to])
						del tks[i]
						del tks[i]
						del tks[i]

				except:
					error(tks[i]["line"], "Unexpected the end of the file after USE or USE AS")

				continue

			i += 1
		i += 1

	
	# used constants

	i = 0
	while i < len(tks):
		for j in range(len(used_constants)):
			if tks[i]["value"] == used_constants[j][0]["value"]:
				del tks[i]
				for k in range(len(used_constants[j][1])):
					tks.insert(i, used_constants[j][1][k])
					i += 1
				continue
		i += 1

	# getting the indention level and removing \n and \t

	current_level = 0
	current_line = 1
	i = 0
	while i < len(tks):
		if tks[i]["value"] == "\t":
			current_level += 1
			del tks[i]
			continue

		if tks[i]["value"] == "\n":
			current_level = 0
			current_line += 1
			del tks[i]
			continue

		tks[i]["level"] = current_level
		tks[i]["line"] = current_line
		i += 1
		continue

	libs = []

	# including libs

	for i in range(len(libs)):
		for j in range(len(libs[i])):
			tks.append(libs[i][j])

	# checking for _code label

	if not is_lib:
		_code = False
		for i in range(len(tks)):
			if tks[i]["token"] == Tk.LBL:
				if tks[i]["value"] == "_code:":
					_code = True
					break

		if not _code:
			error(-1, "Undefined reference to _code entry point")

	# checking for duplicates labels

	lbls = []
	lbll = []
	for i in range(len(tks)):
		if tks[i]["token"] == Tk.LBL:
			if tks[i]["value"] in lbls:
				error(tks[i]["line"], "Duplicate label $, defined first at line %", tks[i]["value"][:-1], lbll[lbls.index(tks[i]["value"])])
			
			lbls.append(tks[i]["value"])
			lbll.append(tks[i]["line"])

	# checking for CALL definitions

	for i in range(len(tks)):
		if tks[i]["value"] == "CALL" and not use_stdcall:
			error(tks[i]["line"], "Undefined reference to CALL. You must define CALL type (USE STDCALL)")

	return tks

def assemble(pa : list, is_src = False) -> bytes:

	# converting numbers into effective numbers

	for i in range(len(pa)):
		if pa[i]["token"] == Tk.NUM:
			if pa[i]["value"].startswith("x"):
				pa[i]["value"] = int(pa[i]["value"][1:], 16)
			else:
				pa[i]["value"] = int(pa[i]["value"], 0)	
	
	# creating a list of labels

	current_level = 0
	lbl = []
	temp_lbl = {"name": str(), "code": list()}
	i = 0
	while i < len(pa):
		if pa[i]["value"] == "ORG":
			if temp_lbl["name"] != "": lbl.append(temp_lbl)
			temp_lbl = {"name": str(), "code": list()}
			try:
				lbl.append({"name": "$ ORG $", "code": int(pa[i + 1]["value"])})
			except:
				try:
					error(lbl[i]["code"][j + 1]["line"], "Unexpected value after ORG directive")
				except:
					error(lbl[i]["code"][j]["line"], "Unexpected the end of the file")
			i += 2
			continue

		if pa[i]["token"] == Tk.LBL:
			current_level = pa[i]["level"]
			if temp_lbl["name"] != "": lbl.append(temp_lbl)

			temp_lbl = {"name": pa[i]["value"][:-1], "code": list()}
			i += 1
			continue

		if (pa[i]["token"] == Tk.INS or pa[i]["token"] == Tk.ILL or pa[i]["value"] == "CALL") and not is_src:
			if current_level >= pa[i]["level"]: error(pa[i]["line"], "Expected indention under the label $", temp_lbl["name"])

		temp_lbl["code"].append(pa[i])
		i += 1
	
	lbl.append(temp_lbl)

	class Addr(Enum):
		ABS = 0		# absolute
		ABSI = 1	# absoulte, I
		REL = 2		# relative
		RELJ = 3	# relative with J
		IND = 4		# indirect
		INDI = 5	# indirect, I
		IMPL = 6	# implied
		IMM = 7		# immediate
		ZPG = 8		# zero page
		ZPGI = 9	# zero page, I
		A = 10		# accumulator
		AH = 11		# AH
		AL = 12		# AL
		B = 13		# base
		BH = 14		# BH
		BL = 15		# BL
		I = 16		# index reg
		IMM2 = 17	# immediate 2 bytes

	# starting to convert instructions

	opcs = [
		{"hex": 0x0014, "mnemonic": "ADA", "addr": Addr.B},
		{"hex": 0x4004, "mnemonic": "ADA", "addr": Addr.IMM},
		{"hex": 0x4005, "mnemonic": "ADA", "addr": Addr.ZPG},
		{"hex": 0x4006, "mnemonic": "ADA", "addr": Addr.ZPGI},
		{"hex": 0x8004, "mnemonic": "ADA", "addr": Addr.ABS},
		{"hex": 0x8005, "mnemonic": "ADA", "addr": Addr.ABSI},
		{"hex": 0x8006, "mnemonic": "ADA", "addr": Addr.IND},
		{"hex": 0x8007, "mnemonic": "ADA", "addr": Addr.INDI},
		{"hex": 0x8033, "mnemonic": "ADA", "addr": Addr.IMM2},
		{"hex": 0x0015, "mnemonic": "ADB", "addr": Addr.A},
		{"hex": 0x4007, "mnemonic": "ADB", "addr": Addr.IMM},
		{"hex": 0x4008, "mnemonic": "ADB", "addr": Addr.ZPG},
		{"hex": 0x4009, "mnemonic": "ADB", "addr": Addr.ZPGI},
		{"hex": 0x8008, "mnemonic": "ADB", "addr": Addr.ABS},
		{"hex": 0x8009, "mnemonic": "ADB", "addr": Addr.ABSI},
		{"hex": 0x800A, "mnemonic": "ADB", "addr": Addr.IND},
		{"hex": 0x800B, "mnemonic": "ADB", "addr": Addr.INDI},
		{"hex": 0x8034, "mnemonic": "ADB", "addr": Addr.IMM2},
		{"hex": 0x0016, "mnemonic": "ANA", "addr": Addr.B},
		{"hex": 0x0018, "mnemonic": "ANA", "addr": Addr.I},
		{"hex": 0x400A, "mnemonic": "ANA", "addr": Addr.IMM},
		{"hex": 0x400B, "mnemonic": "ANA", "addr": Addr.ZPG},
		{"hex": 0x400C, "mnemonic": "ANA", "addr": Addr.ZPGI},
		{"hex": 0x800C, "mnemonic": "ANA", "addr": Addr.ABS},
		{"hex": 0x800D, "mnemonic": "ANA", "addr": Addr.ABSI},
		{"hex": 0x800E, "mnemonic": "ANA", "addr": Addr.IND},
		{"hex": 0x800F, "mnemonic": "ANA", "addr": Addr.INDI},
		{"hex": 0x8035, "mnemonic": "ANA", "addr": Addr.IMM2},
		{"hex": 0x0017, "mnemonic": "ANB", "addr": Addr.A},
		{"hex": 0x0019, "mnemonic": "ANB", "addr": Addr.I},
		{"hex": 0x400D, "mnemonic": "ANB", "addr": Addr.IMM},
		{"hex": 0x400E, "mnemonic": "ANB", "addr": Addr.ZPG},
		{"hex": 0x400F, "mnemonic": "ANB", "addr": Addr.ZPGI},
		{"hex": 0x8010, "mnemonic": "ANB", "addr": Addr.ABS},
		{"hex": 0x8011, "mnemonic": "ANB", "addr": Addr.ABSI},
		{"hex": 0x8012, "mnemonic": "ANB", "addr": Addr.IND},
		{"hex": 0x8013, "mnemonic": "ANB", "addr": Addr.INDI},
		{"hex": 0x8036, "mnemonic": "ANB", "addr": Addr.IMM2},
		{"hex": 0x0002, "mnemonic": "ARET", "addr": Addr.IMPL},
		{"hex": 0x3FFF, "mnemonic": "BRK", "addr": Addr.IMPL},
		{"hex": 0x0010, "mnemonic": "CLC", "addr": Addr.IMPL},
		{"hex": 0x0012, "mnemonic": "CLD", "addr": Addr.IMPL},
		{"hex": 0x0013, "mnemonic": "CLI", "addr": Addr.IMPL},
		{"hex": 0x0011, "mnemonic": "CLO", "addr": Addr.IMPL},
		{"hex": 0x001A, "mnemonic": "CMAH", "addr": Addr.BH},
		{"hex": 0x403F, "mnemonic": "CMAH", "addr": Addr.IMM},
		{"hex": 0x4040, "mnemonic": "CMAH", "addr": Addr.ZPG},
		{"hex": 0x4041, "mnemonic": "CMAH", "addr": Addr.ZPGI},
		{"hex": 0x8014, "mnemonic": "CMAH", "addr": Addr.ABS},
		{"hex": 0x8015, "mnemonic": "CMAH", "addr": Addr.ABSI},
		{"hex": 0x8016, "mnemonic": "CMAH", "addr": Addr.IND},
		{"hex": 0x8017, "mnemonic": "CMAH", "addr": Addr.INDI},
		{"hex": 0x001B, "mnemonic": "CMBH", "addr": Addr.AH},
		{"hex": 0x4042, "mnemonic": "CMBH", "addr": Addr.IMM},
		{"hex": 0x4043, "mnemonic": "CMBH", "addr": Addr.ZPG},
		{"hex": 0x4044, "mnemonic": "CMBH", "addr": Addr.ZPGI},
		{"hex": 0x8018, "mnemonic": "CMBH", "addr": Addr.ABS},
		{"hex": 0x8019, "mnemonic": "CMBH", "addr": Addr.ABSI},
		{"hex": 0x801A, "mnemonic": "CMBH", "addr": Addr.IND},
		{"hex": 0x801B, "mnemonic": "CMBH", "addr": Addr.INDI},
		{"hex": 0x001C, "mnemonic": "CMPA", "addr": Addr.B},
		{"hex": 0x001E, "mnemonic": "CMPA", "addr": Addr.I},
		{"hex": 0x4045, "mnemonic": "CMPA", "addr": Addr.ZPG},
		{"hex": 0x4046, "mnemonic": "CMPA", "addr": Addr.ZPGI},
		{"hex": 0x801C, "mnemonic": "CMPA", "addr": Addr.ABS},
		{"hex": 0x801D, "mnemonic": "CMPA", "addr": Addr.ABSI},
		{"hex": 0x801E, "mnemonic": "CMPA", "addr": Addr.IND},
		{"hex": 0x801F, "mnemonic": "CMPA", "addr": Addr.INDI},
		{"hex": 0x8024, "mnemonic": "CMPA", "addr": Addr.IMM2},
		{"hex": 0x001D, "mnemonic": "CMPB", "addr": Addr.A},
		{"hex": 0x001F, "mnemonic": "CMPB", "addr": Addr.I},
		{"hex": 0x4047, "mnemonic": "CMPB", "addr": Addr.ZPG},
		{"hex": 0x4048, "mnemonic": "CMPB", "addr": Addr.ZPGI},
		{"hex": 0x8020, "mnemonic": "CMPB", "addr": Addr.ABS},
		{"hex": 0x8021, "mnemonic": "CMPB", "addr": Addr.ABSI},
		{"hex": 0x8022, "mnemonic": "CMPB", "addr": Addr.IND},
		{"hex": 0x8023, "mnemonic": "CMPB", "addr": Addr.INDI},
		{"hex": 0x8025, "mnemonic": "CMPB", "addr": Addr.IMM2},
		{"hex": 0x0020, "mnemonic": "CMPI", "addr": Addr.A},
		{"hex": 0x4049, "mnemonic": "CMPI", "addr": Addr.ZPG},
		{"hex": 0x8026, "mnemonic": "CMPI", "addr": Addr.IMM2},
		{"hex": 0x8027, "mnemonic": "CMPI", "addr": Addr.ABS},
		{"hex": 0x8028, "mnemonic": "CMPI", "addr": Addr.IND},
		{"hex": 0x0003, "mnemonic": "CPUID", "addr": Addr.IMPL},
		{"hex": 0x0008, "mnemonic": "DEA", "addr": Addr.IMPL},
		{"hex": 0x0009, "mnemonic": "DEB", "addr": Addr.IMPL},
		{"hex": 0x000A, "mnemonic": "DEI", "addr": Addr.IMPL},
		{"hex": 0x000B, "mnemonic": "DEJ", "addr": Addr.IMPL},
		{"hex": 0x0004, "mnemonic": "INA", "addr": Addr.IMPL},
		{"hex": 0x0005, "mnemonic": "INB", "addr": Addr.IMPL},
		{"hex": 0x0006, "mnemonic": "INI", "addr": Addr.IMPL},
		{"hex": 0x0007, "mnemonic": "INJ", "addr": Addr.IMPL},
		{"hex": 0x0021, "mnemonic": "JCC", "addr": Addr.RELJ},
		{"hex": 0x4010, "mnemonic": "JCC", "addr": Addr.REL},
		{"hex": 0x8029, "mnemonic": "JCC", "addr": Addr.ABS},
		{"hex": 0x0025, "mnemonic": "JCS", "addr": Addr.RELJ},
		{"hex": 0x4014, "mnemonic": "JCS", "addr": Addr.REL},
		{"hex": 0x802D, "mnemonic": "JCS", "addr": Addr.ABS},
		{"hex": 0x0056, "mnemonic": "JMP", "addr": Addr.A},
		{"hex": 0x0057, "mnemonic": "JMP", "addr": Addr.B},
		{"hex": 0x0058, "mnemonic": "JMP", "addr": Addr.I},
		{"hex": 0x8031, "mnemonic": "JMP", "addr": Addr.ABS},
		{"hex": 0x8032, "mnemonic": "JMP", "addr": Addr.IND},
		{"hex": 0x0024, "mnemonic": "JNC", "addr": Addr.RELJ},
		{"hex": 0x4013, "mnemonic": "JNC", "addr": Addr.REL},
		{"hex": 0x802C, "mnemonic": "JNC", "addr": Addr.ABS},
		{"hex": 0x0028, "mnemonic": "JNS", "addr": Addr.RELJ},
		{"hex": 0x4017, "mnemonic": "JNS", "addr": Addr.REL},
		{"hex": 0x8030, "mnemonic": "JNS", "addr": Addr.ABS},
		{"hex": 0x0022, "mnemonic": "JOC", "addr": Addr.RELJ},
		{"hex": 0x4011, "mnemonic": "JOC", "addr": Addr.REL},
		{"hex": 0x802A, "mnemonic": "JOC", "addr": Addr.ABS},
		{"hex": 0x0026, "mnemonic": "JOS", "addr": Addr.RELJ},
		{"hex": 0x4015, "mnemonic": "JOS", "addr": Addr.REL},
		{"hex": 0x802E, "mnemonic": "JOS", "addr": Addr.ABS},
		{"hex": 0x0023, "mnemonic": "JZC", "addr": Addr.RELJ},
		{"hex": 0x4012, "mnemonic": "JZC", "addr": Addr.REL},
		{"hex": 0x802B, "mnemonic": "JZC", "addr": Addr.ABS},
		{"hex": 0x0027, "mnemonic": "JZS", "addr": Addr.RELJ},
		{"hex": 0x4016, "mnemonic": "JZS", "addr": Addr.REL},
		{"hex": 0x802F, "mnemonic": "JZS", "addr": Addr.ABS},
		{"hex": 0x0001, "mnemonic": "KILL", "addr": Addr.IMPL},
		{"hex": 0x3FFD, "mnemonic": "KILL", "addr": Addr.IMPL},
		{"hex": 0x8086, "mnemonic": "KILL", "addr": Addr.ABS},
		{"hex": 0x8037, "mnemonic": "LDA", "addr": Addr.ABS},
		{"hex": 0x8038, "mnemonic": "LDA", "addr": Addr.ABSI},
		{"hex": 0x8039, "mnemonic": "LDA", "addr": Addr.IND},
		{"hex": 0x803A, "mnemonic": "LDA", "addr": Addr.INDI},
		{"hex": 0x8053, "mnemonic": "LDA", "addr": Addr.IMM2},
		{"hex": 0x4018, "mnemonic": "LDAH", "addr": Addr.IMM},
		{"hex": 0x803B, "mnemonic": "LDAH", "addr": Addr.ABS},
		{"hex": 0x803C, "mnemonic": "LDAH", "addr": Addr.ABSI},
		{"hex": 0x803D, "mnemonic": "LDAH", "addr": Addr.IND},
		{"hex": 0x803E, "mnemonic": "LDAH", "addr": Addr.INDI},
		{"hex": 0x4019, "mnemonic": "LDAL", "addr": Addr.IMM},
		{"hex": 0x803F, "mnemonic": "LDAL", "addr": Addr.ABS},
		{"hex": 0x8040, "mnemonic": "LDAL", "addr": Addr.ABSI},
		{"hex": 0x8041, "mnemonic": "LDAL", "addr": Addr.IND},
		{"hex": 0x8042, "mnemonic": "LDAL", "addr": Addr.INDI},
		{"hex": 0x8043, "mnemonic": "LDB", "addr": Addr.ABS},
		{"hex": 0x8044, "mnemonic": "LDB", "addr": Addr.ABSI},
		{"hex": 0x8045, "mnemonic": "LDB", "addr": Addr.IND},
		{"hex": 0x8046, "mnemonic": "LDB", "addr": Addr.INDI},
		{"hex": 0x8054, "mnemonic": "LDB", "addr": Addr.IMM2},
		{"hex": 0x401A, "mnemonic": "LDBH", "addr": Addr.IMM},
		{"hex": 0x8047, "mnemonic": "LDBH", "addr": Addr.ABS},
		{"hex": 0x8048, "mnemonic": "LDBH", "addr": Addr.ABSI},
		{"hex": 0x8049, "mnemonic": "LDBH", "addr": Addr.IND},
		{"hex": 0x804A, "mnemonic": "LDBH", "addr": Addr.INDI},
		{"hex": 0x401B, "mnemonic": "LDBL", "addr": Addr.IMM},
		{"hex": 0x804B, "mnemonic": "LDBL", "addr": Addr.ABS},
		{"hex": 0x804C, "mnemonic": "LDBL", "addr": Addr.ABSI},
		{"hex": 0x804D, "mnemonic": "LDBL", "addr": Addr.IND},
		{"hex": 0x804E, "mnemonic": "LDBL", "addr": Addr.INDI},
		{"hex": 0x808A, "mnemonic": "LDD", "addr": Addr.ABS},
		{"hex": 0x808B, "mnemonic": "LDD", "addr": Addr.IND},
		{"hex": 0x808C, "mnemonic": "LDD", "addr": Addr.IMM2},
		{"hex": 0x804F, "mnemonic": "LDI", "addr": Addr.ABS},
		{"hex": 0x8050, "mnemonic": "LDI", "addr": Addr.IND},
		{"hex": 0x8055, "mnemonic": "LDI", "addr": Addr.IMM2},
		{"hex": 0x401C, "mnemonic": "LDJ", "addr": Addr.IMM},
		{"hex": 0x404A, "mnemonic": "LDJ", "addr": Addr.ZPG},
		{"hex": 0x8051, "mnemonic": "LDJ", "addr": Addr.ABS},
		{"hex": 0x8052, "mnemonic": "LDJ", "addr": Addr.IND},
		{"hex": 0x8056, "mnemonic": "LDS", "addr": Addr.ABS},
		{"hex": 0x8057, "mnemonic": "LDS", "addr": Addr.IND},
		{"hex": 0x8058, "mnemonic": "LDS", "addr": Addr.IMM2},
		{"hex": 0x404B, "mnemonic": "LMHI", "addr": Addr.ZPG},
		{"hex": 0x404C, "mnemonic": "LMHI", "addr": Addr.ZPGI},
		{"hex": 0x808D, "mnemonic": "LMHI", "addr": Addr.ABS},
		{"hex": 0x808E, "mnemonic": "LMHI", "addr": Addr.IND},
		{"hex": 0x808F, "mnemonic": "LMHI", "addr": Addr.IMM2},
		{"hex": 0x404D, "mnemonic": "LMLI", "addr": Addr.ZPG},
		{"hex": 0x404E, "mnemonic": "LMLI", "addr": Addr.ZPGI},
		{"hex": 0x8090, "mnemonic": "LMLI", "addr": Addr.ABS},
		{"hex": 0x8091, "mnemonic": "LMLI", "addr": Addr.IND},
		{"hex": 0x8092, "mnemonic": "LMLI", "addr": Addr.IMM2},
		{"hex": 0x000C, "mnemonic": "MSB", "addr": Addr.A},
		{"hex": 0x000D, "mnemonic": "MSB", "addr": Addr.B},
		{"hex": 0x0000, "mnemonic": "NOP", "addr": Addr.IMPL},
		{"hex": 0x0029, "mnemonic": "NOP", "addr": Addr.IMPL},
		{"hex": 0x002A, "mnemonic": "NOP", "addr": Addr.IMPL},
		{"hex": 0x002B, "mnemonic": "NOP", "addr": Addr.IMPL},
		{"hex": 0x002C, "mnemonic": "NOP", "addr": Addr.IMPL},
		{"hex": 0x002F, "mnemonic": "NOP", "addr": Addr.IMPL},
		{"hex": 0x0030, "mnemonic": "NOP", "addr": Addr.IMPL},
		{"hex": 0x0033, "mnemonic": "NOP", "addr": Addr.IMPL},
		{"hex": 0x0034, "mnemonic": "NOP", "addr": Addr.IMPL},
		{"hex": 0x0035, "mnemonic": "NOP", "addr": Addr.IMPL},
		{"hex": 0x005F, "mnemonic": "NOP", "addr": Addr.IMPL},
		{"hex": 0x3FFC, "mnemonic": "NOP", "addr": Addr.IMPL},
		{"hex": 0x4000, "mnemonic": "NOP", "addr": Addr.IMM},
		{"hex": 0x4023, "mnemonic": "NOP", "addr": Addr.IMM},
		{"hex": 0x4038, "mnemonic": "NOP", "addr": Addr.ZPGI},
		{"hex": 0x4053, "mnemonic": "NOP", "addr": Addr.IMM},
		{"hex": 0x7FFF, "mnemonic": "NOP", "addr": Addr.IMM},
		{"hex": 0x8000, "mnemonic": "NOP", "addr": Addr.ABS},
		{"hex": 0x8076, "mnemonic": "NOP", "addr": Addr.ABSI},
		{"hex": 0x8078, "mnemonic": "NOP", "addr": Addr.INDI},
		{"hex": 0x80FE, "mnemonic": "NOP", "addr": Addr.ABS},
		{"hex": 0x80A9, "mnemonic": "NOP", "addr": Addr.ABS},
		{"hex": 0x0036, "mnemonic": "ORA", "addr": Addr.B},
		{"hex": 0x0038, "mnemonic": "ORA", "addr": Addr.I},
		{"hex": 0x401D, "mnemonic": "ORA", "addr": Addr.IMM},
		{"hex": 0x401E, "mnemonic": "ORA", "addr": Addr.ZPG},
		{"hex": 0x401F, "mnemonic": "ORA", "addr": Addr.ZPGI},
		{"hex": 0x8059, "mnemonic": "ORA", "addr": Addr.ABS},
		{"hex": 0x805A, "mnemonic": "ORA", "addr": Addr.ABSI},
		{"hex": 0x805B, "mnemonic": "ORA", "addr": Addr.IND},
		{"hex": 0x805C, "mnemonic": "ORA", "addr": Addr.INDI},
		{"hex": 0x8061, "mnemonic": "ORA", "addr": Addr.IMM2},
		{"hex": 0x0037, "mnemonic": "ORB", "addr": Addr.A},
		{"hex": 0x0039, "mnemonic": "ORB", "addr": Addr.I},
		{"hex": 0x4020, "mnemonic": "ORB", "addr": Addr.IMM},
		{"hex": 0x4021, "mnemonic": "ORB", "addr": Addr.ZPG},
		{"hex": 0x4022, "mnemonic": "ORB", "addr": Addr.ZPGI},
		{"hex": 0x805D, "mnemonic": "ORB", "addr": Addr.ABS},
		{"hex": 0x805E, "mnemonic": "ORB", "addr": Addr.ABSI},
		{"hex": 0x805F, "mnemonic": "ORB", "addr": Addr.IND},
		{"hex": 0x8060, "mnemonic": "ORB", "addr": Addr.INDI},
		{"hex": 0x8062, "mnemonic": "ORB", "addr": Addr.IMM2},
		{"hex": 0x003A, "mnemonic": "PSH", "addr": Addr.A},
		{"hex": 0x003B, "mnemonic": "PSH", "addr": Addr.B},
		{"hex": 0x003C, "mnemonic": "PSH", "addr": Addr.AH},
		{"hex": 0x003D, "mnemonic": "PSH", "addr": Addr.AL},
		{"hex": 0x005E, "mnemonic": "PSH", "addr": Addr.IMPL},
		{"hex": 0x4001, "mnemonic": "PSH", "addr": Addr.IMM},
		{"hex": 0x4002, "mnemonic": "PSH", "addr": Addr.ZPGI},
		{"hex": 0x4003, "mnemonic": "PSH", "addr": Addr.ZPG},
		{"hex": 0x8001, "mnemonic": "PSH", "addr": Addr.ABS},
		{"hex": 0x8002, "mnemonic": "PSH", "addr": Addr.IND},
		{"hex": 0x8003, "mnemonic": "PSH", "addr": Addr.INDI},
		{"hex": 0x003E, "mnemonic": "READ", "addr": Addr.A},
		{"hex": 0x003F, "mnemonic": "READ", "addr": Addr.B},
		{"hex": 0x4024, "mnemonic": "READ", "addr": Addr.ZPG},
		{"hex": 0x4025, "mnemonic": "READ", "addr": Addr.ZPGI},
		{"hex": 0x8063, "mnemonic": "READ", "addr": Addr.ABS},
		{"hex": 0x8064, "mnemonic": "READ", "addr": Addr.ABSI},
		{"hex": 0x3FFE, "mnemonic": "REST", "addr": Addr.IMPL},
		{"hex": 0x80FF, "mnemonic": "RET", "addr": Addr.IMPL},
		{"hex": 0x000F, "mnemonic": "SED", "addr": Addr.IMPL},
		{"hex": 0x000E, "mnemonic": "SEI", "addr": Addr.IMPL},
		{"hex": 0x0040, "mnemonic": "SHL", "addr": Addr.A},
		{"hex": 0x0041, "mnemonic": "SHL", "addr": Addr.B},
		{"hex": 0x0042, "mnemonic": "SHL", "addr": Addr.I},
		{"hex": 0x0043, "mnemonic": "SHR", "addr": Addr.A},
		{"hex": 0x0044, "mnemonic": "SHR", "addr": Addr.B},
		{"hex": 0x0045, "mnemonic": "SHR", "addr": Addr.I},
		{"hex": 0x404F, "mnemonic": "SMHI", "addr": Addr.ZPG},
		{"hex": 0x4050, "mnemonic": "SMHI", "addr": Addr.ZPGI},
		{"hex": 0x8093, "mnemonic": "SMHI", "addr": Addr.ABS},
		{"hex": 0x8094, "mnemonic": "SMHI", "addr": Addr.ABSI},
		{"hex": 0x8095, "mnemonic": "SMHI", "addr": Addr.IND},
		{"hex": 0x8096, "mnemonic": "SMHI", "addr": Addr.INDI},
		{"hex": 0x4051, "mnemonic": "SMLI", "addr": Addr.ZPG},
		{"hex": 0x4052, "mnemonic": "SMLI", "addr": Addr.ZPGI},
		{"hex": 0x8097, "mnemonic": "SMLI", "addr": Addr.ABS},
		{"hex": 0x8098, "mnemonic": "SMLI", "addr": Addr.ABSI},
		{"hex": 0x8099, "mnemonic": "SMLI", "addr": Addr.IND},
		{"hex": 0x809A, "mnemonic": "SMLI", "addr": Addr.INDI},
		{"hex": 0x4026, "mnemonic": "STA", "addr": Addr.ZPG},
		{"hex": 0x4027, "mnemonic": "STA", "addr": Addr.ZPGI},
		{"hex": 0x8065, "mnemonic": "STA", "addr": Addr.ABS},
		{"hex": 0x8066, "mnemonic": "STA", "addr": Addr.ABSI},
		{"hex": 0x8067, "mnemonic": "STA", "addr": Addr.IND},
		{"hex": 0x8068, "mnemonic": "STA", "addr": Addr.INDI},
		{"hex": 0x4028, "mnemonic": "STAH", "addr": Addr.ZPG},
		{"hex": 0x4029, "mnemonic": "STAH", "addr": Addr.ZPGI},
		{"hex": 0x8069, "mnemonic": "STAH", "addr": Addr.ABS},
		{"hex": 0x806A, "mnemonic": "STAH", "addr": Addr.ABSI},
		{"hex": 0x806B, "mnemonic": "STAH", "addr": Addr.IND},
		{"hex": 0x806C, "mnemonic": "STAH", "addr": Addr.INDI},
		{"hex": 0x402A, "mnemonic": "STB", "addr": Addr.ZPG},
		{"hex": 0x402B, "mnemonic": "STB", "addr": Addr.ZPGI},
		{"hex": 0x806D, "mnemonic": "STB", "addr": Addr.ABS},
		{"hex": 0x806E, "mnemonic": "STB", "addr": Addr.ABSI},
		{"hex": 0x806F, "mnemonic": "STB", "addr": Addr.IND},
		{"hex": 0x8070, "mnemonic": "STB", "addr": Addr.INDI},
		{"hex": 0x402C, "mnemonic": "STBH", "addr": Addr.ZPG},
		{"hex": 0x402D, "mnemonic": "STBH", "addr": Addr.ZPGI},
		{"hex": 0x8071, "mnemonic": "STBH", "addr": Addr.ABS},
		{"hex": 0x8072, "mnemonic": "STBH", "addr": Addr.ABSI},
		{"hex": 0x8073, "mnemonic": "STBH", "addr": Addr.IND},
		{"hex": 0x8074, "mnemonic": "STBH", "addr": Addr.INDI},
		{"hex": 0x402E, "mnemonic": "STI", "addr": Addr.ZPG},
		{"hex": 0x8075, "mnemonic": "STI", "addr": Addr.ABS},
		{"hex": 0x8077, "mnemonic": "STI", "addr": Addr.IND},
		{"hex": 0x402F, "mnemonic": "STJ", "addr": Addr.ZPG},
		{"hex": 0x8079, "mnemonic": "STJ", "addr": Addr.ABS},
		{"hex": 0x807A, "mnemonic": "STJ", "addr": Addr.ABSI},
		{"hex": 0x807B, "mnemonic": "STJ", "addr": Addr.IND},
		{"hex": 0x807C, "mnemonic": "STJ", "addr": Addr.INDI},
		{"hex": 0x80A7, "mnemonic": "STPC", "addr": Addr.ABS},
		{"hex": 0x80A8, "mnemonic": "STSR", "addr": Addr.ABS},
		{"hex": 0x0046, "mnemonic": "SUA", "addr": Addr.B},
		{"hex": 0x0048, "mnemonic": "SUA", "addr": Addr.I},
		{"hex": 0x4030, "mnemonic": "SUA", "addr": Addr.IMM},
		{"hex": 0x4031, "mnemonic": "SUA", "addr": Addr.ZPG},
		{"hex": 0x4032, "mnemonic": "SUA", "addr": Addr.ZPGI},
		{"hex": 0x807D, "mnemonic": "SUA", "addr": Addr.ABS},
		{"hex": 0x807E, "mnemonic": "SUA", "addr": Addr.ABSI},
		{"hex": 0x807F, "mnemonic": "SUA", "addr": Addr.IND},
		{"hex": 0x8080, "mnemonic": "SUA", "addr": Addr.INDI},
		{"hex": 0x809B, "mnemonic": "SUA", "addr": Addr.IMM2},
		{"hex": 0x0047, "mnemonic": "SUB", "addr": Addr.A},
		{"hex": 0x0049, "mnemonic": "SUB", "addr": Addr.I},
		{"hex": 0x4033, "mnemonic": "SUB", "addr": Addr.IMM},
		{"hex": 0x4034, "mnemonic": "SUB", "addr": Addr.ZPG},
		{"hex": 0x4035, "mnemonic": "SUB", "addr": Addr.ZPGI},
		{"hex": 0x8081, "mnemonic": "SUB", "addr": Addr.ABS},
		{"hex": 0x8082, "mnemonic": "SUB", "addr": Addr.ABSI},
		{"hex": 0x8083, "mnemonic": "SUB", "addr": Addr.IND},
		{"hex": 0x8084, "mnemonic": "SUB", "addr": Addr.INDI},
		{"hex": 0x809C, "mnemonic": "SUB", "addr": Addr.IMM2},
		{"hex": 0x004A, "mnemonic": "TAB", "addr": Addr.IMPL},
		{"hex": 0x002E, "mnemonic": "TABH", "addr": Addr.IMPL},
		{"hex": 0x005A, "mnemonic": "TABL", "addr": Addr.IMPL},
		{"hex": 0x005B, "mnemonic": "TAD", "addr": Addr.IMPL},
		{"hex": 0x0031, "mnemonic": "TAHJ", "addr": Addr.IMPL},
		{"hex": 0x004B, "mnemonic": "TAI", "addr": Addr.IMPL},
		{"hex": 0x005C, "mnemonic": "TAMH", "addr": Addr.IMPL},
		{"hex": 0x005D, "mnemonic": "TAML", "addr": Addr.IMPL},
		{"hex": 0x004C, "mnemonic": "TBA", "addr": Addr.IMPL},
		{"hex": 0x002D, "mnemonic": "TBAH", "addr": Addr.IMPL},
		{"hex": 0x0059, "mnemonic": "TBAL", "addr": Addr.IMPL},
		{"hex": 0x0032, "mnemonic": "TBHJ", "addr": Addr.IMPL},
		{"hex": 0x004D, "mnemonic": "TBI", "addr": Addr.IMPL},
		{"hex": 0x004E, "mnemonic": "TIS", "addr": Addr.IMPL},
		{"hex": 0x004F, "mnemonic": "TSB", "addr": Addr.IMPL},
		{"hex": 0x8085, "mnemonic": "WRTE", "addr": Addr.ABS},
		{"hex": 0x8087, "mnemonic": "WRTE", "addr": Addr.ABSI},
		{"hex": 0x0050, "mnemonic": "WRTI", "addr": Addr.AH},
		{"hex": 0x0051, "mnemonic": "WRTI", "addr": Addr.BH},
		{"hex": 0x4036, "mnemonic": "WRTI", "addr": Addr.IMM},
		{"hex": 0x4037, "mnemonic": "WRTI", "addr": Addr.ZPG},
		{"hex": 0x8088, "mnemonic": "WRTI", "addr": Addr.ABS},
		{"hex": 0x8089, "mnemonic": "WRTI", "addr": Addr.IND},
		{"hex": 0x0052, "mnemonic": "XORA", "addr": Addr.B},
		{"hex": 0x0054, "mnemonic": "XORA", "addr": Addr.I},
		{"hex": 0x4039, "mnemonic": "XORA", "addr": Addr.IMM},
		{"hex": 0x403A, "mnemonic": "XORA", "addr": Addr.ZPG},
		{"hex": 0x403B, "mnemonic": "XORA", "addr": Addr.ZPGI},
		{"hex": 0x809D, "mnemonic": "XORA", "addr": Addr.ABS},
		{"hex": 0x809E, "mnemonic": "XORA", "addr": Addr.ABSI},
		{"hex": 0x809F, "mnemonic": "XORA", "addr": Addr.IND},
		{"hex": 0x80A0, "mnemonic": "XORA", "addr": Addr.INDI},
		{"hex": 0x80A5, "mnemonic": "XORA", "addr": Addr.IMM2},
		{"hex": 0x0053, "mnemonic": "XORB", "addr": Addr.A},
		{"hex": 0x0055, "mnemonic": "XORB", "addr": Addr.I},
		{"hex": 0x403C, "mnemonic": "XORB", "addr": Addr.IMM},
		{"hex": 0x403D, "mnemonic": "XORB", "addr": Addr.ZPG},
		{"hex": 0x403E, "mnemonic": "XORB", "addr": Addr.ZPGI},
		{"hex": 0x80A1, "mnemonic": "XORB", "addr": Addr.ABS},
		{"hex": 0x80A2, "mnemonic": "XORB", "addr": Addr.ABSI},
		{"hex": 0x80A3, "mnemonic": "XORB", "addr": Addr.IND},
		{"hex": 0x80A4, "mnemonic": "XORB", "addr": Addr.INDI},
		{"hex": 0x80A6, "mnemonic": "XORB", "addr": Addr.IMM2},
	]
	

	def get_opcode(mnemonic : str, addr: Addr) -> bytes:
		for i in range(len(opcs)):
			if opcs[i]["mnemonic"] == mnemonic and opcs[i]["addr"] == addr:
				return int.to_bytes(opcs[i]["hex"], 2, "big")

		return -1
	
	# converting instructions

	for i in range(len(lbl)):
		if lbl[i]["name"] == "$ ORG $": continue
		j = 0
		while j < len(lbl[i]["code"]):
			if lbl[i]["code"][j]["token"] == Tk.INS:

				# implied
				if j + 1 == len(lbl[i]["code"]) or lbl[i]["code"][j + 1]["token"] == Tk.INS or lbl[i]["code"][j + 1]["token"] == Tk.ILL or lbl[i]["code"][j + 1]["value"] == "CALL":
					b = get_opcode(lbl[i]["code"][j]["value"], Addr.IMPL)
					if b == -1: error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")
					lbl[i]["code"][j] = b
					j += 1
					continue
				
				# immediate
				if lbl[i]["code"][j + 1]["value"] == "#":
					n = lbl[i]["code"][j + 2]["value"]
					if type(n) != int:
						j += 2
						continue
					addr = None
					if n < 256: 
						addr = Addr.IMM
						b = get_opcode(lbl[i]["code"][j]["value"], addr)
						if b == -1: 
							addr = Addr.IMM2
					else:
						addr = Addr.IMM2
						
					
					b = get_opcode(lbl[i]["code"][j]["value"], addr)
						
					if b == -1: error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")
					lbl[i]["code"][j] = b
					del lbl[i]["code"][j + 1]
					try:
						if addr == Addr.IMM:
							lbl[i]["code"][j + 1] = int.to_bytes(lbl[i]["code"][j + 1]["value"], 1, "big", signed = True)
						else:
							lbl[i]["code"][j + 1] = int.to_bytes(lbl[i]["code"][j + 1]["value"], 2, "big", signed = True)
					except:
						try:
							error(lbl[i]["code"][j + 1]["line"], "Unexpected token: '$'", lbl[i]["code"][j + 1]["value"])
						except:
							error(lbl[i]["code"][j]["line"], "Unexpected the end of the label $", lbl[i]["name"])
					j += 2
					continue
				
				# absolute
				if type(lbl[i]["code"][j + 1]["value"]) == int:
					addr = None
					try:
						if lbl[i]["code"][j + 2]["value"] == ',' and lbl[i]["code"][j + 3]["value"] == "I":
							addr = Addr.ABSI
							del lbl[i]["code"][j + 2]
							del lbl[i]["code"][j + 2]
						else:
							addr = Addr.ABS
					except:
						addr = Addr.ABS

					b = get_opcode(lbl[i]["code"][j]["value"], addr)
					if b == -1: error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")
					lbl[i]["code"][j] = b
					lbl[i]["code"][j + 1] = int.to_bytes(lbl[i]["code"][j + 1]["value"], 2, "big", signed = True)
					j += 2
					continue
				
				# zero page
				if lbl[i]["code"][j + 1]["value"] == "%":
					addr = None
					try:
						if lbl[i]["code"][j + 3]["value"] == ',' and lbl[i]["code"][j + 4]["value"] == "I":
							addr = Addr.ZPGI
							del lbl[i]["code"][j + 3]
							del lbl[i]["code"][j + 3]
						else:
							addr = Addr.ZPG
					except:
						addr = Addr.ZPG

					try:
						if type(lbl[i]["code"][j + 2]["value"]) != int:
							j += 2
							continue
					except:
						error(lbl[i]["code"][j]["line"], "Unexpected the end of the label $", lbl[i]["name"])

					b = get_opcode(lbl[i]["code"][j]["value"], addr)
					if b == -1: error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")
					lbl[i]["code"][j] = b
					del lbl[i]["code"][j + 1]
					try:
						lbl[i]["code"][j + 1] = int.to_bytes(lbl[i]["code"][j + 1]["value"], 1, "big", signed = True)
					except:
						error(lbl[i]["code"][j]["line"], "Unexpected the end of the label $", lbl[i]["name"])
					j += 2
					continue
				
				# relative
				if lbl[i]["code"][j + 1]["value"] == "*":
					try:
						if lbl[i]["code"][j + 2]["value"] == "J":
							addr = Addr.RELJ
						else:
							addr = Addr.REL
					except:
						error(lbl[i]["code"][j]["line"], "Unexpected the end of the label $", lbl[i]["name"])
					b = get_opcode(lbl[i]["code"][j]["value"], addr)
					if b == -1: error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")
					
					try:
						if type(lbl[i]["code"][j + 2]["value"]) != int and addr != Addr.RELJ:
							j += 2
							continue
					except:
						error(lbl[i]["code"][j]["line"], "Unexpected the end of the label $", lbl[i]["name"])

					lbl[i]["code"][j] = b
					del lbl[i]["code"][j + 1]
					try:
						lbl[i]["code"][j + 1] = int.to_bytes(lbl[i]["code"][j + 1]["value"], 1, "big", signed = True)
					except:
						error(lbl[i]["code"][j + 1]["line"], "Unexpected token: '$'", lbl[i]["code"][j + 1]["value"])
					j += 2
					continue
				
				# indirect
				if lbl[i]["code"][j + 1]["value"] == "(":
					addr = None
					try:
						if lbl[i]["code"][j + 4]["value"] == ',' and lbl[i]["code"][j + 5]["value"] == "I":
							addr = Addr.INDI
							del lbl[i]["code"][j + 4]
							del lbl[i]["code"][j + 4]
						else:
							addr = Addr.IND
					except:
						addr = Addr.IND

					b = get_opcode(lbl[i]["code"][j]["value"], addr)
					if b == -1: error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")
					
					try:
						if type(lbl[i]["code"][j + 2]["value"]) != int:
							j += 2
							continue
					except:
						error(lbl[i]["code"][j]["line"], "Unexpected the end of the label $", lbl[i]["name"])

					lbl[i]["code"][j] = b
					del lbl[i]["code"][j + 1]
					try:
						lbl[i]["code"][j + 1] = int.to_bytes(lbl[i]["code"][j + 1]["value"], 2, "big", signed = True)
						del lbl[i]["code"][j + 2]
					except:
						error(lbl[i]["code"][j + 1]["line"], "Unexpected the end of the label $", lbl[i]["name"])
					j += 2
					continue

				if lbl[i]["code"][j + 1]["value"] == "A":
					b = get_opcode(lbl[i]["code"][j]["value"], Addr.A)
					if b == -1: error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")
					lbl[i]["code"][j] = b
					del lbl[i]["code"][j + 1]
					j += 1
					continue

				if lbl[i]["code"][j + 1]["value"] == "B":
					b = get_opcode(lbl[i]["code"][j]["value"], Addr.B)
					if b == -1: error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")
					lbl[i]["code"][j] = b
					del lbl[i]["code"][j + 1]
					j += 1
					continue

				if lbl[i]["code"][j + 1]["value"] == "AH":
					b = get_opcode(lbl[i]["code"][j]["value"], Addr.AH)
					if b == -1: error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")
					lbl[i]["code"][j] = b
					del lbl[i]["code"][j + 1]
					j += 1
					continue

				if lbl[i]["code"][j + 1]["value"] == "BH":
					b = get_opcode(lbl[i]["code"][j]["value"], Addr.BH)
					if b == -1: error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")
					lbl[i]["code"][j] = b
					del lbl[i]["code"][j + 1]
					j += 1
					continue

				if lbl[i]["code"][j + 1]["value"] == "I":
					b = get_opcode(lbl[i]["code"][j]["value"], Addr.A)
					if b == -1: error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")
					lbl[i]["code"][j] = b
					del lbl[i]["code"][j + 1]
					j += 1
					continue

			j += 1

	def search_label(name: str) -> bool:
		for k in range(len(lbl)): 
			if lbl[k]["name"] == name:
				return True

		return False

	def get_label_addr(name: str) -> bytes:
		for k in range(len(lbl)): 
			if lbl[k]["name"] == name:
				return int.to_bytes(lbl[k]["addr"], 2, "big", signed = True)

		return -1

	def get_size_by_addr(label_addr: int) -> int:
		for k in range(len(lbl)): 
			if lbl[k]["addr"] == label_addr:
				return lbl[k]["size"]

		return -1

	# converting strings into bytes

	for i in range(len(lbl)):
		if lbl[i]["name"] == "$ ORG $": continue
		for j in range(len(lbl[i]["code"])):
			if type(lbl[i]["code"][j]) == dict and lbl[i]["code"][j]["token"] == Tk.STR:
				lbl[i]["code"][j] = bytes(lbl[i]["code"][j]["value"][1:-1], "charmap")

	# calculating the size of each label

	for i in range(len(lbl)):
		if lbl[i]["name"] == "$ ORG $": continue
		temp_size = 0
		j = 0
		while j < len(lbl[i]["code"]):
			if type(lbl[i]["code"][j]) == bytes:
				temp_size += len(lbl[i]["code"][j])
				j += 1
				continue

			if lbl[i]["code"][j]["token"] == Tk.OTHER:
				# checking for a label

				if search_label(lbl[i]["code"][j]["value"]):
					temp_size += 2
				j += 1
				continue

			if lbl[i]["code"][j]["token"] == Tk.INS or lbl[i]["code"][j]["token"] == Tk.ILL:
				temp_size += 2
				j += 1

			if lbl[i]["code"][j]["token"] == Tk.DIR:
				if lbl[i]["code"][j]["value"] == "WORD":
					if type(lbl[i]["code"][j + 1]["value"]) == int:
						del lbl[i]["code"][j]
						lbl[i]["code"][j] = int.to_bytes(lbl[i]["code"][j]["value"], 2, "big", signed = True)
						temp_size += 2
					else:
						error(lbl[i]["code"][j + 1]["line"], "Unexpected value after WORD directive")
				elif lbl[i]["code"][j]["value"] == "BYTE":
					if type(lbl[i]["code"][j + 1]["value"]) == int:
						del lbl[i]["code"][j]
						try:
							lbl[i]["code"][j] = int.to_bytes(lbl[i]["code"][j]["value"], 1, "big", signed = True)
						except:
							error(lbl[i]["code"][j]["line"], "Cannot convert a word into a byte")
						temp_size += 1
					else:
						error(lbl[i]["code"][j + 1]["line"], "Unexpected value after BYTE directive")
				elif lbl[i]["code"][j]["value"] == "CALL":
					temp_size += STDCALL_SIZE

				j += 1
				continue
			j += 1

		lbl[i]["size"] = temp_size
	
	# resolving addresses

	origin = 0
	i = 0
	while i < len(lbl):
		if lbl[i]["name"] == "$ ORG $":
			origin = lbl[i]["code"]
			del lbl[i]
			continue

		lbl[i]["addr"] = origin
		origin += lbl[i]["size"]

		i += 1

	# sorting lebles by addresses
	try: temp_lbl = [lbl[0]]
	except: pass

	for i in range(1, len(lbl)):
		j = 0
		while j < len(temp_lbl):
			if lbl[i]["addr"] < temp_lbl[j]["addr"]:
				break
			j += 1

		temp_lbl.insert(j, lbl[i]) 
	
	lbl = temp_lbl

	try:
		if lbl[0]["name"] != "_code":
			error(-1, "_code label must be in the first address available")
	except IndexError:
		pass

	# checking for overlapping addresses

	for i in range(len(lbl) - 1):
		if lbl[i + 1]["addr"] >= lbl[i]["addr"] and lbl[i + 1]["addr"] < lbl[i]["addr"] + lbl[i]["size"]:
			error(-1, "Overlap between label \"$\" and label \"%\" using the ORG directive", lbl[i]["name"], lbl[i + 1]["name"])

	# converting labels into absolute addresses

	for i in range(len(lbl)):
		for j in range(len(lbl[i]["code"])):
			if type(lbl[i]["code"][j]) != bytes:
				b = get_label_addr(lbl[i]["code"][j]["value"])
				if b != -1:
					lbl[i]["code"][j] = b

	# converting instructions again

	for i in range(len(lbl)):
		j = 0
		while j < len(lbl[i]["code"]):
			if type(lbl[i]["code"][j]) == bytes:
				j += 1
				continue

			if lbl[i]["code"][j]["token"] == Tk.INS:

				# immediate
				if type(lbl[i]["code"][j + 1]) != bytes and lbl[i]["code"][j + 1]["value"] == "#":
					n = lbl[i]["code"][j + 2]
					addr = None
					if len(n) == 1: 
						addr = Addr.IMM
						b = get_opcode(lbl[i]["code"][j]["value"], addr)
						if b == -1: 
							error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")
					else:
						addr = Addr.IMM2
						
					
					b = get_opcode(lbl[i]["code"][j]["value"], addr)
						
					if b == -1: error(lbl[i]["code"]["line"], "Unrecogniezed addressing mode")
					lbl[i]["code"][j] = b
					del lbl[i]["code"][j + 1]
					j += 2
					continue
				
				# absolute
				if type(lbl[i]["code"][j + 1]) == bytes:
					addr = None
					try:
						if lbl[i]["code"][j + 2]["value"] == ',' and lbl[i]["code"][j + 3]["value"] == "I":
							addr = Addr.ABSI
							del lbl[i]["code"][j + 2]
							del lbl[i]["code"][j + 2]
						else:
							addr = Addr.ABS
					except:
						addr = Addr.ABS

					b = get_opcode(lbl[i]["code"][j]["value"], addr)
					if b == -1: error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")
					
					if len(lbl[i]["code"][j + 1]) != 2:
						error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")

					
					lbl[i]["code"][j] = b
					j += 2
					continue
				
				# zero page
				if type(lbl[i]["code"][j + 1]) != bytes and lbl[i]["code"][j + 1]["value"] == "%":
					addr = None
					try:
						if lbl[i]["code"][j + 3]["value"] == ',' and lbl[i]["code"][j + 4]["value"] == "I":
							addr = Addr.ZPGI
							del lbl[i]["code"][j + 3]
							del lbl[i]["code"][j + 3]
						else:
							addr = Addr.ZPG
					except:
						addr = Addr.ZPG

					b = get_opcode(lbl[i]["code"][j]["value"], addr)
					if b == -1: error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")
					
					if len(lbl[i]["code"][j + 2]) != 1:
						error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")
					
					lbl[i]["code"][j] = b
					del lbl[i]["code"][j + 1]
					j += 2
					continue
				
				# relative
				if type(lbl[i]["code"][j + 1]) != bytes and lbl[i]["code"][j + 1]["value"] == "*":
					b = get_opcode(lbl[i]["code"][j]["value"], Addr.REL)
					if b == -1: error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")
					
					if len(lbl[i]["code"][j + 2]) != 1:
						error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")
					
					lbl[i]["code"][j] = b
					del lbl[i]["code"][j + 1]
					j += 2
					continue
				
				# indirect
				if type(lbl[i]["code"][j + 1]) != bytes and lbl[i]["code"][j + 1]["value"] == "(":
					addr = None
					try:
						if lbl[i]["code"][j + 4]["value"] == ',' and lbl[i]["code"][j + 5]["value"] == "I":
							addr = Addr.INDI
							del lbl[i]["code"][j + 4]
							del lbl[i]["code"][j + 4]
						else:
							addr = Addr.IND
					except:
						addr = Addr.IND

					b = get_opcode(lbl[i]["code"][j]["value"], addr)
					if b == -1: error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")
					
					if len(lbl[i]["code"][j + 2]) != 2:
						error(lbl[i]["code"][j]["line"], "Unrecogniezed addressing mode")

					lbl[i]["code"][j] = b
					del lbl[i]["code"][j + 1]
					del lbl[i]["code"][j + 2]


					j += 2
					continue

			# CALL
			if lbl[i]["code"][j]["value"] == "CALL":
				b = bytes(0) 
				arg = lbl[i]["code"][j + 1]
				narg = int.from_bytes(arg, "big", signed = True)
				
				b += get_opcode("TSB", Addr.IMPL)
				b += get_opcode("PSH", Addr.IMPL)
				b += get_opcode("LDI", Addr.IMM2)
				b += int.to_bytes(0, 2, "big", signed = True)
				b += get_opcode("LDAH", Addr.ABSI)
				b += arg
				b += get_opcode("PSH", Addr.AH)
				b += get_opcode("INI", Addr.IMPL)
				b += get_opcode("CMPI", Addr.IMM2)
				b += int.to_bytes(get_size_by_addr(narg), 2, "big", signed = True)
				b += get_opcode("JZC", Addr.REL)
				b += int.to_bytes(-4, 1, "big", signed = True)
				b += get_opcode("JMP", Addr.B)

				lbl[i]["code"][j] = b
				del lbl[i]["code"][j + 1]

			j += 1
	
	# last check

	for i in range(len(lbl)):
		for j in range(len(lbl[i]["code"])):
			if type(lbl[i]["code"][j]) != bytes:
				a = 0
				try:
					error(lbl[i]["code"][j]["line"], "Unexpected token: '$'", lbl[i]["code"][j]["value"])
				except IndexError:
					error(-1, "Unrecogniezed error")
					
	# creating bytes

	b = bytes()
	current_addr = 0
	try:
		current_addr = lbl[0]["addr"]
	except:
		pass

	for i in range(len(lbl)):
		for j in range(len(lbl[i]["code"])):
			b += lbl[i]["code"][j]
			current_addr += len(lbl[i]["code"][j])

		try:
			next_addr = lbl[i + 1]["addr"]
			while current_addr < next_addr:
				b += bytes(1)
				current_addr += 1

		except:
			pass

	return b

VERISON = "1"

if len(sys.argv) < 2:
	print("""
usage: 		 	 ARG1			ARG2
	assembler.py <source.anc16> 
	assembler.py <source.anc16> <output> 

commands:
	assembler.py ver
	""" 
	)
	exit(0)

if sys.argv[1] == "ver":
	print("version: " + VERISON)
	exit(0)

f = open(sys.argv[1], "r")
out = "a"
try:
	out = sys.argv[2]
except:
	pass
pa = pre_assemble(f.read())
f.close()
a = assemble(pa)
if out.endswith(".bin"):
	f = open(out, "wb")
else:
	f = open(out + ".bin", "wb")
f.write(a)
f.close()
