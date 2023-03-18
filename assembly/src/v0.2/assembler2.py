import re
import enum
import sys
import warnings
from termcolor import colored
warnings.simplefilter(action = 'ignore', category = FutureWarning)

module_pool = list[str]()

def get_value(t: tuple):
	n = len(t)
	s = str()
	for i in range(n):
		if not t[i] is None:
			s += str(t[i])
	
	return s

class TokenType(enum.Enum):
	NUM = r"\-?(0x[0-9a-fA-F]+|\d+|0o[0-7]+|0b[0-1]+)\b"
	STR = r"\""
	OTHER = None
	ID = r"\b([a-zA-Z_]+[a-zA-Z_0-9]*)\b"
	RESERVED = r"\b(use|used|as|stdcall|import|org|word|byte|if|else|elif|endif|\$|sizeof|reserve|call|syscall|local|global)\b"
	TAB = r"\t"
	END_LINE = r"\n"
	INS = r"\b(ada|adb|ana|anb|aret|brk|clc|cld|cli|clo|cmah|cmpa|cmpb|cmpi|cpuid|dea|deb|dei|dej|ina|inb|ini|inj|jcc|jcs|jmp|jnc|jns|joc|jos|jsp|jzc|jzs|kill|lda|ldah|ldal|ldb|ldbh|ldbl|ldd|ldi|ldj|lds|lmhi|lmli|msb|nop|ora|orb|psh|read|rest|ret|sed|sei|shl|shr|smhi|smli|sta|stah|stb|stbh|sti|stj|stpc|stsr|sua|sub|tab|tabh|tabl|tad|tahj|tai|tamh|taml|tba|tbah|tbal|tbhj|tbi|tis|tsb|wrte|wrti|xora|xorb)\b"

class Token:
	def __init__(self, t: TokenType, value, line, column) -> None:
		self.t = t
		self.value = value
		self.line = line
		self.column = column

	def __str__(self):
		return f"(<token>|{TokenType(self.t).name}|value: '{self.value}'|line: {self.line}|column: {self.column})"

class Rule:
	def __init__(self, name: str, params: list[Token], line: int) -> None:
		self.name = name
		self.params = params
		self.line = line

	def __str__(self) -> str:
		s =  f"(<rule>|name: '{self.name}'|line: {self.line})"

		for i in self.params:
			s += "\n\t" + str(i)

		return s

class Error:
	def throw(module: str, msg: str, line: int, column: int) -> None:
		sys.stderr.write(f"In module '{module}'\n@ line: ")
		sys.stderr.write(colored(f"{line}", "cyan"))
		sys.stderr.write(" and column: ")
		sys.stderr.write(colored(f"{column}", "cyan"))
		sys.stderr.write(colored(f"\nerror:", "red"))
		sys.stderr.write(f" {msg}\n\n")

class Assembler:
	__defined_constants = list[dict]()
	__pre_process_rules = {
		"use_as": [
			["^", "use", TokenType.ID, "as", TokenType.ID, "\n"],	# ^ means starting line
			["^", "use", TokenType.ID, "as", TokenType.NUM, "\n"],
			["^", "use", TokenType.RESERVED, "as", TokenType.ID, "\n"],
			["^", "use", TokenType.RESERVED, "as", TokenType.NUM, "\n"],
		],
		"use": [
			["^", "use", TokenType.ID, "\n"],
			["^", "use", TokenType.RESERVED, "\n"]
		],
		"import": [
			["^", "import", TokenType.ID, "\n"]
		],
		"if_used": [
			["^", "if", "used", TokenType.ID, "\n"]
		],
		"if_not_used": [
			["^", "if", "not", "used", TokenType.ID, "\n"]
		],
		"else": [
			["^", "else", "\n"]
		],
		"elif_used": [
			["^", "elif", "used", TokenType.ID, "\n"]
		],
		"elif_not_used": [
			["^", "elif", "not", "used", TokenType.ID, "\n"]
		],
		"endif": [
			["^", "endif", "\n"]
		],
		
	}

	__rules = {
		"org": [
			["^", "org", TokenType.NUM, "\n"]
		],
		"word": [
			["word", TokenType.NUM],
			["word", TokenType.ID]
		],
		"byte": [
			["byte", TokenType.NUM],
			["byte", TokenType.ID]
		],
		"sizeof": [
			["sizeof", TokenType.ID]
		],
		"reserve": [
			["reserve", TokenType.NUM]
		],
		"call": [
			["call"]
		],
		"syscall": [
			["syscall"]
		],
		"local_label": [
			["local", TokenType.ID, ":"]
		],
		"global_label": [
			["global", TokenType.ID, ":"]
		],
		"label": [
			[TokenType.ID, ":"]
		],
		"instruction": [
			[TokenType.INS]
		],
		"tab": [
			[TokenType.TAB]
		],
		"string": [
			[TokenType.STR]
		],
		"label_access": [
			[TokenType.ID, ".", TokenType.ID]
		],
	}

	__addressing = {
		"abs_indx": [
			["&", ", I"]
		],
		"rel": [
			["*", "&"]	# & means match any rule
		],
		"rel_j": [
			["*", "J"]
		],
		"ind": [
			["(", "&", ")"]
		],
		"imm": [
			["#", "&"]
		],
		"zp": [
			["%", "&"]
		],
		"zpi": [
			["%", "&", ", I"]
		]
	}

	def __init__(self, filename: str, source: str) -> None:
		self.source = source
		self.filename = filename

	def assemble(self) -> bytes:
		module_pool.append(self.filename)
		pre_assembled = self.__pre_assemble()
		self.__token_map(pre_assembled)
		self.__pre_process()
		self.__label_handling()


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

			m = re.match(TokenType.INS.value, pre_assembled, re.I | re.M)
			if not m is None:
				self.tokens.append(Token(TokenType.INS, get_value(m.groups()), line, column))
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
				self.tokens.append(Token(TokenType.END_LINE, "\n", line, column))
				column = 0
				line += 1
				continue

			self.tokens.append(Token(TokenType.OTHER, pre_assembled[0], line, column))
			column += 1
			pre_assembled = pre_assembled[1::]
		
		self.tokens.sort(key = self.__sort_token_by_pos)


	def __pre_process(self) -> None:
		# analyze pre process stuff
		self.rule_map = self.__rules_map(self.__pre_process_rules)
		error = False

		for r in self.rule_map:
			match r.name:
				case "use":
					for e in self.__defined_constants:
						if e["name"] == r.params[0].value:
							Error.throw(self.filename, f"redefinition of '{r.params[0].value}'", r.line, 0)
							error = True
							break
					
					if not error:
						self.__defined_constants.append({"name": r.params[0].value, "value": None})
				case "use_as":
					for e in self.__defined_constants:
						if e["name"] == r.params[0]:
							Error.throw(self.filename, f"redefinition of '{r.params[0]}'", r.line, 0)
							error = True
							break

					if not error:
						self.__defined_constants.append({"name": r.params[0].value, "value": r.params[1]})
				case "import":
					pass
		
		for r in self.rule_map:
			x = 0
			match r.name:
				case "if_used":
					x = 1
				case "if_not_used":
					x = -1

			for i in self.__defined_constants:
				if x != 0 and (i["name"] == r.params[0].value and x == -1 or i["name"] != r.params[0].value and x == 1):
					if_cnt = 0
					tmp = self.__all_tokens()
					for i in tmp:
						if i.line > r.params[0].line or i.line == r.params[0].line and i.column > r.params[0].column:
							if i.value == "endif" and i.t == TokenType.RESERVED:
								if if_cnt == 0:
									break
								if_cnt -= 1
							if i.value == "if" and i.t == TokenType.RESERVED:
								if_cnt += 1
							try:
								self.__del_tokens.append(i)
								self.tokens.remove(i)
							except:
								pass


		for t in self.tokens:
			for c in self.__defined_constants:
				if not c is None:
					if t.value == c["name"]:
						t.t = c["value"].t
						t.value = c["value"].value
		
		if error:
			sys.exit(1)

	def __label_handling(self):
		self.rule_map = self.__rules_map(self.__rules)
		self.__addressing_detect()

		for i in self.tokens:
			if i.t != TokenType.END_LINE:
				Error.throw(self.filename, f"unexpected token '{i.value}'", i.line, i.column)

	def __addressing_detect():
		pass

	def __rules_map(self, rules) -> list[Rule]:
		# search and recognize the rules
		rule_map = list[Rule]()
		self.__del_tokens = list[Token]()
		i = 0
		try:
			while len(self.tokens) > i:
				for r in rules:
					for l in rules[r]:
						matched = True
						j = i
						params = []
						for e in l:
							if e == "^":
								if j != 0 and self.tokens[j - 1].value != "\n":
									matched = False
									break
							elif type(e) == str:
								if e != self.tokens[j].value:
									matched = False
									break
								j += 1
							elif type(e) == TokenType:
								if e.name != self.tokens[j].t.name:
									matched = False
									break
								else:
									params.append(self.tokens[j])
								j += 1
								
							
						if matched:
							rule_map.append(Rule(r, params, self.tokens[i].line))
							for k in range(0, j - i):
								self.__del_tokens.append(self.tokens[i])
								del self.tokens[i]

							break
					if matched:
						break

				if not matched:
					i += 1
		except IndexError:
			pass
	
		self.__del_tokens.sort(key = self.__sort_token_by_pos)
		return rule_map
					
	def __sort_token_by_pos(self, t: Token) -> int:
		return t.line * 10000 + t.column

	def __debug_rule(self) -> None:
		for r in self.rule_map:
			print(str(r))
	
	def __debug_token(self) -> None:
		for t in self.tokens:
			print(str(t))

	def __debug_token_colored(self) -> None:
		for t in self.tokens:
			match t.t:
				case TokenType.NUM:
					print(colored(t.value, "cyan"), end=" ")
				case TokenType.ID:
					print(colored(t.value, "yellow"), end=" ")
				case TokenType.RESERVED:
					print(colored(t.value, "magenta"), end=" ")
				case TokenType.STR:
					print(colored(t.value, "green"), end=" ")
				case __:
					print(t.value, end=" ")

	def __all_tokens(self) -> list[Token]:
		tmp = self.tokens + self.__del_tokens
		tmp.sort(key = self.__sort_token_by_pos)
		return tmp

	def __debug_all_tokens(self) -> None:
		tmp = self.__all_tokens()
		for t in tmp:
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

