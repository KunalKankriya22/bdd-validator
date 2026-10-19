-- =====================================================================================
-- Database Menu Entry for Enter Product Attributes (VADDTST)
-- Generated: 2026-05-28
-- JIRA: MLT-14083
-- Mnemonic: VADDTST
-- Navigation: Product Management Functions => Inventory Management => Product Management => Enter Product Attributes
-- =====================================================================================

-- IMPORTANT: Execute this script in Oracle database to add menu entry
-- This enables navigation search to find this screen

-- =====================================================================================
-- STEP 1: Find the parent menu ID for Product Management
-- =====================================================================================
-- Run this query first to find the correct MENU_ID for "Product Management"
-- SELECT MENU_ID, FCN_ID, DESCRIP, SEQUENCE, MNEMONIC
-- FROM UTIL.FCN_MENU_ITEMS
-- WHERE UPPER(DESCRIP) LIKE '%PRODUCT MANAGEMENT%'
-- AND MENU_ID IS NOT NULL
-- ORDER BY SEQUENCE;

-- Example result: Assuming parent MENU_ID = 500 (replace with actual value from above query)

-- =====================================================================================
-- STEP 2: Insert menu item for Enter Product Attributes
-- =====================================================================================

-- Replace {parent_menu_id} with the actual MENU_ID from Step 1
-- Example: If parent menu ID is 500, replace {parent_menu_id} with 500

INSERT INTO UTIL.FCN_MENU_ITEMS (
  MENU_ID,
  FCN_ID,
  DESCRIP,
  SEQUENCE,
  MNEMONIC,
  REMARKS
)
SELECT
  {parent_menu_id},  -- Replace with actual parent MENU_ID (e.g., 500)
  (SELECT NVL(MAX(FCN_ID), 0) + 1 FROM UTIL.FCN_MENU_ITEMS),  -- Auto-generate next FCN_ID
  'Enter Product Attributes',  -- Menu display label
  (SELECT NVL(MAX(SEQUENCE), 0) + 10 FROM UTIL.FCN_MENU_ITEMS WHERE MENU_ID = {parent_menu_id}),  -- Auto-sequence
  'VADDTST',  -- Mnemonic code (CRITICAL: Must match fcn-route-map.ts)
  'Enter Product Attributes - Assign attributes to inventory products/components (ALERT and SP groups only)'  -- Description
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1
  FROM UTIL.FCN_MENU_ITEMS
  WHERE MNEMONIC = 'VADDTST'
);

COMMIT;

-- =====================================================================================
-- STEP 3: Verify the insert
-- =====================================================================================
-- Run this query to verify the menu item was created successfully
-- SELECT * FROM UTIL.FCN_MENU_ITEMS WHERE MNEMONIC = 'VADDTST';

-- Expected result:
-- MENU_ID: {parent_menu_id}
-- FCN_ID: (auto-generated, e.g., 1501)
-- DESCRIP: Enter Product Attributes
-- MNEMONIC: VADDTST
-- SEQUENCE: (auto-generated, e.g., 10, 20, 30, etc.)

-- =====================================================================================
-- NOTES FOR DBA:
-- =====================================================================================
-- 1. Replace {parent_menu_id} with the actual MENU_ID from the parent menu "Product Management"
-- 2. The mnemonic "VADDTST" is mapped in the frontend (fcn-route-map.ts) to route:
--    /product-management-functions/inventory-management/product-management/enter-product-attributes
-- 3. If the menu item already exists (duplicate mnemonic), the insert will be skipped
-- 4. After running this script, users should be able to search for "Enter Product Attributes"
--    in the navigation search and navigate to the screen
-- 5. The screen will appear under:
--    Product Management Functions > Inventory Management > Product Management > Enter Product Attributes
-- =====================================================================================

-- =====================================================================================
-- ALTERNATIVE: Manual insert with known parent_menu_id
-- =====================================================================================
-- If you know the parent MENU_ID, you can directly insert:
-- Example with parent_menu_id = 500:
/*
INSERT INTO UTIL.FCN_MENU_ITEMS (
  MENU_ID,
  FCN_ID,
  DESCRIP,
  SEQUENCE,
  MNEMONIC,
  REMARKS
) VALUES (
  500,  -- Parent menu ID
  (SELECT NVL(MAX(FCN_ID), 0) + 1 FROM UTIL.FCN_MENU_ITEMS),
  'Enter Product Attributes',
  (SELECT NVL(MAX(SEQUENCE), 0) + 10 FROM UTIL.FCN_MENU_ITEMS WHERE MENU_ID = 500),
  'VADDTST',
  'Enter Product Attributes - Assign attributes to inventory products/components'
);
COMMIT;
*/
