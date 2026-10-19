---
tags:
  - package
  - LTAPI
---
# OUTBOUND_RECRUITMENT_API

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE         "OUTBOUND_RECRUITMENT_API" as
  procedure insert_error_log (p_drive_id in varchar2,
                              p_data_source_name in varchar2) ;

  procedure POPULATE_API_DONORS;
END OUTBOUND_RECRUITMENT_API;

```
