SELECT SYSTIMESTAMP FROM DUAL;

Declare
 v_rep_status   varchar2(5);
 v_finish_date  date;
 v_rep_dir      VARCHAR2(200);
 v_destname     VARCHAR2(200);
 v_job_name     VARCHAR2(50);
 v_printer_name  VARCHAR2(50);
 v_rep_server   VARCHAR2(200);
 v_wls_path  VARCHAR2(200):='/home/lifetrak/repout/';
 v_fmw_path  VARCHAR2(200):='/apps/Middleware/Oracle_Home/user_projects/domains/LT_Domain/reports/cache/';

  Cursor c1 is
     select user_name, rep_job_id,report_name,parm_id,rep_server
     from rpt_parm
       where submit_date > sysdate - (1/24)
        and report_status !='C' and
        start_time is null
        order by submit_date;
Begin

  For c1rec in c1 loop
      Begin
         select status_code,finished,job_name,desname
          into v_rep_status,v_finish_date,v_job_name,v_destname
           from rw_server_job_queue
           where job_id=c1rec.rep_job_id
           and lower(server) = lower(c1rec.rep_server);
      Exception
        when others then
          v_rep_status :='E';
      End;

       IF v_rep_status = to_char(4) then

          Begin
              update rpt_parm set report_status='C',end_date=v_finish_date
              where rep_job_id=c1rec.rep_job_id and
              UPPER(rep_server) = UPPER(c1rec.rep_server);
          Exception
            when others then
              null;
          End;

          -- the following insert is to auto print
          If v_job_name in ('oerorslp','scrpicks','scrunpsl','scrtrafr','shrpklst',
                            'imrrtlst','scroutdt','imrckosl','csrdclst',
                            'cprckosl','cprpool','mcrchblt','mcrcold4') then 

            Begin
            
             -- Get the printer ID

             select print_id into v_printer_name from system_users where
             user_id=c1rec.user_name;

            -- Get the report path name
            If lower(c1rec.rep_server) like 'rep_wls%' then 
               v_rep_dir:=v_wls_path;
            Else
              v_rep_dir:=v_fmw_path;
            End If;

            select replace(v_destname,'$','\$') into v_destname from dual;  

             insert into print_request_queue (rep_dir,
                                              FILE_NAME,        
                                              FORM_TYPE,        
                                              PRINTER_NAME,     
                                              REQUEST_DATE,     
                                              PRINTED_DATE,     
                                              NO_OF_COPIES)
                                      values(v_rep_dir,
                                             v_destname,
                                             null,
                                             v_printer_name,
                                             sysdate,
                                             null,
                                             1
                                            );  
            Exception when others then 
              NULL;
            End;
 
          End If;   -- for if v_job_name statement

          commit;
      END IF;

End loop;
commit;
End;
/
exit;

