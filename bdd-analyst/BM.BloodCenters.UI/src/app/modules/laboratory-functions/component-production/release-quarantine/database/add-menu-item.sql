-- ============================================================================
-- Script: Add Release Product Quarantine Menu Item
-- JIRA Ticket: MLT-14086
-- Mnemonic: RQU
-- Component: Release Product Quarantine
-- Route: /laboratory-functions/component-production/release-quarantine
-- ============================================================================
-- Description:
--   Adds the "Release Product Quarantine" menu item to the
--   UTIL.FCN_MENU_ITEMS table for navigation search functionality.
--
-- Prerequisites:
--   - Parent menu (Component Production) must exist
--   - User must have appropriate privileges to insert into UTIL.FCN_MENU_ITEMS
--
-- Instructions for DBA:
--   1. Identify the correct MENU_ID for "Component Production" parent menu
--   2. Update the @parent_menu_id variable below
--   3. Execute the script in the UTIL schema
--   4. Verify the insert with: SELECT * FROM UTIL.FCN_MENU_ITEMS WHERE MNEMONIC = 'RQU';
-- ============================================================================

-- TODO: DBA must set the correct parent menu ID
-- Find parent menu ID with:
-- SELECT MENU_ID, DESCRIP FROM UTIL.FCN_MENU_ITEMS WHERE DESCRIP LIKE '%Component Production%';

DECLARE
  v_parent_menu_id NUMBER := NULL; -- DBA: Set this to the correct parent menu ID
  v_new_fcn_id NUMBER;
  v_new_sequence NUMBER;
  v_count NUMBER;
BEGIN
  -- Check if mnemonic already exists
  SELECT COUNT(*) INTO v_count
  FROM UTIL.FCN_MENU_ITEMS
  WHERE MNEMONIC = 'RQU';

  IF v_count > 0 THEN
    DBMS_OUTPUT.PUT_LINE('ERROR: Menu item with mnemonic RQU already exists.');
    RETURN;
  END IF;

  -- Validate parent menu ID
  IF v_parent_menu_id IS NULL THEN
    DBMS_OUTPUT.PUT_LINE('ERROR: Parent menu ID not set. Please update v_parent_menu_id.');
    RETURN;
  END IF;

  -- Generate new FCN_ID
  SELECT NVL(MAX(FCN_ID), 0) + 1 INTO v_new_fcn_id
  FROM UTIL.FCN_MENU_ITEMS;

  -- Generate new SEQUENCE for the parent menu
  SELECT NVL(MAX(SEQUENCE), 0) + 10 INTO v_new_sequence
  FROM UTIL.FCN_MENU_ITEMS
  WHERE MENU_ID = v_parent_menu_id;

  -- Insert new menu item
  INSERT INTO UTIL.FCN_MENU_ITEMS (
    MENU_ID,
    FCN_ID,
    DESCRIP,
    SEQUENCE,
    MNEMONIC,
    REMARKS
  )
  VALUES (
    v_parent_menu_id,
    v_new_fcn_id,
    'Release Product Quarantine',
    v_new_sequence,
    'RQU',
    'Process returned products from consignees and update inventory or credit based on the return reason.'
  );

  COMMIT;

  DBMS_OUTPUT.PUT_LINE('SUCCESS: Release Product Quarantine menu item added.');
  DBMS_OUTPUT.PUT_LINE('FCN_ID: ' || v_new_fcn_id);
  DBMS_OUTPUT.PUT_LINE('SEQUENCE: ' || v_new_sequence);
  DBMS_OUTPUT.PUT_LINE('MNEMONIC: RQU');

EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    DBMS_OUTPUT.PUT_LINE('ERROR: ' || SQLERRM);
    RAISE;
END;
/

-- Verify the insert
SELECT
  FCN_ID,
  MENU_ID,
  DESCRIP,
  SEQUENCE,
  MNEMONIC,
  REMARKS
FROM UTIL.FCN_MENU_ITEMS
WHERE MNEMONIC = 'RQU';

-- ============================================================================
-- End of script
-- ============================================================================
