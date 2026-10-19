---
tags:
  - package
  - SBCSYS
---
# INITEXTRACT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- UTL_FILE (SYNONYM in PUBLIC)

## Package Specification

```plsql
PACKAGE          "INITEXTRACT" IS
  procedure main_proc(inp_file_name in varchar2);
  procedure schedule_extracts(p_file_name in varchar2,p_schedule_time in date);

  LogDir    VARCHAR2(70);
  logfile                UTL_FILE.FILE_TYPE;
 instfile               UTL_FILE.FILE_TYPE;

end INITEXTRACT;

```
