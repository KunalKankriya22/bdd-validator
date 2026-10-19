-- Version: 01 Modified Date: 07/22/2014
declare
  x                     CHAR(1);
  storage_class	        VARCHAR2(2);
  inventory_class       VARCHAR2(2);
  mix_abo               CHAR(1);
  mix_product           CHAR(1);
  row_count             NUMBER(3):= 0;
  ship_any_rh           CHAR(1);
  err_text              VARCHAR2(32);
  ctr                   NUMBER := 0;
  abo                   VARCHAR2(6);
  interdiction	        VARCHAR2(4);
  v_timezone_active     CHAR(1);
  v_local_time	        DATE;
  v_local_date	        DATE;
  t_program_error_count number := 0;
  temp_errors_exceeded  varchar2(1);
  prd_type              VARCHAR2(5);
  import_flag           VARCHAR2(1) := ' ';


  --MAIN CURSOR TO GET PRODUCTS FROM LAB
  CURSOR comp IS
  SELECT c.unit_id unit_id, c.chapter_id chapter_id,
         c.component_prefix aliquot, c.product_code product_code,
         c.expiry_date expiry_date, c.system_label_decision blood_type,
         c.warehouse_id warehouse_id, c.label_dats label_dats,
         u.drive_id drive_id, u.coll_date coll_date,
         u.group_site_id group_site_id, u.contract_id contract_id,
         NVL(u.unit_scheme_type, DECODE(LENGTH(u.unit_id), 13, 'I', 'C')) code_scheme, u.chk_digit chk_digit
    FROM components c, units u
   WHERE c.unit_id = u.unit_id
     AND c.coll_date = u.coll_date
     AND c.chapter_id = 'WAD'
     AND c.chapter_id = u.chapter_id
     AND c.warehouse_id = u.warehouse_id
     AND c.warehouse_id = 'A'
     AND c.component_status = 'L'
     AND c.system_label_decision IS NOT NULL
     AND expiry_date IS NOT NULL
     AND expiry_date  > SYSDATE
     AND SUBSTR(c.product_code,1,5) NOT IN (SELECT product_code
                                              FROM valid_products
                                             WHERE pool_product_code='Y')
     AND NOT EXISTS (SELECT 'x'
                       FROM active_products
                      WHERE chapter_id = c.chapter_id
                        AND unit_id = c.unit_id
                        AND product_code = c.product_code
                        AND coll_date =	u.coll_date)
     AND NOT EXISTS (SELECT 'x'
                       FROM shipped_products
                      WHERE chapter_id = c.chapter_id
                        AND unit_id = c.unit_id
                        AND product_code = c.product_code
                        AND coll_date =	u.coll_date)
     AND NOT EXISTS (SELECT 'x'
                       FROM quarantine_products
                      WHERE chapter_id = c.chapter_id
                        AND unit_id = c.unit_id
                        AND product_code = c.product_code
                        AND aliquot = c.component_prefix)
     AND NOT EXISTS (SELECT 'x'
                       FROM discard_products
                      WHERE chapter_id = c.chapter_id
                        AND unit_id = c.unit_id
                        AND product_code = c.product_code
                        AND aliquot = c.component_prefix)
     AND ((NVL(u.unit_scheme_type, DECODE(LENGTH(u.unit_id), 13, 'I', 'C')) = 'I' AND 
           c.system_label_decision NOT IN ('Mb', 'Mq', 'Mx', 'Md', 'Mf')) OR
          (NVL(u.unit_scheme_type, DECODE(LENGTH(u.unit_id), 13, 'I', 'C')) = 'C' AND
           c.system_label_decision NOT IN ('21', '39', '47', '49', '58')))
     AND NOT EXISTS (SELECT 'x'
                       FROM component_attributes
                      WHERE unit_id = c.unit_id
                        AND chapter_id = c.chapter_id
                        AND coll_date = c.coll_date
                        AND attrib_code = 'CP6I')
     AND c.system_label_decision NOT IN ('71')
     AND NOT EXISTS (SELECT 'x'
                       FROM valid_abo_values
                      WHERE unit_scheme_type = DECODE(LENGTH(c.product_code), 5, 'C', 'I')
                        AND abo_label =	c.system_label_decision
                        AND identifier_code = 'EM')
   ORDER BY c.product_code, c.unit_id;


  procedure insert_program_errors (p_statement_id in varchar2,
                                   p_error_msg in varchar2) is
  begin
    insert into temp_program_errors
      (module_id, statement_id,
       item_id, error_msg,
       insert_user, insert_date, program_id)
    values
      ('COPY FROM LAB', p_statement_id,
       null, p_error_msg,
       'SBCSYS', sysdate, 'COPY FROM LAB');
  end;

		
BEGIN
  begin
    delete from program_errors
     where module_id = 'COPY FROM LAB'
       and insert_user = 'SBCSYS';

    delete from temp_program_errors;

    commit;
  end;
    
  -- Get timezone flag
  BEGIN
    SELECT nvl(TIME_ZONE_ENABLED, 'N')
      INTO v_timezone_active
      FROM LT_APPLICATION_CONFIG ;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      insert_program_errors ('100', 'Error: ' || 'No records found in timezone');
    WHEN OTHERS THEN
      insert_program_errors ('101', 'Error: ' || SQLERRM);
  END;
    
  IF v_timezone_active = 'Y' THEN
    Lifetrack_timezone_convert.get_local_time('WAD', sysdate, v_local_time);
    v_local_date := v_local_time;
  ELSE
    v_local_date := SYSDATE;
  END IF;
    
  FOR c_rec IN comp LOOP
    BEGIN
      row_count := row_count + 1;

      BEGIN
        SELECT SUBSTR(abo_desc, 1, 6)
          INTO abo
          FROM vserv_abo
         WHERE abo_code = c_rec.blood_type
           AND unit_scheme_type = c_rec.code_scheme;
      EXCEPTION
        WHEN NO_DATA_FOUND THEN
          insert_program_errors ('102', 'Blood type not found in VSERV_ABO: ' || c_rec.unit_id || ', ' || c_rec.product_code);
      END;
	
      -------------------------------------------------
      -- GET INV PRODUCT TYPE FOR SELECTED PRODUCT
      -------------------------------------------------
      BEGIN
        SELECT inv_product_type
          INTO prd_type
          FROM vserv_products
         WHERE product_code = SUBSTR(c_rec.product_code, 1, 5)
           AND unit_scheme_type = c_rec.code_scheme
           AND v_local_date BETWEEN eff_date AND NVL(term_date, SYSDATE + 10);
      EXCEPTION
        WHEN NO_DATA_FOUND THEN
          insert_program_errors ('103', 'Product Type not found: ' || c_rec.unit_id || ', ' || c_rec.product_code);
        WHEN OTHERS THEN
          insert_program_errors ('104', SQLERRM || ': ' || c_rec.unit_id || ', ' || c_rec.product_code);
      END;

      SELECT COUNT(*)
        INTO ctr
        FROM UNITS
       WHERE unit_id = c_rec.unit_id
         AND coll_date = c_rec.coll_date
         AND chapter_id	= c_rec.chapter_id
         AND warehouse_id = c_rec.warehouse_id
         AND NVL(qc_checkin_flag, 'N') = 'N'
         AND import_flag = 'Y';

      IF ctr > 0 THEN
        insert_program_errors ('105', 'QC not done for Imported Unit: ' || c_rec.unit_id || ', ' || c_rec.product_code);
      END IF;

      --------------------------------------------------
      ---- Checking for Component and Unit Interdictions
      --------------------------------------------------
      BEGIN
        SELECT inter_code
          INTO interdiction
          FROM component_interdictions
         WHERE chapter_id = c_rec.chapter_id
           AND unit_id = c_rec.unit_id
           AND product_code = c_rec.product_code
           AND coll_date = c_rec.coll_date
           AND insert_dats > NVL(c_rec.label_dats, SYSDATE - 1000000);

        insert_program_errors ('106', 'Component Interdiction: ' || c_rec.unit_id || ', ' || c_rec.product_code);
      EXCEPTION
        WHEN NO_DATA_FOUND THEN
          NULL;
        WHEN TOO_MANY_ROWS THEN
          insert_program_errors ('107', 'Component Interdiction: ' || c_rec.unit_id || ', ' || c_rec.product_code);
        WHEN OTHERS THEN
          insert_program_errors ('108', SQLERRM || ': ' || c_rec.unit_id || ', ' || c_rec.product_code);
      END;

      BEGIN
        SELECT ui.inter_code
          INTO interdiction
          FROM unit_interdictions ui, valid_interdictions vi
         WHERE chapter_id = c_rec.chapter_id
           AND unit_id = c_rec.unit_id
           AND coll_date = c_rec.coll_date
           AND ui.inter_code = vi.inter_code
           AND vi.inter_type != 'I'
           AND (vi.inter_type != 'B' OR	
                c_rec.blood_type NOT IN ('40', '71'))
           AND v_local_date BETWEEN vi.eff_date AND NVL(vi.term_date, SYSDATE + 10)
           AND insert_dats > NVL(c_rec.label_dats, SYSDATE - 1000000);

        insert_program_errors ('109', 'Unit Interdiction: ' || c_rec.unit_id || ', ' || c_rec.product_code);
      EXCEPTION
        WHEN NO_DATA_FOUND THEN
          NULL;
        WHEN TOO_MANY_ROWS THEN
          insert_program_errors ('110', 'Unit Interdiction: ' || c_rec.unit_id || ', ' || c_rec.product_code);
        WHEN OTHERS THEN
          insert_program_errors ('111', SQLERRM || ': ' || c_rec.unit_id || ', ' || c_rec.product_code);
      END;
			
      -------------------------------------------------------------------------
      -- INSERT DATA INTO INVENTORY
      -------------------------------------------------------------------------
      IF interdiction IS NULL THEN
        BEGIN
          DBMS_OUTPUT.PUT_LINE('Before Insert in Active Products');

          INSERT INTO ACTIVE_PRODUCTS
            (unit_id, coll_date, chapter_id,
             product_code, aliquot, blood_type,
             exp_date, product_type, insert_date,
             appl_custody, stock_state, location_id,
             import_flag, inventory_class, osok_flag,
             program_id, warehouse_id)
          VALUES
            (c_rec.unit_id, c_rec.coll_date, c_rec.chapter_id,
             c_rec.product_code, c_rec.aliquot, c_rec.blood_type,
             c_rec.expiry_date, prd_type, sysdate,
             'SV', 'AV', 'HC01120001',
             ' ', 'RE', 'Y',
             'COPY_FROM_LAB', 'A');

          DBMS_OUTPUT.PUT_LINE('After Insert');
        EXCEPTION
          WHEN OTHERS THEN
            insert_program_errors ('112', SQLERRM || ': ' || c_rec.unit_id || ', ' || c_rec.product_code);
        END;

        BEGIN
          UPDATE components
             SET component_status	= 'S',
                 program_id = 'COPY_FROM_LAB',
                 out_of_system_dats = SYSDATE
           WHERE unit_id = c_rec.unit_id
             AND coll_date = c_rec.coll_date
             AND chapter_id = c_rec.chapter_id
             AND product_code = c_rec.product_code
             AND component_prefix = c_rec.aliquot;
        EXCEPTION
          WHEN OTHERS THEN
            insert_program_errors ('113', SQLERRM || ': ' || c_rec.unit_id || ', ' || c_rec.product_code);
        END;

        IF row_count = 100 THEN
          --COMMIT;
          row_count := 0;
        END IF;
        
      END IF;

    EXCEPTION
      WHEN UTL_FILE.invalid_filehandle THEN
        insert_program_errors ('114', 'Invalid Filehandle: ' || c_rec.unit_id || ', ' || c_rec.product_code);
      WHEN UTL_FILE.invalid_path THEN
        insert_program_errors ('115', 'Invalid Path: ' || c_rec.unit_id || ', ' || c_rec.product_code);
      WHEN UTL_FILE.invalid_mode THEN
        insert_program_errors ('116', 'Invalid Mode: ' || c_rec.unit_id || ', ' || c_rec.product_code);
      WHEN UTL_FILE.invalid_operation THEN
        insert_program_errors ('117', 'Invalid Operation: ' || c_rec.unit_id || ', ' || c_rec.product_code);
      WHEN OTHERS THEN
        insert_program_errors ('118', SQLERRM || ': ' || c_rec.unit_id || ', ' || c_rec.product_code);
    END;
  END LOOP;

  begin
    select count(*)
      into t_program_error_count
      from temp_program_errors
     where module_id = 'COPY FROM LAB'
       and insert_user = 'SBCSYS';
  end;

  if t_program_error_count >= 100 then
    --commit;
    temp_errors_exceeded := 'Y';
  end if;
  
  savepoint save_just_errors;
 
  begin
    insert into program_errors
    select * from temp_program_errors where module_id = 'COPY FROM LAB';

    --drop table temp_program_errors;
  end;

  if temp_errors_exceeded = 'Y' then
    rollback to save_just_errors;
  end if;

  COMMIT;

END;