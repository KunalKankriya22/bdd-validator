--------------------------------------------------------
--  DDL for Trigger TRANSF_DETAILS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."TRANSF_DETAILS_BI" 
 BEFORE INSERT
 ON TRANSF_DETAILS
 FOR EACH ROW
BEGIN
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
    select audit_seq.nextval into :new.audit_key from dual;
end ;
/
ALTER TRIGGER "DONSYS"."TRANSF_DETAILS_BI" ENABLE;
