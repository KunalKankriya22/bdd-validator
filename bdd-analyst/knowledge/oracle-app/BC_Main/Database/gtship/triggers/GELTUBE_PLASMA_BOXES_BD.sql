--------------------------------------------------------
--  DDL for Trigger GELTUBE_PLASMA_BOXES_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "GELTUBE_PLASMA_BOXES_BD" BEFORE
    DELETE ON GTSHIP.GELTUBE_PLASMA_BOXES
    FOR EACH ROW
DECLARE
    audit_rec GELTUBE_PLASMA_BOXES_ADT%rowtype;

    PROCEDURE insert_audit_rec (
        rec_in GELTUBE_PLASMA_BOXES_ADT%rowtype
    ) IS
    BEGIN
        INSERT INTO GELTUBE_PLASMA_BOXES_ADT VALUES rec_in;
    END insert_audit_rec;
BEGIN
    audit_rec.audit_key         := :old.audit_key;
    audit_rec.audit_insert_dats := SYSDATE;
    audit_rec.program_id        := 'DELETE';
    audit_rec.user_id           := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code       := 'D';
    audit_rec.new_value         := NULL;

    audit_rec.column_name := 'BOX_ID';
    audit_rec.old_value := :old.BOX_ID;
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'CHAPTER_ID';
    audit_rec.old_value := :old.chapter_id;
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'TUBE_SHIP_NO';
    audit_rec.old_value := :old.TUBE_SHIP_NO;
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'PLASMA_SHIP_NO';
    audit_rec.old_value := :old.PLASMA_SHIP_NO;
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'BOX_STATUS';
    audit_rec.old_value := :old.BOX_STATUS;
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'INSERT_DATE';
    audit_rec.old_value := to_char(:old.INSERT_DATE, 'MM-DD-YYYY HH24:MI');
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'INSERT_USER';
    audit_rec.old_value := :old.INSERT_USER;
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'TUBE_SHIP_STATUS';
    audit_rec.old_value := :old.TUBE_SHIP_STATUS;
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'PLASMA_BOX_ID';
    audit_rec.old_value := :old.PLASMA_BOX_ID;
    insert_audit_rec(audit_rec);
END;
/
ALTER TRIGGER "GELTUBE_PLASMA_BOXES_BD" ENABLE;
