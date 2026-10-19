---
tags:
  - package
  - DONSYS
---
# DON_TBV

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE DON_TBV IS

/* ---------------- Version History--------------------------------------------------------------------------

Modified By         Ver          Date            Comments
===============================================================================================================

B. Edwin             01          01/18/19        Original version created to calculate the total blood volume
B. Edwin             02          06/02/19        To add another call for invoking the package without donor ID
Ashok                03          10/03/19        calc_donor_tbv modified.
B. Edwin             04          03/17/20        Sending out the formated TBV [MLT- 3118]
B. Edwin             05          04/29/20       LTrim was applied to the T_TBV final value
------------------------------------------------------------------------------------------------ ------------ */

PROCEDURE CALC_DONOR_TBV    (pl_donor_id   in varchar2,
                             pl_chapter_id in varchar2,
                             pl_donor_ht   in varchar2,
                             pl_donor_wt   in varchar2,
                             pl_donor_sex  in varchar2,
                             pl_TBV        out varchar2);
/*
PROCEDURE CALC_DONOR_TBV
     (
           pl_donor_id     in varchar2,
           pl_chapter_id   in varchar2,
           pl_TBV          out varchar2
      );

PROCEDURE CALC_DONOR_TBV_OPT2
     (
           pl_donor_ht     in varchar2,
           pl_donor_wt     in varchar2,
           pl_donor_sex    in varchar2,
           pl_chapter_id   in varchar2,
           pl_TBV          out varchar2
      );

*/
PROCEDURE FIND_TBV (pl_ht in varchar2,
                   pl_wt in varchar2,
                   pl_sex in varchar2,
                   pl_chapter in varchar2,
                   pl_TOT_BLOOD out number);


temp_ht        varchar2(10);
temp_weight    number:=0;
temp_gender      varchar2(1);
pl_TOT_BLOOD_VOL  number:=0;


END DON_TBV;
```
