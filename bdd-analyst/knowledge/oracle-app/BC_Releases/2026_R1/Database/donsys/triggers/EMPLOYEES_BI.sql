--------------------------------------------------------
--  DDL for Trigger EMPLOYEES_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."EMPLOYEES_BI" 
 BEFORE INSERT
 ON EMPLOYEES
 FOR EACH ROW
BEGIN
  If :new.insert_user is null then
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
  end if;
    :new.insert_date := sysdate ;
    select audit_seq.nextval into :new.audit_key from dual;
end ;
/
ALTER TRIGGER "DONSYS"."EMPLOYEES_BI" ENABLE;
