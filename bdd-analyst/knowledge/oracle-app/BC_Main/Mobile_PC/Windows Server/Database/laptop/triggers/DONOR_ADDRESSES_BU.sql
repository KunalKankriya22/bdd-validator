--------------------------------------------------------
--  DDL for Trigger DONOR_ADDRESSES_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONOR_ADDRESSES_BU" BEFORE
    UPDATE ON donor_addresses
    FOR EACH ROW
DECLARE
    audit_rec donor_addresses_audit%rowtype;
    lbAuditInserted BOOLEAN := FALSE;

    PROCEDURE insert_audit_rec (
        rec_in donor_addresses_audit%rowtype
    ) IS
    BEGIN
        lbAuditInserted := TRUE;

        INSERT INTO donor_addresses_audit VALUES rec_in;

    END insert_audit_rec;

BEGIN
    audit_rec.audit_key := :old.audit_key;
    audit_rec.audit_insert_dats := sysdate;
    audit_rec.program_id := :new.program_id;
    audit_rec.user_id := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code := 'U';

	--
    IF nvl(:old.donor_id, '*') != nvl(:new.donor_id, '*') THEN
        audit_rec.column_name := 'donor_id';
        audit_rec.old_value := :old.donor_id;
        audit_rec.new_value := :new.donor_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.chapter_id, '*') != nvl(:new.chapter_id, '*') THEN
        audit_rec.column_name := 'chapter_id';
        audit_rec.old_value := :old.chapter_id;
        audit_rec.new_value := :new.chapter_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.address_type, '*') != nvl(:new.address_type, '*') THEN
        audit_rec.column_name := 'address_type';
        audit_rec.old_value := :old.address_type;
        audit_rec.new_value := :new.address_type;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.street_name, '*') != nvl(:new.street_name, '*') THEN
        audit_rec.column_name := 'street_name';
        audit_rec.old_value := :old.street_name;
        audit_rec.new_value := :new.street_name;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.suite_apt, '*') != nvl(:new.suite_apt, '*') THEN
        audit_rec.column_name := 'suite_apt';
        audit_rec.old_value := :old.suite_apt;
        audit_rec.new_value := :new.suite_apt;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.d_area_code, '*') != nvl(:new.d_area_code, '*') THEN
        audit_rec.column_name := 'd_area_code';
        audit_rec.old_value := :old.d_area_code;
        audit_rec.new_value := :new.d_area_code;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.d_phone_no, '*') != nvl(:new.d_phone_no, '*') THEN
        audit_rec.column_name := 'd_phone_no';
        audit_rec.old_value := :old.d_phone_no;
        audit_rec.new_value := :new.d_phone_no;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.extension, -1) != nvl(:new.extension, -1) THEN
        audit_rec.column_name := 'extension';
        audit_rec.old_value := :old.extension;
        audit_rec.new_value := :new.extension;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.h_area_code, '*') != nvl(:new.h_area_code, '*') THEN
        audit_rec.column_name := 'h_area_code';
        audit_rec.old_value := :old.h_area_code;
        audit_rec.new_value := :new.h_area_code;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.h_phone_no, '*') != nvl(:new.h_phone_no, '*') THEN
        audit_rec.column_name := 'h_phone_no';
        audit_rec.old_value := :old.h_phone_no;
        audit_rec.new_value := :new.h_phone_no;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.email, '*') != nvl(:new.email, '*') THEN
        audit_rec.column_name := 'email';
        audit_rec.old_value := :old.email;
        audit_rec.new_value := :new.email;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.usps_id, -1) != nvl(:new.usps_id, -1) THEN
        audit_rec.column_name := 'usps_id';
        audit_rec.old_value := :old.usps_id;
        audit_rec.new_value := :new.usps_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.mapsco, '*') != nvl(:new.mapsco, '*') THEN
        audit_rec.column_name := 'mapsco';
        audit_rec.old_value := :old.mapsco;
        audit_rec.new_value := :new.mapsco;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.insert_date, to_date('01-JAN-33')) != nvl(:new.insert_date, to_date('01-JAN-33')) THEN
        audit_rec.column_name := 'insert_date';
        audit_rec.old_value := :old.insert_date;
        audit_rec.new_value := :new.insert_date;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.insert_user, '*') != nvl(:new.insert_user, '*') THEN
        audit_rec.column_name := 'insert_user';
        audit_rec.old_value := :old.insert_user;
        audit_rec.new_value := :new.insert_user;
        insert_audit_rec(audit_rec);
    END IF;
	--
    --

    IF lbAuditInserted THEN
        laptop_util.download_monitor_insert('DONOR_ADDRESSES', 'U', :OLD.audit_key);
        laptop_util.download_monitor_insert('DONOR_ADDRESSES_AUDIT', 'I', :OLD.audit_key);
    END IF;

END;
/
ALTER TRIGGER "DONOR_ADDRESSES_BU" ENABLE;
