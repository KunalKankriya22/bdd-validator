---
tags:
  - trigger
  - DONSYS
---
# DONORS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONORS|DONORS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
    audit_rec donors_audit%rowtype;

    PROCEDURE insert_audit_rec (
        rec_in donors_audit%rowtype
    ) IS
    BEGIN
        INSERT INTO donors_audit VALUES rec_in;

    END insert_audit_rec;

BEGIN
	--
    IF nvl(:old.first_name, '*') != nvl(:new.first_name, '*') THEN
        SELECT
            soundex(substr(:new.first_name, 1, decode(instr(:new.first_name, ' '), 0, length(:new.first_name), instr(:new.first_name,
            ' ') - 1)))
        INTO :new.first_name_sndx
        FROM
            dual;

    END IF;

    audit_rec.audit_key         := :old.audit_key;
    audit_rec.audit_insert_dats := sysdate;
    audit_rec.program_id        := :new.program_id;
    audit_rec.user_id           := substr(lt_user_session.get_userid, 1, 6);
    audit_rec.action_code       := 'U';

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

    IF nvl(:old.gender, '*') != nvl(:new.gender, '*') THEN
        audit_rec.column_name := 'gender';
        audit_rec.old_value := :old.gender;
        audit_rec.new_value := :new.gender;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.date_of_birth, TO_DATE('01-JAN-33', 'DD-MON-YY')) != nvl(:new.date_of_birth, TO_DATE('01-JAN-33', 'DD-MON-YY')) THEN
        audit_rec.column_name := 'date_of_birth';
        audit_rec.old_value := :old.date_of_birth;
        audit_rec.new_value := :new.date_of_birth;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.last_name, '*') != nvl(:new.last_name, '*') THEN
        SELECT
            soundex(:new.last_name)
        INTO :new.soundex_key
        FROM
            dual;

        audit_rec.column_name := 'last_name';
        audit_rec.old_value := :old.last_name;
        audit_rec.new_value := :new.last_name;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.ssn, -1) != nvl(:new.ssn, -1) THEN
        BEGIN
            DECLARE
                v_ssn VARCHAR2(9);
            BEGIN
                SELECT
                    parameter_value
                INTO v_ssn
                FROM
                    valid_parameters
                WHERE
                        parameter_code = 'FKSSN'
                    AND sysdate BETWEEN eff_date AND nvl(term_date, sysdate)
                    AND ROWNUM = 1;

                IF :new.ssn = v_ssn THEN
                    :new.ssn := NULL;
                END IF;

            EXCEPTION
                WHEN OTHERS THEN
                    NULL;
            END;

            audit_rec.column_name := 'ssn';
            audit_rec.old_value := :old.ssn;
            audit_rec.new_value := :new.ssn;
            insert_audit_rec(audit_rec);
        END;
    END IF;

    IF nvl(:old.last_name_suffix, '*') != nvl(:new.last_name_suffix, '*') THEN
        audit_rec.column_name := 'last_name_suffix';
        audit_rec.old_value := :old.last_name_suffix;
        audit_rec.new_value := :new.last_name_suffix;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.first_name, '*') != nvl(:new.first_name, '*') THEN
        audit_rec.column_name := 'first_name';
        audit_rec.old_value := :old.first_name;
        audit_rec.new_value := :new.first_name;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.middle_name, '*') != nvl(:new.middle_name, '*') THEN
        audit_rec.column_name := 'middle_name';
        audit_rec.old_value := :old.middle_name;
        audit_rec.new_value := :new.middle_name;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.salutation, '*') != nvl(:new.salutation, '*') THEN
        audit_rec.column_name := 'salutation';
        audit_rec.old_value := :old.salutation;
        audit_rec.new_value := :new.salutation;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.blood_type, '*') != nvl(:new.blood_type, '*') THEN
        audit_rec.column_name := 'blood_type';
        audit_rec.old_value := :old.blood_type;
        audit_rec.new_value := :new.blood_type;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.employer_id, '*') != nvl(:new.employer_id, '*') THEN
        audit_rec.column_name := 'employer_id';
        audit_rec.old_value := :old.employer_id;
        audit_rec.new_value := :new.employer_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.title, '*') != nvl(:new.title, '*') THEN
        audit_rec.column_name := 'title';
        audit_rec.old_value := :old.title;
        audit_rec.new_value := :new.title;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.ethnic_group, '*') != nvl(:new.ethnic_group, '*') THEN
        audit_rec.column_name := 'ethnic_group';
        audit_rec.old_value := :old.ethnic_group;
        audit_rec.new_value := :new.ethnic_group;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.status, '*') != nvl(:new.status, '*') THEN
        audit_rec.column_name := 'status';
        audit_rec.old_value := :old.status;
        audit_rec.new_value := :new.status;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.soundex_key, '*') != nvl(:new.soundex_key, '*') THEN
        audit_rec.column_name := 'soundex_key';
        audit_rec.old_value := :old.soundex_key;
        audit_rec.new_value := :new.soundex_key;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.previos_donor_id, '*') != nvl(:new.previos_donor_id, '*') THEN
        audit_rec.column_name := 'previos_donor_id';
        audit_rec.old_value := :old.previos_donor_id;
        audit_rec.new_value := :new.previos_donor_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.alias, '*') != nvl(:new.alias, '*') THEN
        audit_rec.column_name := 'alias';
        audit_rec.old_value := :old.alias;
        audit_rec.new_value := :new.alias;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.claimed_donation, -1) != nvl(:new.claimed_donation, -1) THEN
        audit_rec.column_name := 'claimed_donation';
        audit_rec.old_value := :old.claimed_donation;
        audit_rec.new_value := :new.claimed_donation;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.alternate_id, '*') != nvl(:new.alternate_id, '*') THEN
        audit_rec.column_name := 'alternate_id';
        audit_rec.old_value := :old.alternate_id;
        audit_rec.new_value := :new.alternate_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.migrated_unit, -1) != nvl(:new.migrated_unit, -1) THEN
        audit_rec.column_name := 'migrated_unit';
        audit_rec.old_value := :old.migrated_unit;
        audit_rec.new_value := :new.migrated_unit;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.migrated_addr1, '*') != nvl(:new.migrated_addr1, '*') THEN
        audit_rec.column_name := 'migrated_addr1';
        audit_rec.old_value := :old.migrated_addr1;
        audit_rec.new_value := :new.migrated_addr1;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.migrated_addr2, '*') != nvl(:new.migrated_addr2, '*') THEN
        audit_rec.column_name := 'migrated_addr2';
        audit_rec.old_value := :old.migrated_addr2;
        audit_rec.new_value := :new.migrated_addr2;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.migrated_addr3, '*') != nvl(:new.migrated_addr3, '*') THEN
        audit_rec.column_name := 'migrated_addr3';
        audit_rec.old_value := :old.migrated_addr3;
        audit_rec.new_value := :new.migrated_addr3;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.migrated_zip, '*') != nvl(:new.migrated_zip, '*') THEN
        audit_rec.column_name := 'migrated_zip';
        audit_rec.old_value := :old.migrated_zip;
        audit_rec.new_value := :new.migrated_zip;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.migrated_status, '*') != nvl(:new.migrated_status, '*') THEN
        audit_rec.column_name := 'migrated_status';
        audit_rec.old_value := :old.migrated_status;
        audit_rec.new_value := :new.migrated_status;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.migrated_city, '*') != nvl(:new.migrated_city, '*') THEN
        audit_rec.column_name := 'migrated_city';
        audit_rec.old_value := :old.migrated_city;
        audit_rec.new_value := :new.migrated_city;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.lang, '*') != nvl(:new.lang, '*') THEN
        audit_rec.column_name := 'lang';
        audit_rec.old_value := :old.lang;
        audit_rec.new_value := :new.lang;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.note_id, '*') != nvl(:new.note_id, '*') THEN
        audit_rec.column_name := 'note_id';
        audit_rec.old_value := :old.note_id;
        audit_rec.new_value := :new.note_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.conv_donor_id, '*') != nvl(:new.conv_donor_id, '*') THEN
        audit_rec.column_name := 'conv_donor_id';
        audit_rec.old_value := :old.conv_donor_id;
        audit_rec.new_value := :new.conv_donor_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.prev_blood_center, '*') != nvl(:new.prev_blood_center, '*') THEN
        audit_rec.column_name := 'prev_blood_center';
        audit_rec.old_value := :old.prev_blood_center;
        audit_rec.new_value := :new.prev_blood_center;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.insert_date, TO_DATE('01-JAN-33', 'DD-MON-YY')) != nvl(:new.insert_date, TO_DATE('01-JAN-33', 'DD-MON-YY')) THEN
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

    IF nvl(:old.migrated_state, '*') != nvl(:new.migrated_state, '*') THEN
        audit_rec.column_name := 'migrated_state';
        audit_rec.old_value := :old.migrated_state;
        audit_rec.new_value := :new.migrated_state;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.first_name_sndx, '*') != nvl(:new.first_name_sndx, '*') THEN
        audit_rec.column_name := 'first_name_sndx';
        audit_rec.old_value := :old.first_name_sndx;
        audit_rec.new_value := :new.first_name_sndx;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.life_donations, -1) != nvl(:new.life_donations, -1) THEN
        audit_rec.column_name := 'life_donations';
        audit_rec.old_value := :old.life_donations;
        audit_rec.new_value := :new.life_donations;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.ytd_donations, -1) != nvl(:new.ytd_donations, -1) THEN
        audit_rec.column_name := 'ytd_donations';
        audit_rec.old_value := :old.ytd_donations;
        audit_rec.new_value := :new.ytd_donations;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.last_unit_id, '*') != nvl(:new.last_unit_id, '*') THEN
        audit_rec.column_name := 'last_unit_id';
        audit_rec.old_value := :old.last_unit_id;
        audit_rec.new_value := :new.last_unit_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.last_coll_date, TO_DATE('01-JAN-33', 'DD-MON-YY')) != nvl(:new.last_coll_date, TO_DATE('01-JAN-33', 'DD-MON-YY'))
    THEN
        audit_rec.column_name := 'last_coll_date';
        audit_rec.old_value := :old.last_coll_date;
        audit_rec.new_value := :new.last_coll_date;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.last_don_type, '*') != nvl(:new.last_don_type, '*') THEN
        audit_rec.column_name := 'last_don_type';
        audit_rec.old_value := :old.last_don_type;
        audit_rec.new_value := :new.last_don_type;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.last_proc_code, '*') != nvl(:new.last_proc_code, '*') THEN
        audit_rec.column_name := 'last_proc_code';
        audit_rec.old_value := :old.last_proc_code;
        audit_rec.new_value := :new.last_proc_code;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.migrated_donor_id, '*') != nvl(:new.migrated_donor_id, '*') THEN
        audit_rec.column_name := 'migrated_donor_id';
        audit_rec.old_value := :old.migrated_donor_id;
        audit_rec.new_value := :new.migrated_donor_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.life_credit, -1) != nvl(:new.life_credit, -1) THEN
        audit_rec.column_name := 'life_credit';
        audit_rec.old_value := :old.life_credit;
        audit_rec.new_value := :new.life_credit;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.ytd_credit, -1) != nvl(:new.ytd_credit, -1) THEN
        audit_rec.column_name := 'ytd_credit';
        audit_rec.old_value := :old.ytd_credit;
        audit_rec.new_value := :new.ytd_credit;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.height, '*') != nvl(:new.height, '*') THEN
        audit_rec.column_name := 'height';
        audit_rec.old_value := :old.height;
        audit_rec.new_value := :new.height;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.alternate_id_type, '*') != nvl(:new.alternate_id_type, '*') THEN
        audit_rec.column_name := 'alternate_id_type';
        audit_rec.old_value := :old.alternate_id_type;
        audit_rec.new_value := :new.alternate_id_type;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.scan_id, '*') != nvl(:new.scan_id, '*') THEN
        audit_rec.column_name := 'scan_id';
        audit_rec.old_value := :old.scan_id;
        audit_rec.new_value := :new.scan_id;
        insert_audit_rec(audit_rec);
    END IF;

    IF nvl(:old.donor_weight, -1) != nvl(:new.donor_weight, -1) THEN
        audit_rec.column_name := 'donor_weight';
        audit_rec.old_value := :old.donor_weight;
        audit_rec.new_value := :new.donor_weight;
        insert_audit_rec(audit_rec);
    END IF;

END;
```
