---
tags:
  - package
  - DONSYS
---
# DONOR_UPDATE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- [[schemas/DONSYS/Tables/DONORS|DONORS]] (TABLE)
- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE              "DONOR_UPDATE" IS
/*-----------------------------------------------------------------------
** VER   DATE   BY       COMMENTS
** ---------------------------------------------------------------------
** 1.0  060298  Mukesh   Initial version
**                       Updates the donor table for laptop fields
**                        based on range of donor IDs.
**
** 1.1  063098	Mukesh	Initialized local variables. Not Null unit ID
**			check removed.
**
** 1.1  051199	Mukesh	Updated for Credit counts
**------------------------------------------------------------------**/
/*
** this function calculates various lifetime counts on donations
*/
FUNCTION donor_life_counts
         (p_what      IN varchar2,
          szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type)
          RETURN NUMBER;
/*
** This procedure is the main function which will be called to update
** Donor records
*/
PROCEDURE donor_laptop_update
         (p_from_donor     IN VARCHAR2,
	  p_to_donor       IN VARCHAR2,
          p_chapter_id     IN VARCHAR2) ;
/*
** this function calculates various YTD counts on donations
*/
FUNCTION donor_ytd_count
         (p_what      IN varchar2,
          szDonorID   IN donors.donor_id%type,
          szChapterID IN donors.chapter_id%type)
          RETURN NUMBER;
END donor_update;

```
