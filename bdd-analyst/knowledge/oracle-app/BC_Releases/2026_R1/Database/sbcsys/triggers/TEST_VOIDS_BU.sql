--------------------------------------------------------
--  DDL for Trigger TEST_VOIDS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "TEST_VOIDS_BU" 
BEFORE UPDATE
OF UNIT_ID
  ,COLL_DATE
  ,CHAPTER_ID
  ,TEST_SEQ_NO
  ,TEST_ID
  ,TEST_STATE
  ,TEST_MODE
  ,RESULT_STATUS_1
  ,RESULT_STATUS_2
  ,EDIT_RESULT_FLAG
  ,TB_ID
  ,TEST_CHAPTER_ID
  ,TB_SEQ_NO
  ,WELL_NUMBER
  ,ABSORBANCE
  ,RATIO
  ,RESULT_DATS
  ,RESULT_USER_ID
  ,TESTING_LAB_CODE
  ,INSERT_DATS
  ,INSERT_USER_ID
  ,VOID_TYPE
  ,VOID_REASON_CODE
  ,VOID_DATS
  ,VOID_USER_ID  ON SBCSYS.TEST_VOIDS
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
declare
    TEST_VOIDS_aud	      TEST_VOIDS_AUDIT%rowtype;
begin
    TEST_VOIDS_aud.audit_key := :old.audit_key;
    if nvl(:old.UNIT_ID,'*') !=
       nvl(:new.UNIT_ID,'*')
    then
       TEST_VOIDS_aud.UNIT_ID:= nvl(:new.UNIT_ID,'*');
    end if;
    if nvl(:old.COLL_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.COLL_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       TEST_VOIDS_aud.COLL_DATE := nvl(:new.COLL_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.CHAPTER_ID,'*') !=
       nvl(:new.CHAPTER_ID,'*')
    then
       TEST_VOIDS_aud.CHAPTER_ID:= nvl(:new.CHAPTER_ID,'*');
    end if;
    if nvl(:old.TEST_SEQ_NO,-1) !=
       nvl(:new.TEST_SEQ_NO,-1)
    then
       TEST_VOIDS_aud.TEST_SEQ_NO:= nvl(:new.TEST_SEQ_NO,-1);
    end if;
    if nvl(:old.TEST_ID,'*') !=
       nvl(:new.TEST_ID,'*')
    then
       TEST_VOIDS_aud.TEST_ID:= nvl(:new.TEST_ID,'*');
    end if;
    if nvl(:old.TEST_STATE,'*') !=
       nvl(:new.TEST_STATE,'*')
    then
       TEST_VOIDS_aud.TEST_STATE:= nvl(:new.TEST_STATE,'*');
    end if;
    if nvl(:old.TEST_MODE,'*') !=
       nvl(:new.TEST_MODE,'*')
    then
       TEST_VOIDS_aud.TEST_MODE:= nvl(:new.TEST_MODE,'*');
    end if;
    if nvl(:old.RESULT_STATUS_1,'*') !=
       nvl(:new.RESULT_STATUS_1,'*')
    then
       TEST_VOIDS_aud.RESULT_STATUS_1:= nvl(:new.RESULT_STATUS_1,'*');
    end if;
    if nvl(:old.RESULT_STATUS_2,'*') !=
       nvl(:new.RESULT_STATUS_2,'*')
    then
       TEST_VOIDS_aud.RESULT_STATUS_2:= nvl(:new.RESULT_STATUS_2,'*');
    end if;
    if nvl(:old.EDIT_RESULT_FLAG,'*') !=
       nvl(:new.EDIT_RESULT_FLAG,'*')
    then
       TEST_VOIDS_aud.EDIT_RESULT_FLAG:= nvl(:new.EDIT_RESULT_FLAG,'*');
    end if;
   if nvl(:old.TB_ID,'*') !=
       nvl(:new.TB_ID,'*')
    then
       TEST_VOIDS_aud.TB_ID:= nvl(:new.TB_ID,'*');
    end if;
    if nvl(:old.TEST_CHAPTER_ID,'*') !=
       nvl(:new.TEST_CHAPTER_ID,'*')
    then
       TEST_VOIDS_aud.TEST_CHAPTER_ID:= nvl(:new.TEST_CHAPTER_ID,'*');
    end if;
    if nvl(:old.TB_SEQ_NO,-1) !=
       nvl(:new.TB_SEQ_NO,-1)
    then
       TEST_VOIDS_aud.TB_SEQ_NO:= nvl(:new.TB_SEQ_NO,-1);
    end if;
    if nvl(:old.WELL_NUMBER,'*') !=
       nvl(:new.WELL_NUMBER,'*')
    then
       TEST_VOIDS_aud.WELL_NUMBER:= nvl(:new.WELL_NUMBER,'*');
    end if;
    if nvl(:old.ABSORBANCE,'*') !=
       nvl(:new.ABSORBANCE,'*')
    then
       TEST_VOIDS_aud.ABSORBANCE:= nvl(:new.ABSORBANCE,'*');
    end if;
    if nvl(:old.RATIO,'*') !=
       nvl(:new.RATIO,'*')
    then
       TEST_VOIDS_aud.RATIO:= nvl(:new.RATIO,'*');
    end if;
    if nvl(:old.RESULT_DATS,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.RESULT_DATS,to_date('01-JAN-33','DD-MON-YY'))
    then
       TEST_VOIDS_aud.RESULT_DATS := nvl(:new.RESULT_DATS,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.RESULT_USER_ID,'*') !=
       nvl(:new.RESULT_USER_ID,'*')
    then
       TEST_VOIDS_aud.RESULT_USER_ID:= nvl(:new.RESULT_USER_ID,'*');
    end if;
    if nvl(:old.TESTING_LAB_CODE,'*') !=
       nvl(:new.TESTING_LAB_CODE,'*')
    then
       TEST_VOIDS_aud.TESTING_LAB_CODE:= nvl(:new.TESTING_LAB_CODE,'*');
    end if;
    if nvl(:old.INSERT_DATS,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.INSERT_DATS,to_date('01-JAN-33','DD-MON-YY'))
    then
       TEST_VOIDS_aud.INSERT_DATS := nvl(:new.INSERT_DATS,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.INSERT_USER_ID,'*') !=
       nvl(:new.INSERT_USER_ID,'*')
    then
       TEST_VOIDS_aud.INSERT_USER_ID:= nvl(:new.INSERT_USER_ID,'*');
    end if;
    if nvl(:old.VOID_TYPE,'*') !=
       nvl(:new.VOID_TYPE,'*')
    then
       TEST_VOIDS_aud.VOID_TYPE:= nvl(:new.VOID_TYPE,'*');
    end if;
    if nvl(:old.VOID_REASON_CODE,'*') !=
       nvl(:new.VOID_REASON_CODE,'*')
    then
       TEST_VOIDS_aud.VOID_REASON_CODE:= nvl(:new.VOID_REASON_CODE,'*');
    end if;
    if nvl(:old.VOID_DATS,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.VOID_DATS,to_date('01-JAN-33','DD-MON-YY'))
    then
       TEST_VOIDS_aud.VOID_DATS := nvl(:new.VOID_DATS,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.VOID_USER_ID,'*') !=
       nvl(:new.VOID_USER_ID,'*')
    then
       TEST_VOIDS_aud.VOID_USER_ID:= nvl(:new.VOID_USER_ID,'*');
    end if;


    --
    insert into TEST_VOIDS_AUDIT
    (
	UNIT_ID, COLL_DATE, CHAPTER_ID,
	TEST_SEQ_NO, TEST_ID, TEST_STATE,
	TEST_MODE, RESULT_STATUS_1, RESULT_STATUS_2,
	EDIT_RESULT_FLAG, TB_ID, TEST_CHAPTER_ID,
	TB_SEQ_NO, WELL_NUMBER, ABSORBANCE,
	RATIO, RESULT_DATS, RESULT_USER_ID,
	TESTING_LAB_CODE, INSERT_DATS, INSERT_USER_ID,
	VOID_TYPE, VOID_REASON_CODE, VOID_DATS, VOID_USER_ID,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	TEST_VOIDS_aud.UNIT_ID, TEST_VOIDS_aud.COLL_DATE, TEST_VOIDS_aud.CHAPTER_ID,
	TEST_VOIDS_aud.TEST_SEQ_NO, TEST_VOIDS_aud.TEST_ID, TEST_VOIDS_aud.TEST_STATE,
	TEST_VOIDS_aud.TEST_MODE, TEST_VOIDS_aud.RESULT_STATUS_1, TEST_VOIDS_aud.RESULT_STATUS_2,
	TEST_VOIDS_aud.EDIT_RESULT_FLAG, TEST_VOIDS_aud.TB_ID, TEST_VOIDS_aud.TEST_CHAPTER_ID,
	TEST_VOIDS_aud.TB_SEQ_NO, TEST_VOIDS_aud.WELL_NUMBER, TEST_VOIDS_aud.ABSORBANCE,
	TEST_VOIDS_aud.RATIO, TEST_VOIDS_aud.RESULT_DATS, TEST_VOIDS_aud.RESULT_USER_ID,
	TEST_VOIDS_aud.TESTING_LAB_CODE, TEST_VOIDS_aud.INSERT_DATS, TEST_VOIDS_aud.INSERT_USER_ID,
	TEST_VOIDS_aud.VOID_TYPE, TEST_VOIDS_aud.VOID_REASON_CODE, TEST_VOIDS_aud.VOID_DATS, TEST_VOIDS_aud.VOID_USER_ID,
	TEST_VOIDS_aud.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "TEST_VOIDS_BU" ENABLE;
