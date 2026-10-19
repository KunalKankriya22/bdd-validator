--------------------------------------------------------
--  DDL for Trigger DRIVE_EQUIP_QC_DET_BI
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DRIVE_EQUIP_QC_DET_BI" 
BEFORE INSERT
ON DRIVE_EQUIP_QC_DET
FOR EACH ROW
BEGIN
 Declare
  v_audit_key number:=0;
BEGIN
  IF :new.program_id IS NULL THEN
    :new.program_id := 'MANUAL';
  END IF;
  IF :new.insert_user IS NULL THEN
     Select lt_user_session.get_userid into :new.insert_user
       from dual ;
  END IF;
  IF :new.insert_date IS NULL THEN
     :new.insert_date := SYSDATE;
  END IF;
    select audit_seq.nextval into v_audit_key from dual;
    :new.audit_key:=v_audit_key;

  /*---- Added by Seshu-- for laptop data extract- to add in the monitoring table */
    insert into download_monitor(TABLE_NAME,TABLE_AUDIT_KEY,TRANSACTION_MODE,EXTRACT_DATE)
                 values('DRIVE_EQUIP_QC_DET',v_audit_key,'I',null);
end;

end ;
/
ALTER TRIGGER "DRIVE_EQUIP_QC_DET_BI" ENABLE;
