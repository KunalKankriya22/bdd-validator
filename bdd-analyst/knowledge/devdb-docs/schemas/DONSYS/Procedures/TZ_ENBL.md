---
tags:
  - procedure
  - DONSYS
---
# TZ_ENBL

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Type**: FUNCTION

## Dependencies

- LT_APPLICATION_CONFIG (SYNONYM in PUBLIC)
- STANDARD (PACKAGE in SYS)
- SYS_STUB_FOR_PURITY_ANALYSIS (PACKAGE in SYS)

## Source Code

```plsql
FUNCTION              "TZ_ENBL" return boolean is
v_tz CHAR(1);
begin
	SELECT	NVL(time_zone_enabled,'N')
  INTO 		v_tz
  FROM		lt_application_config;
  if v_tz = 'Y' then return true; else return false; end if;
  end;

```
