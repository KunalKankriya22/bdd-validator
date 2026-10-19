--------------------------------------------------------
--  DDL for Trigger RGT_SCHEDULE_EXTRACT_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_SCHEDULE_EXTRACT_BU" 
BEFORE UPDATE
OF FILE_NAME
  ,EXTRACT_DATE_TIME
  ,STATUS
  ,CHAPTER_ID
  ,CONTRACT_ID
  ,RESULT_PARM_ID
  ON SBCSYS.RGT_SCHEDULE_EXTRACT
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
declare
    RGT_SCHEDULE_EXTRACT_aud	      RGT_SCHEDULE_EXTRACT_AUDIT%rowtype;
begin
    RGT_SCHEDULE_EXTRACT_aud.audit_key := :old.audit_key;
    if nvl(:old.FILE_NAME,'*') !=
       nvl(:new.FILE_NAME,'*')
    then
       RGT_SCHEDULE_EXTRACT_aud.FILE_NAME:= nvl(:new.FILE_NAME,'*');
    end if;
    if nvl(:old.EXTRACT_DATE_TIME,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.EXTRACT_DATE_TIME,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_SCHEDULE_EXTRACT_aud.EXTRACT_DATE_TIME := nvl(:new.EXTRACT_DATE_TIME,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.STATUS,'*') !=
       nvl(:new.STATUS,'*')
    then
       RGT_SCHEDULE_EXTRACT_aud.STATUS:= nvl(:new.STATUS,'*');
    end if;
    if nvl(:old.CHAPTER_ID,'*') !=
       nvl(:new.CHAPTER_ID,'*')
    then
       RGT_SCHEDULE_EXTRACT_aud.CHAPTER_ID:= nvl(:new.CHAPTER_ID,'*');
    end if;
    if nvl(:old.CONTRACT_ID,'*') !=
       nvl(:new.CONTRACT_ID,'*')
    then
       RGT_SCHEDULE_EXTRACT_aud.CONTRACT_ID:= nvl(:new.CONTRACT_ID,'*');
    end if;
    if nvl(:old.RESULT_PARM_ID,'*') !=
       nvl(:new.RESULT_PARM_ID,'*')
    then
       RGT_SCHEDULE_EXTRACT_aud.RESULT_PARM_ID:= nvl(:new.RESULT_PARM_ID,'*');
    end if;

    --
    insert into RGT_SCHEDULE_EXTRACT_AUDIT
    (
	FILE_NAME, EXTRACT_DATE_TIME, STATUS,
	CHAPTER_ID, CONTRACT_ID, RESULT_PARM_ID,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	RGT_SCHEDULE_EXTRACT_aud.FILE_NAME, RGT_SCHEDULE_EXTRACT_aud.EXTRACT_DATE_TIME, RGT_SCHEDULE_EXTRACT_aud.STATUS,
	RGT_SCHEDULE_EXTRACT_aud.CHAPTER_ID, RGT_SCHEDULE_EXTRACT_aud.CONTRACT_ID, RGT_SCHEDULE_EXTRACT_aud.RESULT_PARM_ID,
	RGT_SCHEDULE_EXTRACT_aud.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "RGT_SCHEDULE_EXTRACT_BU" ENABLE;
