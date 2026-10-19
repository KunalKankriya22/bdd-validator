---
tags:
  - package
  - SBCSYS
---
# ATTRBACT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- UTL_FILE (SYNONYM in PUBLIC)

## Package Specification

```plsql
PACKAGE          "ATTRBACT" is
/*****************************************************************************
Developed By : Subash
Create Date  : 12.10.2004
Purpose      : BacT
Date Mod     : 02.11.2004
Version      : 01
Date Mod     : 04.18.2011
Version      : 02      by: Hussein; replace user by lt_session_user.get_userid




**************************************************************************** */

PROCEDURE add_log_entry(p_log_text varchar2, p_file UTL_FILE.FILE_TYPE);
PROCEDURE add_log_entry_reac(p_log_text varchar2, p_file UTL_FILE.FILE_TYPE);
procedure main_proc(file_name in varchar2,inst_id in varchar2, inst_test_id in varchar2);
procedure process;
procedure readrecord;
procedure get_column(txtline in varchar2, delimit in char,strt in number,endc in number,outcol out varchar2);
procedure get_column_1(txtline in varchar2, delimit in char,sub_delimit in char,strt in number,endc in number,substart in number, outcol out varchar2);
procedure init_variables;
procedure convert_unit_id ;
procedure update_rpt_parm(p_report_name in varchar2, p_parm_id in varchar2);
procedure rollback_and_exit ;
procedure insert_attributes;
procedure insert_instrument_log;
procedure get_reactive;
procedure sched_conf_utr (p_unit_id varchar2,
			  p_coll_date date,
			  p_chapter_id varchar2,
			  p_conf_test_id varchar2 ,
			  p_program_id varchar2 );
function IsTestMissing (p_unit_id varchar2,
                        p_coll_date date,
			p_chapter_id varchar2,
			p_test_id  varchar2) RETURN BOOLEAN;
procedure insert_attrib (p_unit_id varchar2,
			 p_coll_date date,
			 p_chapter_id varchar2,
			 p_test_id varchar2,
			 p_attrib_group varchar2,
			 p_attrib_code varchar2,
			 p_program_id varchar2);
procedure insert_inter (p_unit_id varchar2,
			p_coll_date date,
			p_chapter_id varchar2,
			p_inter_code varchar2,
			p_test_id varchar2 ,
			p_program_id varchar2  );
FUNCTION IS_ANY_ATTRIBUTES (p_unit_id varchar2,
                            p_coll_date date ,
			    p_chapter_id varchar2,
			    p_test_id varchar2 ) RETURN BOOLEAN;
field_delimiter varchar2(1):='|';
sub_field_delimiter varchar2(1) := '^';
repeat_delimiter varchar2(1);
component_delimiter varchar2(1);
escape_delimiter varchar2(1);
   logfile UTL_FILE.FILE_TYPE;
   logerrfile UTL_FILE.FILE_TYPE;
   logreacfile UTL_FILE.FILE_TYPE;
   instfile UTL_FILE.FILE_TYPE;
   LogDir varchar2(50);
   LogErrDir varchar2(50);
   LogReacDir varchar2(50);
   LogInstDir varchar2(50);
   logfilename varchar2(50);
   logerrfilename varchar2(50);
   logreacfilename varchar2(50);
   read_record varchar2(500);
   complete boolean:=false;
   plate_id varchar2(10);
   bottle_id varchar2(9);
   v_tb_id varchar2(14);
   v_test_id varchar2(10);
   v_source_test_id varchar2(10);
   cut_off varchar2(10);
   v_machine_id varchar2(5);
   v_inst_test_id  varchar2(10);
   maxnum  number;
   v_unit_id varchar2(15);
   dummy_unit_id varchar2(15);
   verify_unit_id varchar2(15);
   process_date_time  varchar2(15);
   process_date  varchar2(15);
   v_absorbance varchar2(12);
   temp_coll_date date;
   result_date date;
   v_result_status varchar2(4);
   negative_result varchar2(4);
   temp_x varchar2(1);
   reactive_result varchar2(4);
   codabar_unit_scheme varchar2(1);
   testing_lab_code varchar2(2);
   v_chapter_id varchar2(4);
   first_unit boolean:=TRUE;
   well_type varchar2(1);
   result_file_name varchar2(60);
   prev_test_id varchar2(10);
   good_unit Boolean :=FALSE;
   result_read Boolean := FALSE;
   plate_seq_no varchar2(1) := null;
   v_number_of_repeats           number(1);
   v_inter_code                  varchar2(4);
   v_attrib_group                varchar2(5);
   v_attrib_code                 varchar2(5);
   v_confirm_test_id_1           varchar2(10);
   v_confirm_test_id_2           varchar2(10);
   v_display_attrib              varchar2(5);
   v_display_inter               varchar2(15);
   v_display_sched_test          varchar2(25);
   display_inter  boolean:=TRUE;
   display_test   boolean:= TRUE;
end ATTRBACT;
```
