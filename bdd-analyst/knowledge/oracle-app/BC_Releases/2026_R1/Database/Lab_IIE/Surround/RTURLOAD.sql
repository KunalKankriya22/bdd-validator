set serveroutput on
set timing on
BEGIN
 RTURLOAD.MAIN_PROC('&1','&2'); 
END;
/
