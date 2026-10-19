---
tags:
  - package
  - DONSYS
---
# ONSITE_BLEED

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE ONSITE_BLEED IS
/*
** VER   DATE   BY    COMMENTS
** ---------------------------------------------------------------------
** 1.0  082519  Edwin  Initial version

*/


PROCEDURE validate_bleed_time  (pl_drive_id    in varchar2,
                                pl_chapter_id  in varchar2,
                                pl_start_time  in date,
                                pl_end_time    in date,
                                pl_return_code out varchar2,
                                pl_error       out varchar2);

g_chapter_id     varchar2(5);

END ONSITE_BLEED;
```
