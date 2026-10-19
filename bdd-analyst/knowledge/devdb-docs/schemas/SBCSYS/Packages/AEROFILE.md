---
tags:
  - package
  - SBCSYS
---
# AEROFILE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- UTL_FILE (SYNONYM in PUBLIC)

## Package Specification

```plsql
PACKAGE          "AEROFILE" is
PROCEDURE add_log_entry(p_log_text varchar2, p_file UTL_FILE.FILE_TYPE);
procedure main_proc(file_name in varchar2);
procedure process;
procedure readrecord;
procedure rollback_and_exit ;
   logfile UTL_FILE.FILE_TYPE;
   instfile UTL_FILE.FILE_TYPE;
   LogDir varchar2(50);
   LogInstDir varchar2(50);
   logfilename varchar2(50);
   result_file_name varchar2(50);
   read_record varchar2(500);
   complete boolean:=false;
   maxnum  number;
end AEROFILE;

```
