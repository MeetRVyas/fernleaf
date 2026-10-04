-- DropIndex
DROP INDEX "order_line_combos_order_line_id_idx";

-- DropIndex
DROP INDEX "prep_units_combo_id_idx";

-- AlterTable
CREATE SEQUENCE "invoice_number_seq";
ALTER TABLE "invoices" ALTER COLUMN "number" SET DEFAULT 'INV-' || lpad(nextval('invoice_number_seq'::regclass)::text, 6, '0');

ALTER TABLE "prep_units" ADD CONSTRAINT "prep_units_done_requires_start" CHECK ("done_at" IS NULL OR "started_at" IS NOT NULL);
ALTER TABLE "prep_units" ADD CONSTRAINT "prep_units_start_actor_matches_time" CHECK (("started_at" IS NULL) = ("started_by_id" IS NULL));
ALTER TABLE "prep_units" ADD CONSTRAINT "prep_units_done_actor_matches_time" CHECK (("done_at" IS NULL) = ("done_by_id" IS NULL));
ALTER TABLE "prep_units" ADD CONSTRAINT "prep_units_done_after_start" CHECK ("done_at" IS NULL OR "done_at" >= "started_at");

ALTER TABLE "order_kitchen_state" ADD CONSTRAINT "order_kitchen_state_ready_requires_start" CHECK ("ready_at" IS NULL OR "started_at" IS NOT NULL);
ALTER TABLE "order_kitchen_state" ADD CONSTRAINT "order_kitchen_state_ready_after_start" CHECK ("ready_at" IS NULL OR "ready_at" >= "started_at");

ALTER TABLE "order_dispatch_state" ADD CONSTRAINT "order_dispatch_state_out_requires_ready" CHECK ("out_for_delivery_at" IS NULL OR "dispatch_ready_at" IS NOT NULL);
ALTER TABLE "order_dispatch_state" ADD CONSTRAINT "order_dispatch_state_delivered_requires_out" CHECK ("delivered_at" IS NULL OR "out_for_delivery_at" IS NOT NULL);
ALTER TABLE "order_dispatch_state" ADD CONSTRAINT "order_dispatch_state_out_after_ready" CHECK ("out_for_delivery_at" IS NULL OR "out_for_delivery_at" >= "dispatch_ready_at");
ALTER TABLE "order_dispatch_state" ADD CONSTRAINT "order_dispatch_state_delivered_after_out" CHECK ("delivered_at" IS NULL OR "delivered_at" >= "out_for_delivery_at");

ALTER TABLE "drops" ADD CONSTRAINT "drops_delivered_actor_matches_time" CHECK (("delivered_at" IS NULL) = ("delivered_by_id" IS NULL));
ALTER TABLE "drops" ADD CONSTRAINT "drops_on_time_matches_delivery" CHECK (("delivered_at" IS NULL) = ("on_time" IS NULL));

ALTER TABLE "orders" ADD CONSTRAINT "orders_invoice_billable_status" CHECK ("invoice_id" IS NULL OR "status" IN ('CONFIRMED', 'DELIVERED'));
ALTER TABLE "orders" ADD CONSTRAINT "orders_confirmed_has_time" CHECK ("status" NOT IN ('CONFIRMED', 'DELIVERED') OR "confirmed_at" IS NOT NULL);
ALTER TABLE "orders" ADD CONSTRAINT "orders_placed_has_time" CHECK ("status" NOT IN ('PLACED', 'CONFIRMED', 'DELIVERED') OR "placed_at" IS NOT NULL);
ALTER TABLE "orders" ADD CONSTRAINT "orders_cancelled_has_time" CHECK ("status" <> 'CANCELLED' OR "cancelled_at" IS NOT NULL);
ALTER TABLE "orders" ADD CONSTRAINT "orders_rejected_has_time_and_reason" CHECK ("status" <> 'REJECTED' OR ("rejected_at" IS NOT NULL AND "reason" IS NOT NULL AND btrim("reason") <> ''));
ALTER TABLE "orders" ADD CONSTRAINT "orders_active_has_address" CHECK ("status" IN ('DRAFT', 'CANCELLED', 'REJECTED') OR ("address_id" IS NOT NULL AND "address_snapshot" IS NOT NULL));

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_paid_time_matches_status" CHECK (("status" = 'PAID') = ("paid_at" IS NOT NULL));
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_void_time_matches_status" CHECK (("status" = 'VOID') = ("voided_at" IS NOT NULL));

ALTER TABLE "price_tiers" ADD CONSTRAINT "price_tiers_none_fields" CHECK ("derivation_kind" <> 'NONE' OR ("factor_milli" IS NULL AND "percent_bp" IS NULL AND "base_tier_id" IS NULL));
ALTER TABLE "price_tiers" ADD CONSTRAINT "price_tiers_cost_multiplier_fields" CHECK ("derivation_kind" <> 'COST_MULTIPLIER' OR ("factor_milli" IS NOT NULL AND "factor_milli" > 0 AND "percent_bp" IS NULL AND "base_tier_id" IS NULL));
ALTER TABLE "price_tiers" ADD CONSTRAINT "price_tiers_percent_over_tier_fields" CHECK ("derivation_kind" <> 'PERCENT_OVER_TIER' OR ("percent_bp" IS NOT NULL AND "percent_bp" > -10000 AND "base_tier_id" IS NOT NULL AND "base_tier_id" <> "id" AND "factor_milli" IS NULL));
ALTER TABLE "price_tiers" ADD CONSTRAINT "price_tiers_default_active" CHECK (NOT "is_default" OR "is_active");

ALTER TABLE "order_line_combos" ADD CONSTRAINT "order_line_combos_unit_covers_dish_price" CHECK ("unit_price_cents" >= "dish_price_cents");

ALTER TABLE "companies" ADD CONSTRAINT "companies_delivery_time_hhmm" CHECK ("default_delivery_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_time_hhmm" CHECK ("delivery_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "drops" ADD CONSTRAINT "drops_delivery_time_hhmm" CHECK ("delivery_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "companies" ADD CONSTRAINT "companies_working_days_required" CHECK ("working_days" IS NOT NULL);
