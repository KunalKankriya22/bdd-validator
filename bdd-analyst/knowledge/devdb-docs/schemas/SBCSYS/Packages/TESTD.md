---
tags:
  - package
  - SBCSYS
---
# TESTD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "TESTD" IS

   PROCEDURE testd
             (in_unit_id          IN      VARCHAR2,
              in_chapter_id       IN      VARCHAR2,
              in_from_date        IN      DATE,
              in_to_date          IN      DATE,
              io_interface_id     IN OUT  VARCHAR2);

END TESTD;

```
