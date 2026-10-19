---
tags:
  - package
  - LTAPI
---
# LT_ROCHE_FILE_PARSING_ENGINE

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- UTL_FILE (SYNONYM in PUBLIC)

## Package Specification

```plsql
PACKAGE         "LT_ROCHE_FILE_PARSING_ENGINE" IS
  procedure add_log_entry(p_log_text in varchar2);
  procedure main_proc(file_name in varchar2,v_inst_id in varchar2,
                       pl_chapter_id in varchar2);
  procedure process;
  procedure readrecord;
  procedure get_column(txtline in varchar2, delimit in char,strt in number,
  endc in number,outcol out varchar2);
  procedure read_delimiter;
  procedure parse_read_record;
  procedure init_variables;
  procedure rollback_and_exit ;
  Function check_error_code (pl_err_result in varchar2) return boolean;

  temp_coll_date         DATE;
  field_delimiter        VARCHAR2(1);
  repeat_delimiter       VARCHAR2(1);
  logfile                UTL_FILE.FILE_TYPE;
  instfile               UTL_FILE.FILE_TYPE;
  LogDir                 VARCHAR2(100);
  logfilename            VARCHAR2(100);
  p_file_name            VARCHAR2(100);
  read_record            VARCHAR2(900);
  fetch_count            NUMBER:=0;
  complete               BOOLEAN:=false;
  process_date_time      VARCHAR2(25);
  v_test_id              VARCHAR2(10);
  v_machine_id           VARCHAR2(5);
  v_unit_id              VARCHAR2(20);
  well_number            VARCHAR2(4);
  result_status          VARCHAR2(4);
  testing_lab_code       VARCHAR2(2);
  v_chapter_id           VARCHAR2(4);
  od_value               VARCHAR2(10);
  result_file_name       VARCHAR2(50);
  record_count           NUMBER:=0;
  pos_res_count          NUMBER:=0;
  neg_res_count          NUMBER:=0;
  upload_count           NUMBER:=0;
  good_unit              BOOLEAN;
  err_msg                VARCHAR2(300);
  ncount                 NUMBER:=0;
  no_of_units            NUMBER:=0;
  g_local_time           DATE;
  p_chp_sys_date         DATE;
end LT_ROCHE_FILE_PARSING_ENGINE;

```
