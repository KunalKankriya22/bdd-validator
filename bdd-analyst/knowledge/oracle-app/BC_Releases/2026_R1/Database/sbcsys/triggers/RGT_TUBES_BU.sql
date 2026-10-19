--------------------------------------------------------
--  DDL for Trigger RGT_TUBES_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_TUBES_BU" 
BEFORE UPDATE
OF CHAPTER_ID
  ,CONTRACT_ID
  ,CBC_UNIT_ID
  ,UNIT_ID
  ,TUBE_CHECK_IN_DATE
  ,RED1_FLAG
  ,RED2_FLAG
  ,PURPLE1_FLAG
  ,PURPLE2_FLAG
  ,PROGRAM_ID
  ,BATCH_ID
  ,USER_ID
  ON SBCSYS.RGT_TUBES
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
declare
    RGT_TUBES_aud	      RGT_TUBES_AUDIT%rowtype;
begin
    RGT_TUBES_aud.audit_key := :old.audit_key;
    RGT_TUBES_aud.program_id := :new.program_id;
    if nvl(:old.CHAPTER_ID,'*') !=
       nvl(:new.CHAPTER_ID,'*')
    then
       RGT_TUBES_aud.CHAPTER_ID:= nvl(:new.CHAPTER_ID,'*');
    end if;
    if nvl(:old.CONTRACT_ID,'*') !=
       nvl(:new.CONTRACT_ID,'*')
    then
       RGT_TUBES_aud.CONTRACT_ID:= nvl(:new.CONTRACT_ID,'*');
    end if;
    if nvl(:old.CBC_UNIT_ID,'*') !=
       nvl(:new.CBC_UNIT_ID,'*')
    then
       RGT_TUBES_aud.UNIT_ID:= nvl(:new.CBC_UNIT_ID,'*');
    end if;
    if nvl(:old.UNIT_ID,'*') !=
       nvl(:new.UNIT_ID,'*')
    then
       RGT_TUBES_aud.UNIT_ID:= nvl(:new.UNIT_ID,'*');
    end if;
    if nvl(:old.TUBE_CHECK_IN_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.TUBE_CHECK_IN_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_TUBES_aud.TUBE_CHECK_IN_DATE := nvl(:new.TUBE_CHECK_IN_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.RED1_FLAG,'*') !=
       nvl(:new.RED1_FLAG,'*')
    then
       RGT_TUBES_aud.RED1_FLAG:= nvl(:new.RED1_FLAG,'*');
    end if;
    if nvl(:old.RED2_FLAG,'*') !=
       nvl(:new.RED2_FLAG,'*')
    then
       RGT_TUBES_aud.RED2_FLAG:= nvl(:new.RED2_FLAG,'*');
    end if;
    if nvl(:old.PURPLE1_FLAG,'*') !=
       nvl(:new.PURPLE1_FLAG,'*')
    then
       RGT_TUBES_aud.PURPLE1_FLAG:= nvl(:new.PURPLE1_FLAG,'*');
    end if;
    if nvl(:old.PURPLE2_FLAG,'*') !=
       nvl(:new.PURPLE2_FLAG,'*')
    then
       RGT_TUBES_aud.PURPLE2_FLAG:= nvl(:new.PURPLE2_FLAG,'*');
    end if;
    if nvl(:old.BATCH_ID,'*') !=
       nvl(:new.BATCH_ID,'*')
    then
       RGT_TUBES_aud.BATCH_ID:= nvl(:new.BATCH_ID,'*');
    end if;
    if nvl(:old.USER_ID,'*') !=
       nvl(:new.USER_ID,'*')
    then
       RGT_TUBES_aud.USER_ID:= nvl(:new.USER_ID,'*');
    end if;

    --
    insert into RGT_TUBES_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, CBC_UNIT_ID,
	UNIT_ID, TUBE_CHECK_IN_DATE, RED1_FLAG,
	RED2_FLAG, PURPLE1_FLAG, PURPLE2_FLAG,
	PROGRAM_ID, BATCH_ID, USER_ID,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	RGT_TUBES_aud.CHAPTER_ID, RGT_TUBES_aud.CONTRACT_ID, RGT_TUBES_aud.CBC_UNIT_ID,
	RGT_TUBES_aud.UNIT_ID, RGT_TUBES_aud.TUBE_CHECK_IN_DATE, RGT_TUBES_aud.RED1_FLAG,
	RGT_TUBES_aud.RED2_FLAG, RGT_TUBES_aud.PURPLE1_FLAG, RGT_TUBES_aud.PURPLE2_FLAG,
	RGT_TUBES_aud.PROGRAM_ID, RGT_TUBES_aud.BATCH_ID, RGT_TUBES_aud.USER_ID,
	RGT_TUBES_aud.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "RGT_TUBES_BU" ENABLE;
