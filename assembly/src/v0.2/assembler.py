import re
import enum
import sys
import warnings
warnings.simplefilter(action = 'ignore', category = FutureWarning)

class RuleType(enum.Enum):
	DIRECTIVE = 0
	MACRO = 1
	LABEL = 2
	INSTRUCTION = 3
	SCOPE = 4

rules = {
	RuleType.DIRECTIVE: {
		"use_as": r"^(use) (\S+) (as) (\S+)$",
		"use": r"^(use) (\S+)$",
		"import": r"^(import) (\S+)$",
		"org": r"^(org) (\S+)$",
		"word": r"\b(word) (\S+)",
		"byte": r"\b(byte) (\S+)",
		"if_used": r"^(if) (used) (\S+)$",
		"if": r"^(if) (\S+)$",
		"else": r"^(else)$",
		"elif_used": r"^(elif) (used) (\S+)$",
		"elif": r"^(elif) (\S+)$",
		"endif": r"^(endif)$",
		"sizeof": r"\b(sizeof) (\S+)",
		"reserve": r"\b(reserv) (\S+)"
	},
	RuleType.MACRO: {
		"call": r"\b(call) (\S+)$",
		"syscall": r"\b(syscall) (\S+)$"
	},
	RuleType.LABEL: {
		"label": r"([a-zA-Z_]+\S*:)"
	},
	RuleType.INSTRUCTION: {
		"ins": r"\b(ada|adb|ana|anb|aret|brk|clc|cld|cli|clo|cmah|cmpa|cmpb|cmpi|cpuid|dea|deb|dei|dej|ina|inb|ini|inj|jcc|jcs|jmp|jnc|jns|joc|jos|jsp|jzc|jzs|kill|lda|ldah|ldal|ldb|ldbh|ldbl|ldd|ldi|ldj|lds|lmhi|lmli|msb|nop|ora|orb|psh|read|rest|ret|sed|sei|shl|shr|smhi|smli|sta|stah|stb|stbh|sti|stj|stpc|stsr|sua|sub|tab|tabh|tabl|tad|tahj|tai|tamh|taml|tba|tbah|tbal|tbhj|tbi|tis|tsb|wrte|wrti|xora|xorb) (\S+)"
	},
	RuleType.SCOPE: {
		"local": r"\b(local )([a-zA-Z_]+\S*)",
		"global": r"\b(global )([a-zA-Z_]+\S*)",
	}
}

module_pool = list[str]()

def get_value(t: tuple):
	n = len(t)
	s = str()
	for i in range(n):
		if not t[i] is None:
			s += str(t[i])
	
	return s



class TokenType(enum.Enum):
	NUM = r"\-?(x[[:xdigit:]]+|\d+|0o[0-7]+|0b[0-1]+)\b"
	STR = r"\""
	OTHER = None
	ID = r"([a-zA-Z_]+\S*)"
	RESERVED = r"(use|used|as|stdcall|import|org|word|byte|if|else|elif|endif|\$|sizeof|reserv|call|syscall|local|global|ada|adb|ana|anb|aret|brk|clc|cld|cli|clo|cmah|cmpa|cmpb|cmpi|cpuid|dea|deb|dei|dej|ina|inb|ini|inj|jcc|jcs|jmp|jnc|jns|joc|jos|jsp|jzc|jzs|kill|lda|ldah|ldal|ldb|ldbh|ldbl|ldd|ldi|ldj|lds|lmhi|lmli|msb|nop|ora|orb|psh|read|rest|ret|sed|sei|shl|shr|smhi|smli|sta|stah|stb|stbh|sti|stj|stpc|stsr|sua|sub|tab|tabh|tabl|tad|tahj|tai|tamh|taml|tba|tbah|tbal|tbhj|tbi|tis|tsb|wrte|wrti|xora|xorb)"
	TAB = r"\t"

class Rule:
	def __init__(self, t: RuleType, name: str, m: re.Match[str]) -> None:
		self.t = t
		self.name = name
		self.m = m
		self.params = list()

	def __str__(self) -> str:
		s =  f"(<rule>|{RuleType(self.t).name}|name: '{self.name}'|value: '{str(get_value(self.m.groups()))}')"

		for i in self.params:
			s += "\n\t" + str(i)

		return s

	def get_value(self, t: tuple):
		n = len(t)
		s = str()
		for i in range(n):
			if not t[i] is None:
				s += str(t[i])
		
		return s

class Token:
	def __init__(self, t: TokenType, value, line, column) -> None:
		self.t = t
		self.value = value
		self.line = line
		self.column = column

	def __str__(self):
		return f"(<token>|{TokenType(self.t).name}|value: '{self.value}'|line: {self.line}|column: {self.column})"

class Error:
	def throw(module: str, msg: str, line: int, column: int) -> None:
		sys.stderr.write(f"In module '{module}'\n@ line: {line} and column: {column}\nerror: {msg}\n")

class Assembler:
	def __init__(self, filename: str, source: str) -> None:
		self.source = source
		self.filename = filename

	def assemble(self) -> bytes:
		module_pool.append(self.filename)
		pre_assembled = self.__pre_assemble()
		self.__token_map(pre_assembled)
		self.__rules_map(pre_assembled)
 
		# self.__debug_token()
		# self.__debug_rule()

		self.__lonely_tokens()


	def __pre_assemble(self) -> str:
		# remove comments, unnecessary spaces
		s = re.sub(r";.*", "", self.source)
		s = re.sub(r"\t+(?=\n)", "", s)
		s = re.sub(r" +(?=\n)", "", s)
		return s
		

	def __token_map(self, pre_assembled: str) -> list[Token]:
		# create a list of token
		self.tokens = list[Token]()
		line = 1
		column = 1
		cursor = 0
		m: re.Match
		while len(pre_assembled) > 0:
			m = re.match(TokenType.RESERVED.value, pre_assembled, re.I | re.M)
			if not m is None:
				self.tokens.append(Token(TokenType.RESERVED, get_value(m.groups()), line, column))
				column += m.span()[1]
				pre_assembled = pre_assembled[m.span()[1]::]
				continue

			m = re.match(TokenType.NUM.value, pre_assembled, re.I | re.M)
			if not m is None:
				self.tokens.append(Token(TokenType.NUM, get_value(m.groups()), line, column))
				column += m.span()[1]
				pre_assembled = pre_assembled[m.span()[1]::]
				continue

			m = re.match(TokenType.ID.value, pre_assembled, re.I | re.M)
			if not m is None:
				self.tokens.append(Token(TokenType.ID, get_value(m.groups()), line, column))
				column += m.span()[1]
				pre_assembled = pre_assembled[m.span()[1]::]
				continue

			m = re.match(TokenType.TAB.value, pre_assembled, re.I | re.M)
			if not m is None:
				self.tokens.append(Token(TokenType.TAB, get_value(m.groups()), line, column))
				column += m.span()[1]
				pre_assembled = pre_assembled[m.span()[1]::]
				continue

			if pre_assembled[0] == "\"":
				i = 1
				s = "\""
				try:
					while pre_assembled[i] != "\"" or (pre_assembled[i] == "\"" and pre_assembled[i - 1] == "\\"):
						i += 1
						column += 1
						cursor += 1
						s += pre_assembled[i - 1]
					
					s += "\""
					self.tokens.append(Token(TokenType.STR, s, line, column))
					pre_assembled = pre_assembled[i + 1::]
		
				except IndexError:
					Error.throw(self.filename, "unexpected the end of the file", line, column)
					sys.exit(1)

			if pre_assembled[0] == " ":
				pre_assembled = pre_assembled[1::]
				continue

			if pre_assembled[0] == "\n":
				pre_assembled = pre_assembled[1::]
				column = 0
				line += 1
				continue

			self.tokens.append(Token(TokenType.OTHER, pre_assembled[0], line, column))
			column += 1
			pre_assembled = pre_assembled[1::]
		
		self.tokens.sort(key = self.__sort_token_by_pos)


	def __rules_map(self, pre_assembled: str) -> list[Rule]:
		# search and recognize the rules
		self.rules = list[Rule]()
		for t in rules:
			for r in rules[t]:
				i = re.finditer(rules[t][r], pre_assembled, re.I | re.M)
				for m in i:
					self.rules.append(Rule(t, r, m))
		self.rules.sort(key = self.__sort_rule_by_span)
	
	def __sort_rule_by_span(self, r: Rule) -> int:
		return r.m.span()[1]
	
	def __sort_token_by_pos(self, t: Token) -> int:
		return t.line * 10000 + t.column

	def __debug_rule(self) -> None:
		for r in self.rules:
			print(str(r))
	
	def __debug_token(self) -> None:
		for t in self.tokens:
			print(str(t))



if __name__ == "__main__":
	try:
		file = open(sys.argv[1])
	except FileNotFoundError:
		sys.stderr.write(f"File not found: {sys.argv[1]} was not found")
		sys.exit(1)
	except IndexError:
		print("Usage:\n\tpy assembler.py <sourceFile> [outputFile]")
		sys.exit(0)
	
	source = file.read()
	filename = file.name
	file.close()

	assembler = Assembler(filename, source)
	out = assembler.assemble()

	file = open("a.bin" if len(sys.argv) <= 2 else sys.argv[2], "w")

