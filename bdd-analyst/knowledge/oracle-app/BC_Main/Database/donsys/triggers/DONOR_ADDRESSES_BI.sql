--------------------------------------------------------
--  DDL for Trigger DONOR_ADDRESSES_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."DONOR_ADDRESSES_BI" 
 BEFORE INSERT
 ON DONOR_ADDRESSES
 FOR EACH ROW
DECLARE
   l_usps_id	number(6);
   l_city	varchar2(40);
   l_state	varchar2(2);
   l_zip	varchar2(5);
begin
   l_usps_id := null;
   l_city    := null;
   l_state   := null;
   l_zip     := null;
---
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
end ;
/
ALTER TRIGGER "DONSYS"."DONOR_ADDRESSES_BI" ENABLE;
