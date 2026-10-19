---
name: bdd-generation
description: Generate Gherkin BDD feature files for the modern Angular application from legacy forms, Figma designs, user guides, and database constraints.
menu-code: bdd-generation
---

**Language:** Use {communication_language} for all output.

# BDD Generation

Generate Gherkin BDD feature files for the modern Angular application, synthesizing behavior from legacy forms, Figma designs, user guides, and database constraints.

## Process

1. **Check for existing screen analysis:** Look for `{agent.screens_base_path}/{mnemonic}/{agent.screen_analysis_filename}`.

   **If found:** Use it as the primary source — it consolidates all field mappings, workflows, discrepancies, and DB constraints. Skip to step 2. Only re-gather raw sources if the user explicitly requests fresh data or the analysis is outdated.

   **If not found:** Gather context using the Screen Analysis approach:
   - Parallel batch: Run `uv run scripts/resolve-screen.py {project-root} {mnemonic}` + `uv run scripts/extract-fmb-deps.py` (independent)
   - After manifest: Run `uv run scripts/lookup-tables.py {project-root} {tables...}` for DB constraints
   - Read FMB analysis MD, Figma screenshots, and vault entry

## Error Handling

- If the screen mnemonic doesn't match any known screen: suggest running `uv run scripts/list-screens.py {project-root} --search "{input}"` to find candidates.
- If no screen analysis AND no FMB XML exist: cannot generate meaningful BDD — inform the user and suggest running Screen Analysis first.
- If table DDLs are partially missing: generate scenarios for known fields, tag uncertain scenarios with `@verify-schema`.

2. **Identify scenarios from multiple sources:**
   - **Legacy workflows:** Every user path documented in FMB triggers and screen analysis
   - **Figma design:** New UI behaviors, form validations visible in the mockup
   - **DB constraints:** NOT NULL fields become required-field scenarios, unique indexes become duplicate-detection scenarios
   - **User guides:** Business rules and expected behaviors described in prose
   - **UAT practices:** Common test patterns and edge cases

3. **Generate Gherkin feature file:** Output to `{agent.screens_base_path}/{mnemonic}/{agent.bdd_feature_filename}`

## Gherkin Structure

```gherkin
@screen:{mnemonic}
@module:{module-name}
Feature: {Screen Title} - {Brief description}
  As a blood center operator
  I want to {primary action}
  So that {business value}

  Background:
    Given I am logged in as an authorized user
    And I navigate to the "{Screen Title}" screen

  # --- CRUD Operations ---

  @happy-path
  Scenario: Successfully create a new {entity}
    Given ...
    When ...
    Then ...

  # --- Validation ---

  @validation
  Scenario Outline: Required field validation
    When I leave "<field>" empty
    And I attempt to save
    Then I should see a validation error for "<field>"

    Examples:
      | field |
      | ... |

  # --- Business Rules ---

  @business-rule
  Scenario: {Rule description}
    ...

  # --- Edge Cases ---

  @edge-case
  Scenario: {Edge case description}
    ...
```

## Scenario Categories

Generate scenarios for each of these categories where applicable:

**CRUD Operations:** Create, read, update, delete for the screen's primary entity. Include search/query flows.

**Field Validation:**
- Required fields (from DB NOT NULL + FMB REQUIRED property)
- Length constraints (from DB column lengths)
- Type validation (date formats, numeric ranges)
- Pattern validation (e.g., Unit ID formats like ISBT128 vs Codabar)

**Business Rules:**
- Conditional field behavior (fields that enable/disable based on other values)
- Cascading updates (changes that affect related records)
- Status transitions (valid state changes for the entity)
- Authorization rules (operations restricted by role)

**Dropdown/LOV Behavior:**
- Dropdown values loaded from validation tables
- Dependent dropdowns (selection in one filters options in another)
- LOV search and selection flows

**Navigation:**
- Screen-to-screen navigation (calling/called screens)
- Parameter passing between screens
- Return navigation with data preservation

**Error Handling:**
- Database constraint violations (unique, FK, check constraints)
- Concurrent modification conflicts
- Network/timeout errors

**Edge Cases:**
- Empty result sets on query
- Maximum record limits
- Special characters in text fields
- Date boundary conditions (timezone-related)

## Conventions

- Use `@tags` for categorization: `@happy-path`, `@validation`, `@business-rule`, `@edge-case`, `@crud`, `@navigation`
- Use `Scenario Outline` with `Examples` tables when testing multiple inputs for the same flow
- Step language should reference UI elements by their Figma labels, not FMB item names
- Include data setup in `Given` steps, not assumptions about existing data
- Each scenario should be independent — no dependencies between scenarios

## Headless Mode

If `{headless_mode}=true`:
- Skip mnemonic confirmation
- Auto-use existing screen analysis if available; if not, gather sources without confirmation
- If no screen analysis AND no FMB XML exist, halt with `status: "blocked"`
- On completion, output:

```json
{
  "status": "complete",
  "capability": "bdd-generation",
  "mnemonic": "{mnemonic}",
  "output_file": "{path-to-feature-file}",
  "summary": {
    "scenarios_generated": 0,
    "categories": { "crud": 0, "validation": 0, "business_rule": 0, "edge_case": 0, "navigation": 0, "error_handling": 0 }
  },
  "assumptions": [],
  "open_questions": []
}
```

If halted:

```json
{
  "status": "blocked",
  "capability": "bdd-generation",
  "mnemonic": "{mnemonic}",
  "reason": "No screen analysis and no FMB XML exist — cannot generate meaningful BDD scenarios",
  "assumptions": [],
  "open_questions": ["Run screen analysis first, or locate FMB file"]
}
```

## What Success Looks Like

- Every user workflow from the screen analysis has at least one scenario
- Validation scenarios cover all NOT NULL fields and length constraints from the DB schema
- Business rules from FMB triggers are captured as scenarios, not just comments
- Scenarios use the modern UI terminology (Figma labels), not legacy field names
- The feature file is executable — step definitions could be written from these scenarios without ambiguity
