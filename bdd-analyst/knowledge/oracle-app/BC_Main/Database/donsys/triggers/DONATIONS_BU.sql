--------------------------------------------------------
--  DDL for Trigger DONATIONS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."DONATIONS_BU" BEFORE
    UPDATE ON donations
FOR EACH ROW DECLARE
    audit_rec donations_audit%rowtype;

    PROCEDURE insert_audit_rec (
        rec_in donations_audit%rowtype
    ) IS
    BEGIN
        INSERT INTO donations_audit VALUES rec_in;

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

    IF nvl(:old.drive_id, '*') != nvl(:new.drive_id, '*') THEN
        audit_rec.column_name := 'drive_id';
        audit_rec.old_value := :old.drive_id;
        audit_rec.new_value := :new.drive_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.coll_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.coll_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'coll_date';
        audit_rec.old_value := TO_CHAR(:old.coll_date, 'MM-DD-YYYY');
        audit_rec.new_value := TO_CHAR(:new.coll_date, 'MM-DD-YYYY');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.set_id, '*') != nvl(:new.set_id, '*') THEN
        audit_rec.column_name := 'set_id';
        audit_rec.old_value := :old.set_id;
        audit_rec.new_value := :new.set_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.credit_count, -1) != nvl(:new.credit_count, -1) THEN
        audit_rec.column_name := 'credit_count';
        audit_rec.old_value := :old.credit_count;
        audit_rec.new_value := :new.credit_count;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.donor_id, '*') != nvl(:new.donor_id, '*') THEN
        audit_rec.column_name := 'donor_id';
        audit_rec.old_value := :old.donor_id;
        audit_rec.new_value := :new.donor_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.credit_sponsor, '*') != nvl(:new.credit_sponsor, '*') THEN
        audit_rec.column_name := 'credit_sponsor';
        audit_rec.old_value := :old.credit_sponsor;
        audit_rec.new_value := :new.credit_sponsor;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.donation_type, '*') != nvl(:new.donation_type, '*') THEN
        audit_rec.column_name := 'donation_type';
        audit_rec.old_value := :old.donation_type;
        audit_rec.new_value := :new.donation_type;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.bleed_start_time_l1, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.bleed_start_time_l1, TO_DATE('01-JAN-1933',
    'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'bleed_start_time_l1';
        audit_rec.old_value := to_char(:old.bleed_start_time_l1, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.bleed_start_time_l1, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.bleed_start_time_l2, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.bleed_start_time_l2, TO_DATE('01-JAN-1933',
    'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'bleed_start_time_l2';
        audit_rec.old_value := to_char(:old.bleed_start_time_l2, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.bleed_start_time_l2, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.bleed_start_time_r1, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.bleed_start_time_r1, TO_DATE('01-JAN-1933',
    'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'bleed_start_time_r1';
        audit_rec.old_value := to_char(:old.bleed_start_time_r1, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.bleed_start_time_r1, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.bleed_start_time_r2, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.bleed_start_time_r2, TO_DATE('01-JAN-1933',
    'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'bleed_start_time_r2';
        audit_rec.old_value := to_char(:old.bleed_start_time_r2, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.bleed_start_time_r2, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.bleed_end_time_r, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.bleed_end_time_r, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'bleed_end_time_r';
        audit_rec.old_value := to_char(:old.bleed_end_time_r, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.bleed_end_time_r, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.bleed_end_time_l, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.bleed_end_time_l, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'bleed_end_time_l';
        audit_rec.old_value := to_char(:old.bleed_end_time_l, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.bleed_end_time_l, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.bleed_start_phleb_l1, '*') != nvl(:new.bleed_start_phleb_l1, '*') THEN
        audit_rec.column_name := 'bleed_start_phleb_l1';
        audit_rec.old_value := :old.bleed_start_phleb_l1;
        audit_rec.new_value := :new.bleed_start_phleb_l1;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.bleed_start_phleb_l2, '*') != nvl(:new.bleed_start_phleb_l2, '*') THEN
        audit_rec.column_name := 'bleed_start_phleb_l2';
        audit_rec.old_value := :old.bleed_start_phleb_l2;
        audit_rec.new_value := :new.bleed_start_phleb_l2;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.bleed_start_phleb_r1, '*') != nvl(:new.bleed_start_phleb_r1, '*') THEN
        audit_rec.column_name := 'bleed_start_phleb_r1';
        audit_rec.old_value := :old.bleed_start_phleb_r1;
        audit_rec.new_value := :new.bleed_start_phleb_r1;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.bleed_start_phleb_r2, '*') != nvl(:new.bleed_start_phleb_r2, '*') THEN
        audit_rec.column_name := 'bleed_start_phleb_r2';
        audit_rec.old_value := :old.bleed_start_phleb_r2;
        audit_rec.new_value := :new.bleed_start_phleb_r2;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.bleed_end_phleb_r, '*') != nvl(:new.bleed_end_phleb_r, '*') THEN
        audit_rec.column_name := 'bleed_end_phleb_r';
        audit_rec.old_value := :old.bleed_end_phleb_r;
        audit_rec.new_value := :new.bleed_end_phleb_r;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.bleed_end_phleb_l, '*') != nvl(:new.bleed_end_phleb_l, '*') THEN
        audit_rec.column_name := 'bleed_end_phleb_l';
        audit_rec.old_value := :old.bleed_end_phleb_l;
        audit_rec.new_value := :new.bleed_end_phleb_l;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.deferral_reason, '*') != nvl(:new.deferral_reason, '*') THEN
        audit_rec.column_name := 'deferral_reason';
        audit_rec.old_value := :old.deferral_reason;
        audit_rec.new_value := :new.deferral_reason;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.bag_type, '*') != nvl(:new.bag_type, '*') THEN
        audit_rec.column_name := 'bag_type';
        audit_rec.old_value := :old.bag_type;
        audit_rec.new_value := :new.bag_type;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.donor_cue, '*') != nvl(:new.donor_cue, '*') THEN
        audit_rec.column_name := 'donor_cue';
        audit_rec.old_value := :old.donor_cue;
        audit_rec.new_value := :new.donor_cue;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.unit_id, '*') != nvl(:new.unit_id, '*') THEN
        audit_rec.column_name := 'unit_id';
        audit_rec.old_value := :old.unit_id;
        audit_rec.new_value := :new.unit_id;
        insert_audit_rec(audit_rec);
        --- Added by Edwin to update the donation interdictions table
        UPDATE donation_interdictions
        SET
            unit_id = :new.unit_id
        WHERE
            transaction_id = :old.transaction_id;

    END IF;

    IF nvl(:old.procedure_code, '*') != nvl(:new.procedure_code, '*') THEN
        audit_rec.column_name := 'procedure_code';
        audit_rec.old_value := :old.procedure_code;
        audit_rec.new_value := :new.procedure_code;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.note_id, '*') != nvl(:new.note_id, '*') THEN
        audit_rec.column_name := 'note_id';
        audit_rec.old_value := :old.note_id;
        audit_rec.new_value := :new.note_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.original_donor_id, '*') != nvl(:new.original_donor_id, '*') THEN
        audit_rec.column_name := 'original_donor_id';
        audit_rec.old_value := :old.original_donor_id;
        audit_rec.new_value := :new.original_donor_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.lookup_id, '*') != nvl(:new.lookup_id, '*') THEN
        audit_rec.column_name := 'lookup_id';
        audit_rec.old_value := :old.lookup_id;
        audit_rec.new_value := :new.lookup_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.screener_id, '*') != nvl(:new.screener_id, '*') THEN
        audit_rec.column_name := 'screener_id';
        audit_rec.old_value := :old.screener_id;
        audit_rec.new_value := :new.screener_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.physical_id, '*') != nvl(:new.physical_id, '*') THEN
        audit_rec.column_name := 'physical_id';
        audit_rec.old_value := :old.physical_id;
        audit_rec.new_value := :new.physical_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.first_reviewer_id, '*') != nvl(:new.first_reviewer_id, '*') THEN
        audit_rec.column_name := 'physical_id';
        audit_rec.old_value := :old.physical_id;
        audit_rec.new_value := :new.physical_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.second_reviewer_id, '*') != nvl(:new.second_reviewer_id, '*') THEN
        audit_rec.column_name := 'second_reviewer_id';
        audit_rec.old_value := :old.second_reviewer_id;
        audit_rec.new_value := :new.second_reviewer_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.deferred_thru_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.deferred_thru_date, TO_DATE('01-JAN-1933',
    'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'deferred_thru_date';
        audit_rec.old_value := to_char(:old.deferred_thru_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.deferred_thru_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.donor_signature_flag, '*') != nvl(:new.donor_signature_flag, '*') THEN
        audit_rec.column_name := 'donor_signature_flag';
        audit_rec.old_value := :old.donor_signature_flag;
        audit_rec.new_value := :new.donor_signature_flag;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.n_audit_flag, '*') != nvl(:new.n_audit_flag, '*') THEN
        audit_rec.column_name := 'n_audit_flag';
        audit_rec.old_value := :old.n_audit_flag;
        audit_rec.new_value := :new.n_audit_flag;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.n_audit_user, '*') != nvl(:new.n_audit_user, '*') THEN
        audit_rec.column_name := 'n_audit_user';
        audit_rec.old_value := :old.n_audit_user;
        audit_rec.new_value := :new.n_audit_user;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.n_audit_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.n_audit_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'n_audit_date';
        audit_rec.old_value := to_char(:old.n_audit_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.n_audit_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.arm_used, '*') != nvl(:new.arm_used, '*') THEN
        audit_rec.column_name := 'arm_used';
        audit_rec.old_value := :old.arm_used;
        audit_rec.new_value := :new.arm_used;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.void_unit_id, '*') != nvl(:new.void_unit_id, '*') THEN
        audit_rec.column_name := 'void_unit_id';
        audit_rec.old_value := :old.void_unit_id;
        audit_rec.new_value := :new.void_unit_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.start_data_entry_time, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.start_data_entry_time, TO_DATE('01-JAN-1933',
    'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'start_data_entry_time';
        audit_rec.old_value := to_char(:old.start_data_entry_time, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.start_data_entry_time, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.end_data_entry_time, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.end_data_entry_time, TO_DATE('01-JAN-1933',
    'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'end_data_entry_time';
        audit_rec.old_value := to_char(:old.end_data_entry_time, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.end_data_entry_time, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.entry_mode, '*') != nvl(:new.entry_mode, '*') THEN
        audit_rec.column_name := 'entry_mode';
        audit_rec.old_value := :old.entry_mode;
        audit_rec.new_value := :new.entry_mode;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.deferral_id, '*') != nvl(:new.deferral_id, '*') THEN
        audit_rec.column_name := 'deferral_id';
        audit_rec.old_value := :old.deferral_id;
        audit_rec.new_value := :new.deferral_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.material_id, '*') != nvl(:new.material_id, '*') THEN
        audit_rec.column_name := 'material_id';
        audit_rec.old_value := :old.material_id;
        audit_rec.new_value := :new.material_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.bleed_end_time_l2, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.bleed_end_time_l2, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'bleed_end_time_l2';
        audit_rec.old_value := to_char(:old.bleed_end_time_l2, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.bleed_end_time_l2, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.bleed_end_phleb_l2, '*') != nvl(:new.bleed_end_phleb_l2, '*') THEN
        audit_rec.column_name := 'bleed_end_phleb_l2';
        audit_rec.old_value := :old.bleed_end_phleb_l2;
        audit_rec.new_value := :new.bleed_end_phleb_l2;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.bleed_end_time_r2, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.bleed_end_time_r2, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
        audit_rec.column_name := 'bleed_end_time_r2';
        audit_rec.old_value := to_char(:old.bleed_end_time_r2, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.bleed_end_time_r2, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.bleed_end_phleb_r2, '*') != nvl(:new.bleed_end_phleb_r2, '*') THEN
        audit_rec.column_name := 'bleed_end_phleb_r2';
        audit_rec.old_value := :old.bleed_end_phleb_r2;
        audit_rec.new_value := :new.bleed_end_phleb_r2;
        insert_audit_rec(audit_rec);
    end if;

    if nvl(:old.interface_date,to_date('01-JAN-1933','DD-MON-YYYY')) !=
     nvl(:new.interface_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'bleed_end_time_r2';
        audit_rec.old_value := to_char(:old.interface_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := to_char(:new.interface_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.insert_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.insert_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY'))
    THEN
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

    IF nvl(:old.plt_pre_count, -1) != nvl(:new.plt_pre_count, -1) THEN
        audit_rec.column_name := 'plt_pre_count';
        audit_rec.old_value := :old.plt_pre_count;
        audit_rec.new_value := :new.plt_pre_count;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.plt_post_count, -1) != nvl(:new.plt_post_count, -1) THEN
        audit_rec.column_name := 'plt_post_count';
        audit_rec.old_value := :old.plt_post_count;
        audit_rec.new_value := :new.plt_post_count;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.deferral_type, '*') != nvl(:new.deferral_type, '*') THEN
        audit_rec.column_name := 'deferral_type';
        audit_rec.old_value := :old.deferral_type;
        audit_rec.new_value := :new.deferral_type;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.sponsor_claim_id, '*') != nvl(:new.sponsor_claim_id, '*') THEN
        audit_rec.column_name := 'sponsor_claim_id';
        audit_rec.old_value := :old.sponsor_claim_id;
        audit_rec.new_value := :new.sponsor_claim_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.actual_rbc_loss, -1) != nvl(:new.actual_rbc_loss, -1) THEN
        audit_rec.column_name := 'actual_rbc_loss';
        audit_rec.old_value := :old.actual_rbc_loss;
        audit_rec.new_value := :new.actual_rbc_loss;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.actual_plasma_loss, -1) != nvl(:new.actual_plasma_loss, -1) THEN
        audit_rec.column_name := 'actual_plasma_loss';
        audit_rec.old_value := :old.actual_plasma_loss;
        audit_rec.new_value := :new.actual_plasma_loss;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.equip_reference, '*') != nvl(:new.equip_reference, '*') THEN
        audit_rec.column_name := 'equip_reference';
        audit_rec.old_value := :old.equip_reference;
        audit_rec.new_value := :new.equip_reference;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.equip_type, '*') != nvl(:new.equip_type, '*') THEN
        audit_rec.column_name := 'equip_type';
        audit_rec.old_value := :old.equip_type;
        audit_rec.new_value := :new.equip_type;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.lot_number, '*') != nvl(:new.lot_number, '*') THEN
        audit_rec.column_name := 'lot_number';
        audit_rec.old_value := :old.lot_number;
        audit_rec.new_value := :new.lot_number;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.catalog_number, '*') != nvl(:new.catalog_number, '*') THEN
        audit_rec.column_name := 'catalog_number';
        audit_rec.old_value := :old.catalog_number;
        audit_rec.new_value := :new.catalog_number;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.other_arm_used, '*') != nvl(:new.other_arm_used, '*') THEN
        audit_rec.column_name := 'other_arm_used';
        audit_rec.old_value := :old.other_arm_used;
        audit_rec.new_value := :new.other_arm_used;
        insert_audit_rec(audit_rec);
    END IF;
--
END;
/
ALTER TRIGGER "DONSYS"."DONATIONS_BU" ENABLE;
