--------------------------------------------------------
--  DDL for Trigger TEST_BAND_HEADER_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "TEST_BAND_HEADER_BU" 
BEFORE UPDATE
OF UNIT_ID
  ,COLL_DATE
  ,CHAPTER_ID
  ,TB_ID
  ,TEST_ID
  ,TB_SEQ_NO
  ,TEST_CHAPTER_ID
  ,TECH1_USER
  ,TECH1_DATE
  ,TECH2_USER
  ,TECH2_DATE
  ,SUPER_USER
  ,SUPER_DATE
  ,RECON_FLAG
  ,TECH1_INTP
  ,TECH2_INTP
  ,SUPER_INTP
  ,NOTE_ID
  ,TEST_TYPE
  ,CTRL_VAL  ON SBCSYS.TEST_BAND_HEADER
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
declare
    TEST_BAND_HEADER_aud	      TEST_BAND_HEADER_AUDIT%rowtype;
begin
    TEST_BAND_HEADER_aud.audit_key := :old.audit_key;
    TEST_BAND_HEADER_aud.program_id := :new.program_id;
    if nvl(:old.UNIT_ID,'*') !=
       nvl(:new.UNIT_ID,'*')
    then
       TEST_BAND_HEADER_aud.UNIT_ID:= nvl(:new.UNIT_ID,'*');
    end if;
    if nvl(:old.COLL_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.COLL_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       TEST_BAND_HEADER_aud.COLL_DATE := nvl(:new.COLL_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.CHAPTER_ID,'*') !=
       nvl(:new.CHAPTER_ID,'*')
    then
       TEST_BAND_HEADER_aud.CHAPTER_ID:= nvl(:new.CHAPTER_ID,'*');
    end if;
    if nvl(:old.TB_ID,'*') !=
       nvl(:new.TB_ID,'*')
    then
       TEST_BAND_HEADER_aud.TB_ID:= nvl(:new.TB_ID,'*');
    end if;
    if nvl(:old.TEST_ID,'*') !=
       nvl(:new.TEST_ID,'*')
    then
       TEST_BAND_HEADER_aud.TEST_ID:= nvl(:new.TEST_ID,'*');
    end if;
    if nvl(:old.TB_SEQ_NO,-1) !=
       nvl(:new.TB_SEQ_NO,-1)
    then
       TEST_BAND_HEADER_aud.TB_SEQ_NO := nvl(:new.TB_SEQ_NO,-1);
    end if;
    if nvl(:old.TEST_CHAPTER_ID,'*') !=
       nvl(:new.TEST_CHAPTER_ID,'*')
    then
       TEST_BAND_HEADER_aud.TEST_CHAPTER_ID:= nvl(:new.TEST_CHAPTER_ID,'*');
    end if;
    if nvl(:old.TECH1_USER,'*') !=
       nvl(:new.TECH1_USER,'*')
    then
       TEST_BAND_HEADER_aud.TECH1_USER:= nvl(:new.TECH1_USER,'*');
    end if;
    if nvl(:old.TECH1_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.TECH1_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       TEST_BAND_HEADER_aud.TECH1_DATE := nvl(:new.TECH1_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.TECH2_USER,'*') !=
       nvl(:new.TECH2_USER,'*')
    then
       TEST_BAND_HEADER_aud.TECH2_USER:= nvl(:new.TECH2_USER,'*');
    end if;
    if nvl(:old.TECH2_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.TECH2_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       TEST_BAND_HEADER_aud.TECH2_DATE := nvl(:new.TECH1_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.SUPER_USER,'*') !=
       nvl(:new.SUPER_USER,'*')
    then
       TEST_BAND_HEADER_aud.SUPER_USER:= nvl(:new.SUPER_USER,'*');
    end if;
    if nvl(:old.SUPER_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.SUPER_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       TEST_BAND_HEADER_aud.SUPER_DATE := nvl(:new.SUPER_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.RECON_FLAG,'*') !=
       nvl(:new.RECON_FLAG,'*')
    then
       TEST_BAND_HEADER_aud.RECON_FLAG:= nvl(:new.RECON_FLAG,'*');
    end if;
    if nvl(:old.TECH1_INTP,'*') !=
       nvl(:new.TECH1_INTP,'*')
    then
       TEST_BAND_HEADER_aud.TECH1_INTP:= nvl(:new.TECH1_INTP,'*');
    end if;
    if nvl(:old.TECH2_INTP,'*') !=
       nvl(:new.TECH2_INTP,'*')
    then
       TEST_BAND_HEADER_aud.TECH2_INTP:= nvl(:new.TECH2_INTP,'*');
    end if;
    if nvl(:old.SUPER_INTP,'*') !=
       nvl(:new.SUPER_INTP,'*')
    then
       TEST_BAND_HEADER_aud.SUPER_INTP:= nvl(:new.SUPER_INTP,'*');
    end if;
    if nvl(:old.NOTE_ID,-1) !=
       nvl(:new.NOTE_ID,-1)
    then
       TEST_BAND_HEADER_aud.NOTE_ID:= nvl(:new.NOTE_ID,-1);
    end if;
    if nvl(:old.TEST_TYPE,'*') !=
       nvl(:new.TEST_TYPE,'*')
    then
       TEST_BAND_HEADER_aud.TEST_TYPE:= nvl(:new.TEST_TYPE,'*');
    end if;
    if nvl(:old.CTRL_VAL,'*') !=
       nvl(:new.CTRL_VAL,'*')
    then
       TEST_BAND_HEADER_aud.CTRL_VAL:= nvl(:new.CTRL_VAL,'*');
    end if;


    --
    insert into TEST_BAND_HEADER_AUDIT
    (
	UNIT_ID, COLL_DATE, CHAPTER_ID,
	TB_ID, TEST_ID, TB_SEQ_NO,
	TEST_CHAPTER_ID, TECH1_USER, TECH1_DATE,
	TECH2_USER, TECH2_DATE, SUPER_USER,
	SUPER_DATE, RECON_FLAG, TECH1_INTP,
	TECH2_INTP, SUPER_INTP, PROGRAM_ID,
	NOTE_ID, TEST_TYPE, CTRL_VAL,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	TEST_BAND_HEADER_aud.UNIT_ID, TEST_BAND_HEADER_aud.COLL_DATE, TEST_BAND_HEADER_aud.CHAPTER_ID,
	TEST_BAND_HEADER_aud.TB_ID, TEST_BAND_HEADER_aud.TEST_ID, TEST_BAND_HEADER_aud.TB_SEQ_NO,
	TEST_BAND_HEADER_aud.TEST_CHAPTER_ID, TEST_BAND_HEADER_aud.TECH1_USER, TEST_BAND_HEADER_aud.TECH1_DATE,
	TEST_BAND_HEADER_aud.TECH2_USER, TEST_BAND_HEADER_aud.TECH2_DATE, TEST_BAND_HEADER_aud.SUPER_USER,
	TEST_BAND_HEADER_aud.SUPER_DATE, TEST_BAND_HEADER_aud.RECON_FLAG, TEST_BAND_HEADER_aud.TECH1_INTP,
	TEST_BAND_HEADER_aud.TECH2_INTP, TEST_BAND_HEADER_aud.SUPER_INTP, TEST_BAND_HEADER_aud.PROGRAM_ID,
	TEST_BAND_HEADER_aud.NOTE_ID, TEST_BAND_HEADER_aud.TEST_TYPE, TEST_BAND_HEADER_aud.CTRL_VAL,
	TEST_BAND_HEADER_aud.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "TEST_BAND_HEADER_BU" ENABLE;
