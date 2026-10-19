---
tags:
  - package
  - SBCSYS
---
# IMPBCHKN

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE impbchkn
AS
   PROCEDURE impbchkn(
   						warehouse 		CHAR
   						,p_chapter_id 	VARCHAR2
   					 )
   ;
END impbchkn;
```
