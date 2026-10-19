---
tags:
  - package
  - UTIL
---
# EMF_UTIL

**Schema**: [[schemas/UTIL/UTIL|UTIL]]

## Dependencies

- [[schemas/UTIL/Tables/EMF_SOURCE_PROCESS|EMF_SOURCE_PROCESS]] (TABLE)
- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE emf_util IS
/*-----------------------------------------------------------------------------
PACKAGE		:	emf_util
PURPOSE   	:	Enhanced Manufacturing Utilities
DEVELOPER 	:	Ashok
DEV. DATE 	:	23 Jan 2018
NOTES     	:	Initial version.
Ver       	:	01

Modification History
-------------------------------------------------------------------------------
Modified by		on  		Version	Remarks
-------------------------------------------------------------------------------
Ashok           04/22/2020  02 - Check for process code eff_date and term_date (V02) 
Ashok           09/09/2025  03 - Allow removal of unit interdiction without a source test id.. (V03) (MLT-8184 - 2022R4 and 2026R1)
-----------------------------------------------------------------------------*/
  -- Session tables to store process responses.
  TYPE resp_aat IS TABLE OF emf_source_process.response%TYPE INDEX BY VARCHAR2(10);
  TYPE proc_resp_aat IS TABLE OF resp_aat INDEX BY VARCHAR2(100);
  proc_resp_aa proc_resp_aat;
  ----
  TYPE sql_stmt_aat IS TABLE OF emf_source_process.sql_stmt%TYPE INDEX BY PLS_INTEGER;
  TYPE proc_sql_aat IS TABLE OF sql_stmt_aat INDEX BY VARCHAR2(10);
  proc_sql_aa proc_sql_aat;

  TYPE sqlOut_aat IS TABLE OF emf_source_process.sql_out%TYPE INDEX BY PLS_INTEGER;
  TYPE proc_sqlOut_aat IS TABLE OF sqlOut_aat INDEX BY VARCHAR2(10);
  proc_sqlOut_aa proc_sqlOut_aat;

  -- AAT to keep track of process codes that needs to have the responses cached
  -- could be an initial load or when respones are changed.
  -- Use the loaded_ arrays to keep track of whcih one to load (TRUE - loaded, FALSE - reload again). 
  -- once loaded, it will be marked to TRUE.
  TYPE loaded_resp_aat IS TABLE OF BOOLEAN INDEX BY emf_source_process.process_code%TYPE;
  loaded_responses loaded_resp_aat;
  TYPE loaded_sql_aat IS TABLE OF BOOLEAN INDEX BY emf_source_process.process_code%TYPE;
  loaded_sqls loaded_sql_aat;

  -- table of strings passed as parameters.
  TYPE strings_t IS TABLE OF VARCHAR2(2000);

  -- table of placeholders (pulled from the query)
  TYPE placeholder_aat IS TABLE OF VARCHAR2(100) INDEX BY PLS_INTEGER;
  placeholders placeholder_aat;
  --
  TYPE typ_sql_tab IS TABLE OF VARCHAR2(200) INDEX BY PLS_INTEGER;

  TYPE typ_nest_tab IS TABLE OF typ_sql_tab INDEX BY PLS_INTEGER;

  PROCEDURE tab_metadata(sql_in IN VARCHAR2, nest_tab IN OUT typ_nest_tab);
  ---------------------

  PROCEDURE RECHECK_DONOR;

  PROCEDURE run_process(name_in        IN VARCHAR2,
                        action_in      IN VARCHAR2,
                        actionSeq_in   IN VARCHAR2,
                        bind_values_in IN strings_t);

  PROCEDURE clear_process_cache(name_in IN VARCHAR2);

  PROCEDURE write_to_screen(flag_in IN BOOLEAN);
  PROCEDURE write_to_file(dir_in IN VARCHAR2, file_in IN VARCHAR2);

  PROCEDURE generate_sql(name_in IN VARCHAR2);

  PROCEDURE run_target_process;

  PROCEDURE staging_insert(tblName_in  IN VARCHAR2,
                           audKey_in   IN VARCHAR2,
                           srcFnc_in   IN VARCHAR2,
                           srcAppl_in  IN VARCHAR2,
                           pgm_in      IN VARCHAR2,
                           modeFlag_in IN VARCHAR2);

  FUNCTION utrs_test_result(p_unit_id IN VARCHAR2,
                            p_test_id IN VARCHAR2,
                            p_chp_id  IN VARCHAR2) RETURN VARCHAR2;                         
END emf_util;


```
