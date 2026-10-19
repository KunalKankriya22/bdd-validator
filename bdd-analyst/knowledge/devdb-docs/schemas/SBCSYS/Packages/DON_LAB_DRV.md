---
tags:
  - package
  - SBCSYS
---
# DON_LAB_DRV

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "DON_LAB_DRV" IS

PROCEDURE interface_drives
             (i_drive_id       IN      VARCHAR2,
              from_date        IN      DATE,
              to_date          IN      DATE,
              i_chapter_id     IN      VARCHAR2,
              i_interface_id   IN OUT  VARCHAR2);
END don_lab_drv;

```
