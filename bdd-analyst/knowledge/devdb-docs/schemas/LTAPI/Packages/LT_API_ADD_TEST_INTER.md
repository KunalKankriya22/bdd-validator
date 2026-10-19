---
tags:
  - package
  - LTAPI
---
# LT_API_ADD_TEST_INTER

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- UTL_FILE (SYNONYM in PUBLIC)

## Package Specification

```plsql
PACKAGE       LT_API_ADD_TEST_INTER IS
/* ************************************************************
  This is an API to schedule any test or interdiction . The tests/interdictions
  should have been populated in the ADDTEST_API table.

  This interface pull the data from teh table and  upload into the LT tables.
  This is a generic interface.
  Stauts: C -> completed
          E -> Error
          H -> Hold (The unit is waiting to be checked in)

  Compatibility     time zone enabled (not for 4.6.x)

  Created By        : Basker Edwin S.
  Date Of Creation  : 06/27/2015
  Version           : 01 [06/7/15] - Edwin
                    : 02 [07/16/15] IM: 61, 62
                    : 03 [07/17/15] IM: 63,64
                    : 04 [07/23/15] IM:65
                    : 05 [08/04/15] LT 2015 (SCR:21571)
                    : 06 [08/19/15] IM: 68,69
                    : 07 [08/21/15] IM: 71, 72

  **********LT_2018 Version update ****

		    : 01 [05/11/16] - Seshu Renamed Below
                                       tables for merging database work
			             	RPT_PARM table as RPT_PARM_LAB
                    : 02 (11/20.17) Edwin , table name chnage

                    : 03 (08/07/18)  Edwin , chapter ID was added to the units query
                    : 04 (10/16/24)  - MLT 7207

*****************************************   */

  procedure add_log_entry(p_log_text in varchar2);
  procedure main_proc( pl_batch_id in varchar2,
                       pl_chapter_id in varchar2,
                       pl_upload_status out varchar2);

  Procedure process_records;
  procedure init_variables;
  procedure convert_unit_id(ok_status out varchar2) ;
  procedure update_rpt_parm;
  procedure rollback_and_exit ;
  procedure archive_processed_data(pl_ext_batch_id in varchar2);
  temp_coll_date         DATE;
  logfile                UTL_FILE.FILE_TYPE;
  instfile               UTL_FILE.FILE_TYPE;
  LogDir                 VARCHAR2(50);
  logfilename            VARCHAR2(50);
  p_file_name            VARCHAR2(50);
  read_record            VARCHAR2(500);
  fetch_count            NUMBER:=0;
  first_unit             BOOLEAN:=TRUE;
  process_date_time      VARCHAR2(25);
  v_test_id              VARCHAR2(10);
  v_unit_id              VARCHAR2(15);
  v_relabel_unit         VARCHAR2(15);
  codabar_unit_scheme    VARCHAR2(1);
  v_chapter_id           VARCHAR2(4);
  batch_created          BOOLEAN:=FALSE;
  test_created           BOOLEAN:=FALSE;
  record_count           NUMBER:=0;
  upload_count           NUMBER:=0;
  nHold_count            NUMBER:=0;
  --good_unit              BOOLEAN;
  err_msg                VARCHAR2(400);
  temp_test_id           VARCHAR2(20);
  ncount                 NUMBER:=0;
  no_of_units            NUMBER:=0;
  g_local_time           DATE;
  upload_status          VARCHAR2(1);
  p_chp_sys_date         DATE;
  upload_flag            VARCHAR2(1);
  g_batch_id             varchar2(50);
  C1_days                varchar2(3);
end LT_API_ADD_TEST_INTER;
```
