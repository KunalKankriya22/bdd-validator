---
tags:
  - package
  - DONSYS
---
# ONSITE_HH

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "ONSITE_HH" is

  -- Author  : ASHOKV
  -- Created : 4/9/2019 9:36:01 AM
  -- Purpose : Health History and Physical Finding routines.
  -- Version :
  -- 01 : New version created.  
  -- 02 : template_id added.
  -- 03 : MLT 2400 (Set all questions as exception if donor going to HH directly skipping DR)
  -- 04 : 08/01/2019 -- treat all questions with screener ask flag null as exceptions.
  -- 05 : 09/20/2019 -- new colum - PARENT_RESP_FLAG changes.
  -- 06 : 10/14/2020 -- MLT 3730 (search for V06)
  /* 
  This routine is called from ONSITE web app (complete form button)
  Commit logic moved from oracle forms to database.
  Inputs: transaction id, screener id (user id), program calling this routine
  Output:  Returns - 'P', 'T' or 'OK'
  'P' - Based on the Physical Findings responses, the donor is deferred Permanently
  'T' - Based on the Physical Findings responses, the donor is deferred Temporarly
  'OK' - no interdictions, committed to database.
  */  

  procedure generate_questions (p_session_id in varchar2,
                                p_transaction_id in varchar2,
                                p_screener_id    in varchar2,
                                p_prog_name      in varchar2,
                                p_abbr_flag      out varchar2, -- A or F
                                p_hh_comp_flag        out varchar2,
                                p_status         out varchar2);

end ONSITE_HH;


```
