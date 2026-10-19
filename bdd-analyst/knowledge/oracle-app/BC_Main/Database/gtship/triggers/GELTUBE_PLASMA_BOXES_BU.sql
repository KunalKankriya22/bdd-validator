--------------------------------------------------------
--  DDL for Trigger GELTUBE_PLASMA_BOXES_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "GELTUBE_PLASMA_BOXES_BU" BEFORE
    UPDATE ON GTSHIP.GELTUBE_PLASMA_BOXES
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
    audit_rec.audit_key := :old.audit_key;
    audit_rec.audit_insert_dats := sysdate;
    audit_rec.program_id := :new.program_id;
    audit_rec.user_id := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code := 'U';
--
    IF nvl(:old.BOX_ID, '*') != nvl(:new.BOX_ID, '*') THEN
        audit_rec.column_name := 'BOX_ID';
        audit_rec.old_value := :old.BOX_ID;
        audit_rec.new_value := :new.BOX_ID;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.CHAPTER_ID, '*') != nvl(:new.CHAPTER_ID, '*') THEN
        audit_rec.column_name := 'CHAPTER_ID';
        audit_rec.old_value := :old.CHAPTER_ID;
        audit_rec.new_value := :new.CHAPTER_ID;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.TUBE_SHIP_NO, '*') != nvl(:new.TUBE_SHIP_NO, '*') THEN
        audit_rec.column_name := 'TUBE_SHIP_NO';
        audit_rec.old_value := :old.TUBE_SHIP_NO;
        audit_rec.new_value := :new.TUBE_SHIP_NO;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.PLASMA_SHIP_NO, '*') != nvl(:new.PLASMA_SHIP_NO, '*') THEN
        audit_rec.column_name := 'PLASMA_SHIP_NO';
        audit_rec.old_value := :old.PLASMA_SHIP_NO;
        audit_rec.new_value := :new.PLASMA_SHIP_NO;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.BOX_STATUS, '*') != nvl(:new.BOX_STATUS, '*') THEN
        audit_rec.column_name := 'BOX_STATUS';
        audit_rec.old_value := :old.BOX_STATUS;
        audit_rec.new_value := :new.BOX_STATUS;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.insert_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.insert_date, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'INSERT_DATE';
        audit_rec.old_value := TO_CHAR(:old.insert_date, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.insert_date, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.insert_user, '*') != nvl(:new.insert_user, '*') THEN
        audit_rec.column_name := 'INSERT_USER';
        audit_rec.old_value := :old.insert_user;
        audit_rec.new_value := :new.insert_user;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.TUBE_SHIP_STATUS, '*') != nvl(:new.TUBE_SHIP_STATUS, '*') THEN
        audit_rec.column_name := 'TUBE_SHIP_STATUS';
        audit_rec.old_value := :old.TUBE_SHIP_STATUS;
        audit_rec.new_value := :new.TUBE_SHIP_STATUS;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.PLASMA_BOX_ID, '*') != nvl(:new.PLASMA_BOX_ID, '*') THEN
        audit_rec.column_name := 'PLASMA_BOX_ID';
        audit_rec.old_value := :old.PLASMA_BOX_ID;
        audit_rec.new_value := :new.PLASMA_BOX_ID;
        insert_audit_rec(audit_rec);
    END IF;
END;
/
ALTER TRIGGER "GELTUBE_PLASMA_BOXES_BU" ENABLE;
