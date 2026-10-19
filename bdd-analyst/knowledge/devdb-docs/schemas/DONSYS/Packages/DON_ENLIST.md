---
tags:
  - package
  - DONSYS
---
# DON_ENLIST

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE don_enlist IS
/*
** this is the donor enlistment package. most of the functionality
** required is stored in this package and i have tried to modularize
** the code as much as possible, but then this is going to take some time.
**
** Ver   Date   By    Comments
** -----------------------------------------------------------------------
** 1.0  081297  RAJ  Initial version
** 2.0  041511  Hus  replace user by lt_sesseion_user.get_userid
** 3.0  020712  Edwin fixing the chapter issue.
** 4.0  030512 Edwin -fixing the NEXT_LIST_ID function to include the timezone
*/

   -- this procedure will initialize some variables, PLSQL table etc to start
   -- working.
   PROCEDURE init_enlist (p_chapter_id varchar2) ;

   -- use this procedure to interrupt the list
   procedure InterruptList(p_list_id VARCHAR2);

   procedure RUN_NEXT_LIST( p_status out varchar2);

   procedure add_log_entry(p_log_type varchar2,
                           p_log_text varchar2);
   procedure randomize_list( p_list_id varchar2,
                            p_max_donors number,
                            p_total_donors out number);

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

END DON_ENLIST;
```
