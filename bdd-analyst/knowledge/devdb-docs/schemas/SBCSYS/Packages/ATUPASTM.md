---
tags:
  - package
  - SBCSYS
---
# ATUPASTM

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- UTL_FILE (SYNONYM in PUBLIC)

## Package Specification

```plsql
PACKAGE          "ATUPASTM" is
procedure add_log_entry(p_log_text in varchar2);
procedure main_proc(file_name in varchar2,v_inst_id in varchar2,
                    pl_chapter_id in varchar2);
procedure process;
procedure readrecord;
procedure get_column(txtline in varchar2, delimit in char,strt in number,
                     endc in number,outcol out varchar2);
procedure header_record;
procedure comment_record;
procedure unit_record;
procedure result_record;
procedure init_variables;
procedure update_batch_information;
procedure update_controls;
procedure insert_instrument_log;
procedure convert_unit_id ;
procedure update_rpt_parm;
procedure insert_competency_test_results;
procedure rollback_and_exit ;
field_delimiter varchar2(1);
repeat_delimiter varchar2(1);
component_delimiter varchar2(1);
last_unit varchar2(15);
escape_delimiter varchar2(1);
   logfile UTL_FILE.FILE_TYPE;
   instfile UTL_FILE.FILE_TYPE;
   LogDir varchar2(50);
   logfilename varchar2(50);
   read_record varchar2(500);
   complete boolean:=false;
   plate_id varchar2(10);
   v_tb_id varchar2(14);
   well_count number;
   process_date_time varchar2(15);
   v_test_id varchar2(10);
   cut_off varchar2(10);
   kit_lot varchar2(30);
   v_machine_id varchar2(5);
   unit_id varchar2(15);
   well_number varchar2(4);
   result_status varchar2(4);
   negative_result varchar2(4);
   reactive_result varchar2(4);
   ratio varchar2(7);
   codabar_unit_scheme varchar2(1);
   testing_lab_code varchar2(2);
   v_chapter_id varchar2(4);
   od_value varchar2(10);
   first_unit boolean:=TRUE;
   well_type varchar2(1);
   result_file_name varchar2(30);
   record_count number:=0;
   pos_res_count number:=0;
   neg_res_count number:=0;
   upload_count number:=0;
   good_unit boolean;
   p_chp_sys_date  date;
end ATUPASTM;

```
