SELECT SYSTIMESTAMP FROM DUAL;

Declare
 v_rep_status   varchar2(5);
 v_finish_date  date;
 v_rep_server   VARCHAR2(200);

  Cursor c1 is
     select rep_job_id,report_name,parm_id,rep_server
     from rpt_parm
       where submit_date > sysdate - (1/24)
        and report_status !='C'
        order by submit_date;
Begin

  For c1rec in c1 loop
      Begin
         select status_code,finished into v_rep_status,v_finish_date
           from rw_server_job_queue
           where job_id=c1rec.rep_job_id
           and lower(server) = lower(c1rec.rep_server);
      Exception
        when others then
          v_rep_status :='E';
      End;
       If v_rep_status = to_char(4) then
          Begin
            update rpt_parm set report_status='C',end_date=v_finish_date
              where rep_job_id=c1rec.rep_job_id and UPPER(rep_server) = UPPER(c1rec.rep_server);
          Exception
            when others then
              null;
          End;
          commit;
      End if;
End loop;
commit;
End;
/
exit;

