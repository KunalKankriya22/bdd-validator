---
tags:
  - package
  - SRVSYS
---
# SRVDON

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE              "SRVDON" as

   function donor_acceptable (
      p_unit_id      in varchar2,
      p_coll_date    in date,
      p_chapter_id   in varchar2,
      p_product_code in varchar2,
      p_aliquot      in varchar2,   -- not currently used
      p_debug        in boolean := FALSE
      ) return varchar2;
end;

```
