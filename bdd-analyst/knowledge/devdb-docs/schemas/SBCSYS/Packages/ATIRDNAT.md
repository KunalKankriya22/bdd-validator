---
tags:
  - package
  - SBCSYS
---
# ATIRDNAT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- UTL_FILE (SYNONYM in PUBLIC)

## Package Specification

```plsql
PACKAGE          "ATIRDNAT" IS

/*  This is NAT
--  Created By        : Hussein Abbas
--  Date Of Creation  : 03/13/12
--  Version           : 01
                      : 02  IM: 8438 Edwin-04/20/12  */

procedure main_proc(file_name in varchar2, v_inst_id in varchar2,
                     p_chapter_id in varchar2);
function f_check_duplicate RETURN BOOLEAN;
procedure f_process;
procedure f_generate_batch_id;
procedure f_insert_nat_data;
procedure f_insert_test_batch_hdr;
procedure f_update_last_unit_id;
procedure f_insert_test_batch_det;
procedure f_insert_instrument_log;
procedure f_process_detail;
procedure f_process_test;
function f_validate_test return boolean;
function f_validate_result return boolean;
procedure f_get_codabar_scheme;
procedure f_init_variables;
procedure f_windup;
procedure check_error_1(p_module_name  in varchar2,
			                  p_statement_id in varchar2,
			                  p_error_key    in varchar2,
			                  p_error_desc   in varchar2);
PROCEDURE f_ins_parmid;
PROCEDURE rollback_and_exit;
-------------------
program_version varchar2(5) := '01';
----char *program_version = "01";
err_key varchar2(70);
sql_code number;
err number;
sql_msg varchar2(500);
uid varchar2(6);
result_file_name varchar2(300);
curr_time varchar2(18);
log_file_name varchar2(500);
parm_id varchar2(200);
v_machine_id varchar2(6);
inp_ppid varchar2(50);
temp_unit_id varchar2(16);
--rowid char(18);
arr_eye_read_trns VARCHAR2(500);
Selection char(2);
complete boolean :=false;
read_record varchar2(1000);
uid_length int;
lab_code VARchar2(10);
test_batch_id VARCHAR2(100);
xmt_status char(2);
v_chapter_id varchar2(4);
codabar_unit_scheme VARchar2(50);
machine_code_char char(5);
test_code VARchar2(5);
unit_id varchar2(15);
tempisbt varchar2(5);
misc_fld varchar2(6);
v_test_id varchar2(15);
Prevtest_id varchar2(15);
master_test_id varchar2(15);
result_status_desc varchar2(50);
result_status varchar2(5);
test_date varchar2(22);
analyzer VARCHAR2(10);
nat_count number;
nat_tot number;
other_count number ;
unit_id_len number;
machine_code number;
function_result VARchar2(500);
--EXEC SQL END DECLARE SECTION;
detail_buffer char(500);
other_detail_buffer char(180);
hdr_flag varchar2(100);
ins_other_count number;
not_end_of_stream number;
n_tests number;
load_count number;
arr_test_batch varchar2 (200);--(MAXTESTID);
itest_id VARCHAR2(10);
ctest_id char(5);
logfile                UTL_FILE.FILE_TYPE;
instfile               UTL_FILE.FILE_TYPE;
LogDir                 VARCHAR2(150);
logfilename            VARCHAR2(500);
p_file_name            VARCHAR2(500);
p_chp_sys_date         DATE;
g_local_time           DATE;

END;
```
