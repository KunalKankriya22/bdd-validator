DECLARE
   t_count   number;
   cursor get_addr IS
      SELECT rowid
         FROM donor_addresses
       WHERE (h_phone_no is not null OR
              d_phone_no is not null);
BEGIN
   t_count   := 0;
   FOR a1 in get_addr LOOP
      t_count := t_count + 1;
      UPDATE donor_addresses
         SET h_phone_no = translate (h_phone_no,'1234567890 -,.','1234567890'),
             d_phone_no = translate (d_phone_no,'1234567890 -,.','1234567890')
       WHERE rowid = a1.rowid;
---
      IF (mod(t_count,1000) = 0) THEN
         COMMIT;
      END IF;
   END LOOP;
   COMMIT;
END;
/
