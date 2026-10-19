set serverout on size 100000
declare
   vDir varchar2(100) := '&1';
   cursor c1 is
      select rowid, 'lp -d ' || print_id || ' -o raw  ' || vDir || '/' ||
             file_name || ' -n ' || no_copies cmd
      from bc_prnt_job_list
      where program_id = 'AGLBL';
begin   
   for rec in c1 loop
      dbms_output.put_line(rec.cmd);
      delete from bc_prnt_job_list
      where rowid = rec.rowid;
   end loop;
   commit;
end;
/

