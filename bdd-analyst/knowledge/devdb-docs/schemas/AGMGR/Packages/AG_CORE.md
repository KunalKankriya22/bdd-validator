---
tags:
  - package
  - AGMGR
---
# AG_CORE

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE AG_CORE AS 

/*-----------------------------------------------------------------------------------
|| Author       : WellSky BC.
|| Description  : Core pkg that deals with antigens. 
||              : Main Routine is start_job that calculates if an antigen is confirmed for a donor.
|| Requirements : 
|| Call Syntax  :AG_CORE.START_JOB
|| Version
|| 01   10/29/2023  New pkg creation.
|| 02   10/31/2023  MLT-6387 (Get UNITS SET issue)
|| 03   11/01/2023  MLT-6390 (3 units scenario - Formula corrected)      
|| 04   11/07/2023  MLT-6404  Multiple tests scenario - using source of truth as utrs.
||                            Handle cancelled tests by resetting antigen flag.  
||      11/14/2023  MLT-6404  Logging changes. Table renamed from _temp to _job_queue
||      11/20/2023  MLT-6404  handle_merged_donors added
|| 05   11/29/2023  MLT-6423  handle_attach_detach added.
||                            get_antigen_confirm_status parameter spec updated.
|| 06   12/07/2023  MLT-6437  
||                              6.0 Added lock/unlock for start_job.
||                              6.1 Use result code column, 
||                                  Use REAC, NREAC mastercodes, store + / - for result_code                                  
||                              6.2 Discard if results do not match with earlier results for all the scenarios
||                                  already confirmed, to be confirmed, or not yet confirmed.
||                                  Use Exclude_flag to exclude units from pkg evaluation.
||                              6.3 EDIT feature
|| 07   02/02/2024  MLT-6535    7.0 Using tz conversion for checking effective date , term date.
||                                  use table VALID_EXT_ANT_APPROVED_DET to check if test batch is 
||                                  configured to retreive license flag.
|| 08   02/13/2024  MLT-6593    8.0 recompute_antigen_status added.            
|| 09   03/26/2024  MLT-6451    9.0 Populating chapter_id in ag_donor_tests_det table (used for AGRDISCR report)
|| Add logging for handle_merged_donors and handle_attach_Detach_units
|| 10   05/14/2024  MLT-6276    10.0 handle_hist_antigens routine added.
|| 11   06/05/2024  MLT-6904    11  MLT-6904 - Lic flag moved to test_kits level instead of reagents level
||                                  MLT-6904 - antigen_group soored at ag_donor_tests_det table        
|| 12   07/18/2024  MLT-7011    12  Use chapter id from utrs instead of chapter id from valid_ext_ant_approved_det table.
||------2024.1.0 Release version 12----------------------------------------------------------------------------
||  
*/-----------------------------------------------------------------------------------

    PROCEDURE START_JOB;
    PROCEDURE handle_merged_donors(primary_donor_in     IN VARCHAR2, 
                                   secondary_donor_in   IN VARCHAR2) ; 
    PROCEDURE handle_attach_detach_units(unit_id_in     IN VARCHAR2,
                                         donor_id_in    IN VARCHAR2,
                                         ad_flag_in     IN VARCHAR2);
    PROCEDURE recompute_antigen_status (donor_id_in IN VARCHAR2, antigen_code_in IN VARCHAR2);
    PROCEDURE recompute_antigen_status (donor_id_in IN VARCHAR2, antigen_code_in IN VARCHAR2, program_id_IN in VARCHAR2);
    FUNCTION get_test_ag_group (test_id_in IN VARCHAR2) RETURN VARCHAR2;

    PROCEDURE handle_hist_antigens(start_date_in        IN DATE, 
                                   end_date_in          IN DATE,
                                   increment_months_in  IN NUMBER,
                                   status_out           OUT VARCHAR2);

    FUNCTION version_no RETURN VARCHAR2;
END AG_CORE;







```
