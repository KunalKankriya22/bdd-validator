---
tags:
  - package
  - DONSYS
---
# DON_ELIG

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE DON_ELIG IS
/*
** This is the eligibility server designed for donor enlistment
** This package provides function overloading, which lets user
** call one function in various ways, with consistant functionality.
**
** This package also performs profiling, and records timings
** Most of the functions can also be called from other places
** to check eligibility, but additional functions available in
** this package are useful mainly to do eligibility check on a large
** number of donors at a time.
**
** Ver  Date   By  Comments
** --------------------------------------------------------------------
** 1.0  072897 RAJ Initial version
**
*/
   PROCEDURE check_list_eligibility (szListID    IN  VARCHAR2,  -- List id
                                     szSource    IN  VARCHAR2,
                                     bIncTemp    IN  BOOLEAN,   -- SPOOL/DONLIST
                                     nAllDonors  OUT NUMBER,
                                     nEligCount  OUT NUMBER);
   PROCEDURE check_list_eligibility (szListID    IN  VARCHAR2,  -- List id
                                     szSource    IN  VARCHAR2,  -- SPOOL/DONLIST
                                     bIncTemp    IN  BOOLEAN,
                                     szProcCode  IN  VARCHAR2,  -- proc code
                                     szDonType   IN  VARCHAR2,  -- don type
                                     nAllDonors  OUT NUMBER,
                                     nEligCount  OUT NUMBER);
   PROCEDURE check_list_eligibility (szListID    IN  VARCHAR2,  -- List id
                                     szSource    IN  VARCHAR2,  -- SPOOL/DONLIST
                                     bIncTemp    IN  BOOLEAN,
                                     szProcCode  IN  VARCHAR2,  -- proc code
                                     szDonType   IN  VARCHAR2,  -- don type
                                     szCollDate  IN  DATE,      -- target date
                                     nAllDonors  OUT NUMBER,
                                     nEligCount  OUT NUMBER);
   /*
   ** use following procedure to set chapter id
   */
   PROCEDURE set_chapter (szChapterID VARCHAR2);
PRAGMA RESTRICT_REFERENCES (set_chapter, WNDS);
END DON_ELIG;

```
