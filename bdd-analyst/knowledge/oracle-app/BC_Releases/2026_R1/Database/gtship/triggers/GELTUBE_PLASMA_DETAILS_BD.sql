--------------------------------------------------------
--  DDL for Trigger GELTUBE_PLASMA_DETAILS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "GELTUBE_PLASMA_DETAILS_BD" BEFORE
    DELETE ON GTSHIP.GELTUBE_PLASMA_DETAILS
    FOR EACH ROW
DECLARE
    audit_rec geltube_plasma_details_adt%rowtype;

    PROCEDURE insert_audit_rec (
        rec_in geltube_plasma_details_adt%rowtype
    ) IS
    BEGIN
        INSERT INTO geltube_plasma_details_adt VALUES rec_in;
    END insert_audit_rec;
BEGIN
    audit_rec.audit_key         := :old.audit_key;
    audit_rec.audit_insert_dats := SYSDATE;
    audit_rec.program_id        := 'DELETE';
    audit_rec.user_id           := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code       := 'D';
    audit_rec.new_value         := NULL;

    audit_rec.column_name := 'UNIT_ID';
    audit_rec.old_value := :old.unit_id;
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'CHAPTER_ID';
    audit_rec.old_value := :old.chapter_id;
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'CHECKIN_DATE';
    audit_rec.old_value := to_char(:old.checkin_date, 'MM-DD-YYYY HH24:MI');
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'TUBE_STATUS';
    audit_rec.old_value := :old.tube_status;
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'TUBE_CHECKIN_USER';
    audit_rec.old_value := :old.tube_checkin_user;
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'PROD_CODE';
    audit_rec.old_value := :old.prod_code;
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'INSERT_DATE';
    audit_rec.old_value := to_char(:old.insert_date, 'MM-DD-YYYY HH24:MI');
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'INSERT_USER';
    audit_rec.old_value := :old.insert_user;
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'DELETE_REASON';
    audit_rec.old_value := :old.delete_reason;
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'COLL_DATE';
    audit_rec.old_value := to_char(:old.coll_date, 'MM-DD-YYYY HH24:MI');
    insert_audit_rec(audit_rec);
END;
/
ALTER TRIGGER "GELTUBE_PLASMA_DETAILS_BD" ENABLE;
