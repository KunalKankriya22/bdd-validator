delete from note_books where note_id not exists (
select 'x' from units
where units.note_id=note_books.note_id
