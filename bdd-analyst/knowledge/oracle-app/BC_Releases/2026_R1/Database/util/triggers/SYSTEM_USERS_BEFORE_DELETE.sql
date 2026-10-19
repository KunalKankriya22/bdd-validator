--------------------------------------------------------
--  DDL for Trigger SYSTEM_USERS_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "SYSTEM_USERS_BEFORE_DELETE" 
before delete
on system_users
for each row
begin

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
	DEPARTMENT, PHONE, LAST_MODIFIED_DATE,
	REFRESH_TOKEN, ISSUED_DATE, EXPIRES_DATE

      )
      values
      (
            :old.user_id,:old.chapter_id,:old.staff_no,
            :old.user_first_name,:old.user_last_name, :old.user_initials,
            :old.testing_lab_code,:old.print_id,:old.eff_date,
	    :old.term_date,:old.CUSTOMER_ID, :old.WAREHOUSE_ID,
	    :old.APPL_PASSWORD, :old.audit_key, :old.program_id,
	    :old.INSERT_USER, :old.INSERT_DATE, :old.USER_CLASS,
	    sysdate, lt_user_session.get_userid, :old.PASSWORD_MODIFIED_DATE,
	    :old.PASS_THRU, :old.LIFETRAK_PASSWORD, :old.EDI_PN_ID,
	    :old.IS_PASSWORD_LOCKED, :old.RESET_REQUEST, :old.LOCKOUT_DATE,
	    :old.KT_USER_ID, :old.AD_USER_ID, :old.PIN_NO, :old.SKIP_AD,
	    :old.DEPARTMENT, :old.PHONE, :old.LAST_MODIFIED_DATE,
	    :old.REFRESH_TOKEN, :old.ISSUED_DATE, :old.EXPIRES_DATE

      );
end;
/
ALTER TRIGGER "SYSTEM_USERS_BEFORE_DELETE" ENABLE;
