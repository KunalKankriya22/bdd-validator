---
tags:
  - package
  - LTAPI
---
# LT_API_INST_INTERFACE

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- UTL_FILE (SYNONYM in PUBLIC)

## Package Specification

```plsql
PACKAGE   "LT_API_INST_INTERFACE" IS

/* ************************************************************
  This is an interface engine for the Instrument Test results. The instrument
  interface test result API tables should have been populated by
  the Customer or by external application. This interface will read the
   results from the table and upload into the LT tables.
   This is a generic interface.

  Compatibility     Oralce 11g/12C

  Created By        : Basker Edwin
  Date Of Creation  : 11/05/2012
  Version           : 01 [11/05/12] - Edwin
                    : 02 [02/28/14] - Edwin SCR: 20357, 20358  4.6.2_R3
                    : 03 [03/04/14] - Edwin IM: 9930
                    : 04 [04/14/14] - do not hardcode the flag charater 00
                    : 05 [05/14/14] - SCR: 20608 , By: Edwin
                    : 06 [07/01/15] - Added code to display debug messages
                                     based on values in the DEBUG_CONTROLS table

                   Reseting it to 01 for LT 2018

                   :  01 [10/10/16]
                   :  02 [03/29/17]  IM: 507, adding eff and term date in the
                                     TEST_SCH cursor
                   :  03 [10/08/24]  MLT-7225

  ***************************************************************   */

  procedure add_log_entry(p_log_text in varchar2);
  procedure main_proc(file_name in varchar2,v_inst_id in varchar2,
                       pl_chapter_id in varchar2,
                       pl_upload_status out varchar2);

  Procedure process_and_upload (pl_inst_id in varchar2,
                                pl_file_name in varchar2);

  Procedure upload_test_results (pl_test_id     in varchar2,
                               pl_result_code in varchar2,
                               pl_well_number in varchar2,
                               pl_ratio       in varchar2,
                               pl_abs_value   in varchar2,
                               pl_tb_id       in varchar2,
                               pl_result_date in date,
                               pl_error_status out varchar2);

  Procedure insert_test_batch_det (p_tb_id in varchar2,
                                 p_test_id in varchar2,
                                 p_cut_off in varchar2,
                                 p_kit_lot in varchar2) ;

  Procedure gen_test_batch_id;
  procedure init_variables;
  procedure update_batch_information;
  procedure insert_instrument_log (pl_test_id in varchar2);
  procedure convert_unit_id(ok_status out varchar2) ;
  procedure update_rpt_parm;
  procedure rollback_and_exit ;
  procedure update_api_inst_upload;
  procedure archive_processed_data;
  temp_max_test_seq_no   NUMBER:=0;
  temp_coll_date         DATE;
  field_delimiter        VARCHAR2(1);
  repeat_delimiter       VARCHAR2(1);
  component_delimiter    VARCHAR2(1);
  last_unit              VARCHAR2(15);
  logfile                UTL_FILE.FILE_TYPE;
  instfile               UTL_FILE.FILE_TYPE;
  LogDir                 VARCHAR2(50);
  logfilename            VARCHAR2(50);
  p_file_name            VARCHAR2(50);
  read_record            VARCHAR2(500);
  fetch_count            NUMBER:=0;
  first_unit             BOOLEAN:=TRUE;
  testing_lab_code       VARCHAR2(2);
  plate_id               VARCHAR2(10);
  v_tb_id                VARCHAR2(64);
  well_count             NUMBER:=0;
  process_date_time      VARCHAR2(25);
  v_test_id              VARCHAR2(10);
  cut_off                VARCHAR2(10);
  kit_lot                VARCHAR2(30);
  v_machine_id           VARCHAR2(5);
  v_unit_id              VARCHAR2(15);
  well_number            VARCHAR2(4);
  result_status          VARCHAR2(4);
  negative_result        VARCHAR2(4);
  reactive_result        VARCHAR2(4);
  ratio                  VARCHAR2(20);
  codabar_unit_scheme    VARCHAR2(1);
  v_chapter_id           VARCHAR2(4);
  od_value               VARCHAR2(10);
  batch_created          BOOLEAN:=FALSE;
  test_created           BOOLEAN:=FALSE;
  well_type              VARCHAR2(1);
  result_file_name       VARCHAR2(30);
  record_count           NUMBER:=0;
  pos_res_count          NUMBER:=0;
  neg_res_count          NUMBER:=0;
  upload_count           NUMBER:=0;
  --good_unit              BOOLEAN;
  err_msg                VARCHAR2(300);
  temp_test_id           VARCHAR2(20);
  ncount                 NUMBER:=0;
  no_of_units            NUMBER:=0;
  g_local_time           DATE;
  p_chp_sys_date         DATE;
  upload_flag            VARCHAR2(1);
  t_is_debug_msg_displayed BOOLEAN; -- Added by Kishore on 07/01/2015

end LT_API_INST_INTERFACE;
```
