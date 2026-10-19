--------------------------------------------------------
--  DDL for Trigger RSM_RPT_PARM_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RSM_RPT_PARM_BI" 
before insert
on RSM_RPT_PARM
for each row
declare
    temp_audit_key    number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
           --
    insert into RSM_RPT_PARM_AUDIT
    (
	APPL_ID, USER_NAME, REPORT_NAME,
	RESULT_PARM_ID, REPORT_ID, SUBMIT_DATE,
	REPORT_STATUS, REPORT_FILE_NAME, PRINT_REQUEST_FLAG,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.APPL_ID, :new.USER_NAME, :new.REPORT_NAME,
	:new.RESULT_PARM_ID, :new.REPORT_ID, :new.SUBMIT_DATE,
	:new.REPORT_STATUS, :new.REPORT_FILE_NAME, :new.PRINT_REQUEST_FLAG,
	:new.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "RSM_RPT_PARM_BI" ENABLE;
