--------------------------------------------------------
--  DDL for Trigger DONOR_INTERDICTIONS_BI
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONOR_INTERDICTIONS_BI" 
 BEFORE INSERT
 ON DONOR_INTERDICTIONS
 FOR EACH ROW
BEGIN
 Declare
  v_audit_key number:=0;
BEGIN
--select audit_seq.nextval into :new.audit_key from dual;
select audit_seq.nextval into v_audit_key from dual;
    :new.audit_key:=v_audit_key;
if :new.inter_code='RBC56' and :new.unit_id is not null then
:new.eff_date:=to_date(to_char(:new.eff_date,'MM-DD-YYYY')||' 23:59','MM-DD-YYYY HH24:MI');
end if;

/*---- Added by Touqeer -- for laptop data extract- to add in the monitoring table */
    insert into download_monitor(TABLE_NAME,TABLE_AUDIT_KEY,TRANSACTION_MODE,EXTRACT_DATE)
                 values('DONOR_INTERDICTIONS',v_audit_key,'I',null);


end ;

END;
/
ALTER TRIGGER "DONOR_INTERDICTIONS_BI" ENABLE;
