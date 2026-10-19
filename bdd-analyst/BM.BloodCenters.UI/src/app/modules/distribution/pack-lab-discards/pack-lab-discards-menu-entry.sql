-- ============================================================================
-- SQL Script: Add Pack Lab Discards to Discard Menu Entry
-- ============================================================================
-- JIRA: MLT-14011
-- Mnemonic: PACKLD
-- Component: PackLabDiscardsComponent
-- Route: /distribution/pack-lab-discards
-- Description: Pack Lab Discards to Discard - Enables lab personnel to pack
--              laboratory-discarded blood products into boxes for disposal
--
-- Navigation Path: Product Management Functions → Distribution Module →
--                  Packing Functions → Pack Lab Discards to Discard
--
-- Prerequisites:
-- 1. Parent menu items must exist in UTIL.FCN_MENU_ITEMS
-- 2. User must have DBA privileges to run this script
-- 3. Run this script in the appropriate database environment
--
-- Instructions for DBA:
-- 1. Update the {parent_menu_id} placeholder with the actual MENU_ID of the
--    "Packing Functions" parent menu
-- 2. Review the FCN_ID generation logic (auto-increment from max)
-- 3. Review the SEQUENCE generation logic (auto-increment from max in parent menu)
-- 4. Execute the script
-- 5. Verify the menu entry appears in the application navigation
-- 6. Grant appropriate access to user groups via Define User Access
--
-- ============================================================================

-- Step 1: Verify parent menu exists (Packing Functions)
-- Note: Update this query to find your specific parent menu
SELECT MENU_ID, FCN_ID, DESCRIP, MNEMONIC
FROM UTIL.FCN_MENU_ITEMS
WHERE DESCRIP LIKE '%Packing%'
  AND MNEMONIC IS NOT NULL
ORDER BY MENU_ID;

-- Expected result: Find the MENU_ID for "Packing Functions" menu
-- Example: MENU_ID = 5200 (this is a placeholder, actual value may differ)

-- ============================================================================

-- Step 2: Check if PACKLD mnemonic already exists
SELECT FCN_ID, MENU_ID, DESCRIP, MNEMONIC, SEQUENCE
FROM UTIL.FCN_MENU_ITEMS
WHERE MNEMONIC = 'PACKLD';

-- Expected result: No rows (menu item doesn't exist yet)

-- ============================================================================

-- Step 3: Insert Pack Lab Discards menu entry
-- IMPORTANT: Replace {parent_menu_id} with actual parent MENU_ID from Step 1

INSERT INTO UTIL.FCN_MENU_ITEMS (
  MENU_ID,
  FCN_ID,
  DESCRIP,
  SEQUENCE,
  MNEMONIC,
  REMARKS
)
SELECT
  {parent_menu_id}, -- REPLACE WITH ACTUAL PARENT MENU_ID (e.g., 5200)
  (SELECT NVL(MAX(FCN_ID), 0) + 1 FROM UTIL.FCN_MENU_ITEMS),
  'Pack Lab Discards to Discard',
  (SELECT NVL(MAX(SEQUENCE), 0) + 10
   FROM UTIL.FCN_MENU_ITEMS
   WHERE MENU_ID = {parent_menu_id}), -- REPLACE WITH ACTUAL PARENT MENU_ID
  'PACKLD',
  'Pack laboratory-discarded blood products and materials into boxes for approved disposal. JIRA: MLT-14011'
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM UTIL.FCN_MENU_ITEMS WHERE MNEMONIC = 'PACKLD'
);

COMMIT;

-- ============================================================================

-- Step 4: Verify insertion
SELECT
  FCN_ID,
  MENU_ID,
  DESCRIP,
  SEQUENCE,
  MNEMONIC,
  REMARKS
FROM UTIL.FCN_MENU_ITEMS
WHERE MNEMONIC = 'PACKLD';

-- Expected result: 1 row with PACKLD menu entry

-- ============================================================================

-- Step 5: Verify menu hierarchy (optional)
SELECT
  LPAD(' ', (LEVEL - 1) * 2) || DESCRIP AS MENU_HIERARCHY,
  FCN_ID,
  MENU_ID,
  MNEMONIC,
  SEQUENCE
FROM UTIL.FCN_MENU_ITEMS
START WITH MENU_ID = {parent_menu_id} -- REPLACE WITH ACTUAL PARENT MENU_ID
CONNECT BY PRIOR FCN_ID = MENU_ID
ORDER SIBLINGS BY SEQUENCE;

-- Expected result: Shows the full menu tree with PACKLD in proper position

-- ============================================================================

-- Step 6: Grant access to user groups (Example - adjust as needed)
-- This is typically done through the "Define User Access" screen in the
-- application, but can also be done via SQL if needed.

-- Example: Grant access to a specific group (adjust GROUP_ID as needed)
/*
INSERT INTO UTIL.GROUP_ACCESS (
  GROUP_ID,
  FCN_ID,
  ACCESS_LEVEL
)
SELECT
  'GROUP_ID_HERE', -- Replace with actual group ID
  FCN_ID,
  1 -- 1 = Read, 2 = Write, etc. (adjust based on your access level system)
FROM UTIL.FCN_MENU_ITEMS
WHERE MNEMONIC = 'PACKLD';

COMMIT;
*/

-- ============================================================================
-- Post-Installation Verification
-- ============================================================================

-- 1. Verify menu entry exists
SELECT COUNT(*) AS MENU_ENTRY_COUNT
FROM UTIL.FCN_MENU_ITEMS
WHERE MNEMONIC = 'PACKLD';
-- Expected: 1

-- 2. Verify frontend routing (check application)
-- - Login to application
-- - Navigate to Product Management Functions → Distribution Module → Packing Functions
-- - Verify "Pack Lab Discards to Discard" menu item appears
-- - Click on menu item
-- - Verify route navigates to /distribution/pack-lab-discards
-- - Verify component loads without errors

-- 3. Verify mnemonic mapping (check browser console if navigation search fails)
-- - Open browser developer tools
-- - Search for "Pack Lab Discards" in navigation search
-- - Verify result appears and routes correctly when clicked

-- ============================================================================
-- Rollback Script (Use only if needed to remove the menu entry)
-- ============================================================================

/*
-- WARNING: This will delete the menu entry. Use with caution.

DELETE FROM UTIL.FCN_MENU_ITEMS
WHERE MNEMONIC = 'PACKLD';

COMMIT;

-- Verify deletion
SELECT COUNT(*) AS REMAINING_COUNT
FROM UTIL.FCN_MENU_ITEMS
WHERE MNEMONIC = 'PACKLD';
-- Expected: 0
*/

-- ============================================================================
-- End of SQL Script
-- ============================================================================

-- Notes for Frontend Team:
-- 1. After running this script, the menu entry will be available in the API response
-- 2. The frontend fcn-route-map.ts already has the PACKLD → PackLabDiscards mapping
-- 3. The route-registry.ts already has the route definition
-- 4. Users will need appropriate access levels granted via Define User Access
-- 5. The menu item will appear in navigation search if the user has access

-- Notes for QA Team:
-- 1. Test navigation from menu: Product Management → Distribution → Packing Functions → Pack Lab Discards
-- 2. Test navigation search: Search "Pack Lab Discards" or "PACKLD"
-- 3. Test all form operations: Pack product, View available products, View box contents, Close box
-- 4. Test validation: Required fields, barcode scheme validation, BIO test IDs requirement
-- 5. Test error handling: Invalid consignee, product already packed, etc.
-- 6. Test accessibility: Screen reader, keyboard navigation, ARIA attributes
-- 7. Test responsive design: Desktop, tablet, mobile viewports

-- ============================================================================
