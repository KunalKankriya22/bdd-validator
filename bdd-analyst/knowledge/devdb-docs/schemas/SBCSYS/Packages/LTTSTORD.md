---
tags:
  - package
  - SBCSYS
---
# LTTSTORD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "LTTSTORD" as
   PROCEDURE LTTSTORD(rundate date);
   FUNCTION check_db RETURN BOOLEAN;
   PROCEDURE SET_PARAMETERS(ttype varchar2,temp_unit_id  varchar2);
   senda             varchar2(1) := 'Y';
   tstord            varchar2(1) := 'Y';
   Nodonor           varchar2(1) := 'Y';
   Msg_seg           varchar2(1) := 'Y';
   Nobar             varchar2(1) := 'Y';
   err_text                varchar2(50);
End LTTSTORD;

```
