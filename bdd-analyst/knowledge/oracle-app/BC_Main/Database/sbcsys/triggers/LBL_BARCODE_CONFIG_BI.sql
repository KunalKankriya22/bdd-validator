--------------------------------------------------------
--  DDL for Trigger LBL_BARCODE_CONFIG_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "LBL_BARCODE_CONFIG_BI" 
before insert
on SBCSYS.LBL_BARCODE_CONFIG
for each row
declare
    temp_audit_key    number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
        --
    insert into LBL_BARCODE_CONFIG_audit
    (
        BARCODE_VALUE, TEST_ID, RESULT_CODE,
        AUDIT_KEY, EFF_DATE, TERM_DATE, INSERT_DATE,
	INSERT_USER, PROGRAM_ID, AUDIT_INSERT_DATS,AUDIT_INSERT_USER,PRIORITY_SEQ
    )
    values
    (
        :new.BARCODE_VALUE, :new.TEST_ID, :new.RESULT_CODE,
        :new.AUDIT_KEY, :new.EFF_DATE, :new.TERM_DATE, :new.INSERT_DATE,
	:new.INSERT_USER, :new.PROGRAM_ID, sysdate, lt_user_session.get_userid, :new.PRIORITY_SEQ
    );
    end;
/
ALTER TRIGGER "LBL_BARCODE_CONFIG_BI" ENABLE;
