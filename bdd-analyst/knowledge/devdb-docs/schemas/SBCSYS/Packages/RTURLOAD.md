---
tags:
  - package
  - SBCSYS
---
# RTURLOAD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- UTL_FILE (SYNONYM in PUBLIC)

## Package Specification

```plsql
PACKAGE RTURLOAD IS


  procedure rollback_and_exit (pl_err_msg in varchar2);
  Procedure f_validate_chapter_id(p_chapter_id in varchar2) ;
  procedure  f_validate_test(p_test_id in varchar2);
  Procedure f_interpret_results(p_test_id in varchar2);
  Procedure f_update_batch_info(p_tb_id in varchar2,p_chapter_id in varchar2,
                              p_test_id in varchar2,p_unit_id in varchar2) ;

  Procedure f_instr_log(p_tb_id in varchar2, p_test_id in varchar2);
  Procedure f_reagent_info (p_test_id in varchar2,
                          p_chapter_id in varchar2);
  -- Added "p_chapter_id" to the call to the below "f_get_batch_id" function. Added by Kishore on 07/26/2011
  Function f_get_batch_id(p_chapter_id in varchar2,
                          p_test_id in varchar2) return Number;
  procedure translate_result_code(p_test_id     in  varchar2,
                                 p_result_code in  varchar2,
                                 p_lt_code     out varchar2);
  PROCEDURE MAIN_PROC (p_file_name in varchar2,inp_ppid in varchar2);
  procedure f_init_variables;
  procedure f_process;
  procedure f_copy_results_data;
  procedure f_get_userid(p_user_id in varchar2);
  procedure f_windup;
  Procedure f_upd_batch_seqno(p_sl_no in number,p_chapter in varchar2);
  PROCEDURE f_ins_parmid;
  procedure f_validate_unit(p_unit_id in varchar2);
  PROCEDURE add_error_log(pl_log_text in varchar2);
  Procedure f_copy_test_results(p_test_id in varchar2);
  Procedure f_detail(p_file_name in varchar2,p_chapter_id in varchar2);
  Procedure f_update_hdr_tables(p_tb_id in varchar2,p_chapter_id in varchar2,
                              p_test_id in varchar2);
  Procedure schedule_test(p_test_id in varchar2,p_unit_id in varchar2,
                          p_out_status out varchar2);

  g_rowid               VARCHAR2(18);
  logptr                UTL_FILE.FILE_TYPE;
  inpptr                UTL_FILE.FILE_TYPE;
  xmt_status            VARCHAR2(20);
  log_file_name         VARCHAR2(100);
  curr_time             VARCHAR2(50);
  act_file_name         VARCHAR2(100);
  g_file_name           VARCHAR2(100);
  g_parm_id             VARCHAR2(20);
  load_user_id          VARCHAR2(30);
  first_unit            NUMBER:= 1;
  slno                  VARCHAR2(5);
  unit_id               VARCHAR2(15);
  result_status         VARCHAR2(5);
  skip_cnt              NUMBER:= 0;
  prob_cnt              NUMBER:= 0;
  test_recs_read        NUMBER:= 0;
  user_id               VARCHAR2(30);
  testing_lab_code      VARCHAR2(2);
  rec_type1             VARCHAR2(4);
  g_chapter_id          VARCHAR2(5);
  od_rep_flag           VARCHAR2(2);
  chapter_name          VARCHAR2(50);
  logDir                VARCHAR2(100);
  gContract             VARCHAR2(15);
  g_file_type           VARCHAR2(1);
  end_aborh_batch_id    VARCHAR2(15);
  start_aborh_batch_id  VARCHAR2(15);
  start_batch_id        VARCHAR2(15);
  end_batch_id          VARCHAR2(15);
  curr_slno             NUMBER:=0;
  abs_value             VARCHAR2(10);
  test_batch_id         VARCHAR2(15);
  aborh_batch_size      INTEGER;
  alt_e_level           NUMBER:=0.0;
  alt_se_level          NUMBER:=0.0;
  recs_read_cnt         NUMBER:=0;
  test_id               VARCHAR2(15);
  test_seq              VARCHAR2(1);
  final_result_code     VARCHAR2(5);
  test_result_code1     VARCHAR2(5);
  od_value_1            VARCHAR2(15);
  od_value_2            VARCHAR2(15);
  od_value_3            VARCHAR2(15);
  FINAL_RESULT          NUMBER:=0;
  TEST_INVALID          NUMBER:=0;
  first_aborh_unit      NUMBER:=1;
  aborh_batch_count     NUMBER:=0;
  TRAILOR_NOTFOUND      BOOLEAN:=FALSE;
  p_status              VARCHAR2(240);
  time_stamp            VARCHAR2(25);
  SKIP_TEST_RECS        NUMBER:=0;
  batch_id              VARCHAR2(15);
  skip_record           EXCEPTION;
  batch_count           VARCHAR2(7);
  load_cnt              NUMBER:=0;
  last_unit_id          VARCHAR2(15);
  test_batch_count      NUMBER:=0;
  file_count            VARCHAR2(7);
  g_test_kit_id         VARCHAR2(15);
  muser_id              VARCHAR2(18);
  remote_test_id        VARCHAR2(10);
  lt_test_id            VARCHAR2(10);
  nTestCount            NUMBER:=0;
  lt_result             VARCHAR2(10);
  temp_string           VARCHAR2(200);
  v_local_sysdate       DATE;
  t_is_debug_msg_displayed BOOLEAN; -- Added by Kishore on 06/26/2015
END RTURLOAD;
```
