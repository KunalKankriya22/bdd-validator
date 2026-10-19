--------------------------------------------------------
--  DDL for Trigger DONOR_COMMUNICATIONS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."DONOR_COMMUNICATIONS_BI" 
before insert
on DONSYS.DONOR_COMMUNICATIONS
for each row
begin
  if :new.insert_user is null then
     select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
     into :new.insert_user from dual ;
  end if;
  if :new.insert_date is null then
    :new.insert_date := sysdate ;
  end if;
  if :new.audit_key is null then
    select audit_seq.nextval into :new.audit_key from dual;
  end if;
end;



/
ALTER TRIGGER "DONSYS"."DONOR_COMMUNICATIONS_BI" ENABLE;
