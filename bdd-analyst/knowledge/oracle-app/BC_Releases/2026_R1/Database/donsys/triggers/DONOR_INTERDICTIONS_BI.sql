--------------------------------------------------------
--  DDL for Trigger DONOR_INTERDICTIONS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."DONOR_INTERDICTIONS_BI" 
 BEFORE INSERT
 ON DONOR_INTERDICTIONS
 FOR EACH ROW
BEGIN
if :new.audit_key is null then
   select audit_seq.nextval into :new.audit_key from dual;
end if;
if :new.inter_code='RBC56' and :new.unit_id is not null then
:new.eff_date:=to_date(to_char(:new.eff_date,'MM-DD-YYYY')||' 23:59','MM-DD-YYYY
 HH24:MI');
end if;
end ;
/
ALTER TRIGGER "DONSYS"."DONOR_INTERDICTIONS_BI" ENABLE;
