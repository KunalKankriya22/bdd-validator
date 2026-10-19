--------------------------------------------------------
--  DDL for Trigger TEMP_DRIVES_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."TEMP_DRIVES_BI" 
before insert
on TEMP_DRIVES
for each row
begin
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
end ;
/
ALTER TRIGGER "DONSYS"."TEMP_DRIVES_BI" ENABLE;
