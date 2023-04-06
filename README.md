# ANC16: 16-bit architecture

Check the complete documentation in `/doc/ANC16 Architecture.pdf`

## Introduction

TheANC16 architecture was created for educational purposes. It is an easy architecture useful for studying.

## Abbreviations

- ARC: architecture.
- INS: instruction.
- A: accumulator register.
- B: base register.
- SP: stack pointer.
- GPR: general purpose register.
- IO: input/output.
- DR: decremental register.
- SR: status register.
- PC: program counter.
- IRQ: interrupt request.
- DR-INR: interrupt request issued by DR.
- EIRQ: external IRQ.
- NMI: non-maskable interrupt.
- ISA: instruction set architecture.
- OS: operative system.
- MSB: most significant byte (8-bit).
- LSB: least significant byte.
- HEX: hexadecimal.
- BIN: binary.
- OCT: octal
- OPC: operation code
- INR: interrupt

## Architecture

An ANC16 microprocessor is composed of different things. It has 16-bit and 8-bit length registers, a 64KB integrated random access memory, a 512B integrated ROM, theALU and different buses.

## Registers

A register is a tiny memory used to temporary store data such as addresses, numbers or characters to print on the screen.

There are different registers for different purposes, we call the registers used for general purposes GPR.

There are 4 GPRs and others registers with specific purposes. We list below the 4 GPRs

- The **A**ccumulator is a 16-bit GPR, divided in **A**ccumulator **H**igh (8-bit) and **A**ccumulator **L**ow (8-bit)
- The **B**ase is another 16-bit GPR, divided in **B**ase **H**igh (8-bit) and **B**ase **L**ow (8-bit)
- The **I**ndex register is a 16-bit GPR usually used to store addresses
- And finally the **J**ump To register that is the only 8-bit GPR usually used to store **relative addresses**

Summarizing, there are 4 GPRs:A, B, I and J. I and J registers are GPRs but are usually used to store addresses.

There are others registers with different purposes:

- The **P**rogram **C**ounter is a 16-bit register used to store the address of the current instruction
- The **I**nstruction **R**egister is a 16-bit read-only register used to store the current instruction
- The **S**tack **P**ointer is a 16-bit register used to refer to a certain address of an area of the memory used as stack.
- The **S**tatus **R**egister is an 8-bit register used to store additional information about the result of the current instruction:
  - **N**egative: 1 the result is negative, otherwise 0.
  - **O**verflow: 1 the result is out of the range -32.768, 32.767.
  - **I**nterrupts: 1 EIRQs are enabled, 0 disabled.
  - **D**R interrupts: 1 DR-INR is enabled, 0 disabled (when is disabled the register keep counting anyway).
  - **S**ystem privileges: 1 if system privileges are enable, otherwise 0. This flag can be modified only if is set to 1, otherwise is read-only.
  - NOT USED, always 1.
  - **Z**ero: 1 if the result is 0, otherwise 0.
  - **C**arry: 1 if the result is out of range 0, 65.535
- The **D**ecremental **R**egister is an 8-bit register that decrements itself at each cycle if it is 00 and the DR interrupt flag is 1, then a DR-INR is issued.
- The **I**nternal **M**emory **L**ower **I**ndex and **I**nternal **M**emory **H**igher **I**ndex are two 16-bit long registers that are used by the OS to specify the memory space available for an application running where IMLI is the starting address (included) and IMHI is the ending address (excluded). These two register are accessible only if the value in the **System Privileges** are enable.
- The **E**xternal **M**emory **L**ower **I**ndex and **E**xternal **M**emory **H**igher **I**ndex are two 16-bit long registers that have the same function as registers **IMLI** and **IMHI** but with external memory. These two register are accessible only if the value in the **System Privileges** are enable.
- The **A**ddress **R**egister is a 16-bit read-only register that contains the processed address argument of instructions that support internal/external memory read and write operations. For processed address we refer to an absolute address where the argument is fetched.

## Buses

Abus is a connection between internal CPU's components. There are 3 buses with different widths.

- Address bus: 16-bit used to specify an address of a memory cell or an IO device, a cell stores 8-bit, a byte.
- Data bus: 16-bit used to transfer data among microprocessor’s components.
- Control bus: a 4-bit length bus that is used to specify the operation such as read or write. The first bit is used to specify internal or external R/W. The second bit is used to specify read (0) or write (1). The third is the enable, and the last one specifies the data width (0 = 8- bit, 1 = 16-bit)

## Instructions

An instruction is a number that tells theALU which operation should perform.An instruction is 16- bit long. There are ins. that takes no parameters and others that may take different parameters. Instructions are of different categories:

- Arithmetic operations, such as the sum, or the subtraction, increment, decrement
- Logical operations, such asAND, OR
- Shift operations, such as shift left or shift right
- Transfer / Load instructions, used to transfer data from registers or memory
- Stack instructions, used to perform stack operations.
- Flag instructions, that change or read the **SR** (Status Register).
- Comparison instructions, used to compare data.
- Jumps, that change the **PC** (Program Counter).
- Interrupt instructions, used to handle interrupts.
- IO instructions.

## Memory

The 64KB integrated memory is used to store the current program in execution, data, or information regarding IO devices.

The memory is mapped as follows:

- From 0000 to 00FF there is the zero page.
- From 0100 to 1FFF there is the memory reserved to operative system routines.
- From 2000 to 2001 there is the OS ENTRYPOINT vector, that store the entry point of the operative system
- From 2002 to 2003 there is the **DR-INR** vector, that store the 16-bit (2 bytes) address of the routine that handles the interrupt request issued by the **DR** (Decremental Register).
- From 2004 to 2005 there is the **EIRQ** vector, that store the address of the routine that handles the external interrupt request.
- From 2006 to 2007 there is the **NMI** vector, that store the routine address that handles a non-maskable interrupt.
- From 2008 to 2009 there is the SYSCALL vector, where is stored the address of the routine that handles system calls from applications.
- From 200Ato 200B there is the **IAOOR-INR** vector, that store the 16-bit (word) address of the routine that handles the interrupt issued when the **AR** is Out Of Range (the range is defined by IMLI and IMHI registers).
- From 200C to 200D there is the **EAOOR-INR** vector, that store the 16-bit (word) address of the routine that handles the interrupt issued when the **AR** is Out Of Range (the range is defined by EMLI and EMHI registers).
- From 200E to 200F there is the **SPOOR-INR** vector, that store the address of the routine that handles the interrupt issued when stack overflow occurs
- From 2010 to 2011 there is the vector used to store the **PC** when an irq is issued.
- 2012 there is the vector used to store the **SR** when an irq is issued
- From 2013 to 34FF (arbitrary) there is the memory reserved to operative system data.
- From 3500 (arbitrary) to FDFF free memory.
- From FE00 to FFFF ROM with firmware.

The format of an address of a cell in memory is PPAAwhere PP is a byte that refers to the page,AA is the address in the page.

## ROM

The 512B Read Only Memory contains the firmware that loads the operative system into memory from an external ROM, the starting loading address is 0000 and the ending address is 200B (included) (IO Address).

## Addressing mode

There are different ways of referring to a position in memory.

- Absolute: when the argument of the instruction is the address of a cell in memory
- Absolute indexed: from the absolute address, is added **I** as signed integer
- Relative: when the argument of the instruction is the address of a cell calculated by adding the 8-bit signed value to the **PC**.
- Relative with J: as the Relative, with the difference that there is no argument, the value added to the PC is the value stored in **J**.
- Indirect: when the argument of the instruction is an address stored in a cell in memory referred by an absolute address.
- Indirect indexed: from the indirect address, is added **I** as signed integer to the final address.
- Implied: when an instruction takes no argument.
- Immediate: when the argument is the operand.
- Zero page: when the argument is a byte that refers to the first page of the integrated memory.
- Zero page indexed: from the zero page, is added **I** as unsigned integer.
- Accumulator: when the operand is the **A** register or **AH** or **AL**.
- Base: when the operand is the **B** register, **BH** or **BL**.
- Index register: when the operand is stored in **I**.

## Interrupts

An interrupt is an internal or external signal that interrupt the execution of the CPU and start a routine called interrupt handler.

Hardware interrupts:

- EIRQ: maskable external interrupt request.Address to routine stored in 2004 – 2005 (hex).
- NMI: non-maskable interrupt.Address to routine stored in 2006 – 2007 (in hex).

When the CPU does not recognize an opcode a NMI is issued and in **AL** is stored 1.

When an application tries to execute an instruction that require **System Privileges** a NMI is issued and in **AL** is stored 2.

- \*RESET: restart the CPU, also a software interrupt.
- DR-INR: this interrupt is issued when the register **DR** is 0000.Address to interrupt handler is stored in 2002 – 2003 (hex)
- \*\*IAOOR-INR: (**I**nternal **A**ddress **O**ut **O**f **R**ange **In**te**r**rupt) this interrupt is issued when the **AR** is out of the range from the value stored in **IMLI** (included) to the value stored in **IMHI** (included). Address to interrupt handler is stored in 200A– 200B.
- \*\*EAOOR-INR: (**E**xternal **A**ddress **O**ut **O**f **R**ange **In**te**r**rupt) this interrupt is issued when the **AR** is out of the range from the value stored in **EMLI** (included) to the value stored in **EMHI** (included).Address to interrupt handler is stored in 200C – 200D.
- \*\*SPOOR-INR: this interrupt is very similar to **AOOR-INR**. The **SP O**ut **O**f **R**ange inr. is issued when the **SP** is lower than the value stored in **IMLI** or is higher than the value stored in **IMHI**.

Software interrupt

- SYS: is a software interrupt used for system calls.Address to routine is stored in 2008 – 2009

Interrupts marked with \* do not store **PC** and **SR**.

Interrupts marked with \*\* are issued only if **System Privileges** is not set.

When an interrupt (except for RESET) is issued the SR changes into n o I d S 1 z c (uppercase = 1)

## Assembly standard

This tells how to write in ANC16 Assembly:

- HEX representation: **0xHHHH**… where H is a hex digit (0 – F).
- BIN representation: **0bBBBB**… where B is 0 or 1.
- OCT representation: **0oOOOO**… where O is an oct digit (0 – 7).
- Decimal representation: **DDDD**… where D is a decimal digit (0 – 9).
- Absolute addressing example: READ **0xFF00**.
- Absolute indexed: STA**0xFF00, I.**
- Relative: JMP \***0b10**.
- Relative with J: JNS \***J**.
- Indirect: JMP **[0xFF00]**.
- Indirect indexed: JMP **[0xFF00], I**.
- Implied: SYS.
- Immediate: LDA **#0xFF00**.
- Zero page:ADA **%0xFF**.
- Zero page indexed: SUB **%0xFF, I**.
- Accumulator: SHL**A**.
- Base: SHR **B**.

Directives and predefined routines:

The list shown below may differ from assembler to assembler:

- **ORG**: set the starting address of a label.
- **USE STDCALL**: this allows you to use CALL predefined routine.
- **USEAS**: this allows you to define constants: USE sixAS 6.
- **IMPORT:** this allows you to import a library.
- **WORD:** this allows you to specify if the next number is 2 bytes long.
- **BYTE:** the same as WORD, but the next number is just 1 byte long.
- **CALL:** this is a macro that allows you to call a routine simply by using the label name.
- **SYSCALL:** this is a macro used to make a system call referring to the syscall name.

## System calls

Asystem call is a software interrupt managed by the operating system and is used by programs to read and modify resources that only the operating system can access such as video memory. The system call inr. is issued using the **SYS** instruction.Arguments are stored in the registers. The system call code is saved in the register **AL**.

This is the list of standard system calls:

**exit**

The exit system call is used to kill the execution of the program.

- Code: 0x00
- Arguments
  - **BL** register: exit status code (0x00 is no error)

**fopen**

Is used to open files or streams.

- Code: 0x01
- Arguments
  - **B** register: the address of the string that represents the file path.
  - **I** register: the address to a cell in memory (8-bit) that will contains the file descriptor id
- Return
  - **AH** register: 0x01 in case of error

**fclose**

Is used to close and save files.

- Code: 0x02
- Arguments
  - **AH** register: the file descriptor id
- Return
  - **AH** register: 0x01 in case of error

**fread**

Is used to read from streams.

- Code: 0x03
- Arguments
  - **AH** register: the file descriptor id
  - **BL** register: the buffer size
  - **I** register: the pointer to the buffer

**fwrite**

Is used write in streams.

- Code: 0x04
- Arguments
  - **AH** register: the file descriptor id
  - **BH**: the write mode (0 = append, 1 = truncate)
  - **BL**: the buffer size
  - **I**: the pointer to the buffer that contains the content.

**print**

Is used to print strings in the standard output stream.

- Code: 0x05
- Arguments
  - **BL** register: the length of the string
  - **I** register: the pointer to the buffer

**getl**

Is used to get lines from the standard input stream.

- Code: 0x06
- Arguments
  - **BL** register: the length of the destination buffer
  - **I** register: the pointer to the destination buffer

**sleep**

The sleep system call is used to pause the execution of the program.

- Code: 0x07
- Arguments
  - **B** register: number of cycle to sleep

**listenKey**

Is used to handle keyboard events.

- Code: 0x08
- Arguments
  - **I** register: the address to the event handler procedure
- Return
  - **AH**: the key code (used by the event handler procedure)

**requestPrivileges**

Is used to request **System Privileges**.

- Code: 0x09
- Return
  - **AH**: 0 = not allowed, 1 = allowed

**malloc**

Is used to allocate memory dynamically.

- Code: 0x0A
- Arguments
  - **BL**: the memory size.
- Return
  - **I**: the address of the allocated area or 0x0000 in case of error.

**dealloc**

Is used to free memory dynamically.

- Code: 0x0B
- Arguments
  - **I**: the address of the area.
- Return
  - **AH**: 0x01 in case of error.

**On Reset**

When the CPU is restarted or turned on, the **PC** is set to FE00, where the firmware resides. The **SR** is set to: n o I D S 1 z c (uppercase = 1)