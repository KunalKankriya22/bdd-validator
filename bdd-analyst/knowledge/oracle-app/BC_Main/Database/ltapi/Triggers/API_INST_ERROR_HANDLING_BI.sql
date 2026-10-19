--------------------------------------------------------
--  DDL for Trigger API_INST_ERROR_HANDLING_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "API_INST_ERROR_HANDLING_BI" 
BEFORE INSERT
ON LTAPI.API_INST_ERROR_HANDLING
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
begin
if :new.insert_user is null then
     select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
     into :new.insert_user from dual ;
end if;
if :new.insert_date is null then
   :new.insert_date := sysdate ;
end if;
--if :new.audit_key is null then
   select audit_seq.nextval into :new.audit_key from dual;
--end if;

if :new.program_id is null then
 :new.program_id := 'MANUAL';
end if;
end ;
/
ALTER TRIGGER "API_INST_ERROR_HANDLING_BI" ENABLE;
