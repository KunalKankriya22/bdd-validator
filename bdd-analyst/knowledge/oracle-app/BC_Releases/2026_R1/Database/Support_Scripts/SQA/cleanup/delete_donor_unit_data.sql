set SERVEROUTPUT on;
begin
    dbms_output.put_line('=== Deletion process started ===');
   for rec in (
      select donor_id, unit_id
        from donations
       where program_id = 'DRIREGIS'
         and n_audit_flag = 'Y'
         and n_audit_date is not null
         and chapter_id = 'OBK'
         and coll_date between TO_DATE('03/25/2025','MM/DD/YYYY') and TO_DATE('03/26/2025','MM/DD/YYYY')
   ) loop
      delete_donor_unit_data(
         rec.donor_id,
         rec.unit_id
      );
   end loop;
    dbms_output.put_line('=== Deletion process completed ===');
   dbms_output.put_line('**Issue a commit to make the changes permanent**');
end;
