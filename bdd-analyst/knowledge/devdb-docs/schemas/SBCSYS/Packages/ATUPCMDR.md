---
tags:
  - package
  - SBCSYS
---
# ATUPCMDR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- UTL_FILE (SYNONYM in PUBLIC)

## Package Specification

```plsql
PACKAGE          "ATUPCMDR" is
/*****************************************************************************
Developed By : Sobha Damodaran
Create Date  : 12.03.2003
Purpose      : Abbott Commander Interfac
Modified By  : Basker Edwin
Date [Ver]   : 09.18.06 [02]
Comments     : This would support both ISBT and Codabar. The important thing
               to note is, the instrument must be configured to take 20 chars
               unit length(the unit numbers will be in two lines in the file)
Date [Ver]  :09/25/08 [ver:03]  : strip off the start and stop code for
                                   ISBT units
            :03 [03/19/2012] Time zone and multi chapter changes- Edwin LT2012
**************************************************************************** */
procedure add_log_entry(p_log_text in varchar2);
procedure main_proc(file_name in varchar2,v_inst_id in varchar2,
                   pl_chapter_id in varchar2);
procedure process;
procedure readrecord;
procedure unit_record;
procedure test_record;
procedure init_variables;
procedure update_batch_information;
procedure insert_instrument_log;
procedure convert_unit_id ;
procedure update_rpt_parm;
procedure rollback_and_exit ;
last_unit varchar2(20);
type LogLineTable is TABLE of VARCHAR2(80) index by binary_integer;
 LogOP LogLineTable;
 v_cntr number :=0;
   logfile UTL_FILE.FILE_TYPE;
   instfile UTL_FILE.FILE_TYPE;
   LogDir varchar2(50);
   logfilename varchar2(50);
   read_record varchar2(500);
   complete boolean:=false;
   samples_started boolean:=false;
   v_tb_id varchar2(14);
   inst_test_id varchar2(2);
   v_test_id varchar2(10);
   cut_off varchar2(10);
   kit_lot varchar2(30);
   v_machine_id varchar2(5);
   v_unit_id varchar2(20);
   well_number varchar2(4);
   result_status varchar2(4);
   codabar_unit_scheme varchar2(1);
   testing_lab_code varchar2(2);
   v_chapter_id varchar2(4);
   auto_sch_flag  varchar2(1);
   temp_max_test_seq_no  number:=0;
   temp_coll_date date;
   od_value varchar2(12);
   first_unit boolean:=TRUE;
   result_file_name varchar2(30);
   record_count number:=0;
   pos_res_count number:=0;
   neg_res_count number:=0;
   upload_count number:=0;
   reject_count number:=0;
   samples_count number:=0;
   good_unit boolean;
   line_number  number:=0;
   start_batch_time  varchar2(20);
   end_batch_time  varchar2(20);
   tech_id   varchar2(3);
   reset_counter NUMBER:=0;
   first_line_unit  varchar2(20);
   ppc_serial_no  varchar2(7);
   g_local_time   DATE;
   p_chp_sys_date DATE;

end ATUPCMDR;
```
