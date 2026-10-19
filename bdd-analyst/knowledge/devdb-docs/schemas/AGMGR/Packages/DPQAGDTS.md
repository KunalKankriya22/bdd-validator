---
tags:
  - package
  - AGMGR
---
# DPQAGDTS

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE DPQAGDTS AS 

/*-----------------------------------------------------------------------------------
|| Author       : WellSky BC.
|| Description  : Used by query screen.
||              : 
|| Requirements : 
|| Call Syntax  :
|| Version
|| 01   07/23/2024  MLT-7054 - New pkg creation.
||------2024.1.0 Release version 01----------------------------------------------------------------------------
||  
*/-----------------------------------------------------------------------------------
    FUNCTION testgroup_disp_order(test_id_in IN VARCHAR2) RETURN NUMBER;
    FUNCTION test_disp_order(test_id_in IN VARCHAR2) RETURN NUMBER; 
    FUNCTION version_no RETURN VARCHAR2;

END DPQAGDTS;



```
