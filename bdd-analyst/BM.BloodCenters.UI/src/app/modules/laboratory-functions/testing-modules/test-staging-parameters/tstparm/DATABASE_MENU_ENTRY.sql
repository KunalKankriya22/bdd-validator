-- ============================================================================
-- Database Menu Entry for Define Critical Controls for Test (TSTPARM)
-- ============================================================================
-- This SQL script must be executed by a DBA to add the menu item to the
-- navigation system. The mnemonic 'TSTPARM' must match exactly (case-sensitive)
-- for navigation search to work properly.
-- ============================================================================

-- Add Define Critical Controls for Test to navigation menu
-- Mnemonic: TSTPARM
-- Module: Laboratory Functions > Testing Modules

-- TODO: Update MENU_ID and parent references based on your database structure
-- TODO: Determine the correct FCN_ID sequence for your environment
-- TODO: Adjust SEQUENCE value based on desired menu order

INSERT INTO UTIL.FCN_MENU_ITEMS (
  MENU_ID,              -- Parent menu ID (TODO: Replace with actual parent menu ID for Testing Modules)
  FCN_ID,               -- Function ID (auto-generated)
  DESCRIP,              -- Display label in menu
  SEQUENCE,             -- Order in menu (TODO: Adjust as needed)
  MNEMONIC,             -- Mnemonic code (MUST be 'TSTPARM')
  REMARKS               -- Description/notes
)
SELECT
  9999,  -- TODO: Replace with actual parent menu ID for Testing Modules section
  (SELECT NVL(MAX(FCN_ID), 0) + 1 FROM UTIL.FCN_MENU_ITEMS),
  'Define Critical Controls for Test',
  (SELECT NVL(MAX(SEQUENCE), 0) + 10 FROM UTIL.FCN_MENU_ITEMS WHERE MENU_ID = 9999),  -- TODO: Use same MENU_ID
  'TSTPARM',
  'Configure individual test parameters by defining metadata and assigning parameters with min/max values and dates'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM UTIL.FCN_MENU_ITEMS WHERE MNEMONIC = 'TSTPARM'
);

COMMIT;

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this query after insertion to verify the menu item was created:

SELECT
  FCN_ID,
  MENU_ID,
  MNEMONIC,
  DESCRIP,
  SEQUENCE,
  REMARKS
FROM UTIL.FCN_MENU_ITEMS
WHERE MNEMONIC = 'TSTPARM';

-- ============================================================================
-- Expected Result:
-- The menu item should appear with:
-- - MNEMONIC: TSTPARM
-- - DESCRIP: Define Critical Controls for Test
-- - Proper MENU_ID matching the Testing Modules parent menu
-- ============================================================================
