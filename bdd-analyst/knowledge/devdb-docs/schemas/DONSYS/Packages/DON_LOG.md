---
tags:
  - package
  - DONSYS
---
# DON_LOG

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- UTL_FILE (SYNONYM in PUBLIC)

## Package Specification

```plsql
PACKAGE              "DON_LOG" IS
/*
** this package provides the interface for logging information
** for donor enlistment
**
** Ver  Date    By   Comments
** -----------------------------------------------------------------------
** 1.0  082197  RAJ  Initial Version
**
*/
   procedure add_log_entry(logfile UTL_FILE.FILE_TYPE, p_log_type varchar2,
                           p_log_text varchar2);
END;

```
