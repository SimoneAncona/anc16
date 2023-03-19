# ANC16 Assembly Standard Version 2

## Index
1. <a href="#intro">Introduction</a>
2. <a href="#dirs">Directives</a>
3. <a href="#keywords">Keywords</a>

<a name="intro"></a>

## Introduction

In this document you will find all the references regarding the updated standard on the ANC16 assembly

<a name="dirs"></a>

## Directives

### USE
This dicetive is used to define a constant:  
`USE X`.  
Here we defined a constant with null value. To specify the value you must use `AS`:
`USE SIX AS 6`.  
In this case we defined the constant `SIX` (more specifically `_main.SIX` where _main is the name of the main module) with a value of 6.  
The `USE` directive is also used to define which method is used to call functions.
You can use the `stdcall` (or standard call).  
`USE STDCALL`  
or to use the manual call:  
`USE MANUALCALL`  
<a href="#std-manual-call">click here</a> for more informations regarding call methods.

### IMPORT
The import directive is used to import an external module or a definition module (a module with only USE).  
Example of use:  
`IMPORT math`  
Where math is the module name. From now on we could call the procedures in math:
```
USE STDCALL		; note that keywords are not case sensitive, You can write also `use stdcall`
IMPORT my_lib

_code:			; main procedure
	CALL my_lib.my_procedure
```

### ORG (abbreviation of origin)
`ORG` is used to specify the starting address of a label: 
```
USE STDCALL
ORG 0x4000 
_code:
	LDA	#5
	CALL _main.procedure	; call the procedure stored in 0x5000 (_main is the reference of the current module, you can omit it)

ORG 0x5000
procedure:
	LDB #6
	
```

### IF (NOT) USED
preprocessor directive used to assemble code for different systems
```
USE TEST
_code:
	LDA #1
	LDB #2
	IF USED TEST	; you can use the denied form: IF NOT USED
		LDA #5
	ENDIF
```

### ELSE
Is used after an IF

### ELIF (NOT) USED
used with if

### ENDIF
used to close the if

<a name="keywords"></a>

## Keywords

### WORD and BYTE
used to define a word or a byte or to specify the argument length:  
`label: WORD 1`  
`label` is a pointer to a word (16-bit) where is stored the number 1

### $
The `$` is the reference to the current address

### SIZEOF
Return the size in byte of a label

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
Is used to call a system procedure referenced by a symbol or the absolute address where is stored the procedure

```
_code:
	LDI # my_message	; pointer to the message
	LDB #5			; message length
	SYSCALL print	; display the message

my_message: "Hello"
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
The indirect addressing mode is specified putting the address in two brackets. Example: `CMBH [0x40A4]`

### Indirect indexed
as indirect, but is added the value stored in I (as a signed integer) to the final address.
Like in the indirect you have to write [address], I. Example: `ANB [0o554], I`

### Implied 
you just write the instruction.
Example: `BRK`

### Immediate
when the argument is the operand
The immediate addressing mode is specified putting a # before the argument: `LDA #0xFF00`

### Zero page
the argument is a byte that specify a cell in the first page of the memory.
The zero page addressing mode is specified putting a % before the address. Example: `ADA %0x4F`

### Zero page indexed 
like the zero page addressing mode, but adding the value stored in I as an unsigned integer.
The zero page indexed addressing mode is specified putting a % before the address and , I after. Example: `SUB %0xFF, I ; the sum can refer to an address out of the zero page`

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

### Sublabels
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
