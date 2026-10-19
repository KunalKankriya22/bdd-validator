-- ============================================================================
-- Database Menu Entry for Notation Code Configuration
-- JIRA: MLT-12596
-- Mnemonic: NOTCFG
-- Module: Laboratory Functions > Lab Administration
-- ============================================================================

-- Script to add Notation Code Configuration menu item to UTIL.FCN_MENU_ITEMS
-- This enables the component to appear in navigation search results

-- NOTE: The parent menu ID should be confirmed by DBA before execution
-- The parent menu is "Lab Administration" under "Laboratory Functions"

-- Variables to be confirmed by DBA:
-- @parent_menu_id: Menu ID for "Lab Administration" parent menu
-- @sequence_number: Next available sequence number in that menu

-- Add Notation Code Configuration menu item
INSERT INTO UTIL.FCN_MENU_ITEMS (
  MENU_ID,
  FCN_ID,
  DESCRIP,
  SEQUENCE,
  MNEMONIC,
  REMARKS
)
SELECT
  999,  -- REPLACE WITH ACTUAL PARENT MENU ID (Lab Administration)
  (SELECT NVL(MAX(FCN_ID), 0) + 1 FROM UTIL.FCN_MENU_ITEMS),
  'Notation Code Configuration',
  (SELECT NVL(MAX(SEQUENCE), 0) + 10 FROM UTIL.FCN_MENU_ITEMS WHERE MENU_ID = 999),  -- REPLACE 999 WITH ACTUAL PARENT MENU ID
  'NOTCFG',
  'Map external blood bank codes to internal testing facility codes if there are differences.'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM UTIL.FCN_MENU_ITEMS WHERE MNEMONIC = 'NOTCFG'
);

COMMIT;

-- Verification query
SELECT 
  M.MENU_ID,
  M.FCN_ID,
  M.DESCRIP,
  M.SEQUENCE,
  M.MNEMONIC,
  M.REMARKS
FROM 
  UTIL.FCN_MENU_ITEMS M
WHERE 
  M.MNEMONIC = 'NOTCFG';

-- ============================================================================
-- Instructions for DBA:
-- 1. Replace 999 with the actual MENU_ID for "Lab Administration" 
--    (Query: SELECT MENU_ID, MENU_NAME FROM UTIL.FCN_MENUS WHERE MENU_NAME LIKE '%Lab Admin%')
-- 2. Verify sequence number doesn't conflict with existing menu items
-- 3. Execute INSERT statement
-- 4. Run verification query to confirm successful insert
-- 5. Test navigation search in UI by typing "Notation Code Configuration"
-- ============================================================================
