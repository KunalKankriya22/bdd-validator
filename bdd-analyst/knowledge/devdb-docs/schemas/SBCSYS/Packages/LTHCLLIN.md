---
tags:
  - package
  - SBCSYS
---
# LTHCLLIN

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "LTHCLLIN" as
   --PROCEDURE LTHCLLIN(warehouse char,facility char,rundate date); -- Commented by Kishore on 01/10/2013. IM 5775
   PROCEDURE LTHCLLIN(warehouse char,facility char,rundate date, p_chapter_id in varchar2); -- Added by Kishore on 01/10/2013. IM 5775
End LTHCLLIN;

```
