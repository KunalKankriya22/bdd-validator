--------------------------------------------------------
--  DDL for Trigger VALID_PHYSICAL_EQUIP_CONFIG_BI
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "VALID_PHYSICAL_EQUIP_CONFIG_BI" 
BEFORE INSERT
ON VALID_PHYSICAL_EQUIP_CONFIG
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
                 values('VALID_PHYSICAL_EQUIP_CONFIG',v_audit_key,'I',null);
end;

end ;
/
ALTER TRIGGER "VALID_PHYSICAL_EQUIP_CONFIG_BI" ENABLE;
