--------------------------------------------------------
--  DDL for Trigger AUDIT_RESET_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "AUDIT_RESET_BI" BEFORE
  INSERT ON SBCSYS.AUDIT_RESET REFERENCING NEW AS NEW OLD AS OLD FOR EACH ROW
DECLARE

temp_audit_key NUMBER(23);
interface_id     varchar2(10);
PRAGMA AUTONOMOUS_TRANSACTION;

BEGIN

  dnlbu.donor_to_lab_unit_data (:new.unit_id, :new.chapter_id, null, null, interface_id);

  don_lab_nai.interface_nursing_audit (:new.unit_id, null, null,:new.chapter_id,interface_id);
END;
/
ALTER TRIGGER "AUDIT_RESET_BI" ENABLE;
