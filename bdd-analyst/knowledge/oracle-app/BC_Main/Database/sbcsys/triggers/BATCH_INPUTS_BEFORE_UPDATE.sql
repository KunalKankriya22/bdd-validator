--------------------------------------------------------
--  DDL for Trigger BATCH_INPUTS_BEFORE_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "BATCH_INPUTS_BEFORE_UPDATE" 
BEFORE UPDATE
OF BATCH_ID
  ,CHAPTER_ID
  ,CONTRACT_ID
  ,CONTRACT_SUFFIX
  ,NUMBER_OF_UNITS
  ,PRODUCT_TYPE
  ,CARTON_COUNT
  ,AIRWAY_BILL_NO
  ,SHIPPED_DATE
  ,RECEIVED_DATE
  ,MIN_TEMP
  ,MAX_TEMP
  ,QC_DATE
  ,CHECKIN_USER_ID
  ,INSERT_DATS
  ,NOTE_ID
  ,RESULTS_QC_DATE
  ,RESULTS_QC_USER
  ,PROFILE_SEQ_NO
ON SBCSYS.BATCH_INPUTS
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
declare
    Batch_Input_aud	      BATCH_INPUTS%rowtype;
begin
    Batch_Input_aud.audit_key := :old.audit_key;
    if nvl(:old.BATCH_ID,'*') !=
       nvl(:new.BATCH_ID,'*')
    then
       Batch_Input_aud.BATCH_ID := nvl(:new.BATCH_ID,'*');
    end if;
    if nvl(:old.CHAPTER_ID,'*') !=
       nvl(:new.CHAPTER_ID,'*')
    then
       Batch_Input_aud.CHAPTER_ID := nvl(:new.CHAPTER_ID,'*');
    end if;
    if nvl(:old.CONTRACT_ID,'*') !=
       nvl(:new.CONTRACT_ID,'*')
    then
       Batch_Input_aud.CONTRACT_ID := nvl(:new.CONTRACT_ID,'*');
    end if;
    if nvl(:old.CONTRACT_SUFFIX,'*') !=
       nvl(:new.CONTRACT_SUFFIX,'*')
    then
       Batch_Input_aud.CONTRACT_SUFFIX := nvl(:new.CONTRACT_SUFFIX,'*');
    end if;
    if nvl(:old.NUMBER_OF_UNITS,-1) !=
       nvl(:new.NUMBER_OF_UNITS,-1)
    then
       Batch_Input_aud.NUMBER_OF_UNITS := nvl(:new.NUMBER_OF_UNITS,-1);
    end if;
    if nvl(:old.PRODUCT_TYPE,'*') !=
       nvl(:new.PRODUCT_TYPE,'*')
    then
       Batch_Input_aud.PRODUCT_TYPE := nvl(:new.PRODUCT_TYPE,'*');
    end if;
    if nvl(:old.CARTON_COUNT,-1) !=
       nvl(:new.CARTON_COUNT,-1)
    then
       Batch_Input_aud.CARTON_COUNT := nvl(:new.CARTON_COUNT,-1);
    end if;
    if nvl(:old.AIRWAY_BILL_NO,'*') !=
       nvl(:new.AIRWAY_BILL_NO,'*')
    then
       Batch_Input_aud.AIRWAY_BILL_NO := nvl(:new.AIRWAY_BILL_NO,'*');
    end if;
    if nvl(:old.SHIPPED_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.SHIPPED_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       Batch_Input_aud.SHIPPED_DATE := nvl(:new.SHIPPED_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.RECEIVED_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.RECEIVED_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       Batch_Input_aud.RECEIVED_DATE := nvl(:new.RECEIVED_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.MIN_TEMP,-1) !=
       nvl(:new.MIN_TEMP,-1)
    then
       Batch_Input_aud.MIN_TEMP := nvl(:new.MIN_TEMP,-1);
    end if;
    if nvl(:old.MAX_TEMP,-1) !=
       nvl(:new.MAX_TEMP,-1)
    then
       Batch_Input_aud.MAX_TEMP := nvl(:new.MAX_TEMP,-1);
    end if;
    if nvl(:old.QC_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.QC_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       Batch_Input_aud.QC_DATE := nvl(:new.QC_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.CHECKIN_USER_ID,'*') !=
       nvl(:new.CHECKIN_USER_ID,'*')
    then
       Batch_Input_aud.CHECKIN_USER_ID := nvl(:new.CHECKIN_USER_ID,'*');
    end if;
    if nvl(:old.INSERT_DATS,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.INSERT_DATS,to_date('01-JAN-33','DD-MON-YY'))
    then
       Batch_Input_aud.INSERT_DATS := nvl(:new.INSERT_DATS,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.NOTE_ID,-1) !=
       nvl(:new.NOTE_ID,-1)
    then
       Batch_Input_aud.NOTE_ID := nvl(:new.NOTE_ID,-1);
    end if;
    if nvl(:old.RESULTS_QC_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.RESULTS_QC_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       Batch_Input_aud.RESULTS_QC_DATE := nvl(:new.RESULTS_QC_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.RESULTS_QC_USER,'*') !=
       nvl(:new.RESULTS_QC_USER,'*')
    then
       Batch_Input_aud.RESULTS_QC_USER := nvl(:new.RESULTS_QC_USER,'*');
    end if;
    if nvl(:old.PROFILE_SEQ_NO,-1) !=
       nvl(:new.PROFILE_SEQ_NO,-1)
    then
       Batch_Input_aud.PROFILE_SEQ_NO := nvl(:new.PROFILE_SEQ_NO,-1);
    end if;

    --
    insert into BATCH_INPUTS_audit
    (
	BATCH_ID, CHAPTER_ID, CONTRACT_ID,
	CONTRACT_SUFFIX, NUMBER_OF_UNITS, PRODUCT_TYPE,
	CARTON_COUNT, AIRWAY_BILL_NO,
	SHIPPED_DATE, RECEIVED_DATE,
	MIN_TEMP, MAX_TEMP,
	QC_DATE,CHECKIN_USER_ID,
	INSERT_DATS, NOTE_ID, RESULTS_QC_DATE,
	RESULTS_QC_USER, PROFILE_SEQ_NO, AUDIT_KEY,
	audit_insert_dats, audit_insert_user
    )
    values
    (
	Batch_Input_aud.BATCH_ID, Batch_Input_aud.CHAPTER_ID, Batch_Input_aud.CONTRACT_ID,
	Batch_Input_aud.CONTRACT_SUFFIX, Batch_Input_aud.NUMBER_OF_UNITS, Batch_Input_aud.PRODUCT_TYPE,
	Batch_Input_aud.CARTON_COUNT, Batch_Input_aud.AIRWAY_BILL_NO,
	Batch_Input_aud.SHIPPED_DATE, Batch_Input_aud.RECEIVED_DATE,
	Batch_Input_aud.MIN_TEMP, Batch_Input_aud.MAX_TEMP,
	Batch_Input_aud.QC_DATE,Batch_Input_aud.CHECKIN_USER_ID,
	Batch_Input_aud.INSERT_DATS, Batch_Input_aud.NOTE_ID,Batch_Input_aud.RESULTS_QC_DATE,
	Batch_Input_aud.RESULTS_QC_USER, Batch_Input_aud.PROFILE_SEQ_NO, Batch_Input_aud.AUDIT_KEY,
	sysdate, lt_user_session.get_userid
    );
end;
/
ALTER TRIGGER "BATCH_INPUTS_BEFORE_UPDATE" ENABLE;
