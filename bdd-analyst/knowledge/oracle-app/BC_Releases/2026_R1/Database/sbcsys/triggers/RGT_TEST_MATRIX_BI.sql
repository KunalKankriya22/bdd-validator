--------------------------------------------------------
--  DDL for Trigger RGT_TEST_MATRIX_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_TEST_MATRIX_BI" 
 BEFORE INSERT
 ON RGT_TEST_MATRIX
 FOR EACH ROW
BEGIN

if :new.INSERT_USER_ID is null then
   :new.INSERT_USER_ID:=lt_user_session.get_userid;
end if;

if :new.audit_key is null then
   select AUDIT_SEQ_LAB.nextval into :new.audit_key from dual;
end if;
end ;
/
ALTER TRIGGER "RGT_TEST_MATRIX_BI" ENABLE;
