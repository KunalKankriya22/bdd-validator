-- SQL Script to add EQC1 menu item to navigation
-- Enter Equipment QC Details - First Tech
-- Mnemonic: EQC1
-- Generated: 2026-05-31

-- IMPORTANT: This script must be executed by a DBA
-- The menu item will be added to the Laboratory Functions > Equipment QC menu

-- TODO: Update parent_menu_id based on the correct menu hierarchy
-- TODO: Update sequence number based on desired position in menu

-- Add EQC1 to navigation menu
INSERT INTO UTIL.FCN_MENU_ITEMS (
  MENU_ID,
  FCN_ID,
  DESCRIP,
  SEQUENCE,
  MNEMONIC,
  REMARKS
)
SELECT
  -- TODO: Replace with actual parent menu ID for Equipment QC
  9999, -- parent_menu_id (Laboratory Functions > Equipment QC)
  (SELECT NVL(MAX(FCN_ID), 0) + 1 FROM UTIL.FCN_MENU_ITEMS),
  'Enter Equipment QC Details - First Tech',
  (SELECT NVL(MAX(SEQUENCE), 0) + 10 FROM UTIL.FCN_MENU_ITEMS WHERE MENU_ID = 9999),
  'EQC1',
  'Capture and validate control parameters for equipment test batch before verification'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM UTIL.FCN_MENU_ITEMS WHERE MNEMONIC = 'EQC1');

COMMIT;

-- Verification query - run after insert to confirm
SELECT
  MENU_ID,
  FCN_ID,
  DESCRIP,
  SEQUENCE,
  MNEMONIC,
  REMARKS
FROM UTIL.FCN_MENU_ITEMS
WHERE MNEMONIC = 'EQC1';
