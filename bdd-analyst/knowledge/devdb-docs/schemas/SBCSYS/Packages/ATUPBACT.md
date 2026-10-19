---
tags:
  - package
  - SBCSYS
---
# ATUPBACT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- UTL_FILE (SYNONYM in PUBLIC)

## Package Specification

```plsql
PACKAGE          "ATUPBACT" is
procedure add_log_entry(p_log_text in varchar2);
procedure main_proc(file_name in varchar2,inst_id in varchar2,
                    pl_chapter_id in varchar2);
procedure process;
procedure readrecord;
procedure get_column(txtline in varchar2, delimit in char,strt in number,endc in number,outcol out varchar2);
procedure init_variables;
procedure update_batch_information;
procedure insert_instrument_log;
procedure convert_unit_id ;
procedure rollback_and_exit ;
procedure move_test_results;
procedure update_rpt_parm;
field_delimiter varchar2(1):=',';
repeat_delimiter varchar2(1);
component_delimiter varchar2(1);
escape_delimiter varchar2(1);
   logfile UTL_FILE.FILE_TYPE;
   instfile UTL_FILE.FILE_TYPE;
   LogDir varchar2(50);
   logfilename varchar2(50);
   read_record varchar2(500);
   complete boolean:=false;
   plate_id varchar2(10);
   v_tb_id varchar2(14);
   v_test_id varchar2(10);
   cut_off varchar2(10);
   v_machine_id varchar2(5);
   maxnum  number;
   unit_id varchar2(15);
   dummy_unit_id varchar2(15);
   verify_unit_id varchar2(15);
   process_date_time  varchar2(15);
   process_date  varchar2(15);
   process_time  varchar2(15);
   result_date date;
   result_status varchar2(4);
   negative_result varchar2(4);
   reactive_result varchar2(4);
   codabar_unit_scheme varchar2(1);
   testing_lab_code varchar2(2);
   v_chapter_id varchar2(4);
   first_unit boolean:=TRUE;
   well_type varchar2(1);
   result_file_name varchar2(60);
   prev_test_id varchar2(10);
   good_unit Boolean;
   p_chp_sys_date         DATE;
   g_local_time           DATE;

end ATUPBACT;

```
