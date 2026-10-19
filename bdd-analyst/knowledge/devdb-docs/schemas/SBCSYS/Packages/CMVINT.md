---
tags:
  - package
  - SBCSYS
---
# CMVINT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "CMVINT" IS

   PROCEDURE donor_to_lab_unit_data
             (in_unit_id          IN      VARCHAR2,
              in_chapter_id       IN      VARCHAR2,
              in_from_date        IN      DATE,
              in_to_date          IN      DATE,
              io_interface_id     IN OUT  VARCHAR2);

   PROCEDURE unit_level_cmv_transfer
             (in_unit_id          IN      VARCHAR2,
              in_chapter_id       IN      VARCHAR2,
              in_coll_date        IN      DATE,
              in_interface_id     IN      VARCHAR2,
              out_status_flag     OUT     VARCHAR2);

   PROCEDURE schedule_cmv
             (in_unit_id          IN      VARCHAR2,
              in_chapter_id       IN      VARCHAR2,
              in_interface_id     IN      VARCHAR2,
              in_coll_date        IN      DATE);

   PROCEDURE insert_donor_antigens
             (in_donor_id         IN      VARCHAR2,
              in_unit_id          IN      VARCHAR2,
              in_coll_date        IN      DATE,
              in_interface_id     IN      VARCHAR2,
              in_chapter_id       IN      VARCHAR2);
END CMVINT;

```
