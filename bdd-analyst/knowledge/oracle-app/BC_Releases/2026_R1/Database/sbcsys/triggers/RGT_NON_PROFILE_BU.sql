--------------------------------------------------------
--  DDL for Trigger RGT_NON_PROFILE_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_NON_PROFILE_BU" 
BEFORE UPDATE
OF CONTRACT_ID
  ,CHAPTER_ID
  ,TEST_ID
  ,EFF_DATE
  ,TERM_DATE
  ,LAST_MODIFIED_DATE
  ,LAST_MODIFIED_USER
  ,TEST_GROUP
  ,PROGRAM_ID
  ON SBCSYS.RGT_NON_PROFILE
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
declare
    RGT_NON_PROFILE_aud	      RGT_NON_PROFILE_AUDIT%rowtype;
begin
    RGT_NON_PROFILE_aud.audit_key := :old.audit_key;
    RGT_NON_PROFILE_aud.program_id := :new.program_id;
    if nvl(:old.CONTRACT_ID,'*') !=
       nvl(:new.CONTRACT_ID,'*')
    then
       RGT_NON_PROFILE_aud.CONTRACT_ID:= nvl(:new.CONTRACT_ID,'*');
    end if;
    if nvl(:old.CHAPTER_ID,'*') !=
       nvl(:new.CHAPTER_ID,'*')
    then
       RGT_NON_PROFILE_aud.CHAPTER_ID:= nvl(:new.CHAPTER_ID,'*');
    end if;
    if nvl(:old.TEST_ID,'*') !=
       nvl(:new.TEST_ID,'*')
    then
       RGT_NON_PROFILE_aud.TEST_ID:= nvl(:new.TEST_ID,'*');
    end if;
    if nvl(:old.EFF_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.EFF_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_NON_PROFILE_aud.EFF_DATE:= nvl(:new.EFF_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.TERM_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.TERM_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_NON_PROFILE_aud.TERM_DATE:= nvl(:new.TERM_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.LAST_MODIFIED_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.LAST_MODIFIED_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_NON_PROFILE_aud.LAST_MODIFIED_DATE:= nvl(:new.LAST_MODIFIED_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.LAST_MODIFIED_USER,'*') !=
       nvl(:new.LAST_MODIFIED_USER,'*')
    then
       RGT_NON_PROFILE_aud.LAST_MODIFIED_USER:= nvl(:new.LAST_MODIFIED_USER,'*');
    end if;
    if nvl(:old.TEST_GROUP,'*') !=
       nvl(:new.TEST_GROUP,'*')
    then
       RGT_NON_PROFILE_aud.TEST_GROUP:= nvl(:new.TEST_GROUP,'*');
    end if;

    --
    insert into RGT_NON_PROFILE_AUDIT
    (
	CONTRACT_ID, CHAPTER_ID, TEST_ID,
	EFF_DATE, TERM_DATE, LAST_MODIFIED_DATE,
	LAST_MODIFIED_USER, TEST_GROUP, AUDIT_KEY,PROGRAM_ID,
	AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	RGT_NON_PROFILE_aud.CONTRACT_ID, RGT_NON_PROFILE_aud.CHAPTER_ID, RGT_NON_PROFILE_aud.TEST_ID,
	RGT_NON_PROFILE_aud.EFF_DATE, RGT_NON_PROFILE_aud.TERM_DATE, RGT_NON_PROFILE_aud.LAST_MODIFIED_DATE,
	RGT_NON_PROFILE_aud.LAST_MODIFIED_USER, RGT_NON_PROFILE_aud.TEST_GROUP, RGT_NON_PROFILE_aud.AUDIT_KEY, RGT_NON_PROFILE_aud.PROGRAM_ID,
	sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "RGT_NON_PROFILE_BU" ENABLE;
