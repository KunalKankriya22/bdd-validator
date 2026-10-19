--------------------------------------------------------
--  DDL for Trigger GELTUBE_PLASMA_SHIP_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "GELTUBE_PLASMA_SHIP_BU" BEFORE
    UPDATE ON GTSHIP.GELTUBE_PLASMA_SHIP
    FOR EACH ROW
DECLARE
    audit_rec GELTUBE_PLASMA_SHIP_ADT%rowtype;

    PROCEDURE insert_audit_rec (
        rec_in GELTUBE_PLASMA_SHIP_ADT%rowtype
    ) IS
    BEGIN
        INSERT INTO GELTUBE_PLASMA_SHIP_ADT VALUES rec_in;
    END insert_audit_rec;
BEGIN
    audit_rec.audit_key := :old.audit_key;
    audit_rec.audit_insert_dats := sysdate;
    audit_rec.program_id := :new.program_id;
    audit_rec.user_id := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code := 'U';
--
    IF nvl(:old.TUBE_SHIP_NO, '*') != nvl(:new.TUBE_SHIP_NO, '*') THEN
        audit_rec.column_name := 'TUBE_SHIP_NO';
        audit_rec.old_value := :old.TUBE_SHIP_NO;
        audit_rec.new_value := :new.TUBE_SHIP_NO;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.CHAPTER_ID, '*') != nvl(:new.CHAPTER_ID, '*') THEN
        audit_rec.column_name := 'CHAPTER_ID';
        audit_rec.old_value := :old.CHAPTER_ID;
        audit_rec.new_value := :new.CHAPTER_ID;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.PACKED_BY, '*') != nvl(:new.PACKED_BY, '*') THEN
        audit_rec.column_name := 'PACKED_BY';
        audit_rec.old_value := :old.PACKED_BY;
        audit_rec.new_value := :new.PACKED_BY;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.PACKED_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.PACKED_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'PACKED_DATE';
        audit_rec.old_value := TO_CHAR(:old.PACKED_DATE, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.PACKED_DATE, 'MM-DD-YYYY HH24:MI');
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

    IF nvl(:old.PLASMA_SHIP_NO, '*') != nvl(:new.PLASMA_SHIP_NO, '*') THEN
        audit_rec.column_name := 'PLASMA_SHIP_NO';
        audit_rec.old_value := :old.PLASMA_SHIP_NO;
        audit_rec.new_value := :new.PLASMA_SHIP_NO;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.STATUS_FLAG, '*') != nvl(:new.STATUS_FLAG, '*') THEN
        audit_rec.column_name := 'STATUS_FLAG';
        audit_rec.old_value := :old.STATUS_FLAG;
        audit_rec.new_value := :new.STATUS_FLAG;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.COMMENTS, '*') != nvl(:new.COMMENTS, '*') THEN
        audit_rec.column_name := 'COMMENTS';
        audit_rec.old_value := :old.COMMENTS;
        audit_rec.new_value := :new.COMMENTS;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.RECEIVED_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.RECEIVED_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'RECEIVED_DATE';
        audit_rec.old_value := TO_CHAR(:old.RECEIVED_DATE, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.RECEIVED_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.SHIPMENT_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) != nvl(:new.SHIPMENT_DATE, TO_DATE('01-JAN-1933', 'DD-MON-YYYY')) THEN
        audit_rec.column_name := 'SHIPMENT_DATE';
        audit_rec.old_value := TO_CHAR(:old.SHIPMENT_DATE, 'MM-DD-YYYY HH24:MI');
        audit_rec.new_value := TO_CHAR(:new.SHIPMENT_DATE, 'MM-DD-YYYY HH24:MI');
        insert_audit_rec(audit_rec);
    END IF;
END;
/
ALTER TRIGGER "GELTUBE_PLASMA_SHIP_BU" ENABLE;
