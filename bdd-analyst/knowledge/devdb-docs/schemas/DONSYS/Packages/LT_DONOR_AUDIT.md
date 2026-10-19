---
tags:
  - package
  - DONSYS
---
# LT_DONOR_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE              "LT_DONOR_AUDIT" as
  Procedure POPULATE_HISTORY(p_chapter_id in varchar2,
                             p_donor_id in varchar2,
                             p_from_date in varchar2,
                             p_to_date in varchar2,
                             p_unit_id in varchar2,
                             p_coll_date in varchar2,
                             p_deferral_id in varchar2,
                             p_user_id in varchar2,
                             p_status out varchar2);
END LT_DONOR_AUDIT;

```
