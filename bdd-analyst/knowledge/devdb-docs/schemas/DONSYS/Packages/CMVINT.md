---
tags:
  - package
  - DONSYS
---
# CMVINT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE CMVINT IS

   PROCEDURE donor_to_lab_unit_data
             (in_unit_id          IN      VARCHAR2,
              in_chapter_id       IN      VARCHAR2,
              in_from_date        IN      DATE,
              in_to_date          IN      DATE,
              io_interface_id     IN OUT  VARCHAR2);

END CMVINT;

```
