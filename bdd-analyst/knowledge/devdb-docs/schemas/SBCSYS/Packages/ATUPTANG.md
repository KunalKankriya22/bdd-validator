---
tags:
  - package
  - SBCSYS
---
# ATUPTANG

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- UTL_FILE (SYNONYM in PUBLIC)

## Package Specification

```plsql
PACKAGE          "ATUPTANG" IS
  procedure add_log_entry(p_log_text in varchar2);
  procedure main_proc(file_name in varchar2,v_inst_id in varchar2,
                       pl_chapter_id in varchar2);
  procedure process;
  procedure readrecord;
  procedure get_column(txtline in varchar2, delimit in char,strt in number,
  endc in number,outcol out varchar2);
  procedure read_header_record;
  procedure read_order_record;
  procedure read_result_record;
  procedure read_comment_record;
  procedure init_variables;
  procedure update_batch_hdr;
  procedure update_batch_det;
  procedure insert_instrument_log;
  procedure convert_unit_id(ok_status out varchar2) ;
  procedure update_rpt_parm;
  procedure rollback_and_exit ;
  function  is_batch_updated(p_test_id in varchar2) return boolean;
  procedure create_batch_id;

  temp_max_test_seq_no   NUMBER:=0;
  temp_coll_date         DATE;
  field_delimiter        VARCHAR2(1);
  repeat_delimiter       VARCHAR2(1);
  component_delimiter    VARCHAR2(1);
  last_unit              VARCHAR2(15);
  escape_delimiter       VARCHAR2(1);
  logfile                UTL_FILE.FILE_TYPE;
  instfile               UTL_FILE.FILE_TYPE;
  LogDir                 VARCHAR2(50);
  logfilename            VARCHAR2(50);
  p_file_name            VARCHAR2(50);
  read_record            VARCHAR2(500);
  fetch_count            NUMBER:=0;
  complete               BOOLEAN:=false;
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
  ratio                  VARCHAR2(7);
  codabar_unit_scheme    VARCHAR2(1);
  testing_lab_code       VARCHAR2(2);
  v_chapter_id           VARCHAR2(4);
  od_value               VARCHAR2(10);
  first_unit             BOOLEAN:=TRUE;
  batch_created          BOOLEAN:=FALSE;
  test_created           BOOLEAN:=FALSE;
  well_type              VARCHAR2(1);
  result_file_name       VARCHAR2(30);
  record_count           NUMBER:=0;
  pos_res_count          NUMBER:=0;
  neg_res_count          NUMBER:=0;
  upload_count           NUMBER:=0;
  good_unit              BOOLEAN;
  err_msg                VARCHAR2(300);
  temp_test_id           VARCHAR2(20);
  ncount                 NUMBER:=0;
  no_of_units            NUMBER:=0;
  header_read            VARCHAR2(1);
  pat_read               VARCHAR2(1);
  order_read             VARCHAR2(1);
  result_read            VARCHAR2(1);
  comment_read           VARCHAR2(1);
  line_read              VARCHAR2(1);
  szLastType             VARCHAR2(1);
  order_test_id          VARCHAR2(10);
  result_test_id         VARCHAR2(10);
  temp_ABO_result        VARCHAR2(10);
  temp_RH_result         VARCHAR2(10);
  RH_read                VARCHAR2(1);
  ABO_read               VARCHAR2(1);
  global_test_id         VARCHAR2(15);
  idx                    NUMBER:=0;
  hdr_created            VARCHAR2(1):='N';
  type resrectype is record (unit_id varchar2(15),
			     test_id varchar2(15),
			     result_code1 varchar2(15),
			     result_code2 varchar2(15),
			     result_code3  varchar2(15));
  type restabtype is table of resrectype index by binary_integer;
  plresults restabtype;

  type remrectyp is record ( unit_id varchar2(15),
		             test_id varchar2(10),
		             rmks varchar2(200));
  type remtabtyp is table of remrectyp index by binary_integer ;
  plremarks remtabtyp;
  type testrectyp is record (test_id varchar2(10));
  type testtabtyp is table of testrectyp index by binary_integer;
  pltests testtabtyp;
  type comrectyp is record ( unit_id varchar2(15),
	                     test_id varchar2(10));
  type comtabtyp is table of comrectyp index by binary_integer ;
  plcomments comtabtyp;
  plcomments_idx NUMBER:=0;
  rmcount   NUMBER:=0;
  valid_result_record     VARCHAR2(1);
  nLines                   NUMBER:=0;
  nresRead                 NUMBER:=0;
  r_test_id                VARCHAR2(25);
  c_status                 VARCHAR2(300);
  g_local_time             DATE;
  p_chp_sys_date           DATE;

end ATUPTANG;
```
