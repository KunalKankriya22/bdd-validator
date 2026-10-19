--------------------------------------------------------
--  DDL for Trigger LABELING_TEST_MESSAGE_MAP_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "LABELING_TEST_MESSAGE_MAP_BU" 
BEFORE UPDATE
OF LT_TEST_ID
  ,RESULT_CODE
  ,DISPLY_TEST_ID
  ,MESSAGE_DESC
  ,EFF_DATE
  ,INSERT_DATE
  ,INSERT_USER
  ,PROGRAM_ID
  ,TERM_DATE
ON SBCSYS.LABELING_TEST_MESSAGE_MAP
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
declare
    LABELING_TEST_MESSAGE_MAP_aud	      LABELING_TEST_MESSAGE_MAP_ADT%rowtype;
begin
    LABELING_TEST_MESSAGE_MAP_aud.audit_key := :old.audit_key;
    LABELING_TEST_MESSAGE_MAP_aud.program_id := :new.program_id;
    if nvl(:old.LT_TEST_ID,'*') !=
       nvl(:new.LT_TEST_ID,'*')
    then
       LABELING_TEST_MESSAGE_MAP_aud.LT_TEST_ID:= nvl(:new.LT_TEST_ID,'*');
    end if;
    if nvl(:old.RESULT_CODE,'*') !=
       nvl(:new.RESULT_CODE,'*')
    then
       LABELING_TEST_MESSAGE_MAP_aud.RESULT_CODE:= nvl(:new.RESULT_CODE,'*');
    end if;
    if nvl(:old.DISPLY_TEST_ID,'*') !=
       nvl(:new.DISPLY_TEST_ID,'*')
    then
       LABELING_TEST_MESSAGE_MAP_aud.DISPLY_TEST_ID:= nvl(:new.DISPLY_TEST_ID,'*');
    end if;
    if nvl(:old.MESSAGE_DESC,'*') !=
       nvl(:new.MESSAGE_DESC,'*')
    then
       LABELING_TEST_MESSAGE_MAP_aud.MESSAGE_DESC:= nvl(:new.MESSAGE_DESC,'*');
    end if;
    if nvl(:old.EFF_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.EFF_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       LABELING_TEST_MESSAGE_MAP_aud.EFF_DATE := nvl(:new.EFF_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.INSERT_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.INSERT_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       LABELING_TEST_MESSAGE_MAP_aud.INSERT_DATE := nvl(:new.INSERT_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.INSERT_USER,'*') !=
       nvl(:new.INSERT_USER,'*')
    then
       LABELING_TEST_MESSAGE_MAP_aud.INSERT_USER:= nvl(:new.INSERT_USER,'*');
    end if;
    if nvl(:old.TERM_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.TERM_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       LABELING_TEST_MESSAGE_MAP_aud.TERM_DATE := nvl(:new.TERM_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;

     --
    insert into LABELING_TEST_MESSAGE_MAP_ADT
    (
        LT_TEST_ID, RESULT_CODE, DISPLY_TEST_ID,
        MESSAGE_DESC, EFF_DATE, INSERT_DATE,
	INSERT_USER,PROGRAM_ID, AUDIT_KEY, TERM_DATE,
	AUDIT_USER,AUDIT_DATE
    )
    values
    (
        LABELING_TEST_MESSAGE_MAP_aud.LT_TEST_ID, LABELING_TEST_MESSAGE_MAP_aud.RESULT_CODE, LABELING_TEST_MESSAGE_MAP_aud.DISPLY_TEST_ID,
        LABELING_TEST_MESSAGE_MAP_aud.MESSAGE_DESC, LABELING_TEST_MESSAGE_MAP_aud.EFF_DATE, LABELING_TEST_MESSAGE_MAP_aud.INSERT_DATE,
	LABELING_TEST_MESSAGE_MAP_aud.INSERT_USER, LABELING_TEST_MESSAGE_MAP_aud.PROGRAM_ID, LABELING_TEST_MESSAGE_MAP_aud.AUDIT_KEY, LABELING_TEST_MESSAGE_MAP_aud.TERM_DATE,
	lt_user_session.get_userid, sysdate
    );
end;
/
ALTER TRIGGER "LABELING_TEST_MESSAGE_MAP_BU" ENABLE;
