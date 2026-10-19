set serveroutput on
declare
   p_status varchar2(15);
begin
don_enlist.run_next_list(p_status );
end;
/
exit;

