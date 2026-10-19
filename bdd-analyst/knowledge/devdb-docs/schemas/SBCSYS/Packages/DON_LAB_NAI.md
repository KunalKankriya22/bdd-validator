---
tags:
  - package
  - SBCSYS
---
# DON_LAB_NAI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "DON_LAB_NAI" IS

PROCEDURE interface_nursing_audit
             (in_unit_id        IN      VARCHAR2,
              in_from_date      IN      DATE,
              in_to_date        IN      DATE,
              in_chapter_id     IN      VARCHAR2,
              io_interface_id   IN OUT  VARCHAR2);
END don_lab_nai;

```
