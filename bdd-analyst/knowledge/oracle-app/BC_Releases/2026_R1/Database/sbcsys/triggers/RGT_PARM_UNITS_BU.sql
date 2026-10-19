--------------------------------------------------------
--  DDL for Trigger RGT_PARM_UNITS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RGT_PARM_UNITS_BU" 
BEFORE UPDATE
OF CHAPTER_ID
  ,UNIT_ID
  ,PARM_ID
  ,CONTRACT_ID
  ON SBCSYS.RGT_PARM_UNITS
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
declare
    RGT_PARM_UNITS_aud	      RGT_PARM_UNITS_AUDIT%rowtype;
begin
    RGT_PARM_UNITS_aud.audit_key := :old.audit_key;
    if nvl(:old.CHAPTER_ID,'*') !=
       nvl(:new.CHAPTER_ID,'*')
    then
       RGT_PARM_UNITS_aud.CHAPTER_ID:= nvl(:new.CHAPTER_ID,'*');
    end if;
    if nvl(:old.UNIT_ID,'*') !=
       nvl(:new.UNIT_ID,'*')
    then
       RGT_PARM_UNITS_aud.UNIT_ID:= nvl(:new.UNIT_ID,'*');
    end if;
    if nvl(:old.PARM_ID,'*') !=
       nvl(:new.PARM_ID,'*')
    then
       RGT_PARM_UNITS_aud.PARM_ID:= nvl(:new.PARM_ID,'*');
    end if;
    if nvl(:old.CONTRACT_ID,'*') !=
       nvl(:new.CONTRACT_ID,'*')
    then
       RGT_PARM_UNITS_aud.CONTRACT_ID:= nvl(:new.CONTRACT_ID,'*');
    end if;

    --
    insert into RGT_PARM_UNITS_AUDIT
    (
	CHAPTER_ID, UNIT_ID, PARM_ID,
	CONTRACT_ID, AUDIT_KEY,
	AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	RGT_PARM_UNITS_aud.CHAPTER_ID, RGT_PARM_UNITS_aud.UNIT_ID, RGT_PARM_UNITS_aud.PARM_ID,
	RGT_PARM_UNITS_aud.CONTRACT_ID, RGT_PARM_UNITS_aud.AUDIT_KEY,
	sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "RGT_PARM_UNITS_BU" ENABLE;
