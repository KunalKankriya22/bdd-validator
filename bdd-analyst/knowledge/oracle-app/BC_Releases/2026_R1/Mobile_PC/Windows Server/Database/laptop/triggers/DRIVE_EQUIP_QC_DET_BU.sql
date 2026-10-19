--------------------------------------------------------
--  DDL for Trigger DRIVE_EQUIP_QC_DET_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DRIVE_EQUIP_QC_DET_BU" BEFORE
    UPDATE ON drive_equip_qc_det
    FOR EACH ROW
DECLARE
    audit_rec drive_equip_qc_det_adt%rowtype;
    lbAuditInserted BOOLEAN := FALSE;
    PROCEDURE insert_audit_rec (
        rec_in drive_equip_qc_det_adt%rowtype
    ) IS
    BEGIN
        lbAuditInserted := TRUE;
        INSERT INTO drive_equip_qc_det_adt VALUES rec_in;

    END insert_audit_rec;
BEGIN
    audit_rec.audit_key := :old.audit_key;
    audit_rec.audit_insert_dats := sysdate;
    audit_rec.program_id := :new.program_id;
    audit_rec.user_id := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code := 'U';
	--

    IF nvl(:old.drive_id, '*') != nvl(:new.drive_id, '*') THEN
        audit_rec.column_name := 'drive_id';
        audit_rec.old_value := :old.drive_id;
        audit_rec.new_value := :new.drive_id;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.drive_date, to_date('01-JAN-33')) != nvl(:new.drive_date, to_date('01-JAN-33')) THEN
        audit_rec.column_name := 'drive_date';
        audit_rec.old_value := to_char(:old.drive_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.drive_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);       
    END IF;

    IF nvl(:old.drive_profile_code, '*') != nvl(:new.drive_profile_code, '*') THEN
        audit_rec.column_name := 'drive_profile_code';
        audit_rec.old_value := :old.drive_profile_code;
        audit_rec.new_value := :new.drive_profile_code;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.equip_or_supply, '*') != nvl(:new.equip_or_supply, '*') THEN
        audit_rec.column_name := 'equip_or_supply';
        audit_rec.old_value := :old.equip_or_supply;
        audit_rec.new_value := :new.equip_or_supply;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.equip_supply_code, '*') != nvl(:new.equip_supply_code, '*') THEN
        audit_rec.column_name := 'equip_supply_code';
        audit_rec.old_value := :old.equip_supply_code;
        audit_rec.new_value := :new.equip_supply_code;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.qc_test_parm_code, '*') != nvl(:new.qc_test_parm_code, '*') THEN
        audit_rec.column_name := 'qc_test_parm_code';
        audit_rec.old_value := :old.qc_test_parm_code;
        audit_rec.new_value := :new.qc_test_parm_code;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.qc_value_date, to_date('01-JAN-33')) != nvl(:new.qc_value_date, to_date('01-JAN-33')) THEN
        audit_rec.column_name := 'qc_value_date';
        audit_rec.old_value := to_char(:old.qc_value_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.qc_value_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);   
    END IF;

    IF nvl(:old.qc_value_scan, '*') != nvl(:new.qc_value_scan, '*') THEN
        audit_rec.column_name := 'qc_value_scan';
        audit_rec.old_value := :old.qc_value_scan;
        audit_rec.new_value := :new.qc_value_scan;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.qc_value_data, '*') != nvl(:new.qc_value_data, '*') THEN
        audit_rec.column_name := 'qc_value_data';
        audit_rec.old_value := :old.qc_value_data;
        audit_rec.new_value := :new.qc_value_data;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.bag_catalog_no, '*') != nvl(:new.bag_catalog_no, '*') THEN
        audit_rec.column_name := 'bag_catalog_no';
        audit_rec.old_value := :old.bag_catalog_no;
        audit_rec.new_value := :new.bag_catalog_no;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.bag_lot_no, '*') != nvl(:new.bag_lot_no, '*') THEN
        audit_rec.column_name := 'bag_lot_no';
        audit_rec.old_value := :old.bag_lot_no;
        audit_rec.new_value := :new.bag_lot_no;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.bag_opened, '*') != nvl(:new.bag_opened, '*') THEN
        audit_rec.column_name := 'bag_opened';
        audit_rec.old_value := :old.bag_opened;
        audit_rec.new_value := :new.bag_opened;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.bag_opened_date, to_date('01-JAN-33')) != nvl(:new.bag_opened_date, to_date('01-JAN-33')) THEN
        audit_rec.column_name := 'bag_opened_date';
        audit_rec.old_value := to_char(:old.bag_opened_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.bag_opened_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);   
    END IF;

    IF nvl(:old.bag_expiry_date, to_date('01-JAN-33')) != nvl(:new.bag_expiry_date, to_date('01-JAN-33')) THEN
        audit_rec.column_name := 'bag_expiry_date';
        audit_rec.old_value := to_char(:old.bag_expiry_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.bag_expiry_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);   
    END IF;

    IF nvl(:old.qc_status, '*') != nvl(:new.qc_status, '*') THEN
        audit_rec.column_name := 'qc_status';
        audit_rec.old_value := :old.qc_status;
        audit_rec.new_value := :new.qc_status;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.insert_date, to_date('01-JAN-33')) != nvl(:new.insert_date, to_date('01-JAN-33')) THEN
        audit_rec.column_name := 'insert_date';
        audit_rec.old_value := to_char(:old.insert_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.insert_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);   
    END IF;

    IF nvl(:old.insert_user, '*') != nvl(:new.insert_user, '*') THEN
        audit_rec.column_name := 'insert_user';
        audit_rec.old_value := :old.insert_user;
        audit_rec.new_value := :new.insert_user;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.equip_type, '*') != nvl(:new.equip_type, '*') THEN
        audit_rec.column_name := 'equip_type';
        audit_rec.old_value := :old.equip_type;
        audit_rec.new_value := :new.equip_type;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.equip_reference, '*') != nvl(:new.equip_reference, '*') THEN
        audit_rec.column_name := 'equip_reference';
        audit_rec.old_value := :old.equip_reference;
        audit_rec.new_value := :new.equip_reference;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.supply_id, '*') != nvl(:new.supply_id, '*') THEN
        audit_rec.column_name := 'supply_id';
        audit_rec.old_value := :old.supply_id;
        audit_rec.new_value := :new.supply_id;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.set_id, '*') != nvl(:new.set_id, '*') THEN
        audit_rec.column_name := 'set_id';
        audit_rec.old_value := :old.set_id;
        audit_rec.new_value := :new.set_id;
        insert_audit_rec(audit_rec);    
    END IF;

    IF nvl(:old.sort_sequence, -1) != nvl(:new.sort_sequence, -1) THEN
        audit_rec.column_name := 'sort_sequence';
        audit_rec.old_value := :old.sort_sequence;
        audit_rec.new_value := :new.sort_sequence;
        insert_audit_rec(audit_rec);       
    END IF;

    IF nvl(:old.qc_condition_code, '*') != nvl(:new.qc_condition_code, '*') THEN
        audit_rec.column_name := 'qc_condition_code';
        audit_rec.old_value := :old.qc_condition_code;
        audit_rec.new_value := :new.qc_condition_code;
        insert_audit_rec(audit_rec);      
    END IF;

    IF nvl(:old.data_type, '*') != nvl(:new.data_type, '*') THEN
        audit_rec.column_name := 'data_type';
        audit_rec.old_value := :old.data_type;
        audit_rec.new_value := :new.data_type;
        insert_audit_rec(audit_rec);      
    END IF;

    IF nvl(:old.comments, '*') != nvl(:new.comments, '*') THEN
        audit_rec.column_name := 'comments';
        audit_rec.old_value := :old.comments;
        audit_rec.new_value := :new.comments;
        insert_audit_rec(audit_rec);      
    END IF;

    IF nvl(:old.is_copy, -1) != nvl(:new.is_copy, -1) THEN
        audit_rec.column_name := 'is_copy';
        audit_rec.old_value := :old.is_copy;
        audit_rec.new_value := :new.is_copy;
        insert_audit_rec(audit_rec);      
    END IF;

    IF nvl(:old.device_status, '*') != nvl(:new.device_status, '*') THEN
        audit_rec.column_name := 'device_status';
        audit_rec.old_value := :old.device_status;
        audit_rec.new_value := :new.device_status;
        insert_audit_rec(audit_rec);      
    END IF;

    IF nvl(:old.device_comments, '*') != nvl(:new.device_comments, '*') THEN
        audit_rec.column_name := 'device_comments';
        audit_rec.old_value := :old.device_comments;
        audit_rec.new_value := :new.device_comments;
        insert_audit_rec(audit_rec);      
    END IF;
    IF lbAuditInserted THEN
        laptop_util.download_monitor_insert('DRIVE_EQUIP_QC_DET', 'U', :OLD.audit_key);

        laptop_util.download_monitor_insert('DRIVE_EQUIP_QC_DET_ADT', 'I',:OLD.audit_key);
    END IF;
--
END;
/
ALTER TRIGGER "DRIVE_EQUIP_QC_DET_BU" ENABLE;
