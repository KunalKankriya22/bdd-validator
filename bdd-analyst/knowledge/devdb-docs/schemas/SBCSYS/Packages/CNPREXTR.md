---
tags:
  - package
  - SBCSYS
---
# CNPREXTR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- [[schemas/SBCSYS/Tables/CNF_EXTRACT_UNITS|CNF_EXTRACT_UNITS]] (TABLE)
- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "CNPREXTR" as
/* *********************************************************************************
  Name              : CNPREXTR.pkg
  Created By        : Ashok
  Date Of Creation  : 10/10/2018
  Purpose           : Regional Test Center result extraction program.

  Version History (Change program version in code below)

  Date         Version   by       Description
  ---------------------------------------------------------------------------------
  10/10/2018   01  Ashok    Initial development
  10/20/2018   02  Ashok    chapter id added to rpt_parm table
  10/24/2018   03  Ashok    new parameter user id to main_program.
  11/06/2018   04  Ashok    use confirm_test_flag to generate electornic file.
  11/08/2018   05  Ashok    re_extract is not lookign at proper flag -- MLT 1035 -- V05
***********************************************************************   */
  TYPE t_tab IS TABLE OF cnf_extract_units%ROWTYPE INDEX BY BINARY_INTEGER;

  procedure MAIN_PROGRAM(p_parm_id     in varchar2,
                         p_chapter_id  in varchar2,
                         p_user_id     in varchar2,
                         p_status      out varchar2) ;
END CNPREXTR;

```
