--------------------------------------------------------
--  DDL for Trigger NOTE_BOOKS_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "NOTE_BOOKS_BEFORE_DELETE" 
BEFORE DELETE
ON SBCSYS.NOTE_BOOKS
REFERENCING NEW AS NEW OLD AS OLD
FOR EACH ROW
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
/
ALTER TRIGGER "NOTE_BOOKS_BEFORE_DELETE" ENABLE;
