---
tags:
  - package
  - AGMGR
---
# AG_UTIL

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE AG_UTIL AS 

/*-----------------------------------------------------------------------------------
|| Author       : WellSky BC.
|| Description  : Antigens pkg utility 
|| Requirements : 
|| Version
|| 01   08/16/2024  New pkg creation.
||
*/-----------------------------------------------------------------------------------
    FUNCTION is_licensed RETURN BOOLEAN;

    FUNCTION version_no RETURN VARCHAR2;
END AG_UTIL;

```
