---
tags:
  - package
  - DONSYS
---
# DON_LAPTOP_UPDT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- [[schemas/DONSYS/Tables/DONORS|DONORS]] (TABLE)
- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE              "DON_LAPTOP_UPDT" IS

/*
**
** VER   DATE   BY       COMMENTS
** ---------------------------------------------------------------------
** 1.0  060298  Mukesh   Initial version
**
** 1.1  063098  Mukesh  Initialized local variables. Not Null unit ID
**                      check removed. select stmt made on coll_date
**                      plus insert_date
**
*/
/*
** this function calculates various lifetime counts on donations
*/

/*
** This procedure is the main function which will be called to update
** Donor records
*/

/*
** this function calculates various YTD counts on donations
*/

PROCEDURE DONOR_LAPTOP_UPDATE
 (P_FROM_DATE IN date
 ,P_TO_DATE IN date
 ,P_CHAPTER_ID IN varchar2
 );
FUNCTION DONOR_LIFE_COUNTS
 (P_WHAT IN varchar2
 ,SZDONORID IN donors.donor_id%type
 ,SZCHAPTERID IN donors.chapter_id%type
 )
 RETURN NUMBER;
FUNCTION DONOR_YTD_COUNT
 (P_WHAT IN varchar2
 ,SZDONORID IN donors.donor_id%type
 ,SZCHAPTERID IN donors.chapter_id%type
 )
 RETURN NUMBER;
END DON_LAPTOP_UPDT;

```
