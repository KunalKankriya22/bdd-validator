---
tags:
  - package
  - SBCSYS
---
# GERAUDIT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE GERAUDIT as
  Procedure POPULATE_GERAUDIT(p_parm_id in varchar2,
                              p_status out varchar2);
END GERAUDIT;
```
