---
tags:
  - trigger
  - SBCSYS
---
# NOTE_BOOKS_BEFORE_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/NOTE_BOOKS|NOTE_BOOKS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
    NOTE_BOOKS_aud	      NOTE_BOOKS%rowtype;
begin
    NOTE_BOOKS_aud.audit_key := :old.audit_key;
    if nvl(:old.NOTE_ID,-1) !=
       nvl(:new.NOTE_ID,-1)
    then
       NOTE_BOOKS_aud.NOTE_ID := nvl(:new.NOTE_ID,-1);
    end if;
    if nvl(:old.NOTE,'*') !=
       nvl(:new.NOTE,'*')
    then
       NOTE_BOOKS_aud.NOTE := nvl(:new.NOTE,'*');
    end if;
    if nvl(:old.NOTE_SEQ,-1) !=
       nvl(:new.NOTE_SEQ,-1)
    then
       NOTE_BOOKS_aud.NOTE_SEQ := nvl(:new.NOTE_SEQ,-1);
    end if;
    if nvl(:old.NOTES_TABLE,'*') !=
       nvl(:new.NOTES_TABLE,'*')
    then
       NOTE_BOOKS_aud.NOTES_TABLE := nvl(:new.NOTES_TABLE,'*');
    end if;
    if nvl(:old.CHAPTER_ID,'*') !=
       nvl(:new.CHAPTER_ID,'*')
    then
       NOTE_BOOKS_aud.CHAPTER_ID := nvl(:new.CHAPTER_ID,'*');
    end if;
    if nvl(:old.PROGRAM_ID,'*') !=
       nvl(:new.PROGRAM_ID,'*')
    then
       NOTE_BOOKS_aud.PROGRAM_ID := nvl(:new.PROGRAM_ID,'*');
    end if;
    if nvl(:old.NOTES_TYPE,'*') !=
       nvl(:new.NOTES_TYPE,'*')
    then
       NOTE_BOOKS_aud.NOTES_TYPE := nvl(:new.NOTES_TYPE,'*');
    end if;

    --
    insert into NOTE_BOOKS_audit
    (
	NOTE_ID,NOTE,AUDIT_KEY,
        NOTE_SEQ,NOTES_TABLE,CHAPTER_ID,PROGRAM_ID,
	audit_insert_dats, audit_insert_user,NOTES_TYPE
    )
    values
    (
	NOTE_BOOKS_aud.NOTE_ID, NOTE_BOOKS_aud.NOTE, NOTE_BOOKS_aud.AUDIT_KEY,
	NOTE_BOOKS_aud.NOTE_SEQ, NOTE_BOOKS_aud.NOTES_TABLE, NOTE_BOOKS_aud.CHAPTER_ID,NOTE_BOOKS_aud.PROGRAM_ID,
	sysdate,lt_user_session.get_userid,NOTE_BOOKS_aud.NOTES_TYPE
    );
end;
```
