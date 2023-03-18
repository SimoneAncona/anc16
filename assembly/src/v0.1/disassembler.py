import sys
from enum import Enum

def disassemble(b : bytes) -> str:
	s = "_code:\n"

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

	def get_mnemonic(hex : int) -> str:
		for i in range(len(opcs)):
			if hex == opcs[i]["hex"]: return opcs[i]["mnemonic"]
		return -1

	def get_addr(hex : int) -> Addr:
		for i in range(len(opcs)):
			if hex == opcs[i]["hex"]: return opcs[i]["addr"]
		return -1

	i = 0
	while i < len(b):
		ts = get_mnemonic(int.from_bytes(b[i : i + 2], "big"))
		if ts == -1:
			s += "BYTE " + hex(b[i])[1:] + "\n"
			i += 1
			continue
		
		add = get_addr(int.from_bytes(b[i : i + 2], "big"))
		if add == -1:
			s += "\t" + ts + " BYTE " + hex(b[i + 2]) + "\n"
			i += 3
			continue

		if add == Addr.IMM:
			ts += " # BYTE " + hex(b[i + 2])[1:]
			i += 3
		elif add == Addr.IMM2:
			ts += " # WORD " + hex(int.from_bytes(b[i + 2: i + 4], "big"))[1:]
			i += 4
		elif add == Addr.ABS:
			ts += " WORD " + hex(int.from_bytes(b[i + 2: i + 4], "big"))[1:]
			i += 4
		elif add == Addr.ABSI:
			ts += " WORD " + hex(int.from_bytes(b[i + 2: i + 4], "big"))[1:] + ", I"
			i += 4
		elif add == Addr.REL:
			ts += " * BYTE " + hex(b[i + 2])[1:]
			i += 3
		elif add == Addr.RELJ:
			ts += " *J"
			i += 2
		elif add == Addr.IND:
			ts += " (WORD " + hex(int.from_bytes(b[i + 2: i + 4], "big"))[1:] + ")"
			i += 4
		elif add == Addr.INDI:
			ts += " (WORD " + hex(int.from_bytes(b[i + 2: i + 4], "big"))[1:] + "), I"
			i += 4
		elif add == Addr.IMPL:
			i += 2
		elif add == Addr.ZPG:
			ts += " % BYTE " + hex(b[i + 2])[1:]
			i += 3
		elif add == Addr.ZPGI:
			ts += " % BYTE " + hex(b[i + 2])[1:] + ", I"
			i += 3
		elif add == Addr.A:
			ts += " A"
			i += 2
		elif add == Addr.AH:
			ts += " AH"
			i += 2
		elif add == Addr.AL:
			ts += " AL"
			i += 2
		elif add == Addr.A:
			ts += " B"
			i += 2
		elif add == Addr.BH:
			ts += " BH"
			i += 2
		elif add == Addr.BL:
			ts += " BL"
			i += 2
		elif add == Addr.I:
			ts += " I"
			i += 2
		else: i += 1

		s += "\t" + ts + "\n"

	return s

VERISON = "1"

if len(sys.argv) < 2:
	print("""
usage: 		 	 ARG1			ARG2
	disassembler.py <source.bin> 
	disassembler.py <source.bin> <output> 

commands:
	disassembler.py ver
	""" 
	)
	exit(0)

if sys.argv[1] == "ver":
	print("version: " + VERISON)
	exit(0)

f = open(sys.argv[1], "rb")
out = "a"
try:
	out = sys.argv[2]
except:
	pass
d = disassemble(f.read())
f.close()

if out.endswith(".anc16"):
	f = open(out, "w")
else:
	f = open(out + ".anc16", "w")
f.write(d)
f.close()