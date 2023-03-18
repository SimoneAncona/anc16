# ANC16 Assembly standard version 2

## directives

### USE
is used to define a constant:  
`USE SIX AS 6` or `USE X`  
is also used to use the standard call and:  
`USE STDCALL`

### IMPORT
is used to import a library:  
`IMPORT math`

### ORG
is used to specify the starting address of a label: 
```
ORG 0x4000 
_code:
	LDA	#5
	CALL function	; call the function stored in 0x5000

ORG 0x5000
function:
	LDB #6
	
```
### WORD and BYTE
used to define a word or a byte or to specify the argument length:  
`variable: WORD 1`  
`variable` is a pointer to a word (16-bit) where is stored the number 1

### IF (NOT) USED
preprocessor directive used to assemble code for different systems
```
use test
_code:
	lda #1
	ldb #2
	if used test
	lda #5
	endif
```

### ELSE
used with if

### ELIF (NOT) USED
used with if

### ENDIF
used to close the if

### $
the `$` is the current address

### SIZEOF
return the size in byte of a label

### RESERV
used to reserv n bytes

## Macros

### CALL
used to call a function referenced by a label

```
addFunction:
	ADA B
	RET	; return
_code:
	LDA #12
	LDB #29
	CALL addFunction
```

### SYSCALL
used to call a system function referenced by a symbol

```
msg: "ciao"
_code:
	LDA msg		; pointer to message
	LDB #5		; message length
	SYSCALL print
```

## Numbers
| base | format  | example
| ---- | ------  | ------
| 16   | 0xHHHH..| 0x2AFE
| 10   | DDDD... | 11006
| 8    | 0oOOO...| 0o25376
| 2    | 0bBBB...| 0b10101011111110

## Addressing modes

### Absolute
the argument of the instruction is a word (16-bit) and is the address of a cell in memory.
To specify the absolute addressing mode, you just have to write the address, example: `READ 0xFF00` or `JMP 493`

### Absolute indexed: 
the argument of the instruction is a word (16-bit) and is the address + the value stored in the Index register of a cell in memory.
To specify the indexed addressing mode, you just have to write address, I. `STA 0x34FE, I`

### Relative: 
the argument is a byte that, added with the value stored in the Prgram Counter, resolves an address.
The relative addressing mode is specified putting a * before the argument. `JNC *0b110`

### Relative with J: 
similar to Relative, but with no argument, the value added to the Prgram Counter is stored in J.
The relative addressing mode is specified putting a *J. Example: `JOC *J`

### Indirect
the argument is 16-bit long and is and address of a cell that store another address used in this addressing mode.
The indirect addressing mode is specified putting the address in two brackets. Example: `CMBH (0x40A4)`

### Indirect indexed
as indirect, but is added the value stored in I (as a signed integer) to the final address.
Like in the indirect you have to write (address), I. Example: `ANB (0o554), I`

### Implied 
you just write the instruction.
Example: `BRK`

### Immediate
when the argument is the operand
The immediate addressing mode is specified putting a # before the argument: `LDA #0xFF00`

### Zero page
the argument is a byte that specify a cell in the first page of the memory.
The zero page addressing mode is specified putting a % before the address. Example: `ADA %x4F`

### Zero page indexed 
like the zero page addressing mode, but adding the value stored in I as an unsigned integer.
The zero page indexed addressing mode is specified putting a % before the address and , I after. Example: `SUB %xFF, I ; the sum can refer to an address out of the zero page`

### Registers 
the value is stored in a register, these instructions takes no arguments, the register is specified in the opcode. Example:
```
SHL A
ADA B
ORA I
PSH AH
```

## Labels
A label is a pointer to a certain area in memory. Labels are used to make coding easier.

```
_code:
	LDA #5
	LDB #6
	CALL sum

sum: 
	ADA B

msg: "hello"	; you can use a label to store something, like a variable
```

### Sub-labels
Now you can use sub-labels like:
```
_code:
	local var1: BYTE 10 ; local is the default
	global var2: BYTE 8

sum: 
	ADA _code.var1	; you cannot, is local
	ADA _code.var2	; you can, is global

msg: "hello"	; you can use a label to store something, like a variable
```
