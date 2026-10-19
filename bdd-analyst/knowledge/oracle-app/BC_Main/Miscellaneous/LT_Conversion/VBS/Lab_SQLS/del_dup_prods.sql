DECLARE
   CURSOR get_data IS
      SELECT unit_id, coll_date, product_code
        FROM Convert_products
       GROUP BY unit_id, coll_date, product_code having count(*) > 1;
BEGIN
   FOR a1 IN get_data LOOP
      DELETE from convert_products cp
       WHERE cp.unit_id = a1.unit_id
         AND cp.coll_date = a1.coll_date
         AND cp.product_code = a1.product_code
         AND EXISTS
             (SELECT 'x' FROM convert_products cp2
               WHERE cp2.unit_id = a1.unit_id
                 AND cp2.coll_date = a1.coll_date
                 AND cp2.product_code = a1.product_code
      COMMIT;
  END LOOP;
END;

/
