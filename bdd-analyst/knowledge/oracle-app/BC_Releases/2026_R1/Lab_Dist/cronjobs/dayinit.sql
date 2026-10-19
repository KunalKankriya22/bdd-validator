declare
  cursor c1 is
  select chapter_id, time_zone
    from chapters
   where sysdate between eff_date and nvl(term_date, sysdate + 1);

  v_local_time     date;
begin
  for c1rec in c1 loop
     If lifetrack_timezone_convert.is_timezone_enabled then

        if c1rec.time_zone is not null then

              select sysdate + (substr(c1rec.time_zone,1,1)||'1') *
                       to_dsinterval('0 '||substr(c1rec.time_zone,2,5)||':00')
              into v_local_time from dual;
        else
         v_local_time:=sysdate;
        end if;

     Else
        v_local_time:=sysdate;
     End If;


    if to_char(v_local_time, 'HH24:MI') = '00:00' then
      begin
        update chapters
           set batch_seq = 1000,
               tb_seq = 1000,
               ws_seq = 1000,
               sdc_ws_seq = 1000,
               work_number_seq = 0,
               pool_seq = 0,
               program_id = 'DAYINIT'
         where chapter_id = c1rec.chapter_id;
      end;
    end if;
  end loop;

  commit;
end;
/
commit
/
exit
