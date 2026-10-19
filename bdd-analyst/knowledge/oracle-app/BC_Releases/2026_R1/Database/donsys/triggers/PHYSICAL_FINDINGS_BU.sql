--------------------------------------------------------
--  DDL for Trigger PHYSICAL_FINDINGS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."PHYSICAL_FINDINGS_BU" BEFORE
    UPDATE ON physical_findings
    FOR EACH ROW
DECLARE
    audit_rec physical_findings_audit%rowtype;

    PROCEDURE insert_audit_rec (
        rec_in physical_findings_audit%rowtype
    ) IS
    BEGIN

        INSERT INTO physical_findings_audit VALUES rec_in;

    END insert_audit_rec;
BEGIN
    audit_rec.audit_key := :old.audit_key;
    audit_rec.audit_insert_dats := sysdate;
    audit_rec.program_id := :new.program_id;
    audit_rec.user_id := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code := 'U';
	--
    IF nvl(:old.transaction_id, '*') != nvl(:new.transaction_id, '*') THEN
        audit_rec.column_name := 'transaction_id';
        audit_rec.old_value := :old.transaction_id;
        audit_rec.new_value := :new.transaction_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.chapter_id, '*') != nvl(:new.chapter_id, '*') THEN
        audit_rec.column_name := 'chapter_id';
        audit_rec.old_value := :old.chapter_id;
        audit_rec.new_value := :new.chapter_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.physical_code, '*') != nvl(:new.physical_code, '*') THEN
        audit_rec.column_name := 'physical_code';
        audit_rec.old_value := :old.physical_code;
        audit_rec.new_value := :new.physical_code;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.physical_value, '*') != nvl(:new.physical_value, '*') THEN
        audit_rec.column_name := 'physical_value';
        audit_rec.old_value := :old.physical_value;
        audit_rec.new_value := :new.physical_value;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.inter_code, '*') != nvl(:new.inter_code, '*') THEN
        audit_rec.column_name := 'inter_code';
        audit_rec.old_value := :old.inter_code;
        audit_rec.new_value := :new.inter_code;
        insert_audit_rec(audit_rec);
    END IF;
    /* -- Do not have to monitor insert_date change.s
    IF nvl(:old.insert_date, to_date('01-JAN-33')) != nvl(:new.insert_date, to_date('01-JAN-33')) THEN
        audit_rec.column_name := 'insert_date';
        audit_rec.old_value := to_char(:old.insert_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.insert_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;
    */
    IF nvl(:old.insert_user, '*') != nvl(:new.insert_user, '*') THEN
        audit_rec.column_name := 'insert_user';
        audit_rec.old_value := :old.insert_user;
        audit_rec.new_value := :new.insert_user;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.sort_sequence, -1) != nvl(:new.sort_sequence, -1) THEN
        audit_rec.column_name := 'sort_sequence';
        audit_rec.old_value := :old.sort_sequence;
        audit_rec.new_value := :new.sort_sequence;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.comments, '*') != nvl(:new.comments, '*') THEN
        audit_rec.column_name := 'comments';
        audit_rec.old_value := :old.comments;
        audit_rec.new_value := :new.comments;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.physical_value_repeat, '*') != nvl(:new.physical_value_repeat, '*') THEN
        audit_rec.column_name := 'physical_value_repeat';
        audit_rec.old_value := :old.physical_value_repeat;
        audit_rec.new_value := :new.physical_value_repeat;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.equip_reference, '*') != nvl(:new.equip_reference, '*') THEN
        audit_rec.column_name := 'equip_reference';
        audit_rec.old_value := :old.equip_reference;
        audit_rec.new_value := :new.equip_reference;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.equip_reference_repeat, '*') != nvl(:new.equip_reference_repeat, '*') THEN
        audit_rec.column_name := 'equip_reference_repeat';
        audit_rec.old_value := :old.equip_reference_repeat;
        audit_rec.new_value := :new.equip_reference_repeat;
        insert_audit_rec(audit_rec);
    END IF;
	--
END;
/
ALTER TRIGGER "DONSYS"."PHYSICAL_FINDINGS_BU" ENABLE;
