---
tags:
  - package
  - SBCSYS
---
# DNLBU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "DNLBU" IS

   PROCEDURE donor_to_lab_unit_data
             (in_unit_id          IN      VARCHAR2,
              in_chapter_id       IN      VARCHAR2,
              in_from_date        IN      DATE,
              in_to_date          IN      DATE,
              io_interface_id     IN OUT  VARCHAR2);

   PROCEDURE check_donor_eligibility
             (in_donor_id         IN      VARCHAR2,
              in_chapter_id       IN      VARCHAR2,
              in_unit_id          IN      VARCHAR2,
              in_coll_date        IN      DATE,
              in_proc_code        IN      VARCHAR2,
              in_don_type         IN      VARCHAR2);

END DNLBU;

```
