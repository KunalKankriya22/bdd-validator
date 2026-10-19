---
tags:
  - trigger
  - DONSYS
---
# DONOR_CONSENTS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONOR_CONSENTS|DONOR_CONSENTS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
    audit_rec donor_consents_adt%rowtype;

    PROCEDURE insert_audit_rec (
        rec_in donor_consents_adt%rowtype
    ) IS
    BEGIN
        INSERT INTO donor_consents_adt VALUES rec_in;
    END insert_audit_rec;
BEGIN
    audit_rec.audit_key         := :old.audit_key;
    audit_rec.audit_insert_dats := SYSDATE;
    audit_rec.program_id        := 'DELETE';
    audit_rec.user_id           := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code       := 'D';
    audit_rec.new_value         := NULL;
    audit_rec.old_blob          := NULL;

    audit_rec.column_name := 'TRANSACTION_ID';
    audit_rec.old_value := :old.TRANSACTION_ID; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'DONOR_ID';
    audit_rec.old_value := :old.DONOR_ID; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'CHAPTER_ID';
    audit_rec.old_value := :old.CHAPTER_ID; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'COLL_DATE';
    audit_rec.old_value := to_char(:old.COLL_DATE, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'LETTER_CODE';
    audit_rec.old_value := :old.LETTER_CODE; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'LETTER_ID';
    audit_rec.old_value := :old.LETTER_ID; 
    insert_audit_rec(audit_rec);

    audit_rec.column_name := 'CONSENT_STATUS';
    audit_rec.old_value := :old.CONSENT_STATUS; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'VERSION_NO';
    audit_rec.old_value := :old.VERSION_NO; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'WITNESS';
    audit_rec.old_value := :old.WITNESS; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'SIGNATURE_DATE';
    audit_rec.old_value := to_char(:old.SIGNATURE_DATE, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'MANUAL_SIGNATURE_DATE';
    audit_rec.old_value := to_char(:old.MANUAL_SIGNATURE_DATE, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'PROGRAM_ID';
    audit_rec.old_value := :old.PROGRAM_ID; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'INSERT_DATE';
    audit_rec.old_value := to_char(:old.INSERT_DATE, 'MM-DD-YYYY HH24:MI'); 
    insert_audit_rec(audit_rec);      

    audit_rec.column_name := 'INSERT_USER';
    audit_rec.old_value := :old.INSERT_USER; 
    insert_audit_rec(audit_rec); 

    -- NOTE: Below blob updates have to be at the end.
    audit_rec.column_name := 'DONOR_SIGNATURE';
    audit_rec.old_value := NULL;
    audit_rec.old_blob := :old.DONOR_SIGNATURE; 
    insert_audit_rec(audit_rec);    

    audit_rec.column_name := 'WITNESS_SIGNATURE';
    audit_rec.old_value := NULL;    
    audit_rec.old_blob := :old.WITNESS_SIGNATURE; 
    insert_audit_rec(audit_rec);      
END;
```
