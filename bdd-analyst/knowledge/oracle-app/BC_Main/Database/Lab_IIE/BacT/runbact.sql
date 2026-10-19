set serveroutput on
begin
ATUPBACT.main_proc('&1','BAT','OBK');
end;
/
exit;
