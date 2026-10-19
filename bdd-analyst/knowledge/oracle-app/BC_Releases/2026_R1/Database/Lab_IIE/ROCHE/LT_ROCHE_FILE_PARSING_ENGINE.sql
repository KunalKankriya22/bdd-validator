CREATE OR REPLACE PACKAGE LT_ROCHE_FILE_PARSING_ENGINE IS
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
/


CREATE OR REPLACE package body LT_ROCHE_FILE_PARSING_ENGINE is

PROCEDURE add_log_entry(p_log_text varchar2) is
BEGIN
         UTL_FILE.putf(logfile,'%s\n',p_log_text);
         UTL_FILE.fflush(logfile);
END add_log_entry;

procedure main_proc(file_name in varchar2,
                    v_inst_id in varchar2,
                    pl_chapter_id in varchar2) is

 start_time   VARCHAR2(30);
 end_time     VARCHAR2(30);
Begin
      dbms_output.enable(50000000);
      v_machine_id:=v_inst_id;
      result_file_name:=file_name;
      v_chapter_id:=pl_chapter_id;
      --p_chp_sys_date:=lifetrack_timezone_convert.get_local_time(v_chapter_id,
      --                                                          sysdate);
      p_chp_sys_date:=sysdate;

      begin
           select code_desc into LogDir from master_codes
           where code_type='LOGDR' and code='ILOG' and p_chp_sys_date
	   between eff_date and nvl(term_date,sysdate+10);
      exception
           when utl_file.invalid_path then
               dbms_output.put_line('Invalid path or filename');
	       raise;
           when others then
           dbms_output.put_line('Error in prepare_log_filename');
	   raise;
       end;

      dbms_output.put_line('File Name='||file_name);

     begin
         instfile:=UTL_FILE.fopen(LogDir,file_name, 'r');
       exception
         when utl_file.invalid_path then
         dbms_output.put_line('Invalid path or filename'); raise;
     end;

    dbms_output.put_line('Input file has been opend successfully');


      begin
       p_file_name:=substr(result_file_name,1,instr(result_file_name,'.',1)-1);

       select 'ROCHE_PARSER_'||p_file_name||'_'||
       to_char(sysdate,'mmddyyyyhh24mi')||'.r' into logfilename from dual;
      exception
	  when others then
	     dbms_output.put_line('Error in getting logfilename ... Aborting');
	     raise;
      end;


       begin
        -- g_local_time:=lifetrack_timezone_convert.get_local_time(v_chapter_id,
        --     sysdate);

           g_local_time:=sysdate;
	   start_time := to_char(g_local_time,'mm-dd-yy hh24:mi:ss');
           logfile:=UTL_FILE.fopen(LogDir,logfilename, 'w');
           add_log_entry(' ROCHE Parsing Log');
           add_log_entry('-------------------');
           add_log_entry(' ');
	   add_log_entry('Parsing start time:'||start_time);
	   add_log_entry('File Name  : '||result_file_name);
	   add_log_entry('Log Name   : '||logfilename);
	   add_log_entry('----------------------------------------');

       exception
	  when utl_file.invalid_path then
	   dbms_output.put_line('Invalid path or filename'); raise;
        end;


          dbms_output.put_line('Log file opened successfully');

          init_variables;
	  read_delimiter;

	  loop
	     process;
	     exit when complete;
	  end loop;


	  --update_rpt_parm;
	  add_log_entry('No. of Records parsed: '||to_char(no_of_units));
	  add_log_entry('Parsing successfully completed');

     ---  g_local_time:=lifetrack_timezone_convert.get_local_time(v_chapter_id,
     --  sysdate);

          g_local_time:=sysdate;
          end_time := to_char(g_local_time,'mm-dd-yy hh24:mi:ss');
	  add_log_entry('Program End Time:'||end_time);
	  add_log_entry('*********************End****************************');
	  UTL_FILE.fclose(logfile);

         UTL_FILE.fclose(instfile);

End main_proc;

Procedure process is
   rec_type  VARCHAR2(1);
   process_exception EXCEPTION;
Begin
   readrecord;
   If not complete then
     begin

       --- Verify if the record is a header record. Skip the header record.

       If Upper(substr(read_record,1,5)) like 'DONOR%' then
          null;
       Else
         fetch_count:=fetch_count+1;
         record_count:=record_count+1;
         parse_read_record;
       End If;
    end;
   End if;
Exception
    When process_exception then
	 null;
End process;

procedure readrecord is
 begin
   utl_file.get_line(instfile,read_record);
 exception
  when no_data_found then
    complete:=TRUE;
  when UTL_FILE.READ_ERROR then
     add_log_entry('Error reading file '||result_file_name);
     rollback_and_exit;
end readrecord;

Procedure get_column(txtline in varchar2, delimit in char,strt in number,
		     endc in number,outcol out varchar2) is
   stringend number;
 Begin
    if instr(txtline,delimit,1,endc) = 0 then
       stringend:=length(txtline);
   else
    stringend:=instr(txtline,delimit,1,endc) - instr(txtline,delimit,1,strt)-1;
  end if;
  outcol := substr(txtline,instr(txtline,delimit, 1, strt)+1,stringend);
End get_column;

procedure read_delimiter is
 read_hdr    varchar2(250);
begin
  field_delimiter:=';';
End read_delimiter;

Function check_error_code (pl_err_result in varchar2) return
boolean is
  ncount   number:=0;
Begin
   select nvl(count(*),0) into ncount from api_inst_error_handling
   where machine_id=v_machine_id and error_code=pl_err_result and
   sysdate between eff_date and nvl(term_date,sysdate+1);

dbms_output.put_line('error count='||to_char(ncount));
   If ncount > 0 then
      return true;
   Else
      return false;
   End if;
End check_error_code;


Procedure parse_read_record is
 function_result varchar2(200);
 rescode1   VARCHAR2(40);
 inst_test_id VARCHAR2(20);
 abs_value  VARCHAR2(20);
 v_result  VARCHAR2(80);
 temp_x     VARCHAR2(1);
 result_details  varchar2(300);
 user_exception  EXCEPTION;
 mpxv20_hiv          varchar2(16);
 mpxv20_hbv       varchar2(20);
 mpxv20_hcv       varchar2(20);
 mpx_res          varchar2(20);
 wnv_res         varchar2(20);
 accept_opr_id   varchar2(10);
 accept_date     varchar2(30);
 v_result_date   date;
 c_status         VARCHAR2(300);
 final_pool_size   varchar2(10);
 v_ext_batch_id     varchar2(20);
 first_delimitor NUMBER:=0;
 v_test_id_1         VARCHAR2(30);
 v_result_1        VARCHAR2(10);
 v_test_id_2         VARCHAR2(30);
 v_result_2        VARCHAR2(10);
 v_test_id_3         VARCHAR2(30);
 v_result_3        VARCHAR2(10);
 v_error_code      VARCHAR2(10);
BEGIN


  --Get the Unit Information
   begin
     first_delimitor:=INSTR(read_record,';',1);
     v_unit_id:=substr(read_record,1,first_delimitor-1);
     If substr(v_unit_id,1,1)='"' and substr(v_unit_id,-1)='"' then
        v_unit_id:=substr(v_unit_id,2, Length(v_unit_id)-2);
     End If;

     If Length(v_unit_id) in (15,16) then
        v_unit_id:=substr(v_unit_id,2,13);
     End If;

     no_of_units:=no_of_units+1;
     dbms_output.put_line(v_unit_id);
  exception
   when others then
     add_log_entry('Unit parsing:'||sqlerrm);
   End;

   --Get machine test ID
   get_column(read_record,field_delimiter,1,2,inst_test_id);
   inst_test_id:=substr(inst_test_id,2,Length(inst_test_id)-2);

   dbms_output.put_line('Inst testid='||inst_test_id);

  If upper(inst_test_id)='MPX V2.0' then

     v_result:=null;

     --Get result MPXV2.0-HIV
     get_column(read_record,field_delimiter,2,3,mpxv20_hiv);
     mpxv20_hiv:=substr(mpxv20_hiv,2,Length(mpxv20_hiv)-2);

     begin
       select machine_test_id into v_test_id_1 from
       valid_instrument_tests where machine_id=v_machine_id and
       substr(machine_test_id,1,3)='MPX' and
       substr(machine_test_id,-3)='HIV';
     exception when others then
        v_test_id_1:='MPX v2.0-HIV';
     end;

     v_result_1:=mpxv20_hiv;

     if check_error_code(v_result_1) then
       v_result_1:=null;
       v_error_code:=mpxv20_hiv;
     end if;


     dbms_output.put_line('MPXV2.0-HIV:'||mpxv20_hiv);

     --Get result MPXV2.0-HBV
     get_column(read_record,field_delimiter,3,4,mpxv20_hbv);
     mpxv20_hbv:=substr(mpxv20_hbv,2,Length(mpxv20_hbv)-2);

     dbms_output.put_line('MPXV2.0-HBV:'||mpxv20_hbv);


      begin
        select machine_test_id into v_test_id_2 from
        valid_instrument_tests where machine_id=v_machine_id and
        substr(machine_test_id,1,3)='MPX' and
        substr(machine_test_id,-3)='HBV';
     exception when others then
       v_test_id_2:='MPX v2.0-HBV';
     end;

      --v_test_id_2:='MPX v2.0_HBV';
      v_result_2:=mpxv20_hbv;

      if check_error_code(v_result_2) then
         if v_error_code is  null then
            v_result_2:=null;
            v_error_code:=mpxv20_hbv;
         end if;

     end if;


     --Get result MPXV2.0-HCV
     get_column(read_record,field_delimiter,4,5,mpxv20_hcv);
     mpxv20_hcv:=substr(mpxv20_hcv,2,Length(mpxv20_hcv)-2);

     dbms_output.put_line('MPXV2.0-HCV:'||mpxv20_hcv);


       begin
         select machine_test_id into v_test_id_3 from
         valid_instrument_tests where machine_id=v_machine_id and
         substr(machine_test_id,1,3)='MPX' and
         substr(machine_test_id,-3)='HCV';
      exception when others then
         v_test_id_3:='MPX v2.0-HCV';
      end;

      --v_test_id_3:='MPX v2.0_HCV';
      v_result_3:=mpxv20_hcv;

      if check_error_code(v_result_3) then

         if v_error_code is null then
            v_result_3:=null;
            v_error_code:=mpxv20_hcv;
         end if;

     end if;


  Elsif UPPer(inst_test_id)='MPX' then

     --Get result MPX
     get_column(read_record,field_delimiter,8,9,mpx_res);
     mpx_res:=substr(mpx_res,2,Length(mpx_res)-2);

      dbms_output.put_line('MPX:'||mpx_res);
      v_result:=mpx_res;
      v_test_id_1:=inst_test_id;
      v_result_1:=mpx_res;

    if check_error_code(v_result) then
        v_result:=null;
        v_result_1:=null;
        v_error_code:=mpx_res;
    end if;

  Elsif UPPER(inst_test_id)='WNV' then

    --Get result MNW
     get_column(read_record,field_delimiter,7,8,wnv_res);
     wnv_res:=substr(wnv_res,2,Length(wnv_res)-2);

      dbms_output.put_line('MNV:'||wnv_res);
     v_result:=wnv_res;
     v_result_1:=wnv_res;
     v_test_id_1:=inst_test_id;

      if check_error_code(v_result) then
         v_result:=null;
         v_result_1:=null;
         v_error_code:=wnv_res;
     end if;

  End If;

   --Get final pool size
     get_column(read_record,field_delimiter,10,11,final_pool_size);
     final_pool_size:=substr(final_pool_size,2,Length(final_pool_size)-2);

      dbms_output.put_line('Final Pool Size:'||final_pool_size);

    --Get result ext batch id
     get_column(read_record,field_delimiter,16,17,v_ext_batch_id);
     v_ext_batch_id:=substr(v_ext_batch_id,2,Length(v_ext_batch_id)-2);

    --Get result user (operator)
     get_column(read_record,field_delimiter,20,21,accept_opr_id);
     accept_opr_id:=substr(accept_opr_id,2,Length(accept_opr_id)-2);

      dbms_output.put_line('Operator ID:'||accept_opr_id);

     --Get result idate
     get_column(read_record,field_delimiter,21,22,accept_date);


     accept_date:=replace(accept_date,'T',' ');
     accept_date:=substr(accept_date,2,Length(accept_date)-2);
    dbms_output.put_line('Accept Date:'||substr(accept_date,1,16));

     v_result_date:=to_date(substr(accept_date,1,16),'yyyy-mm-dd hh24:mi');

    abs_value:=0;

    process_date_time:=to_char(p_chp_sys_date,'mm-dd-yyyy hh24:mi');

   If v_unit_id is not null then
      Insert into api_inst_test_results
         (MACHINE_ID          ,
         CHAPTER_ID          ,
         FILE_ID             ,
         UNIT_ID             ,
         COLL_DATE           ,
         MACHINE_TEST_ID     ,
         MACHINE_RESULT      ,
         TEST_ID_1           ,
         RESULT_1            ,
         TEST_ID_2           ,
         RESULT_2            ,
         TEST_ID_3           ,
         RESULT_3            ,
         LOWER_RESULT_RANGE  ,
         UPPER_RESULT_RANGE  ,
         WELL_NUMBER         ,
         ABSORBANCE          ,
         RATIO               ,
         PLATE_ID            ,
         RESULT_DATE         ,
         RESULT_USER_ID      ,
         ERROR_CODE          ,
         RECORD_SEQUENCE     ,
         PATIENT_LAST_NAME   ,
         PATIENT_FIRST_NAME  ,
         PATIENT_DOB         ,
         COMMENTS            ,
         SKIP_RECORD         ,
         UPLOAD_STATUS       ,
         INSERT_DATE         ,
         INSERT_USER         ,
         AUDIT_KEY           ,
         FINAL_POOL_SIZE     ,
         EXT_BATCH_ID       ,
         site_id           ,
         parsed_by         )
     VALUES(
            v_machine_id,
            v_chapter_id,
            result_file_name,
            v_unit_id,
            null,
            inst_test_id,
            v_result,
            v_test_id_1,
            v_result_1,
            v_test_id_2,
            v_result_2,
            v_test_id_3,
            v_result_3,
            null,
            null,
            null,
           '0',
           null,
           null,
           v_result_date,
           accept_opr_id,
           v_error_code,
           '1',
          null,
          null,
          null,
          null,
          null,
          'P',
          p_chp_sys_date,
          'ROCHE',
          audit_seq.nextval,
          to_number(final_pool_size),
          v_ext_batch_id,
          null,
          'LT');
    End If;

EXCEPTION When user_exception then
  null;
  when others then
  add_log_entry('Error on '||v_unit_id||' '||sqlerrm);
  dbms_output.put_line('Error:'||sqlerrm);
END parse_read_record;

Procedure init_variables is
 v_prism_id    varchar2(10);
Begin
  null;
End init_variables;

procedure rollback_and_exit is
 end_time  varchar2(30);
Begin
 rollback;
 add_log_entry('Aborting');
 UTL_FILE.fclose(logfile);
 raise_application_error('-20000','Aborting');
End rollback_and_exit;

END LT_ROCHE_FILE_PARSING_ENGINE;
/
