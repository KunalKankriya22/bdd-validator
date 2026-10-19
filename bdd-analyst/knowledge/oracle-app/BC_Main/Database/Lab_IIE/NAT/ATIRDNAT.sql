set serveroutput on
begin
  ATIRDNAT.main_proc('&1','NAT','OBK');
end;
/
exit;
