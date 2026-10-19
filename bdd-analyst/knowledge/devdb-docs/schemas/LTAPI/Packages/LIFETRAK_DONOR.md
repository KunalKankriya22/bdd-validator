---
tags:
  - package
  - LTAPI
---
# LIFETRAK_DONOR

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE         "LIFETRAK_DONOR" IS
  type type_param_tbl is table of varchar2(350) index by binary_integer;

  Procedure INS_UPDT_TABLE(i_dml_type in varchar2,
			 	   i_table_name in varchar2,
			 	   i_table_values in type_param_tbl,
				   p_status out varchar2);

END LIFETRAK_DONOR;

```
