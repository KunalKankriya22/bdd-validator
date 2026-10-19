---
tags:
  - package
  - AGMGR
---
# AG_LBL

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- [[schemas/AGMGR/Tables/VALID_ANTIGEN_DS_DET|VALID_ANTIGEN_DS_DET]] (TABLE)

## Package Specification

```plsql
PACKAGE AG_LBL AS 

/*-----------------------------------------------------------------------------------
|| Author       : WellSky BC.
|| Description  : Core pkg that deals with labeling of antigens 
||              : 
|| Requirements : 
|| Call Syntax  :AG_CORE.START_JOB
|| Version
|| 01   03/15/2024  MLT-6671 - New pkg creation.
|| 02   08/01/2024  MLT-7096 - get_eye_readable_string routine added.
|| 03   08/06/2024  MLT-7063 - Added distinct to utrs query for get pos 17 tests.
||------2024.1.0 Release version 03----------------------------------------------------------------------------
*/-----------------------------------------------------------------------------------
    -- used in init. Indicates that the global variables are populated.
    -- global variables are used for caching.
    gb_initialized          BOOLEAN := FALSE;

    -- used in LABELI screen as well to send the test results as array.
    TYPE test_results_aat IS TABLE OF VARCHAR2(5) INDEX BY VARCHAR2(10);    

    TYPE strings_ntt IS TABLE OF VARCHAR2(10);

    TYPE rcvs_aat IS TABLE OF NUMBER INDEX BY VARCHAR2(10);
    TYPE rc_aat IS TABLE OF rcvs_aat INDEX BY VARCHAR2(10);

    TYPE result_strings_aat IS TABLE OF VARCHAR2(20) INDEX BY PLS_INTEGER;

    TYPE ds_det_rec IS RECORD(
      test_ids      VALID_ANTIGEN_DS_DET.test_ids%TYPE,
      pos_no        VALID_ANTIGEN_DS_DET.pos_no%TYPE,
      pos_length    VALID_ANTIGEN_DS_DET.pos_length%TYPE,
      rc_id         VALID_ANTIGEN_DS_DET.rc_id%TYPE,
      group_flag    VALID_ANTIGEN_DS_DET.group_flag%TYPE
      );
    TYPE ds_det_aat IS TABLE OF ds_det_rec INDEX BY PLS_INTEGER;       

    /*
        Input parameters:
            test_results_in     -> Test results list: arr('K') = '+'; arr('k') = '-';
            content_string_out  -> DS012 DS: <DataIdentifier><DataContent><checkdigit>
            status_out          -> 'OK' or any error.

        Usage: Called from LABELI screen.    
    */

    PROCEDURE get_data_content_string(
        test_results_aa_in  IN ag_lbl.test_results_aat,
        content_string_out  OUT VARCHAR2,
        status_out          OUT VARCHAR2
        );

    /*
        Input parameters:
            test_results_in     -> <test_id, result_code> format :  C,+,e-,E+
            content_string_out  -> DS012 DS: <DataIdentifier><DataContent>
            status_out          -> 'OK' or any error.

        Usage: Called from a test script only .  
    */
    PROCEDURE get_data_content_string(
        test_results_in     IN VARCHAR2,
        content_string_out  OUT VARCHAR2,
        status_out          OUT VARCHAR2
        );


    FUNCTION csv_to_list(csv_string_in IN VARCHAR2)
        RETURN ag_lbl.strings_ntt;        

    PROCEDURE get_eye_readable_string(
        unit_id_in                  IN VARCHAR2,
        selected_tests_csv_in       IN VARCHAR2,
        barcode_string_in           IN VARCHAR2,
        eye_readable_out            OUT VARCHAR2,
        special_eye_readable_out    OUT VARCHAR2,
        status_out                  OUT VARCHAR2
    );    

    FUNCTION version_no RETURN VARCHAR2;

END AG_LBL;


```
