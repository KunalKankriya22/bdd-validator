---
tags:
  - trigger
  - DONSYS
---
# DONOR_CONSENTS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONOR_CONSENTS|DONOR_CONSENTS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
    audit_rec       donor_consents_adt%rowtype;
    lbauditinserted BOOLEAN := false;

    PROCEDURE insert_audit_rec (
        rec_in donor_consents_adt%rowtype
    ) IS
    BEGIN
        lbauditinserted := true;
        INSERT INTO donor_consents_adt VALUES rec_in;

    END insert_audit_rec;

BEGIN
    audit_rec.audit_key := :old.audit_key;
    audit_rec.audit_insert_dats := sysdate;
    audit_rec.program_id := :new.program_id;
    audit_rec.user_id := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code := 'U';

    IF nvl(:old.transaction_id, '*') != nvl(:new.transaction_id, '*') THEN
        audit_rec.column_name := 'TRANSACTION_ID';
        audit_rec.old_value := :old.transaction_id;
        audit_rec.new_value := :new.transaction_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.donor_id, '*') != nvl(:new.donor_id, '*') THEN
        audit_rec.column_name := 'DONOR_ID';
        audit_rec.old_value := :old.donor_id;
        audit_rec.new_value := :new.donor_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.chapter_id, '*') != nvl(:new.chapter_id, '*') THEN
        audit_rec.column_name := 'CHAPTER_ID';
        audit_rec.old_value := :old.chapter_id;
        audit_rec.new_value := :new.chapter_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.coll_date, TO_DATE('01-JAN-33', 'DD-MON-YY')) != nvl(:new.coll_date, TO_DATE('01-JAN-33', 'DD-MON-YY')) THEN
        audit_rec.column_name := 'COLL_DATE';
        audit_rec.old_value := :old.coll_date;
        audit_rec.new_value := :new.coll_date;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.letter_code, '*') != nvl(:new.letter_code, '*') THEN
        audit_rec.column_name := 'LETTER_CODE';
        audit_rec.old_value := :old.letter_code;
        audit_rec.new_value := :new.letter_code;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.letter_id, '*') != nvl(:new.letter_id, '*') THEN
        audit_rec.column_name := 'LETTER_ID';
        audit_rec.old_value := :old.letter_id;
        audit_rec.new_value := :new.letter_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.consent_status, '*') != nvl(:new.consent_status, '*') THEN
        audit_rec.column_name := 'CONSENT_STATUS';
        audit_rec.old_value := :old.consent_status;
        audit_rec.new_value := :new.consent_status;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.version_no, -1) != nvl(:new.version_no, -1) THEN
        audit_rec.column_name := 'VERSION_NO';
        audit_rec.old_value := :old.version_no;
        audit_rec.new_value := :new.version_no;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.witness, '*') != nvl(:new.witness, '*') THEN
        audit_rec.column_name := 'WITNESS';
        audit_rec.old_value := :old.witness;
        audit_rec.new_value := :new.witness;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.signature_date, to_date('01-JAN-33')) != nvl(:new.signature_date, to_date('01-JAN-33')) THEN
        audit_rec.column_name := 'SIGNATURE_DATE';
        audit_rec.old_value := :old.signature_date;
        audit_rec.new_value := :new.signature_date;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.manual_signature_date, to_date('01-JAN-33')) != nvl(:new.manual_signature_date, to_date('01-JAN-33')) THEN
        audit_rec.column_name := 'MANUAL_SIGNATURE_DATE';
        audit_rec.old_value := :old.manual_signature_date;
        audit_rec.new_value := :new.manual_signature_date;
        insert_audit_rec(audit_rec);
    END IF;

    IF length(:old.donor_signature) <> length(:new.donor_signature) THEN
        audit_rec.column_name := 'DONOR_SIGNATURE';
        audit_rec.old_value    := NULL;
        audit_rec.new_value    := NULL;
        audit_rec.old_blob := :old.donor_signature;
        audit_rec.new_blob := :new.donor_signature;
        insert_audit_rec(audit_rec);
    END IF;

    IF length(:old.witness_signature) <> length(:new.witness_signature) THEN
        audit_rec.column_name := 'WITNESS_SIGNATURE';
        audit_rec.old_value    := NULL;
        audit_rec.new_value    := NULL;        
        audit_rec.old_blob := :old.witness_signature;
        audit_rec.new_blob := :new.witness_signature;
        insert_audit_rec(audit_rec);
    END IF;

END;
```
