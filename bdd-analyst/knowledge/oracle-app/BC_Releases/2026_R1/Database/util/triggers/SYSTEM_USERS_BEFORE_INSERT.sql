--------------------------------------------------------
--  DDL for Trigger SYSTEM_USERS_BEFORE_INSERT
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "SYSTEM_USERS_BEFORE_INSERT" 
before insert
on system_users
for each row
declare
      temp_audit_key      number(23);
begin
    if inserting
    then
            select audit_seq.nextval into temp_audit_key from dual;
            :new.audit_key := temp_audit_key;
    end if;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    :new.PASSWORD_MODIFIED_DATE := sysdate;
      :new.appl_password := null;

    insert into system_users_audit
      (
        USER_ID,CHAPTER_ID,STAFF_NO,
	USER_FIRST_NAME,USER_LAST_NAME,USER_INITIALS,
	TESTING_LAB_CODE,PRINT_ID,EFF_DATE,
	TERM_DATE,CUSTOMER_ID,WAREHOUSE_ID,
	APPL_PASSWORD,AUDIT_KEY,PROGRAM_ID,
	INSERT_USER,INSERT_DATE,USER_CLASS,
	AUDIT_INSERT_DATS,AUDIT_INSERT_USER,PASSWORD_MODIFIED_DATE,
	PASS_THRU, LIFETRAK_PASSWORD, EDI_PN_ID,
	IS_PASSWORD_LOCKED, RESET_REQUEST, LOCKOUT_DATE,
	KT_USER_ID, AD_USER_ID, PIN_NO, SKIP_AD,
	DEPARTMENT,PHONE,LAST_MODIFIED_DATE,
	REFRESH_TOKEN,ISSUED_DATE,EXPIRES_DATE
      )
      values
      (
            :new.user_id,:new.chapter_id,:new.staff_no,
            :new.user_first_name,:new.user_last_name, :new.user_initials,
            :new.testing_lab_code,:new.print_id,:new.eff_date,
	    :new.term_date,:new.CUSTOMER_ID, :new.WAREHOUSE_ID,
	    :new.APPL_PASSWORD, :new.audit_key, :new.program_id,
	    :new.INSERT_USER, :new.INSERT_DATE, :new.USER_CLASS,
	    sysdate, lt_user_session.get_userid, :new.PASSWORD_MODIFIED_DATE,
	    :new.PASS_THRU, :new.LIFETRAK_PASSWORD, :new.EDI_PN_ID,
	    :new.IS_PASSWORD_LOCKED, :new.RESET_REQUEST, :new.LOCKOUT_DATE,
	    :new.KT_USER_ID, :new.AD_USER_ID, :new.PIN_NO, :new.SKIP_AD,
	    :new.DEPARTMENT, :new.PHONE, :new.LAST_MODIFIED_DATE,
	    :new.REFRESH_TOKEN, :new.ISSUED_DATE, :new.EXPIRES_DATE
      );
end;
/
ALTER TRIGGER "SYSTEM_USERS_BEFORE_INSERT" ENABLE;
