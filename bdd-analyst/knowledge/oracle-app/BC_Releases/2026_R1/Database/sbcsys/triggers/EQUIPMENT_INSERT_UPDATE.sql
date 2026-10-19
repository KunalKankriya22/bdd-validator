--------------------------------------------------------
--  DDL for Trigger EQUIPMENT_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "EQUIPMENT_INSERT_UPDATE" 
before insert  or update
on equipment
for each row
declare
      temp_audit_key	number(23);
begin
    if inserting
    then
		select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
		:new.audit_key := temp_audit_key;
    end if;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    :new.last_modified_date := sysdate;
	--
    insert into equipment_audit
       (INST_ID, CHAPTER_ID, EQUIP_TYPE, EQUIP_ID, EQUIP_REFERENCE,
	SERIAL_NUMBER, LOCATION, STATUS, IN_SERVICE_DATE   ,
	OUT_SERVICE_DATE  , MANUFACTURER, SERVICE_CONTACT,
	SERVICE_PHONE , SERVICE_START_DATE, SERVICE_END_DATE  ,
	NOTE_ID, LAST_MODIFIED_DATE, MODIFIED_BY, PROGRAM_ID,
	AUDIT_KEY, AUDIT_INSERT_USER, AUDIT_INSERT_DATE)
	values
	(
	:new.INST_ID, :new.CHAPTER_ID, :new.EQUIP_TYPE, :new.EQUIP_ID,
	:new.EQUIP_REFERENCE,
	:new.SERIAL_NUMBER, :new.LOCATION, :new.STATUS, :new.IN_SERVICE_DATE   ,
	:new.OUT_SERVICE_DATE  , :new.MANUFACTURER, :new.SERVICE_CONTACT,
	:new.SERVICE_PHONE , :new.SERVICE_START_DATE, :new.SERVICE_END_DATE  ,
	:new.NOTE_ID, :new.LAST_MODIFIED_DATE, :new.MODIFIED_BY,
	:new.PROGRAM_ID, :new.AUDIT_KEY, lt_user_session.get_userid, sysdate
	);
end;
/
ALTER TRIGGER "EQUIPMENT_INSERT_UPDATE" ENABLE;
