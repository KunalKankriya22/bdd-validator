---
module: Lab/Distribution
sub_module: "Component Processing"
title: "Prepare Pool Component (POOL) - End User Guide"
mnemonic: cpipool2
tags:
  - screen
  - lab-distribution
  - component-processing
  - pool
  - end-user-guide
---

# CPIPOOL2 — Prepare Pool Component (POOL) — End User Guide

**Screen:** POOL (CPIPOOL2)
**Module:** Lab/Distribution > Component Processing
**Purpose:** Combine multiple individual blood component bags into one pooled product bag.

---

## What Is This Screen For?

You're a lab technician. A hospital needs platelets (or another blood product) for a patient. Instead of giving them one tiny bag, you need to **combine several individual blood component bags into one big pooled bag**. This screen is where you do that.

---

## Step 1: Open the Screen

Navigate to the **POOL** screen (keyword: POOL) from the Component Pooling Functions menu.

The system sets itself up silently — loads your chapter (facility), warehouse, timezone, and user info into the header banner.

**Nothing can go wrong here** — it's automatic.

---

## Step 2: Scan or Enter the Pool Unit ID

This is the barcode on the **new empty bag** that will hold the pooled product. You either:
- **Scan** the barcode on the bag
- Type **M** and press Enter to manually type in the Collection ID, Year, Serial Number

The system auto-detects whether this is an **ISBT** (13-character) or **Codabar** (shorter) unit ID.

### Possible Errors

| What Went Wrong | Error | What You See |
|---|---|---|
| The barcode you scanned already exists as a unit in the system | **0180** | "Unit already exists" — You scanned a bag that's already been used. Get a new bag. |
| You scanned an existing pool that has expired | **0154** | "Pool expired" — You can't add to an expired pool. |
| The existing pool has a Hold, Biohazard, or NFT interdiction | **1101** | "Pool has interdictions" — This pool is locked down; you can't modify it. |
| The pool is currently in transit to another location | (interdiction check) | Pool is being shipped — can't touch it. |
| The barcode didn't scan properly | (scan validation error) | Rescan or use manual entry. |

**What happens if you scan an existing pool?** The system loads all the data — patient info, product code, existing components — so you can add more units to it.

---

## Step 3: Enter Patient Info (Optional)

You can enter:
- **Patient ID** (up to 10 characters)
- **Patient Last Name** (up to 50 characters)
- **Patient First Name** (up to 50 characters)
- **Facility** (hospital name, up to 50 characters)

**These are all optional.** No errors possible here — just type and move on. This is for directed pools where you know which patient needs it.

---

## Step 4: Select the Pool Product Code

You scan, type, or pick from a dropdown what type of pooled product you're making (e.g., pooled platelets, pooled cryo).

### Possible Errors

| What Went Wrong | Error | What You See |
|---|---|---|
| Product code doesn't exist or is expired | **1205** | "Invalid product code" — Check that you're using the right code for your scheme (ISBT vs Codabar). |
| Product code isn't a pool type | **1205** | The code must start with 'PO' (pool type). Non-pool products are rejected. |
| Wrong length for your scheme | **1205** | ISBT needs 8 characters, Codabar needs 5. |
| Product code doesn't end in '00' | **1205** | Pool product codes must have suffix '00'. |

**Behind the scenes:** The system also checks if this product requires **freeze time** (FCRYO cryo products) and if **weight** entry is required (from product type configuration). These flags affect what you'll need to enter later.

---

## Step 5: Enter Catalog Number, Lot Number, Filter Lot Number

These identify the physical bag and supplies you're using.

- **Catalog Number** — Scan the bag's catalog barcode, or type M for manual entry. For ISBT, the system can parse a concatenated catalog+lot scan in one go.
- **Lot Number** — Scan or pick from dropdown. Filtered by the catalog you selected and the CMC master code configuration.
- **Filter Lot Number** — If using a filter, enter its lot number (optional).

### Possible Errors

| What Went Wrong | Error | What You See |
|---|---|---|
| Lot number doesn't match catalog | **1200** | "Invalid lot number" — The lot must be linked to the catalog you chose. |
| Catalog/lot not configured for this screen | (empty dropdown) | The CMC master code doesn't include this catalog for CPIPOOL2. Ask your admin. |

---

## Step 6: Enter Number of Units

Type how many individual component bags you're going to combine (e.g., 4 platelets, 6 cryo units).

### Possible Errors

| What Went Wrong | Error | What You See |
|---|---|---|
| You entered 0 or negative | **0046** | "Must be positive number" |
| You try to add more components than this number later | **0109** | "Maximum number of rows reached" — You said 4 units but tried to enter a 5th. |

**Note:** This limit only applies when creating a new pool. If you reopen an existing pool later to add more units, this field doesn't restrict you.

---

## Step 7: Select Pooled ABO/Rh

Pick the ABO blood type for the pool from the dropdown (e.g., Group A, Group O).

### Possible Errors

| What Went Wrong | Error | What You See |
|---|---|---|
| Invalid ABO code | **1140** | "ABO/Rh incompatible" — The code isn't in the POOL master codes list. |
| Codabar pool with mixed ABOs | **1140** | Codabar pools must be same ABO. You can't mix Group A and Group B in a Codabar pool. ISBT pools allow mixing. |

---

## Step 8: Pool Date/Time

Auto-fills with the current date and time. You can change it if the pooling actually happened earlier (e.g., you're entering data late).

### Possible Errors

| What Went Wrong | Error | What You See |
|---|---|---|
| Date is in the future | **8030** | "Future date not allowed" — You can't pool something that hasn't happened yet. |
| Date is more than 3 days old | **0032** | "Date out of range" — Too old to enter now. |
| Time is exactly midnight (00:00) | **0283** | "Midnight time not allowed" — Enter the actual time. |

The system auto-calculates the **pool expiration date** based on the product's lifespan rules.

---

## Step 9: Enter Freeze Time (Only for Cryo Products)

If you selected a cryo product (like POCRY), you must enter when the product was frozen.

### Possible Errors

| What Went Wrong | Error | What You See |
|---|---|---|
| Freeze time is before pool time | **0284** | "Freeze time before pool time" — You can't freeze it before you made it. |
| Worksheet-to-freeze time exceeded limits | **0287** | CRWS interdiction will be placed on the pool. The pool SLD becomes NFT/Discard. |
| Separation-to-freeze time exceeded limits | **0287** | CRSE interdiction will be placed. Same consequence. |

---

## Step 10: Enter Attributes (Optional)

You can add up to 5 attributes to the pool (e.g., CMV Negative, Irradiated). The system always adds a **POOL** attribute automatically.

### Possible Errors

| What Went Wrong | Error | What You See |
|---|---|---|
| Invalid attribute group | **1110** | Not a valid group for pool products. |
| Invalid attribute code | **1100** | Code doesn't exist for this group. |
| Duplicate attribute | **9718** | You already added this attribute. |
| Attribute not valid for this product type | **0035** | This attribute can't be used with this pool product. |
| Used DON or VENI group | **1110** | Donor and venipuncture attributes aren't allowed on pools. |

---

## Step 11: Enter Each Component Unit (Repeat for Each Bag Going Into the Pool)

This is the heart of the screen. For each individual blood bag going into the pool, you go through a 4-field chain:

### 11a. Scan the Unit ID

Scan the barcode on each component bag, or type M for manual entry.

#### Possible Errors

| What Went Wrong | Error | What You See |
|---|---|---|
| Unit doesn't exist in the system | **0063** | "Unit not found" — This unit isn't registered. |
| Unit was collected after the pool date | **8060** | "Collection date after pool date" — Can't pool something collected in the future relative to the pool. |
| Unit has interdictions (Hold, Biohazard, etc.) | **0183** | "Unit has interdictions" — This unit is flagged and can't be pooled. |
| Cryo product but no cryo record for this unit | **0186** | "Cryo unit not found" — The cryo processing wasn't done on this unit. |
| Freeze time violations detected | **0287** | CRWS or CRSE time limit exceeded for this component. |

### 11b. Enter/Scan the Product Code

The product code of the individual component (e.g., platelet concentrate).

#### Possible Errors

| What Went Wrong | Error | What You See |
|---|---|---|
| Product code not found | **1205** | Invalid or expired product code. |
| Product type doesn't match the pool type | **1115** | "Product type mismatch" — You can't put red cells into a platelet pool. |
| You already added this same unit | **9718** | "Duplicate entry" — This unit is already in the pool. |
| Component is missing a required pool attribute | **5237** | If you set "CMV Negative" as a pool attribute, every component must have it too. |
| No eligible component found | **0064** | The component is either rejected, interdicted, not labeled, or has an incompatible ABO. |
| Component ABO not allowed in this pool group | **1140** | "ABO/Rh incompatible" — This blood type doesn't belong in a Group A pool, for example. |

### 11c. Component Prefix (Auto-filled)

For ISBT: auto-derived from positions 7-8 of the product code. For Codabar: looked up from the components table. You don't type this.

#### Possible Errors at This Stage

| What Went Wrong | Error | What You See |
|---|---|---|
| Component not found for this prefix | **1146** | No matching component record. |
| Component is in transit | (interdiction check) | Can't pool something being shipped. |
| Donor is deferred | (library error) | Donor has an active deferral — component can't be used. |
| Component expires before pool date | **0264** | This component is too old for this pool. |
| Component expiry is earlier than current pool expiry | **1855** (warning) | "Pool expiry reduced" — The pool's expiration is adjusted down to match this component. This is a **warning**, not a blocker. |
| Aliquoted Codabar component | Not allowed | Codabar aliquots can't go in pools. |
| Imported component in freeze-time pool | Not allowed | Imported products can't go in pools requiring freeze time. |

**Then the cursor moves down to the next row**, and you repeat for each unit.

---

## Step 12: Press F12 (Commit)

You've entered all your components. Press F12 to commit.

### Possible Errors Before Commit Proceeds

| What Went Wrong | Error | What You See |
|---|---|---|
| First record is incomplete | **0017** | "Required data missing" — The first component row doesn't have unit_id, product_code, and prefix. |
| You entered fewer units than you said | **0288** | "Unit count mismatch" — You said 4 units but only entered 3. |

### What Happens Next Depends on the Product

```
F12 pressed
  |
  +-- Freeze time required? --> Go enter/confirm freeze time first
  |
  +-- Weight required? --> Go enter pool weight first
  |
  +-- Neither? --> Proceed directly to save and print
```

---

## Step 13: Enter Pool Weight (If Required)

For products like pooled platelets or pooled cryo where weight matters, you either:
- **Scan** the weight from a scale interface
- Type **M** and manually enter the weight in grams (format: 999.99)

### Possible Errors

| What Went Wrong | Error | What You See |
|---|---|---|
| Weight is required but you left it blank | **4317** | "Weight required" |
| Weight is not between 1 and 999.99 | **0250** | "Invalid weight" |
| Weight scan didn't parse | **1210** | "Invalid weight scan" — Rescan or enter manually. |
| Weight is outside the acceptable range for this product | **9789** (warning) | A **CMW interdiction** is placed on the pool. The pool SLD becomes NFT (Codabar) or Discard (ISBT). **This cannot be undone.** |

The system auto-calculates **volume** from the weight using the product's specific gravity: `volume = weight / specific_gravity`.

---

## Step 14: System Saves and Prints the Label (Automatic)

After you've entered everything, the system automatically:

1. Creates the pool record in the database
2. Links each component to the pool (marks them as "POOL" rejected, NFT)
3. Adds the POOL attribute and any other attributes you entered
4. Records freeze time and interdictions if applicable
5. **Prints the ABO/Expiration label**

**You don't press anything for this — it happens on its own.**

---

## Step 15: Reprint Label (F6 — Optional, Only Available Now)

If the label printed badly (jammed, smeared, wrong printer), press **F6** to reprint.

**This is your ONLY chance to reprint.** Once you start scanning for label verification (next step), the reprint option disappears.

### Possible Errors

| What Went Wrong | Error | What You See |
|---|---|---|
| Pool ID or product code is missing | **1180** | "Function not available" |
| You tried to reprint after verification started | (not navigable) | F6 does nothing — too late. |
| You tried to reprint for an individual unit | **5308** | "Cannot reprint unit label" — Reprint is for the pool label only. |

---

## Step 16: Label Verification (Mandatory)

A verification window pops up. You must **scan the printed label** to prove it matches what's in the system. This is a safety check — wrong labels on blood products can be fatal.

### Scan 1: Unit ID + ABO (Combined or Separate)

- **Scan the label barcode** that has both unit ID and ABO together, OR
- Type **M** to scan them separately (Scan Unit ID, then Scan ABO)

#### Possible Errors

| What Went Wrong | Error | What You See |
|---|---|---|
| Scanned unit ID doesn't match the pool ID | **1508** | "Unit ID mismatch" — You scanned the wrong label. Start over. |
| Scanned ABO doesn't match the system's label decision | **1509** | "ABO mismatch" — The label has the wrong blood type. This is a serious problem. |

### Scan 2: Product Code + Expiry (Combined or Separate)

- **ISBT pools:** Can scan a combined Product+Expiry barcode, or type M for separate scans
- **Codabar pools:** This combined scan is skipped; you go directly to individual scans

#### Possible Errors

| What Went Wrong | Error | What You See |
|---|---|---|
| Scanned product code doesn't match | **9728** | "Product code mismatch" — Wrong label or wrong product. |
| Scanned expiry date doesn't match | **1170** | "Expiry date mismatch" — The label shows the wrong expiration. |

**Note for Codabar:** If the pool's expiry time is anything other than 23:59, you **must** manually enter the expiry date — you can't scan it.

### Scan 3: Special Test (Only for ISBT CMV-Negative Pools)

- Only appears if the pool is ISBT **and** has a CMV Negative attribute
- Scan or select the CMV code

#### Possible Errors

| What Went Wrong | Error | What You See |
|---|---|---|
| Invalid special test code | **4300** | Code doesn't match the LBCMV master code. |
| No LBCMV code configured | **4327** | System configuration issue — contact admin. |
| Multiple LBCMV codes configured | **4328** | System configuration issue — should only be one. |

---

## Step 17: Final Commit and Report (Automatic)

After successful label verification:

1. The system does the **final database commit**
2. The **Pooled Components Report (CPRPOOL)** automatically prints — a paper record of everything in the pool
3. The form **clears itself** for the next pool entry

### Possible Errors

| What Went Wrong | Error | What You See |
|---|---|---|
| Database commit failed | **0230** | "Commit failed" — Everything is rolled back. Start over. Contact IT if persistent. |
| Commit succeeded | **8010** | This is actually a **success** message, not an error! |

---

## Other Actions Available Anytime

### Delete a Component from the Pool

Use **UP/DOWN arrow keys** to highlight a component, then press **DelRec** (Shift+F6).

- **If the pool is new (not yet saved):** The row is simply cleared from the screen.
- **If the pool already exists:** The component is un-pooled in the database — its pooled_component_id is cleared, its SLD and reject reason are removed, and it becomes available again (but needs a new label).
- Pool weight/volume is cleared (you'll need to re-weigh since the composition changed).
- Pool expiry is recalculated based on remaining components.

### Clear the Form (Start Over)

Press the **Clear Form** key to abandon everything and start fresh. Any unsaved changes are rolled back.

### Exit the Screen

Press the **Exit** key to close the form entirely. All unsaved changes are rolled back.

### Print the Screen

Press **Ctrl+P** to print a paper copy of what's on your screen (like a screenshot). This has nothing to do with labels — it's just a screen print for your records.

---

## ISBT vs Codabar: What's Different for the User?

| What You're Doing | ISBT | Codabar |
|---|---|---|
| Pool Unit ID | Must be 13 characters | Any other length |
| Product code | 8 characters | 5 characters |
| Mixed blood types in one pool | Allowed | NOT allowed — all units must be same ABO |
| Catalog+Lot concatenated scan | Supported (one scan for both) | Not supported — enter separately |
| Lot number scan field | Enabled | Disabled — manual entry only |
| Product+Expiry verification scan | Supported (one scan) | Skipped — scan product and expiry separately |
| Non-23:59 expiry times | Scan works normally | Must be manually entered |
| Special test verification | Appears if CMV Negative | Never appears |
| Product code label printing | Prints on the label | Does NOT print on the label |
| SLD on CRWS/CRSE/CMW interdiction | Discard | NFT (Not For Transfusion) |
| Aliquoted components | Allowed | NOT allowed |

---

## Quick Reference: All Scenarios at a Glance

| Scenario | What Happens |
|---|---|
| **Create new pool** | Scan new bag -> enter product/catalog/lot -> enter components -> F12 -> label prints -> verify label -> report prints |
| **Add to existing pool** | Scan existing pool -> existing components load -> add more -> F12 -> new label prints -> verify -> report |
| **Reprint label** | F6 after label prints but before verification starts |
| **Delete one component** | Arrow to it -> DelRec -> component released, expiry recalculated |
| **Delete entire pool** | Use the separate **DELPOOL** screen (not this screen) |
| **Modify pool product/bag** | Use the separate **MODPOOL** screen |
| **Query pool details** | Use the separate **CPQPOOLC** screen (read-only) |
| **Weight out of range** | CMW interdiction placed -> pool labeled NFT/Discard -> **cannot be undone** |
| **Freeze time exceeded** | CRWS/CRSE interdiction -> pool labeled NFT/Discard -> **cannot be undone** |
| **Label verification fails** | Must re-scan correct label — pool not finalized until verification passes |
| **Codabar + mixed ABOs** | Not allowed — all components must be same blood type |
| **ISBT + mixed ABOs** | Allowed — system calculates combined pool SLD |

---

## Complete Error Code Reference

| Code | Meaning | When It Happens |
|---|---|---|
| **0017** | Required data missing | F12 pressed but first component row incomplete |
| **0032** | Date out of range | Pool date more than 3 days old |
| **0035** | Attribute not valid for product | Attribute can't be used with this pool product type |
| **0046** | Must be positive number | Number of units is 0 or negative |
| **0063** | Unit not found | Scanned unit doesn't exist in the system |
| **0064** | Component not found/ambiguous | No eligible labeled component with valid ABO |
| **0109** | Maximum rows reached | Tried to enter more units than specified |
| **0154** | Pool expired | Existing pool's expiry date has passed |
| **0180** | Unit already exists | Pool ID already used as a unit — need a new bag |
| **0183** | Unit has interdictions | Unit has Hold/Biohazard/other blocking interdictions |
| **0186** | Cryo unit not found | No cryo processing record for this component |
| **0230** | Commit failed | Database error — everything rolled back |
| **0250** | Invalid weight | Weight not between 1 and 999.99 |
| **0264** | Component expired before pool | Component's expiry is earlier than pool date |
| **0283** | Midnight not allowed | Pool time entered as 00:00 |
| **0284** | Freeze before pool time | Freeze time is earlier than pool creation time |
| **0287** | Freeze time interdiction | CRWS or CRSE time limit exceeded |
| **0288** | Unit count mismatch | Fewer components entered than expected |
| **1100** | Invalid attribute code | Attribute code doesn't exist |
| **1101** | Pool has B/H/N interdictions | Pool is locked with blocking interdictions |
| **1110** | Invalid attribute group | Attribute group not valid for pools |
| **1115** | Product type mismatch | Component type incompatible with pool type |
| **1140** | ABO/Rh incompatible | Component blood type doesn't fit the pool group |
| **1146** | Component not found (prefix) | No component matching the given prefix |
| **1170** | Expiry date mismatch | Label verification: expiry doesn't match |
| **1180** | Function not available | Reprint not available or undefined key pressed |
| **1200** | Invalid lot number | Lot not found for this catalog |
| **1205** | Invalid product code | Product code not found or wrong format |
| **1206** | Pool not found | Pool ID not in system or product mismatch |
| **1210** | Invalid weight scan | Weight barcode couldn't be parsed |
| **1508** | Unit ID mismatch | Label verification: wrong unit scanned |
| **1509** | ABO mismatch | Label verification: ABO doesn't match system |
| **1855** | Pool expiry warning | Pool expiry reduced to match component (WARNING only) |
| **4300** | Invalid special test | SP test code doesn't match LBCMV master code |
| **4317** | Weight required | Weight is mandatory but was left blank |
| **4327** | No LBCMV code configured | System configuration issue |
| **4328** | Multiple LBCMV codes | System configuration issue |
| **5237** | Missing pool attribute | Component lacks a required pool attribute |
| **5308** | Cannot reprint unit label | Reprint attempted on individual unit |
| **8010** | Success | Commit completed successfully |
| **8030** | Future date | Pool date is in the future |
| **8060** | Collection after pool date | Component collected after pool date |
| **9718** | Duplicate entry | Same unit or attribute entered twice |
| **9728** | Product code mismatch | Label verification: product doesn't match |
| **9789** | Weight out of cGMP range | CMW interdiction placed — pool becomes NFT/Discard |

---

## Related Screens

| Screen | Keyword | Purpose |
|---|---|---|
| **CPIPOOL2** | POOL | Create pooled components (this screen) |
| **CPIMPOOL** | MODPOOL | Modify existing pooled components |
| **CPIPOOLD** | DELPOOL | Delete/dismantle an entire pool |
| **CPQPOOLC** | — | Query pooled component details (read-only) |
