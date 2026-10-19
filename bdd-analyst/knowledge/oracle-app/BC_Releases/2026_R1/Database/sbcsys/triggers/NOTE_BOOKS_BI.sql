--------------------------------------------------------
--  DDL for Trigger NOTE_BOOKS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "NOTE_BOOKS_BI" 
 BEFORE INSERT
 ON NOTE_BOOKS
 FOR EACH ROW
BEGIN
if :new.insert_user is null then
   select lt_user_session.get_userid
   into :new.insert_user from dual ;
end if;
if :new.insert_date is null then
   :new.insert_date := sysdate ;
end if;
if :new.audit_key is null then
   select AUDIT_SEQ_LAB.nextval into :new.audit_key from dual;
end if;
end ;
/
ALTER TRIGGER "NOTE_BOOKS_BI" ENABLE;
