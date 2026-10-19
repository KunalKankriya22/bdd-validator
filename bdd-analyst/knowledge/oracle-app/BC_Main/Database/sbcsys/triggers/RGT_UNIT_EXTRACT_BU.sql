--------------------------------------------------------
--  DDL for Trigger RGT_UNIT_EXTRACT_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_UNIT_EXTRACT_BU" 
BEFORE UPDATE
OF PARM_ID
  ,UNIT_ID
  ,CHAPTER_ID
  ,CONTRACT_ID
  ,COLL_DATE
  ,BATCH_ID
  ,TEST_SEQ_NO
  ,TEST_ID
ON SBCSYS.RGT_UNIT_EXTRACT
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
declare
    RGT_UNIT_EXTRACT_aud	      RGT_UNIT_EXTRACT%rowtype;
begin
    RGT_UNIT_EXTRACT_aud.audit_key := :old.audit_key;
    if nvl(:old.PARM_ID,'*') !=
       nvl(:new.PARM_ID,'*')
    then
       RGT_UNIT_EXTRACT_aud.PARM_ID := nvl(:new.PARM_ID,'*');
    end if;
    if nvl(:old.UNIT_ID,'*') !=
       nvl(:new.UNIT_ID,'*')
    then
       RGT_UNIT_EXTRACT_aud.UNIT_ID := nvl(:new.UNIT_ID,'*');
    end if;
    if nvl(:old.CHAPTER_ID,'*') !=
       nvl(:new.CHAPTER_ID,'*')
    then
       RGT_UNIT_EXTRACT_aud.CHAPTER_ID := nvl(:new.CHAPTER_ID,'*');
    end if;
    if nvl(:old.CONTRACT_ID,'*') !=
       nvl(:new.CONTRACT_ID,'*')
    then
       RGT_UNIT_EXTRACT_aud.CONTRACT_ID := nvl(:new.CONTRACT_ID,'*');
    end if;
    if nvl(:old.COLL_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.COLL_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_UNIT_EXTRACT_aud.COLL_DATE := nvl(:new.COLL_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.BATCH_ID,'*') !=
       nvl(:new.BATCH_ID,'*')
    then
       RGT_UNIT_EXTRACT_aud.BATCH_ID := nvl(:new.BATCH_ID,'*');
    end if;
    if nvl(:old.TEST_SEQ_NO,-1) !=
       nvl(:new.TEST_SEQ_NO,-1)
    then
       RGT_UNIT_EXTRACT_aud.TEST_SEQ_NO := nvl(:new.TEST_SEQ_NO,-1);
    end if;
    if nvl(:old.TEST_ID,'*') !=
       nvl(:new.TEST_ID,'*')
    then
       RGT_UNIT_EXTRACT_aud.TEST_ID := nvl(:new.TEST_ID,'*');
    end if;


    --
    insert into RGT_UNIT_EXTRACT_AUDIT
    (
	PARM_ID, UNIT_ID,CHAPTER_ID,
	CONTRACT_ID, COLL_DATE, BATCH_ID,
	TEST_SEQ_NO, TEST_ID,
	AUDIT_KEY,audit_insert_dats, audit_insert_user
    )
    values
    (
	RGT_UNIT_EXTRACT_aud.PARM_ID, RGT_UNIT_EXTRACT_aud.UNIT_ID, RGT_UNIT_EXTRACT_aud.CHAPTER_ID,
	RGT_UNIT_EXTRACT_aud.CONTRACT_ID, RGT_UNIT_EXTRACT_aud.COLL_DATE, RGT_UNIT_EXTRACT_aud.BATCH_ID,
	RGT_UNIT_EXTRACT_aud.TEST_SEQ_NO, RGT_UNIT_EXTRACT_aud.TEST_ID,
	RGT_UNIT_EXTRACT_aud.AUDIT_KEY,sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "RGT_UNIT_EXTRACT_BU" ENABLE;
