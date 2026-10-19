---
tags:
  - trigger
  - SBCSYS
---
# NOTE_BOOKS_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/NOTE_BOOKS|NOTE_BOOKS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin

	insert into NOTE_BOOKS_audit
    (
	NOTE_ID, NOTE, AUDIT_KEY,
	NOTE_SEQ,NOTES_TABLE,CHAPTER_ID,PROGRAM_ID,
	audit_insert_dats, audit_insert_user,NOTES_TYPE
    )
    values
    (
	:old.NOTE_ID, :old.NOTE, :old.AUDIT_KEY,
	:old.NOTE_SEQ,:old.NOTES_TABLE,:old.CHAPTER_ID,:old.PROGRAM_ID,
	sysdate,lt_user_session.get_userid,:old.NOTES_TYPE
    );
end;
```
