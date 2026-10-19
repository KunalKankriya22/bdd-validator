---
tags:
  - package
  - DONSYS
---
# ONSITE_HHPF

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
package ONSITE_HHPF is

  -- Author  : ASHOKV
  -- Created : 4/9/2019 9:36:01 AM
  -- Purpose : Health History and Physical Finding routines.
  -- Version :
  -- 01 : New version created.  PF_COMMIT routine added.
  -- 02 : PF_COMMIT routine modified to add reason out parameter.
  -- 03 : PF_PLACE_REMOVE_INTERDICTION modified: terminateOVRDF code added
  -- 04 : pf_commit_v02 (obselete) removed.  pf_pending_commit routine added.
  -- 05 : place_pf_interdictions routine added.

  /* called from ONSITE Physical Findings - pending button. 
    This routine places interdictions based on PF values */
  Procedure pf_pending_commit(p_transaction_id in varchar2,
                              p_screener_id    in varchar2,
                              p_prog_name      in varchar2,
                              p_status         out varchar2,
                              p_reason         out varchar2);

  /* 
  This routine is called from ONSITE web app (complete form button)
  Commit logic moved from oracle forms to database.
  Inputs: transaction id, screener id (user id), program calling this routine
  Output:  Returns - 'P', 'T' or 'OK'
  'P' - Based on the Physical Findings responses, the donor is deferred Permanently
  'T' - Based on the Physical Findings responses, the donor is deferred Temporarly
  'OK' - no interdictions, committed to database.
  */                                
  Procedure pf_commit(p_transaction_id in varchar2,
                          p_screener_id    in varchar2,
                          p_prog_name      in varchar2,
                          p_status         out varchar2,
                          p_reason         out varchar2);                      

 PROCEDURE pf_place_remove_interdiction( p_transaction_id in varchar2,
                                          p_screener_id    in varchar2,
                                          p_prog_name      in varchar2,
                                          p_physical_code  in varchar2,
                                          p_place_remove   in varchar2,
                                          p_status         out varchar2);

 /* called from DETACH screen */   
 Procedure place_pf_interdictions(  p_transaction_id in varchar2,
                                    p_prog_name      in varchar2,
                                    p_status         out varchar2);

end ONSITE_HHPF;


```
