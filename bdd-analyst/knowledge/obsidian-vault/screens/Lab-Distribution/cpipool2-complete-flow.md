---
module: Lab/Distribution
sub_module: "Component Processing"
title: "Prepare Pool Component (POOL) - Complete Flow"
mnemonic: cpipool2
form_file: cpipool2_fmb.xml
tags:
  - screen
  - lab-distribution
  - component-processing
  - pool
  - comprehensive-flow
---

# CPIPOOL2 -- Prepare Pool Component (POOL) -- Complete Flow Document

**Form:** `cpipool2_fmb.xml`
**Program Version:** 09 (MLT-6880)
**Module:** Lab/Distribution > Component Processing
**Report:** CPRPOOL (Pooled Components Report)

---

## Table of Contents

1. [Form Initialization Flow](#1-form-initialization-flow)
2. [Pool Creation Flow (New Pool)](#2-pool-creation-flow-new-pool)
3. [Reopening Existing Pool](#3-reopening-existing-pool)
4. [Delete Component from Pool](#4-delete-component-from-pool)
5. [Reprint Label](#5-reprint-label)
6. [Clear Form / Exit](#6-clear-form--exit)
7. [All Validation Scenarios with Error Codes](#7-all-validation-scenarios-with-error-codes)
8. [ISBT vs Codabar Differences](#8-isbt-vs-codabar-differences)
9. [All Error Codes](#9-all-error-codes)
10. [Tables Written at Each Stage](#10-tables-written-at-each-stage)
11. [Prerequisites and Limitations](#11-prerequisites-and-limitations)

---

## 1. Form Initialization Flow

When the CPIPOOL2 form opens, three triggers fire in sequence:

### 1.1 PRE-FORM Trigger

Sets program version and initializes all global variables:

| Global Variable | Default Value | Purpose |
|---|---|---|
| `global.program_version` | `'09'` | Form version (MLT-6880) |
| `global.is_time_enabled` | `'Y'` or `'N'` | Timezone feature flag, based on `IS_TIMEZONE_ENABLED` |
| `global.sld` | `null` | System label decision |
| `GLOBAL.pool` | `'N'` | Pool processing flag (N=new, Y=existing) |
| `GLOBAL.frz_flag` | `'N'` | Freeze flag (cryo product indicator) |
| `GLOBAL.crws_time_interdiction` | `'N'` | Worksheet-to-freeze time interdiction |
| `GLOBAL.crse_time_interdiction` | `'N'` | Separation-to-freeze time interdiction |
| `GLOBAL.commit_yes` | `'N'` | Commit tracking flag |
| `GLOBAL.weight_required` | `'N'` | Weight requirement flag |
| `GLOBAL.sp_test` | `'N'` | Special testing flag |
| `GLOBAL.CHK_VAL_YEAR` | `'Y'` | Check validation year flag |

Additional actions:
- Hides WINDOW2 (the label verification popup) if visible
- Calls `SBC_BANNER` trigger (inherited from SBCLIB) to set up the standard application banner/header

### 1.2 WHEN-NEW-FORM-INSTANCE Trigger

- Sleeps 200ms (`dbms_lock.sleep(2/10)`) to let the form finish rendering
- Applies Look-and-Feel (LAF) CSS/GUI theming to 6 bean areas (LAF_BEAN183-188) via `PKG_LOOK_AND_FEEL`
- Converts sysdate to local timezone via `lifetrack_timezone_convert.get_local_time` and stores in `:s_sysdate`
- Calls `InitForm` -- business initialization (query setup, field defaults)

### 1.3 WHEN-NEW-ITEM-INSTANCE (Form-Level)

Fires on every field navigation throughout the form's lifetime. Refreshes two values from the `chapters` table on each field change:

- `:GLOBAL.unit_scheme` -- the unit numbering/identification scheme
- `:GLOBAL.chapter_qc_reqd_flag` -- whether QC labeling is required (defaults to 'N')

**Performance note:** This fires a DB round-trip on every field navigation.

### Initialization Flow Diagram

```
Form Open
  |
  +-> PRE-FORM
  |     - Set program_version = '09'
  |     - Set global.is_time_enabled
  |     - Hide WINDOW2
  |     - Execute SBC_BANNER (from SBCLIB)
  |     - Initialize 10 globals via default_value()
  |
  +-> WHEN-NEW-FORM-INSTANCE
  |     - Apply LAF theming (6 beans)
  |     - Get timezone-adjusted sysdate -> :s_sysdate
  |     - Call InitForm
  |
  +-> WHEN-NEW-ITEM-INSTANCE (repeats on every field change)
        - Query chapters table
        - Set GLOBAL.unit_scheme
        - Set GLOBAL.chapter_qc_reqd_flag
```

---

## 2. Pool Creation Flow (New Pool)

### 2a. Pool ID Entry (CTRL_BLK_2.SCAN_POOL_ID -> CTRL_BLK_2.POOL_ID)

The user begins by scanning or entering the pool unit ID in the SCAN_POOL_ID field.

**SCAN_POOL_ID PRE-TEXT-ITEM:**
- Sets entry type to 'D' (direct/scan)
- Sets `GLOBAL.QUERY_POOL_ID = 'N'`
- Sets `s_sysdate` to timezone-adjusted current time

**SCAN_POOL_ID VALIDATE_FIELD:**
- Clears pool_id, chk_digit, and manual_unit_id
- If not 'M' (manual): calls `validate_unit_id_coexist` with mode='S' (scan) to decode the barcode
- Stores decoded unit in `GLOBAL.manual_unit_id`

**SCAN_POOL_ID KEY-NEXT-ITEM:**
- Executes VALIDATE_FIELD
- If value is `'M'`: navigates to `manual_unit_entry_coexist` block for manual entry, sets `GLOBAL.QUERY_POOL_ID = 'Y'`
- Otherwise: advances to POOL_ID field and cascades its KEY-NEXT-ITEM

**POOL_ID PRE-TEXT-ITEM:**
- Copies `GLOBAL.manual_unit_id` into the displayed POOL_ID field

**POOL_ID VALIDATE_FIELD (the primary pool validation):**
1. Null check
2. Determines code scheme: ISBT ('I') if 13 chars, Codabar ('C') otherwise
3. Checks if pool_id already exists in `units` table -- if found, error **0180** (unit already exists; pool ID must be NEW)
4. For existing pools: looks up in `pooled_components` table, checks expiry (error **0154** if expired), retrieves product code
5. Verifies component product code in `components` matches `pooled_components` product code (error **1206** if mismatch)
6. Calls `CHECK_INTRANSIT_INTERDICTION` -- ensures pool is not in transit
7. Calls `check_unit_prod_interdictions` -- ensures no B/H/N interdictions exist (error **1101**)

**POOL_ID KEY-NEXT-ITEM (the main query/load trigger):**

For a new pool (pool_id not found in pooled_components):
- Sets `GLOBAL.pool = 'N'`
- Sets `GLOBAL.first_entry_rec = '1'`
- Clears POOLED_COMPONENTS block

For an existing pool (pool_id found):
- Queries POOLED_COMPONENTS block via `execute_query`
- Loads component attributes into ATTRIBS block via cursor on `component_attributes`
- Loads all individual component units into CTRL_BLK_1 via cursor on `components` (with `pooled_component_id = pool_id`)
- For each component: determines code scheme, formats s_unit_id with appropriate prefix, looks up tested ABO from `valid_abo_values`
- Sets `GLOBAL.pool = 'Y'`
- Sets `GLOBAL.first_entry_rec` to the next empty record number

### 2b. Patient Info Entry (Optional)

The POOLED_COMPONENTS block contains optional patient fields:
- **Patient ID** -- max 10 characters
- **Patient Name** -- max 50 characters each for first/last
- **Facility** -- max 50 characters

These fields are optional and have no special validation triggers.

### 2c. Pool Product Code Selection and Validation

**POOLED_COMPONENTS.PRODUCT_CODE VALIDATE_FIELD:**

1. Null check
2. Validates against `valid_products` with constraints:
   - Product type must match `'PO%'` (pool product types)
   - Last 2 characters must be `'00'`
   - Length must be 8 for ISBT or 5 for Codabar
   - Must be within effective date range
   - Error **1205** if not found
3. Retrieves `product_desc`, `product_type`, `specific_gravity`
4. Sets `GLOBAL.product_type` to the retrieved product type
5. Sets `ctrl_blk_2.sp_gravity` for volume calculation
6. Checks `master_codes` for code_type='FCRYO' to determine if cryo product:
   - If found: `GLOBAL.frz_flag = 'Y'`, enables freeze_time field
   - If not found: `GLOBAL.frz_flag = 'N'`, disables freeze_time field
7. Checks `valid_product_types` for `weight_required` flag:
   - Sets `GLOBAL.weight_required` accordingly (default 'N')

### 2d. Catalog/Lot Number Entry

**Catalog Number Entry (S_CATALOG_NUMBER -> CATALOG_NUMBER):**

The scan field handles three ISBT barcode formats:
1. `=)` prefix + 12 chars + `&)` at position 13: catalog WITH container ID, lot number extracted from position 13+
2. `=)` prefix + 11 chars + `&)` at position 12: catalog WITHOUT container ID, lot number extracted from position 12+
3. Plain scan: catalog number only

For all formats, calls `VALIDATE_CATALOG_NO_SCAN_ISBT` to parse.

If user enters 'M', the CATALOG_NUMBER field is made editable for manual entry. Otherwise it is locked (read-only from scan).

**CMC Filtering:** Catalog and Lot numbers display based on master code CMC configuration. Only entries with matching CMC flag defined in master CMC for CPIPOOL2 will display.

**Lot Number Entry (S_LOT_NUMBER -> LOT_NUMBER):**

For ISBT scheme: S_LOT_NUMBER scan field is enabled. Calls `VALIDATE_LOT_NUMBER` to parse scanned barcode.

For Codabar scheme: S_LOT_NUMBER is disabled; user goes directly to LOT_NUMBER manual entry.

**LOT_NUMBER VALIDATE_FIELD:**
- Null check
- Validates against `valid_lots` table matching `lot_number`, `catalog_number` (minus first char), `chapter_id`, and effective dates
- Error **1200** if not found

**ISBT vs Codabar difference:** For ISBT, lot number scan is enabled and can be concatenated with catalog scan. For Codabar, lot number scan is disabled; direct manual entry only.

### 2e. Number of Units

**NO_OF_UNITS_ENTERED VALIDATE_FIELD:**
- Null check
- Must be > 0 (error **0046** if not)
- Range: 1-999 (integer)
- Only governs initial creation; additions to existing pools are NOT limited by this value

### 2f. ABO/Rh Selection

**POOLED_ABORH VALIDATE_FIELD:**
- Null check
- Validates against `master_codes` with `code_type = 'POOL'`
- Retrieves `code_desc` into `sld_desc` display field
- Error **1140** if not found
- Can be entered manually or selected from LOV

### 2g. Pool Date/Time (POOL_DATS)

**WHEN-NEW-ITEM-INSTANCE:**
- Defaults to current sysdate (converted to local time if timezone enabled)
- Stores GMT version in `global.pool_dats`
- Format: MM-DD-YY HH24:MI

**VALIDATE_FIELD:**
1. Null check
2. Converts to GMT for validation
3. Rejects future dates -- error **8030**
4. Rejects dates older than 3 days -- error **0032**
5. Rejects midnight time 00:00 -- error **0283**
6. Calculates pool expiry date via `calc_new_expiry_date`

**POST-TEXT-ITEM:** Converts both pool_dats and pool_expiry_dats to GMT and stores in globals.

**Navigation after pool_dats:**
- If cryo product (frz_flag='Y'): navigates to freeze_time
- Otherwise: navigates to ATTRIBS block

### 2h. Freeze Time Entry (When Required)

Freeze time entry is required only when the pooled product code is defined in Master Code FCRYO (cryo products like POCRY).

**WHEN-NEW-ITEM-INSTANCE:**
- Shows context message: "Enter CRYO freeze time (MM-DD-YY HH24:MI)" or "Modify Freeze Time if needed, press [ENTER] to commit"

**VALIDATE_FIELD:**
- Null check (when frz_flag='Y')
- Converts freeze_time and pool_dats to GMT for comparison
- Validates freeze time >= pooling time -- error **0284** if freeze time precedes pool time

**KEY-NEXT-ITEM:**
- If in initial entry mode (commit_yes='N'): navigates to ATTRIBS block
- If in commit mode (commit_yes='Y'): calls `perform_commit`

**KEY-PREV-ITEM:**
- Only allows backward navigation if not in commit mode

### 2i. Attribute Entry (ATTRIBS Block)

5-record display block for pool component attributes. Non-database block.

**ATTRIB_GROUP VALIDATE_FIELD:**
- Validates against `valid_product_attributes` joined with `valid_attributes`
- Must be for pool product types (`'PO%'`)
- Excludes 'VENI' and 'DON' groups
- Must match code scheme (ISBT or Codabar)
- Error **1110** if not found

**ATTRIB_CODE VALIDATE_FIELD:**
1. Validates attribute code exists in `valid_attributes` for the given group and scheme -- error **1100** if not found
2. Calls `dupli_check_attribute` to prevent duplicate entries -- error **9718** on duplicate
3. Verifies attribute is valid for the product type via `valid_product_attributes` -- error **0035** if not

**Navigation from ATTRIBS:**
- KEY-NXTBLK scans all attribute records for CMV codes, sets `GLOBAL.sp_test = 'Y'` if found (ISBT only), then navigates to CTRL_BLK_1 for unit entry
- KEY-PRVBLK similarly scans for CMV, then returns to pool_dats if no units entered yet

### 2j. Component Unit Entry Loop (CTRL_BLK_1)

CTRL_BLK_1 is a non-database block displaying 5 records. Each record represents one blood component being added to the pool. Entry flow per component:

#### Step 1: Scan Unit ID (S_UNIT_ID)

**KEY-NEXT-ITEM:**
- Resets CHK_VAL_YEAR='N', initializes codabar_unit_scheme and checkin_type globals
- Clears pool weight/volume if previously set (forces re-entry on new unit)
- Prevents editing records before `first_entry_rec` threshold (pre-loaded components)
- Delegates to VALIDATE_FIELD
- If value is 'M': navigates to manual_unit_entry_coexist block
- Otherwise: cascades to next item

**VALIDATE_FIELD:**
- Null check
- Calls `Val_unit_id_coexist_for_pool` -- pool-specific barcode decoder
  - For 16-character scans (ISBT 128): parses center_id (5), label_year (2), serial_no (6); validates collection center via `Validate_coll_id` against `valid_collection_agencies`; validates check digit; sets code_scheme='I'
  - For other lengths: delegates to Codabar validation; sets code_scheme='C'
- Stores decoded unit_id in `GLOBAL.manual_unit_id`

#### Step 2: Unit ID Validation (UNIT_ID)

**PRE-TEXT-ITEM:** Copies `GLOBAL.manual_unit_id` into the field.

**VALIDATE_FIELD (the heavy validation):**

1. Null check
2. Determines unit_scheme_type: 'I' (ISBT, 13 chars) vs 'C' (Codabar)
3. **Unit existence check:** Queries `units` for max(coll_date) -- error **0063** if not found
4. **Collection date vs pool date:** If coll_date > pool date -- error **8060**
5. **Interdiction check:** Queries `units` joined with `unit_interdictions` and `valid_interdictions_lab` to ensure no non-informational (inter_type != 'I') interdictions exist -- error **0183** if interdicted
6. **Cryo validation** (when frz_flag='Y'):
   a. Retrieves thaw_method and sep_ind from `cryo_units` -- error **0186** if not found
   b. Gets separation time (2nd or 3rd) from `units` based on sep_ind
   c. Calls `check_freeze_time` which:
      - Gets min/max freeze times from `valid_cryo_methods`
      - Gets worksheet insert_dats from `cryo_units`
      - Checks worksheet-to-freeze interval (sets CRWS interdiction if out of range)
      - Checks separation-to-freeze interval (sets CRSE interdiction if out of range)
   d. Error **0287** if either CRWS or CRSE time interdiction is triggered

#### Step 3: Product Code Entry (S_PRODUCT_CODE -> PRODUCT_CODE)

S_PRODUCT_CODE is scanned; PRODUCT_CODE is the decoded value.

**PRODUCT_CODE VALIDATE_FIELD (extensive validation):**

1. Timezone-aware sysdate resolution
2. Null check
3. **Product code existence:** Validates against `valid_products` for the unit_scheme_type -- error **1205** if not found
4. **Duplicate unit check:** Calls `dupli_check_unit` -- error **9718** if same unit_id + product_code already exists in another record
5. **Product type compatibility:** Checks `master_codes` that the component's product_type exists under the pool's product_type code_type -- error **1115** if mismatch
6. **Attribute matching:** Loops through all pool attributes in ATTRIBS block. For each attribute (except SP/POOL):
   - Checks `component_attributes` UNION `unit_attributes` for the component
   - If any attribute is missing from the component -- error **5237**
7. **ISBT component prefix auto-derive:** For ISBT units, extracts component_prefix from positions 7-8 of product code
8. **Component record retrieval:** Queries `components` with conditions:
   - Not rejected (`reject_reason_code IS NULL`)
   - Status is 'L' (labeled)
   - No component interdictions (subquery count=0 on `component_interdictions`)
   - System label decision is a valid tested ABO label (subquery on `valid_abo_values` where `abo_label_type = 'T'`)
   - Error **0064** if not found or ambiguous (too_many_rows)
9. **ABO display:** Gets abo_short_name from `valid_abo_values`
10. **ABO/Rh compatibility:** Validates component's SLD exists in `master_codes` under the pool's pooled_aborh code_type -- error **1140** if incompatible

**PRODUCT_CODE KEY-NEXT-ITEM:**
- For both ISBT and Codabar: disables editing on COMPONENT_PREFIX and auto-navigates past it (component prefix is auto-determined, not user-entered)

#### Step 4: Component Prefix Validation (COMPONENT_PREFIX)

**VALIDATE_FIELD:**

1. **In-transit interdiction check:** Calls `CHECK_INTRANSIT_INTERDICTION` for the specific component (unit_id + product_code + component_prefix + warehouse)
2. **Component retrieval:** Queries `components` for exact match (unit_id, coll_date, chapter_id, product_code, component_prefix) that is labeled ('L'), not rejected, with valid tested ABO label
3. **Donor deferral check:** Calls `CHECK_DONOR_DEFERRALS` -- checks donor interdictions via `check_inter_after_label` and `call_srvdon`
4. **Expiry vs pool date:** If component expires before pool date -- error **0264**
5. **Minimum expiry tracking:** If pool's current expiry date > this component's expiry, shows warning alert **1855** and updates pool_expiry_dats to the earlier date
6. Error **1146** if component not found with given prefix
7. Navigates DOWN to next record after successful validation

#### Block-Level Triggers

**WHEN-NEW-RECORD-INSTANCE:** Prevents adding more components than `no_of_units_entered`. If record number exceeds the limit, clears and shows error **0109**.

**VALIDATE_RECORD:** If any of unit_id, product_code, component_prefix is null, clears the record (treats as abandoned). If all populated, calls `check_donor_deferrals`.

### 2k. Weight Entry (When Required)

Weight entry is required when `weight_required = 'Y'` (set from `valid_product_types` for the pool product type, e.g., POCRY, POPLT).

**S_POOL_WEIGHT (scan field):**
- If weight not required and null: skips ahead
- If scanned (not 'M'): calls `validate_scan('WGHT',...)` to parse weight barcode, locks POOL_WEIGHT field, skips past it
- If 'M': makes POOL_WEIGHT editable for manual entry
- Error **1210** on VALUE_ERROR (invalid scan)

**POOL_WEIGHT VALIDATE_FIELD:**
- If weight required and null: error **4317**
- Auto-calculates volume: `pool_volume = pool_weight / sp_gravity` (if specific gravity defined)

**POOL_WEIGHT KEY-NEXT-ITEM:**
- Validates weight is numeric and between 1 and 999.99 -- error **0250** if invalid
- Calls `check_pool_cGMP` for weight compliance:
  - Looks up min_weight, max_weight from `valid_products`
  - If weight OUT of range: shows warning **9789** with 'CMW' code, INSERTs CMW interdiction into `component_interdictions`
  - If weight IN range: DELETEs any existing CMW interdictions
- On success: navigates to CTRL_BLK_1 and triggers KEY-COMMIT

### 2l. Commit Flow (KEY-COMMIT -> PERFORM_COMMIT)

**CTRL_BLK_1 KEY-COMMIT (triggered by F12):**

1. Navigates to first record of CTRL_BLK_1
2. Validates that first record has unit_id, product_code, and component_prefix -- error **0017** if incomplete
3. Calls `check_units_entered` to verify expected number of units entered -- error **0288** if mismatch
4. Branches:

```
IF frz_flag = 'Y' (cryo product):
  - Set commit_yes = 'Y'
  - IF weight not required OR already entered:
      Navigate to freeze_time (for acceptance/modification, then perform_commit)
  - ELSE:
      Navigate to pool weight entry
      
IF frz_flag = 'N' (non-frozen):
  - Set commit_yes = 'N'
  - IF weight not required OR already entered:
      Call perform_commit directly
  - ELSE:
      Navigate to pool weight entry
```

**PERFORM_COMMIT (the central save procedure):**

This is the core database write procedure. Sequence:

1. **Validate** current record and set up savepoint
2. **Calculate pool expiry** via `minimum_pool_exp_date`
3. **Get timezone-aware sysdate**

4. **IF this is a NEW pool** (pool_id is null on ctrl_blk_2):

   a. **INSERT into `units`:**
   ```
   warehouse, pool_id, chapter_id, contract='POOL', batch_id='POOL'
   ```
   
   b. **INSERT into `components`:**
   ```
   Pool component record: product_code, expiry_date, 
   component_status='L', weight
   ```
   
   c. **If freeze_time provided:** INSERT into `component_cgmp`:
   ```
   parm_code='FRZ', parm_value='A'
   ```
   
   d. **INSERT into `component_attributes`:**
   ```
   attrib_group='SP', attrib_code='POOL'
   ```
   
   e. **Loop through attribs block:** INSERT additional `component_attributes` (checking for duplicates first)

5. **For each component unit** in ctrl_blk_1:
   - Check freeze time if frz_flag='Y'
   - UPDATE `units`: set warehouse_id, program_id (excluding already-pooled units)
   - UPDATE `components`: set `pooled_component_id` = pool_id, `reject_reason_code` = 'POOL', `system_label_decision` = '47' (Codabar NFT) or 'Md' (ISBT NFT)
   - Track minimum expiry_date across all components

6. **Freeze time interdictions:**
   - If CRWS flagged: call `sbclib.comp_system_interdiction` for 'CRWS'
   - If CRSE flagged: call `sbclib.comp_system_interdiction` for 'CRSE'

7. **POST the form** (save without commit)

8. **Print label** via `print_label_1` -- returns pool SLD code

9. **UPDATE `components`** for pool unit: set final expiry_date, system_label_decision, label info

10. **UPDATE `units`** for pool unit: set system_label_decision

11. **Navigate** to ABO scan field for label verification

### 2m. Label Printing (PRINT_LABEL_1)

`print_label_1` is a function that returns the pool SLD code. Steps:

1. **Determine code scheme:** ISBT 'I' vs Codabar 'C' based on pool_id length

2. **ABO/Rh determination:** Loops through all component units in ctrl_blk_1, looking up each unit's ABO/Rh test result from `utrs` (test_id='ABORH'). Builds flags for which blood types are present (opos, oneg, apos, aneg, bpos, bneg, abpos, abneg).

3. **Pool SLD lookup:** Queries `valid_abo_pooled_sld` based on the blood type flags and rh_label_flag to get the combined pool SLD.

4. **Interdiction override:** Calls `chk_inter` to check for Hold/BIO/NFT interdictions, which can override the pool SLD:
   - **Hold (H):** SLD = '39' (Codabar) or 'Mq' (ISBT)
   - **Biohazard (B):** SLD = '58' (Codabar) or 'Mb' (ISBT)
   - **NFT (N):** SLD = '47' (Codabar) or 'Md' (ISBT)
   - **No interdictions:** SLD = null (uses calculated pool SLD)
   - Priority order: Hold > Biohazard > NFT

5. **Print the label:**
   - For Codabar ('C'): calls `print_label_digi('PCA', ...)`
   - For ISBT ('I'): calls `minimum_pool_exp_date`, checks for CMV attribute, then calls `print_label_digi_ISBT('PFF', ...)`

6. **Returns** the pool SLD code

### 2n. Label Verification Flow

After printing, the cursor navigates to the ABO scan field on WINDOW2 (the verification popup). The user must scan:
- Unit ID + ABO (as one concatenated scan or individual)
- Product code + Expiration date (concatenated or individual)

For Codabar pools: components with expiration times other than 23:59 must be manually entered.
For ISBT pools: concatenated Prod/Exp scan is supported.

### 2o. Final Commit (PR_COMMIT)

Called after successful label verification:

1. **QC label check:** Queries `components` to check if this is the first labeled component for the unit:
   - If first label AND QC not required at chapter level (`chapter_qc_reqd_flag != 'Y'`):
     - UPDATE `units`: set `qc_label_flag = 'Y'`, `qc_label_date = sysdate`

2. **Database COMMIT** (the actual commit)

3. **On success:**
   - Calls `gen_report` to generate the CPRPOOL pool report
   - Shows success message (error **8010** -- actually a success indicator)

4. **On failure:**
   - `clear_form(full_rollback)` -- rolls back everything
   - Shows error **0230**

5. **Clears the form** via `key-clrfrm` for the next pool entry

**gen_report flow:**
- Creates/refreshes `rpt_parm` entry for report 'CPRPOOL' with user and pool ID
- Inserts 4 `rpt_parm_select` records: chapter (CHP), pool ID (POLID), from (POLFR='ALL'), to (POLTO='ALL')
- Commits the parameter data
- Gets user's printer from `system_users`
- Calls `REPORT_GENERATE` which submits to Oracle Reports Server via `BC_CHECK_REPSERVER.get_reports_server`

### Complete Pool Creation Flow Diagram

```
SCAN_POOL_ID (scan/type pool barcode)
  |
  +-> 'M' -> Manual Entry Block
  |
  +-> Barcode -> validate_unit_id_coexist -> decode
        |
        v
POOL_ID (validated, decoded)
  |-> VALIDATE_FIELD: Check not in units, not expired,
  |   no interdictions, not in-transit
  |-> KEY-NEXT-ITEM: Query existing pool data if found
  |
  v
POOLED_COMPONENTS Block:
  Patient ID (optional) -> Patient Name (optional) -> Facility (optional)
  |
  v
PRODUCT_CODE -> validate as PO% type, check FCRYO/weight_required
  |
  v
S_CATALOG_NUMBER -> CATALOG_NUMBER (ISBT concat scan support)
  |
  v
S_LOT_NUMBER -> LOT_NUMBER -> validate against valid_lots
  |
  v
NO_OF_UNITS_ENTERED -> must be > 0
  |
  v
POOLED_ABORH -> validate against master_codes POOL type
  |
  v
POOL_DATS -> default sysdate, validate not future/not >3 days old/not midnight
  |         -> calc_new_expiry_date
  |
  +-> [if FCRYO] -> FREEZE_TIME -> validate >= pool time
  |
  v
ATTRIBS Block (0-5 attribute rows)
  ATTRIB_GROUP -> ATTRIB_CODE (validate, no DON/VENI, no duplicates)
  |
  v
CTRL_BLK_1 (component entry, 5-record display, repeats per unit):
  S_UNIT_ID -> UNIT_ID -> S_PRODUCT_CODE -> PRODUCT_CODE -> COMPONENT_PREFIX
  |             |           |                  |                |
  |  Unit exists?  Interdictions?   Product valid?    In-transit check
  |  Coll date OK? Cryo checks?    Type matches pool? Donor deferrals
  |                                Attribs match?     Expiry checks
  |                                ABO compatible?    Min expiry update
  |
  v (repeat for each unit)
  |
  F12 (KEY-COMMIT)
  |-> check_units_entered (count validation)
  |
  +-> [weight required?] -> S_POOL_WEIGHT -> POOL_WEIGHT
  |                         -> check_pool_cGMP (CMW)
  |
  +-> [freeze required?] -> FREEZE_TIME (accept/modify)
  |
  v
PERFORM_COMMIT
  |-> INSERT units, components, component_attributes, component_cgmp
  |-> UPDATE individual components (pooled_component_id, reject='POOL', SLD=NFT)
  |-> INSERT CRWS/CRSE interdictions if flagged
  |-> POST form
  |
  v
PRINT_LABEL_1
  |-> Determine pool ABO from all components' ABORH results
  |-> Look up pool SLD from valid_abo_pooled_sld
  |-> Check interdictions (chk_inter) for SLD override
  |-> Print label (Codabar: print_label_digi, ISBT: print_label_digi_ISBT)
  |
  v
LABEL VERIFICATION (WINDOW2)
  |-> Scan/verify ABO, Product, Expiration
  |
  v
PR_COMMIT
  |-> Update QC flags if needed
  |-> DATABASE COMMIT
  |-> gen_report -> REPORT_GENERATE (CPRPOOL report)
  |-> Show success (8010)
  |-> Clear form for next entry
```

---

## 3. Reopening Existing Pool

When a user scans/enters a pool_id that already exists in `pooled_components`:

1. **POOL_ID VALIDATE_FIELD** verifies the pool exists, is not expired (error **0154**), product codes match, no in-transit or B/H/N interdictions.

2. **POOL_ID KEY-NEXT-ITEM** performs the full data load:
   - Queries `pooled_components` block
   - Loads existing component attributes into ATTRIBS block via cursor on `component_attributes`
   - Loads all existing individual component units into CTRL_BLK_1 via cursor on `components` where `pooled_component_id = pool_id`
   - Sets `GLOBAL.pool = 'Y'`
   - Sets `GLOBAL.first_entry_rec` to the next empty record (cursor position for new entries)
   - For each pre-loaded component: determines code scheme, formats display unit ID, looks up tested ABO

3. The user can then add more components starting from `first_entry_rec`.

**Limitation:** The `no_of_units_entered` from original creation does NOT govern how many units can be added to an existing pool. Components can be added until the pool expires.

---

## 4. Delete Component from Pool (KEY-DELREC)

Two paths based on `GLOBAL.pool` flag:

### Path 1: New Pool (pool='N') -- Components not yet saved to DB

- Simply clears the record from the form display
- Recalculates minimum pool expiry date via `MINIMUM_POOL_EXP_DATE`
- Moves cursor down if the record had data

### Path 2: Existing Pool (pool='Y') -- Removing a saved component

1. **UPDATE `units`:** Resets warehouse_id to current warehouse, stamps program_id (for the unit being un-pooled)

2. **UPDATE `components`:** Clears:
   - `pooled_component_id` (un-pools the component)
   - `reject_reason_code` (removes 'POOL' reject)
   - `system_label_decision` (clears NFT label decision)
   - `expiry_date`
   - `label_user_id`, `label_dats`
   - Resets `warehouse_id` and `program_id`

3. **Deletes the record** from the form display

4. **Recalculates** minimum pool expiry date via `MINIMUM_POOL_EXP_DATE`

5. **Clears pool weight/volume** (forces re-weigh since composition changed)

**Restriction:** Products cannot be removed from existing pools after the pool expires.

---

## 5. Reprint Label (KEY-MENU / F6)

**Prerequisites:**
- `ctrl_blk_2.pool_id` must be non-null
- `pooled_components.pool_id` must be non-null
- `pooled_components.product_code` must be non-null

**Flow:**
1. If `pooled_components.unit_id` IS NULL (pool-level, not individual unit): saves cursor position in `GLOBAL.field_left`, calls `print_label_1`, returns cursor to original field
2. If `pooled_components.unit_id` is NOT null: error **5308** (cannot reprint label for individual unit in pool)
3. If prerequisites not met: error **1180** (function not available)

**Restriction:** Labels cannot be reprinted once label verification has started.

---

## 6. Clear Form / Exit

### KEY-CLRFRM (Clear Form)

1. Erases 8 globals: `product_type`, `system_label_decision`, `sld` (NOTE: has typo "gobal.sld"), `pool`, `frz_flag`, `crws_time_interdiction`, `crse_time_interdiction`, `commit_yes`
2. Calls `clear_form(NO_VALIDATE, FULL_ROLLBACK)` -- skips validation and performs full rollback of pending DB changes
3. Re-executes `PRE-FORM` trigger to reinitialize all globals from scratch
4. Form is reset to its initial state ready for new pool entry

### KEY-EXIT (Exit Form)

1. Erases 7 globals: `product_type`, `system_label_decision`, `sld`, `pool`, `frz_flag`, `time_interdiction`, `commit_yes`
   - NOTE: erases `GLOBAL.time_interdiction` (generic) instead of the two specific CRWS/CRSE ones
2. Calls `clear_form(NO_VALIDATE, FULL_ROLLBACK)` to abandon all changes
3. Calls `exit_form` to close the form completely
4. No confirmation dialog -- exits immediately

### POST-FORM (Form Closing)

- Erases `global.pool_dats` to prevent leaking to the calling form

---

## 7. All Validation Scenarios with Error Codes

### Unit-Level Validations

| Scenario | Error Code | Trigger Location | Description |
|---|---|---|---|
| Unit not found in UNITS table | **0063** | CTRL_BLK_1.UNIT_ID VALIDATE_FIELD | Scanned/entered unit_id does not exist for the chapter |
| Unit has blocking interdictions | **0183** | CTRL_BLK_1.UNIT_ID VALIDATE_FIELD | Unit has non-informational (B/H/N) interdictions in `unit_interdictions` |
| Collection date after pool date | **8060** | CTRL_BLK_1.UNIT_ID VALIDATE_FIELD | Component's collection date is later than the pool date |
| Cryo unit not found | **0186** | CTRL_BLK_1.UNIT_ID VALIDATE_FIELD | No record in `cryo_units` for frozen product |
| Freeze time interdiction | **0287** | CTRL_BLK_1.UNIT_ID VALIDATE_FIELD | CRWS or CRSE time violations detected by `check_freeze_time` |
| Duplicate unit in pool | **9718** | CTRL_BLK_1.PRODUCT_CODE VALIDATE_FIELD (via dupli_check_unit) | Same unit_id + product_code already exists in another record |
| Component expired before pool date | **0264** | CTRL_BLK_1.COMPONENT_PREFIX VALIDATE_FIELD | Component expiry < pool_dats |
| Component not found (prefix) | **1146** | CTRL_BLK_1.COMPONENT_PREFIX VALIDATE_FIELD | No matching component for the given prefix |
| Donor deferred | (library error) | CTRL_BLK_1 VALIDATE_RECORD / COMPONENT_PREFIX VALIDATE_FIELD | `check_donor_deferrals` finds active deferrals via `check_inter_after_label` and `call_srvdon` |

### Product-Level Validations

| Scenario | Error Code | Trigger Location | Description |
|---|---|---|---|
| Product code not found | **1205** | CTRL_BLK_1.PRODUCT_CODE VALIDATE_FIELD / POOLED_COMPONENTS.PRODUCT_CODE VALIDATE_FIELD | Product code not in `valid_products` for the scheme/dates |
| Product type mismatch | **1115** | CTRL_BLK_1.PRODUCT_CODE VALIDATE_FIELD | Component product type not compatible with pool product type in `master_codes` |
| Attribute mismatch | **5237** | CTRL_BLK_1.PRODUCT_CODE VALIDATE_FIELD | Component missing required pool attributes in `component_attributes` / `unit_attributes` |
| Component not found (product) | **0064** | CTRL_BLK_1.PRODUCT_CODE VALIDATE_FIELD | No labeled, non-rejected, non-interdicted component with valid ABO found |
| ABO/Rh incompatible | **1140** | CTRL_BLK_1.PRODUCT_CODE VALIDATE_FIELD / POOLED_ABORH VALIDATE_FIELD | Component's SLD not valid for pool's ABO/Rh group |

### Pool-Level Validations

| Scenario | Error Code | Trigger Location | Description |
|---|---|---|---|
| Pool ID already exists as unit | **0180** | POOLED_COMPONENTS.POOL_ID VALIDATE_FIELD | Pool ID already exists in `units` table (must be new) |
| Pool not found | **1206** | CTRL_BLK_2.POOL_ID VALIDATE_FIELD | Pool ID not in `pooled_components`, or product code mismatch |
| Pool expired | **0154** | CTRL_BLK_2.POOL_ID VALIDATE_FIELD | Pool expiry date is in the past |
| Pool has B/H/N interdictions | **1101** | check_unit_prod_interdictions | Active Biohazard/Hold/NFT interdictions on pool unit/product |
| Number of units <= 0 | **0046** | NO_OF_UNITS_ENTERED VALIDATE_FIELD | Invalid unit count |
| Max records reached | **0109** | CTRL_BLK_1 WHEN-NEW-RECORD-INSTANCE | Record number exceeds no_of_units_entered |
| Unit count mismatch | **0288** | check_units_entered (via KEY-COMMIT) | Actual records != expected no_of_units_entered |
| Required data missing (commit) | **0017** | CTRL_BLK_1 KEY-COMMIT | First record incomplete at commit time |

### Date/Time Validations

| Scenario | Error Code | Trigger Location | Description |
|---|---|---|---|
| Future pool date | **8030** | POOL_DATS VALIDATE_FIELD | Pool date/time is in the future |
| Pool date > 3 days old | **0032** | POOL_DATS VALIDATE_FIELD | Pool date more than 3 days before current date |
| Midnight pool time | **0283** | POOL_DATS VALIDATE_FIELD | Pool time is exactly 00:00 |
| Freeze time before pool time | **0284** | FREEZE_TIME VALIDATE_FIELD | Freeze time precedes pool time |

### Weight Validations

| Scenario | Error Code | Trigger Location | Description |
|---|---|---|---|
| Weight out of numeric range | **0250** | POOL_WEIGHT KEY-NEXT-ITEM | Weight not between 1 and 999.99 |
| Weight required but not entered | **4317** | POOL_WEIGHT VALIDATE_FIELD | GLOBAL.weight_required='Y' and weight is null |
| Invalid weight scan | **1210** | S_POOL_WEIGHT VALIDATE_FIELD | VALUE_ERROR on scan conversion |
| Weight out of cGMP range (CMW) | **9789** | check_pool_cGMP | Weight outside min_weight/max_weight in `valid_products` -- CMW interdiction placed |

### Catalog/Lot Validations

| Scenario | Error Code | Trigger Location | Description |
|---|---|---|---|
| Invalid lot number | **1200** | LOT_NUMBER VALIDATE_FIELD | Lot not found in `valid_lots` for catalog/chapter |
| Invalid ISBT barcode format | **6010** | VALIDATE_SP_TEST_SCAN_CODE128 | Special test barcode does not start with '&(' or is not 7 chars |
| Invalid collection center | **9712** | VALIDATE_COLL_ID | Collection agency not found in `valid_collection_agencies` |

### Attribute Validations

| Scenario | Error Code | Trigger Location | Description |
|---|---|---|---|
| Invalid attribute group | **1110** | ATTRIBS.ATTRIB_GROUP VALIDATE_FIELD | Attribute group not found in `valid_product_attributes` / `valid_attributes` |
| Invalid attribute code | **1100** | ATTRIBS.ATTRIB_CODE VALIDATE_FIELD | Attribute code not found in `valid_attributes` |
| Duplicate attribute | **9718** | dupli_check_attribute (via ATTRIB_CODE VALIDATE_FIELD) | Same attrib_group + attrib_code already in another row |
| Attribute not valid for product | **0035** | ATTRIBS.ATTRIB_CODE VALIDATE_FIELD | Attribute not in `valid_product_attributes` for the product type |

### System/Miscellaneous

| Scenario | Error Code | Trigger Location | Description |
|---|---|---|---|
| Commit failed | **0230** | PR_COMMIT | Database commit failed -- full rollback performed |
| Commit succeeded | **8010** | PR_COMMIT / ON-ERROR | Success message after successful commit |
| No changes to commit | **8013** | ON-ERROR | No pending changes when commit attempted |
| Function not available | **1180** | KEY-OTHERS / KEY-MENU | Undefined key pressed or reprint prerequisites not met |
| Required field empty | **0080** | ON-ERROR (40202) | Oracle Forms required field not entered |
| Pool expiry warning | **1855** | MINIMUM_POOL_EXP_DATE / COMPONENT_PREFIX VALIDATE_FIELD | Pool expiry reduced to match earlier component expiry (warning alert, not blocking) |
| Cannot reprint unit label | **5308** | KEY-MENU | Cannot reprint label for individual unit in pool context |
| Validate record missing data | **0010** | POOLED_COMPONENTS VALIDATE_RECORD | Catalog, lot, pool_dats, or product_code missing |
| First record reached | **1700** | ON-ERROR (40100) | At first record, cannot go further back |

---

## 8. ISBT vs Codabar Differences

| Aspect | Codabar | ISBT |
|---|---|---|
| **Pool Unit ID requirement** | Must be Codabar if ISBT Start Date NOT effective in Chapter Details | Must be ISBT if ISBT Start Date IS effective |
| **Code scheme detection** | unit_id length != 13 -> 'C' | unit_id length = 13 -> 'I' |
| **Product code length** | 5 characters | 8 characters |
| **S_UNIT_ID display format** | `'D' + unit_id + 'D'` | `'=' + unit_id + chk_digit` |
| **Mixed ABO pools** | NOT allowed | Allowed (not prohibited) |
| **Product code label printing** | Label will NOT be printed | Label is printed |
| **SLD on CRWS/CRSE/CMW interdiction** | NFT ('47') | Discard ('Md') |
| **SLD codes -- Hold** | '39' | 'Mq' |
| **SLD codes -- Biohazard** | '58' | 'Mb' |
| **SLD codes -- NFT** | '47' | 'Md' |
| **Label printing function** | `print_label_digi('PCA', ...)` | `print_label_digi_ISBT('PFF', ...)` |
| **Expiration time entry** | Manual entry for non-23:59 times | Concatenated Prod/Exp scan supported |
| **SP Test verification** | Not navigable | Navigable only if CMV Negative |
| **Aliquoted components** | NOT allowed in pools | Not restricted |
| **Component prefix derivation** | From components table query | Auto-derived from product_code positions 7-8 |
| **Catalog scan format** | Direct entry | ISBT `=)` prefix format with container ID parsing |
| **Lot number scan** | Disabled (manual entry only) | Enabled, supports concatenated scan |
| **MODPOOL new bag SLD** | Original gets NFT | Original gets Discard |
| **Attribute cross-scheme** | Must be valid for both if mixed products | Must be valid for both if mixed products |

---

## 9. All Error Codes

| Code | Message/Meaning | Context |
|---|---|---|
| 0010 | Required record data missing | POOLED_COMPONENTS VALIDATE_RECORD |
| 0017 | Required data is missing | KEY-COMMIT -- first record incomplete |
| 0022 | Invalid date format (with mask) | ON-ERROR -- date validation |
| 0032 | Date out of range | Pool date > 3 days old |
| 0035 | Attribute not valid for product type | ATTRIB_CODE validation |
| 0046 | Must be positive number | NO_OF_UNITS_ENTERED <= 0 |
| 0063 | Unit not found | Unit_id not in UNITS table |
| 0064 | Component not found/ambiguous | No valid labeled non-rejected non-interdicted component |
| 0080 | Required field empty | ON-ERROR mapped from 40202 |
| 0109 | Maximum number of rows reached | WHEN-NEW-RECORD-INSTANCE (parameterized) |
| 0154 | Pool expired | Pool expiry_date < sysdate |
| 0180 | Unit already exists | Pool_id already exists in UNITS (must be new) |
| 0183 | Unit has interdictions | Non-informational interdictions on unit |
| 0186 | Cryo unit not found | No cryo_units record for frozen product |
| 0230 | Commit failed | PR_COMMIT failure -- full rollback |
| 0250 | Invalid weight | Weight not numeric or outside 1-999.99 |
| 0264 | Component expired before pool date | Component expiry < pool_dats |
| 0283 | Midnight time not allowed | Pool time is 00:00 |
| 0284 | Freeze time before pool time | Freeze_time < pool_dats |
| 0287 | Freeze time interdiction | CRWS or CRSE time violation |
| 0288 | Unit count mismatch | Actual records != expected count |
| 1100 | Invalid attribute code | Attrib_code not in valid_attributes |
| 1101 | Pool has B/H/N interdictions | Active biohazard/hold/NFT on pool |
| 1110 | Invalid attribute group | Attrib_group not in valid_product_attributes |
| 1115 | Product type mismatch | Component type incompatible with pool type |
| 1140 | ABO/Rh incompatible | Component SLD not valid for pool ABO group |
| 1146 | Component not found (by prefix) | No component matching prefix criteria |
| 1180 | Function not available | Undefined key or reprint prerequisites not met |
| 1200 | Invalid lot number | Lot not in valid_lots |
| 1205 | Invalid product code | Product not in valid_products |
| 1206 | Pool not found | Pool not in pooled_components or product mismatch |
| 1210 | Invalid weight scan | VALUE_ERROR on weight barcode conversion |
| 1700 | At first record | ON-ERROR mapped from 40100 |
| 1701 | Record must be entered first | ON-ERROR mapped from 40102 |
| 1702 | Field protected against update | ON-ERROR mapped from 40200 |
| 1703 | Field is full | ON-ERROR mapped from 40201 |
| 1704 | Must be in range | ON-ERROR mapped from 40207 |
| 1705 | Form in query mode | ON-ERROR mapped from 40208 |
| 1707 | Invalid number | ON-ERROR mapped from 50006-50020 |
| 1855 | Pool expiry warning (alert) | Pool expiry reduced to match component -- WARNING only |
| 4317 | Weight required | Weight_required='Y' but weight is null |
| 5016 | Invalid time | ON-ERROR mapped from 50017-50022 |
| 5050 | Field protected (duplicate) | ON-ERROR second 40200 check (dead code) |
| 5237 | Component missing pool attributes | Component lacks required attribute |
| 5308 | Cannot reprint unit label | Reprint attempted on individual unit in pool |
| 6010 | Invalid ISBT SP test barcode | Barcode does not start with '&(' or wrong length |
| 8010 | Success (commit completed) | Successful commit / ON-ERROR mapped from 40400+ |
| 8013 | No changes to commit | ON-ERROR mapped from 40401 |
| 8030 | Future date not allowed | Pool date is in the future |
| 8060 | Collection date after pool date | Component coll_date > pool date |
| 9712 | Invalid collection center | Collection agency not in valid_collection_agencies |
| 9718 | Duplicate entry | Duplicate unit or duplicate attribute |
| 9789 | Weight out of cGMP range (CMW) | Weight outside min/max from valid_products |

---

## 10. Tables Written at Each Stage

### Stage 1: PERFORM_COMMIT (New Pool Creation)

| Table | Operation | Details |
|---|---|---|
| `units` | INSERT | New pool unit record: warehouse, pool_id, chapter_id, contract='POOL', batch_id='POOL' |
| `components` | INSERT | Pool component: product_code, expiry_date, component_status='L', weight |
| `component_cgmp` | INSERT | Freeze time record: parm_code='FRZ', parm_value='A' (only if freeze_time provided) |
| `component_attributes` | INSERT | SP/POOL attribute + additional attributes from attribs block |

### Stage 2: PERFORM_COMMIT (Per-Component Updates)

| Table | Operation | Details |
|---|---|---|
| `units` | UPDATE | Set warehouse_id, program_id for each component unit |
| `components` | UPDATE | Set pooled_component_id=pool_id, reject_reason_code='POOL', system_label_decision='47'/'Md' |

### Stage 3: PERFORM_COMMIT (Interdictions)

| Table | Operation | Details |
|---|---|---|
| `component_interdictions` | INSERT (via sbclib) | CRWS interdiction if worksheet-to-freeze time exceeded |
| `component_interdictions` | INSERT (via sbclib) | CRSE interdiction if separation-to-freeze time exceeded |

### Stage 4: PERFORM_COMMIT (Post-Label Updates)

| Table | Operation | Details |
|---|---|---|
| `components` | UPDATE | Pool unit: final expiry_date, system_label_decision, label info |
| `units` | UPDATE | Pool unit: system_label_decision |

### Stage 5: Weight Entry (check_pool_cGMP)

| Table | Operation | Details |
|---|---|---|
| `component_interdictions` | INSERT | CMW interdiction if weight OUT of valid range |
| `component_interdictions` | DELETE | Remove existing CMW interdiction if weight IN range |

### Stage 6: PR_COMMIT (Final Commit)

| Table | Operation | Details |
|---|---|---|
| `units` | UPDATE | qc_label_flag='Y', qc_label_date=sysdate (if first label and QC not required) |
| (DATABASE COMMIT) | COMMIT | All pending changes committed |

### Stage 7: gen_report / REPORT_GENERATE

| Table | Operation | Details |
|---|---|---|
| `rpt_parm` | INSERT | Report parameter record: appl='DON', report='CPRPOOL', parm_id=pool_id |
| `rpt_parm_select` | DELETE | Clear existing selection criteria for this pool/user |
| `rpt_parm_select` | INSERT (x4) | Chapter (CHP), Pool ID (POLID), From (POLFR='ALL'), To (POLTO='ALL') |
| `rpt_parm` | UPDATE | rep_job_id, rep_server after report submission |

### Stage 8: Delete Component from Existing Pool (KEY-DELREC when pool='Y')

| Table | Operation | Details |
|---|---|---|
| `units` | UPDATE | Reset warehouse_id, program_id for un-pooled unit |
| `components` | UPDATE | Clear pooled_component_id, reject_reason_code, system_label_decision, expiry_date, label_user_id, label_dats |

### Complete Table Access Summary

**Tables READ:**
- `units`, `components`, `pooled_components`, `component_attributes`, `unit_attributes`
- `component_interdictions`, `unit_interdictions`
- `utrs` (Unit Test Results -- ABORH lookups)
- `cryo_units`
- `valid_products`, `valid_product_attributes`, `valid_product_types`, `valid_attributes`
- `valid_abo_values`, `valid_abo_pooled_sld`
- `valid_errors_lab`, `valid_interdictions_lab`
- `valid_cryo_methods`, `valid_exp_date_ovr`
- `valid_collection_agencies`, `valid_catalog_details`, `valid_lots`
- `chapters`, `master_codes`, `system_users`
- `rpt_parm`, `rpt_parm_select`

**Tables WRITTEN:**
- `units` (INSERT new pool unit, UPDATE warehouse/program/SLD/qc_label for components and pool)
- `components` (INSERT new pool component, UPDATE pooled_component_id/reject_reason/SLD/expiry/label for components, UPDATE final SLD/expiry for pool)
- `component_attributes` (INSERT SP/POOL and other attributes)
- `component_cgmp` (INSERT freeze time records)
- `component_interdictions` (INSERT/DELETE CMW weight interdictions, INSERT CRWS/CRSE time interdictions)
- `rpt_parm` (INSERT/UPDATE report parameters)
- `rpt_parm_select` (DELETE/INSERT report selection criteria)

---

## 11. Prerequisites and Limitations

### Prerequisites

1. Only components with an "acceptable for transfusion" label decision can be pooled.
2. Components must be in the user's log-on warehouse and must NOT be in-transit.
3. Import QC must be performed on imported products before they can be added to a pool.
4. Master code CMC must be defined for CPIPOOL2, linked to a lot number in Valid Lots (LOTS).
5. Master code LBVOL must be defined for product types, linked to the pooled product code's product type.
6. Product Type Data (PRDTYPE): W column must have 'Y' for weight to be required for POCRY, POPLT product types.
7. If labels are to be printed, the form must be defined in Maintain Report Master Table (RMASTER).

### Limitations

1. Components with unit or component level interdictions are NOT allowed in pools.
2. Imported components not allowed in pools requiring freeze time entry.
3. Number of Units field only governs initial creation, not additions to existing pools.
4. Program does NOT consult interdictions override tables for calculating pool SLDs.
5. Aliquoted Codabar components are not allowed in pools.
6. Components can be added to the pool until the pool expires (but not after).
7. Codabar pools cannot be created using mixed ABOs.
8. Product code label will not be printed for Codabar pools.
9. Label verification is required; pool is created only after successful label verification.
10. Program does NOT allow creation of reconstituted whole blood products.
11. CRWS, CRSE, and CMW interdictions placed on the pool cause SLD of NFT for Codabar and Discard for ISBT pools; these cannot be removed.
12. Attributes must be valid for both ISBT and Codabar if products of both schemes will be added.
13. Pool unit ID must be Codabar if ISBT Start Date is NOT effective; must be ISBT if it IS effective.
14. CMV is the only special testing attribute that can be printed for pooled components.

### Known Bugs in Source Code

1. **GET_ERROR_TEXT function:** Hardcodes error code '1855' instead of using the `err_code` parameter -- always returns the same error text regardless of input.
2. **KEY-CLRFRM typo:** Erases `'gobal.sld'` (missing 'l' in "global") instead of `'global.sld'`.
3. **ON-ERROR dead code:** Second check for error code 40200 (mapping to error 5050) is unreachable since 40200 is already caught in the first branch.
4. **PRODUCT_CODE KEY-NEXT-ITEM:** Both IF and ELSE branches are identical (ISBT and Codabar paths do the same thing), making the conditional unnecessary.

---

## Program Units Summary

The form contains 21 program units (19 procedures, 3 functions -- note: one is miscounted as PRINT_LABEL_1 and CHK_INTER are functions plus GET_ERROR_TEXT):

| # | Name | Type | Primary Role |
|---|---|---|---|
| 1 | CHECK_DONOR_DEFERRALS | Procedure | Post-label donor interdiction check |
| 2 | MINIMUM_POOL_EXP_DATE | Procedure | Calculate minimum expiry across all components |
| 3 | GEN_REPORT | Procedure | Set up and submit CPRPOOL report |
| 4 | CALC_NEW_EXPIRY_DATE | Procedure (OUT) | Compute expiry from product lifespan rules |
| 5 | CHECK_FREEZE_TIME | Procedure | Validate cryo freeze timing (CRWS/CRSE) |
| 6 | CHECK_UNIT_PROD_INTERDICTIONS | Procedure | Check B/H/N interdictions on pool |
| 7 | CHK_INTER | Function | Determine SLD override from interdictions |
| 8 | PRINT_LABEL_1 | Function | Main label printing -- determines pool ABO/SLD |
| 9 | PERFORM_COMMIT | Procedure | Central save procedure -- all pool DML |
| 10 | CHECK_UNITS_ENTERED | Procedure | Validate unit count matches expected |
| 11 | DUPLI_CHECK_UNIT | Procedure | Prevent duplicate unit entries |
| 12 | DUPLI_CHECK_ATTRIBUTE | Procedure | Prevent duplicate attribute entries |
| 13 | PR_COMMIT | Procedure | Final database commit + report generation |
| 14 | VALIDATE_SP_TEST_SCAN_CODE128 | Procedure | Validate ISBT special test barcode |
| 15 | VALIDATE_COLLECTION_YEAR | Procedure | Validate ISBT collection year |
| 16 | VALIDATE_COLL_ID | Procedure | Validate collection agency |
| 17 | VAL_UNIT_ID_COEXIST_FOR_POOL | Procedure (OUT) | Pool-specific barcode validation (ISBT/Codabar) |
| 18 | VAL_UNIT_SCAN_CODE128_FOR_POOL | Procedure (OUT) | ISBT 128 barcode parsing for pools |
| 19 | REPORT_GENERATE | Procedure | Oracle Reports Server submission |
| 20 | GET_ERROR_TEXT | Function | Retrieve error text (has hardcoded bug) |
| 21 | CHECK_POOL_CGMP | Procedure | Weight cGMP compliance -- CMW interdictions |

---

## Expiry Date Calculation Logic (CALC_NEW_EXPIRY_DATE)

The pool expiry date is computed from two sources, taking the MINIMUM:

**Source 1: Product lifespan from `valid_products`**
- 'D' (Days): pool_date + life_span
- 'Y' (Years): add_months(pool_date, life_span * 12)
- 'H' (Hours): pool_date + (life_span / 24)
- For non-hourly: time set to 23:59:59

**Source 2: Pool attribute lifespan from `valid_product_attributes`**
- Same calculation as above for attrib_group='SP', attrib_code='POOL'
- Excludes entries where `valid_exp_date_ovr` overrides exist matching component attributes

**Final pool expiry:** The minimum across all individual component expiry dates and the calculated product/attribute lifespans.

If the calculated minimum expiry is earlier than both sysdate and the current pool_expiry_dats, warning alert 1855 is shown.
