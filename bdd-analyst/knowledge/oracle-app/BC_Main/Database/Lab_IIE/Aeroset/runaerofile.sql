set serveroutput on
begin
AEROFILE.main_proc('&1');
end;
/
exit;
