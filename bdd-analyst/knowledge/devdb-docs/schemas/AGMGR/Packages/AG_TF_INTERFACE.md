---
tags:
  - package
  - AGMGR
---
# AG_TF_INTERFACE

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE AG_TF_INTERFACE AS 

/*-----------------------------------------------------------------------------------
|| Author       : WellSky BC.
|| Description  : Core pkg that deals with tietag labels
||              : 
|| Requirements : 
|| Call Syntax  :
|| Version
|| 01   07/11/2024  MLT-6995 - New pkg creation.
|| 02   07/30/2024  MLT-7060
||------2024.1.0 Release version 02----------------------------------------------------------------------------
||
*/-----------------------------------------------------------------------------------

    PROCEDURE process_tf_api(job_id_in      IN NUMBER DEFAULT NULL,
                             start_date_in  IN DATE DEFAULT NULL, 
                             end_date_in    IN DATE DEFAULT NULL) ;

    FUNCTION version_no RETURN VARCHAR2;

END AG_TF_INTERFACE;


```
