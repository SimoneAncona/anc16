export type SyntaxRule = {
	specific: true,
	after: string,
	canFindOnly: TokenType[],	// match the token type
	canFindSpecific: string[],	// match the exact value of the token, use \n to say can be at the end of the line
	pair: false,		// like ( and ) or " and "
	closure?: string	// the token that close the pair
} | {
	specific: true,
	after: string,
	canFindOnly: TokenType[],
	canFindSpecific: string[],
	pair: true,		// like ( and ) or " and "
	closure: string	// the token that close the pair
} | {
	specific: false,
	after: TokenType,
	canFindOnly: TokenType[],	// match the token type
	canFindSpecific: string[],	// match the exact value of the token
	pair: false,		// like ( and ) or " and "
	closure?: string	// the token that close the pair
} | {
	specific: false,
	after: TokenType,
	canFindOnly: TokenType[],
	canFindSpecific: string[],
	pair: true,		// like ( and ) or " and "
	closure: string	// the token that close the pair
}

export type TokenType = "reserved" | "identifier" | "number" | "instruction" | "special" | "other" | "string" | "any";

export type TokenRegex = {
	name: TokenType,
	regularExpression: RegExp
}
export type Token = {
	type: TokenType,
	value: string,
	column: number,
}

export type Line = {
	tokens: Token[],
	indentLevel: number,
	lineNumber: number
	fromModule?: string
}

export type RuleName =
	// pre processor rules
	"useAs" |
	"use" |
	"useStdcall" |
	"ifUsed" |
	"ifUsedStdcall" |
	"ifNotUsed" |
	"ifNotUsedStdcall" |
	"elifUsed" |
	"elifUsedStdcall" |
	"elifNotUsed" |
	"elifNotUsedStdcall" |
	"import" |
	// other rules
	"labelDeclaration" |
	"localLabelDeclaration" |
	"globalLabelDeclaration" |
	"org" |
	// addressing rules
	"absolute" |
	"absoluteIndexed" |
	"accumulatorRegister" |
	"accumulatorHighRegister" |
	"accumulatorLowRegister" |
	"baseRegister" |
	"baseHighRegister" |
	"baseLowRegister" |
	"immediate" |
	"implied" |
	"indexRegister" |
	"indirect" |
	"indirectIndexed" |
	"relative" |
	"relativeUsingJ" |
	"zeroPage" |
	"zeroPageIndexed" |
	// marcos
	"call" |
	"syscall"
	;

export type RuleExpression = {
	genericToken: true
	tokenTypes: TokenType[]
	isArgument: boolean
	value?: string
} | {
	genericToken: false
	value: string
};

export type RuleExpressions = RuleExpression[];

export type RuleInterface = {
	name: RuleName,
	rule: RuleExpressions,
	onlyFor?: string | undefined;
	// ^^^^^ this property means that a certain rule can by applied if
	// the line starts with a certain keyword. Also, if this property is set
	// and there is no match, an exception is raised
	handleRule: (args: Token[], scope: string[], source: Line[], line: Line) => any
}

export type Rule = {
	name: RuleName,
	args: Token[],
	line: Line,
	handleRule: (args: Token[], scope: string[], source: Line[], line: Line) => any
}

export type LocalSymbol = {
	name: string,
	type: "number",
	value: string,
	scope: string[],	// scope path: module.label
	isConst: boolean
} | {
	name: string,
	type: "string",
	value: string,
	scope: string[],
	isConst: boolean
}

export type SymbolTable = LocalSymbol[];

export type Data = {
	token: Token,
	size: number,	// in bytes
	position: number,
	resolve: "value"
	value: number,
	forced: boolean	// the value and size cannot be changed
} | {
	token: Token,
	size: number,	// in bytes
	position: number,
	resolve: "symbol",
	reference: "absolute" | "relative" | "zeroPage"
	symbol: string
} | {
	token: Token,
	size: number,	// in bytes
	position: number,
	resolve: "instruction"
	instruction: string
} | {
	token: Token,
	size: number,
	position: number,
	resolve: "size",
	symbol: string,
} | {
	token: Token,
	size: number,
	position: number,
	resolve: "currentAddress"
} | {
	token: Token,
	size: number,
	position: number,
	resolve: "expression",
	expression: string
}

export type Label = {
	name: string,
	code: Line[],		// from source code
	data: Data[]		// -> generate data
	binary: Uint8Array,	// -> -> and finally binary code
	subLabels: Label[],
	isLocal: boolean,
	size: number | "unresolved",
	address: number | "unresolved",
	scope: string[]
};