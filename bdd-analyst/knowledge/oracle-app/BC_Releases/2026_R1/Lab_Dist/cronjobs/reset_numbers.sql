declare
  cursor c2 is
  select chapter_id, time_zone
    from chapters
   where sysdate between eff_date and nvl(term_date, sysdate + 1);

  cursor c1(p_chapter_id in varchar2) is
  select reset_cycle, last_reset_date, number_type
  from number_generation
  where  chapter_id = p_chapter_id;  

  v_local_time     date; 
begin
  for c2rec in c2 loop
        
     If lifetrack_timezone_convert.is_timezone_enabled then 
         if c2rec.time_zone is not null then 
            select sysdate + (substr(c2rec.time_zone,1,1)||'1') *
                         to_dsinterval('0 '||substr(c2rec.time_zone,2,5)||':00')
             into v_local_time
             from dual;
          else
            v_local_time:=sysdate; 
          end if;
    Else
       v_local_time:=sysdate;
    End If;


    if to_char(v_local_time, 'HH24:MI') = '00:00' then 
      for c1rec in c1(c2rec.chapter_id) loop
        if c1rec.reset_cycle is not null
        then
          if   (    c1rec.reset_cycle = 'D'
                and trunc(v_local_time) > trunc(c1rec.last_reset_date) )
            or (    c1rec.reset_cycle = 'Y'
                and to_char(v_local_time,'ddd') = '001'
                and to_char(v_local_time,'yyyy') >
                       to_char(c1rec.last_reset_date,'yyyy'))
          then
            update number_generation
            set    max_number  = nvl(starting_number,0),
                   last_reset_date = v_local_time
            where  chapter_id  = c2rec.chapter_id 
              and  number_type = c1rec.number_type;
          end if;
        end if;
      end loop;
    end if;
  end loop; 

  commit;
end;
/
