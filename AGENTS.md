# Non-Negotiable Rules: Material & Procurement Module

## 1. Analyse First & Approval Gate
- Phase 0 is read-only.
- Do not edit files or execute schema modifications until the user explicitly approves the implementation plan.

## 2. Reuse, Don't Duplicate
- Extend existing tables wherever possible:
  - `materials`
  - `vendors`
  - `purchase_orders`
  - `goods_receipt_notes`
  - `project_materials`
  - `quotation_wbs_material`
  - `invoice_items`
- Justify every new table in the plan against existing tables considered.
- Pick one indent table and retire the other (migrate data, do not drop table).

## 3. One Stock Mechanism
- Single `stock_ledger` table (append-only) and single `StockService.post()` method used by all transactions:
  - Receipts (`grn_receipt`)
  - Issues (`issue`)
  - Consumptions (`consumption`)
  - Returns (`return`)
  - Transfers Out (`transfer_out`)
  - Transfers In (`transfer_in`)
  - Adjustments (`adjustment`)
  - Reversals (`reversal`)
  - Damages (`damage`)
  - Opening balance (`opening`)
- Nobody writes stock numbers anywhere else.
- Columns: `ledger_id`, `material_id`, `store_id`, `txn_type`, `qty_in`, `qty_out`, `rate`, `txn_date`, `ref_type`, `ref_id`, `project_id`, `wbs_id`, `task_id`, `reversal_of_id`, `remarks`, `created_by`, `created_at`.
- Never `UPDATE` or `DELETE` ledger rows. Corrections must be reversal rows referencing `reversal_of_id`.

## 4. Computed Stock (Never Typed)
- On-hand stock = `SUM(qty_in) - SUM(qty_out)` per material + store.
- Reserved stock comes from reservation rows.
- Available to allocate = `On-hand - Reserved`.
- Cached columns (like `project_materials.received_quantity`, `used_quantity`, `remaining_quantity`) become derived values refreshed exclusively by `StockService`, and editable PUT fields must be removed.

## 5. No Negative Stock (Enforced in Database Transaction)
- Inside one database transaction:
  - Acquire lock with `SELECT ... FOR UPDATE` on the material + store balance row (or atomic update with affected-rows check).
  - Check available quantity against requested quantity.
  - Insert the ledger row and commit.
- If stock is insufficient, immediately abort and return HTTP `409 Conflict`:
  `{ "success": false, "message": "Insufficient stock. Required: X, Available: Y" }`
- Must be validated under concurrent requests.

## 6. Explicit & Idempotent Posting
- GRN workflow: `draft` -> `posted` (or `cancelled`).
- Only the `post` action writes ledger rows, and only for the accepted quantity.
- Posting is strictly idempotent: unique constraint on `(ref_type, ref_id, material_id)` plus a transaction status check prevents double-posting on double clicks or retries.
- Draft, cancelled, or rejected GRNs never touch stock.
- Quotation approval never touches stock.

## 7. Server Validates Everything
- All business rules must be enforced in backend services and database constraints.
- Frontend UI only mirrors server state and validation.

## 8. Rate & Tax Snapshots
- Snapshot purchase rates, billing rates, and tax percentages at posting/transaction time.
- Purchase rate and billing rate are distinct fields.

## 9. Forward-Only Idempotent Migrations
- All migrations must be versioned SQL files in `database/migrations/NNN_*.sql`.
- Run through existing `db:migrate` runner (`schema_migrations`).
- Forward-only, idempotent (check `information_schema` before `ALTER TABLE`).
- No `DROP TABLE`.
- Convert `materials`, `material_logs`, `material_planning`, `audit_logs` from MyISAM to InnoDB.
- Foreign keys added only after reporting and cleaning orphan rows.
- Reconcile `migrate.ts` with the migration folder; versioned SQL migrations are authoritative.

## 10. Role-Agnostic, Permission-Based Access Control
- Seed and use explicit permissions:
  - `purchase_orders`
  - `grn`
  - `stock`
  - `material_issue`
  (with actions: `view`, `create`, `update`, `approve`, `post`, `adjust`, `override`).
- Gate backend routes and frontend sidebar/pages by permission codes, never hardcoded role names alone.
- Stock adjustments and manual override of purchase recommendations require dedicated permissions and a mandatory reason stored in `audit_logs`.

## 11. Audit Logging
- Write `audit_logs` for:
  - GRN post / cancel
  - PO approve / cancel
  - Stock adjustment
  - Material issue / return
  - Purchase recommendation override
  - Billing changes

## 12. Soft Deletes
- Follow `is_deleted` / `deleted_at`.
- Never hard-delete any record with associated ledger rows or invoice links.

## 13. Zero Regression on Existing Modules
- Preserve intact behavior for Quotations, Project 360, Timesheets, Labour, Invoices, and Reports.
- Explicitly catalog any necessary behavioral changes (such as deprecating editable stock input fields) in the plan first.

## 14. Consistent UI System
- Use custom CSS, existing light/dark themes, and core components (`SearchableSelect`, `Modal`, `DataTable`, `Toast`, `ConfirmDeleteModal`).
- No new UI libraries.

## 15. Evidence-Based Verification
- Every "Pass" claim requires executed test output.
- Transparently state any tests or environments that could not be run.
