---
tags:
  - package
  - SBCSYS
---
# SCH_SELECT_TEST

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE SCH_SELECT_TEST as
  Procedure POPULATE_UTRS (p_file_name in varchar2,
				   p_chapter_id in varchar2);

  Procedure VALIDATE_UNIT_ID(p_unit_id in varchar2,
                             p_chapter_id in varchar2,
                             p_status out varchar2);
END SCH_SELECT_TEST;
```
