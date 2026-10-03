-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PLACED', 'CONFIRMED', 'DELIVERED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('OPEN', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "Temperature" AS ENUM ('HOT', 'COLD');

-- CreateEnum
CREATE TYPE "PackagingType" AS ENUM ('STANDARD', 'ECO', 'INSULATED');

-- CreateEnum
CREATE TYPE "PriceSubjectType" AS ENUM ('DISH', 'OPTION');

-- CreateEnum
CREATE TYPE "DerivationKind" AS ENUM ('NONE', 'COST_MULTIPLIER', 'PERCENT_OVER_TIER');

-- CreateEnum
CREATE TYPE "OrderEventType" AS ENUM ('CREATED', 'PLACED', 'EDITED', 'CONFIRMED', 'KITCHEN_STARTED', 'KITCHEN_READY', 'DISPATCH_READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REJECTED', 'OVERRIDE');

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "kitchen_holidays" (
    "id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "kitchen_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allergens" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "allergens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dietary_tags" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "dietary_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kitchen_stations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "kitchen_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dishes" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "image_url" TEXT,
    "sku" TEXT NOT NULL,
    "temperature" "Temperature" NOT NULL,
    "cost_cents" INTEGER NOT NULL,
    "min_order_qty" INTEGER NOT NULL DEFAULT 1,
    "station_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "dishes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "options" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "cost_cents" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "option_groups" (
    "id" UUID NOT NULL,
    "dish_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "option_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "option_group_options" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "option_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "option_group_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dish_allergens" (
    "dish_id" UUID NOT NULL,
    "allergen_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "dish_allergens_pkey" PRIMARY KEY ("dish_id","allergen_id")
);

-- CreateTable
CREATE TABLE "dish_dietary_tags" (
    "dish_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "dish_dietary_tags_pkey" PRIMARY KEY ("dish_id","tag_id")
);

-- CreateTable
CREATE TABLE "option_allergens" (
    "option_id" UUID NOT NULL,
    "allergen_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "option_allergens_pkey" PRIMARY KEY ("option_id","allergen_id")
);

-- CreateTable
CREATE TABLE "option_dietary_tags" (
    "option_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "option_dietary_tags_pkey" PRIMARY KEY ("option_id","tag_id")
);

-- CreateTable
CREATE TABLE "price_tiers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "derivation_kind" "DerivationKind" NOT NULL DEFAULT 'NONE',
    "factor_milli" INTEGER,
    "percent_bp" INTEGER,
    "base_tier_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "price_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_entries" (
    "id" UUID NOT NULL,
    "tier_id" UUID NOT NULL,
    "subject_type" "PriceSubjectType" NOT NULL,
    "subject_id" UUID NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "price_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "tier_id" UUID,
    "default_delivery_time" TEXT NOT NULL DEFAULT '12:00',
    "delivery_lead_minutes" INTEGER NOT NULL DEFAULT 60,
    "default_packaging" "PackagingType" NOT NULL DEFAULT 'STANDARD',
    "driver_instructions" TEXT NOT NULL DEFAULT '',
    "default_driver_id" UUID,
    "billing_name" TEXT NOT NULL,
    "billing_email" TEXT NOT NULL,
    "billing_phone" TEXT,
    "billing_address" TEXT NOT NULL,
    "owner_employee_id" UUID,
    "working_days" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_domains" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "domain" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "company_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_addresses" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "company_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_holidays" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "company_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "can_choose_address" BOOLEAN NOT NULL DEFAULT false,
    "can_change_delivery_time" BOOLEAN NOT NULL DEFAULT false,
    "can_change_packaging" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_allergens" (
    "employee_id" UUID NOT NULL,
    "allergen_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employee_allergens_pkey" PRIMARY KEY ("employee_id","allergen_id")
);

-- CreateTable
CREATE TABLE "employee_dietary_tags" (
    "employee_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employee_dietary_tags_pkey" PRIMARY KEY ("employee_id","tag_id")
);

-- CreateTable
CREATE TABLE "menu_categories" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_secret" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "dish_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_hidden_categories" (
    "company_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "company_hidden_categories_pkey" PRIMARY KEY ("company_id","category_id")
);

-- CreateTable
CREATE TABLE "company_hidden_items" (
    "company_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "company_hidden_items_pkey" PRIMARY KEY ("company_id","item_id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "order_number" SERIAL NOT NULL,
    "employee_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "delivery_date" DATE NOT NULL,
    "delivery_time" TEXT NOT NULL,
    "address_id" UUID,
    "address_snapshot" JSONB,
    "packaging" "PackagingType" NOT NULL DEFAULT 'STANDARD',
    "total_cents" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "price_tier_id" UUID,
    "invoice_id" UUID,
    "created_by_staff_id" UUID NOT NULL,
    "placed_at" TIMESTAMPTZ(6),
    "confirmed_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "rejected_at" TIMESTAMPTZ(6),
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_lines" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "dish_id" UUID NOT NULL,
    "dish_snapshot" JSONB NOT NULL,
    "quantity" INTEGER NOT NULL,
    "line_total_cents" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_line_combos" (
    "id" UUID NOT NULL,
    "order_line_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "dish_price_cents" INTEGER NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "options_snapshot" JSONB NOT NULL,
    "combo_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "order_line_combos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_events" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "type" "OrderEventType" NOT NULL,
    "at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_id" UUID,
    "meta" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "order_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cutoff_runs" (
    "id" UUID NOT NULL,
    "delivery_date" DATE NOT NULL,
    "processed_at" TIMESTAMPTZ(6) NOT NULL,
    "drafts_cancelled" INTEGER NOT NULL,
    "orders_confirmed" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cutoff_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prep_units" (
    "id" UUID NOT NULL,
    "combo_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(6),
    "started_by_id" UUID,
    "done_at" TIMESTAMPTZ(6),
    "done_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "prep_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_kitchen_state" (
    "order_id" UUID NOT NULL,
    "started_at" TIMESTAMPTZ(6),
    "ready_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "order_kitchen_state_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "drops" (
    "id" UUID NOT NULL,
    "delivery_date" DATE NOT NULL,
    "company_id" UUID NOT NULL,
    "address_id" UUID NOT NULL,
    "delivery_time" TEXT NOT NULL,
    "driver_id" UUID,
    "delivered_at" TIMESTAMPTZ(6),
    "delivered_by_id" UUID,
    "note" TEXT,
    "on_time" BOOLEAN,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "drops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_dispatch_state" (
    "order_id" UUID NOT NULL,
    "drop_id" UUID NOT NULL,
    "dispatch_ready_at" TIMESTAMPTZ(6),
    "out_for_delivery_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "order_dispatch_state_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "company_id" UUID NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "total_cents" INTEGER NOT NULL,
    "paid_at" TIMESTAMPTZ(6),
    "voided_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kitchen_holidays_date_key" ON "kitchen_holidays"("date");

-- CreateIndex
CREATE UNIQUE INDEX "allergens_name_key" ON "allergens"("name");

-- CreateIndex
CREATE UNIQUE INDEX "dietary_tags_name_key" ON "dietary_tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "kitchen_stations_name_key" ON "kitchen_stations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "dishes_sku_key" ON "dishes"("sku");

-- CreateIndex
CREATE INDEX "dishes_station_id_idx" ON "dishes"("station_id");

-- CreateIndex
CREATE INDEX "option_groups_dish_id_sort_order_idx" ON "option_groups"("dish_id", "sort_order");

-- CreateIndex
CREATE INDEX "option_group_options_option_id_idx" ON "option_group_options"("option_id");

-- CreateIndex
CREATE UNIQUE INDEX "option_group_options_group_id_option_id_key" ON "option_group_options"("group_id", "option_id");

-- CreateIndex
CREATE INDEX "dish_allergens_allergen_id_idx" ON "dish_allergens"("allergen_id");

-- CreateIndex
CREATE INDEX "dish_dietary_tags_tag_id_idx" ON "dish_dietary_tags"("tag_id");

-- CreateIndex
CREATE INDEX "option_allergens_allergen_id_idx" ON "option_allergens"("allergen_id");

-- CreateIndex
CREATE INDEX "option_dietary_tags_tag_id_idx" ON "option_dietary_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "price_tiers_name_key" ON "price_tiers"("name");

-- CreateIndex
CREATE INDEX "price_tiers_base_tier_id_idx" ON "price_tiers"("base_tier_id");

-- CreateIndex
CREATE UNIQUE INDEX "price_entries_tier_id_subject_type_subject_id_key" ON "price_entries"("tier_id", "subject_type", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE INDEX "companies_tier_id_idx" ON "companies"("tier_id");

-- CreateIndex
CREATE INDEX "companies_default_driver_id_idx" ON "companies"("default_driver_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_domains_domain_key" ON "company_domains"("domain");

-- CreateIndex
CREATE INDEX "company_domains_company_id_idx" ON "company_domains"("company_id");

-- CreateIndex
CREATE INDEX "company_addresses_company_id_idx" ON "company_addresses"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_holidays_company_id_date_key" ON "company_holidays"("company_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_company_id_idx" ON "employees"("company_id");

-- CreateIndex
CREATE INDEX "employee_allergens_allergen_id_idx" ON "employee_allergens"("allergen_id");

-- CreateIndex
CREATE INDEX "employee_dietary_tags_tag_id_idx" ON "employee_dietary_tags"("tag_id");

-- CreateIndex
CREATE INDEX "menu_categories_sort_order_idx" ON "menu_categories"("sort_order");

-- CreateIndex
CREATE INDEX "menu_items_category_id_sort_order_idx" ON "menu_items"("category_id", "sort_order");

-- CreateIndex
CREATE INDEX "menu_items_dish_id_idx" ON "menu_items"("dish_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_items_category_id_dish_id_key" ON "menu_items"("category_id", "dish_id");

-- CreateIndex
CREATE INDEX "company_hidden_categories_category_id_idx" ON "company_hidden_categories"("category_id");

-- CreateIndex
CREATE INDEX "company_hidden_items_item_id_idx" ON "company_hidden_items"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_delivery_date_status_idx" ON "orders"("delivery_date", "status");

-- CreateIndex
CREATE INDEX "orders_company_id_delivery_date_idx" ON "orders"("company_id", "delivery_date");

-- CreateIndex
CREATE INDEX "orders_invoice_id_idx" ON "orders"("invoice_id");

-- CreateIndex
CREATE INDEX "orders_employee_id_idx" ON "orders"("employee_id");

-- CreateIndex
CREATE INDEX "orders_address_id_idx" ON "orders"("address_id");

-- CreateIndex
CREATE INDEX "orders_price_tier_id_idx" ON "orders"("price_tier_id");

-- CreateIndex
CREATE INDEX "orders_created_by_staff_id_idx" ON "orders"("created_by_staff_id");

-- CreateIndex
CREATE INDEX "order_lines_order_id_idx" ON "order_lines"("order_id");

-- CreateIndex
CREATE INDEX "order_lines_dish_id_idx" ON "order_lines"("dish_id");

-- CreateIndex
CREATE INDEX "order_line_combos_order_line_id_idx" ON "order_line_combos"("order_line_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_line_combos_order_line_id_combo_key_key" ON "order_line_combos"("order_line_id", "combo_key");

-- CreateIndex
CREATE INDEX "order_events_order_id_at_idx" ON "order_events"("order_id", "at");

-- CreateIndex
CREATE INDEX "order_events_actor_id_idx" ON "order_events"("actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "cutoff_runs_delivery_date_key" ON "cutoff_runs"("delivery_date");

-- CreateIndex
CREATE UNIQUE INDEX "prep_units_combo_id_key" ON "prep_units"("combo_id");

-- CreateIndex
CREATE INDEX "prep_units_combo_id_idx" ON "prep_units"("combo_id");

-- CreateIndex
CREATE INDEX "prep_units_started_by_id_idx" ON "prep_units"("started_by_id");

-- CreateIndex
CREATE INDEX "prep_units_done_by_id_idx" ON "prep_units"("done_by_id");

-- CreateIndex
CREATE INDEX "drops_delivery_date_driver_id_idx" ON "drops"("delivery_date", "driver_id");

-- CreateIndex
CREATE INDEX "drops_address_id_idx" ON "drops"("address_id");

-- CreateIndex
CREATE INDEX "drops_driver_id_idx" ON "drops"("driver_id");

-- CreateIndex
CREATE INDEX "drops_delivered_by_id_idx" ON "drops"("delivered_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "drops_delivery_date_company_id_address_id_delivery_time_key" ON "drops"("delivery_date", "company_id", "address_id", "delivery_time");

-- CreateIndex
CREATE INDEX "order_dispatch_state_drop_id_idx" ON "order_dispatch_state"("drop_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- CreateIndex
CREATE INDEX "invoices_company_id_status_idx" ON "invoices"("company_id", "status");

-- AddForeignKey
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_station_id_fkey" FOREIGN KEY ("station_id") REFERENCES "kitchen_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_groups" ADD CONSTRAINT "option_groups_dish_id_fkey" FOREIGN KEY ("dish_id") REFERENCES "dishes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_group_options" ADD CONSTRAINT "option_group_options_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "option_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_group_options" ADD CONSTRAINT "option_group_options_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_allergens" ADD CONSTRAINT "dish_allergens_dish_id_fkey" FOREIGN KEY ("dish_id") REFERENCES "dishes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_allergens" ADD CONSTRAINT "dish_allergens_allergen_id_fkey" FOREIGN KEY ("allergen_id") REFERENCES "allergens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_dietary_tags" ADD CONSTRAINT "dish_dietary_tags_dish_id_fkey" FOREIGN KEY ("dish_id") REFERENCES "dishes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_dietary_tags" ADD CONSTRAINT "dish_dietary_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "dietary_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_allergens" ADD CONSTRAINT "option_allergens_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_allergens" ADD CONSTRAINT "option_allergens_allergen_id_fkey" FOREIGN KEY ("allergen_id") REFERENCES "allergens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_dietary_tags" ADD CONSTRAINT "option_dietary_tags_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "option_dietary_tags" ADD CONSTRAINT "option_dietary_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "dietary_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_tiers" ADD CONSTRAINT "price_tiers_base_tier_id_fkey" FOREIGN KEY ("base_tier_id") REFERENCES "price_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_entries" ADD CONSTRAINT "price_entries_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "price_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "price_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_default_driver_id_fkey" FOREIGN KEY ("default_driver_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_owner_employee_id_fkey" FOREIGN KEY ("owner_employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_domains" ADD CONSTRAINT "company_domains_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_addresses" ADD CONSTRAINT "company_addresses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_holidays" ADD CONSTRAINT "company_holidays_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_allergens" ADD CONSTRAINT "employee_allergens_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_allergens" ADD CONSTRAINT "employee_allergens_allergen_id_fkey" FOREIGN KEY ("allergen_id") REFERENCES "allergens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_dietary_tags" ADD CONSTRAINT "employee_dietary_tags_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_dietary_tags" ADD CONSTRAINT "employee_dietary_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "dietary_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "menu_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_dish_id_fkey" FOREIGN KEY ("dish_id") REFERENCES "dishes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_hidden_categories" ADD CONSTRAINT "company_hidden_categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_hidden_categories" ADD CONSTRAINT "company_hidden_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "menu_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_hidden_items" ADD CONSTRAINT "company_hidden_items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_hidden_items" ADD CONSTRAINT "company_hidden_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "company_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_price_tier_id_fkey" FOREIGN KEY ("price_tier_id") REFERENCES "price_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_staff_id_fkey" FOREIGN KEY ("created_by_staff_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_dish_id_fkey" FOREIGN KEY ("dish_id") REFERENCES "dishes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_line_combos" ADD CONSTRAINT "order_line_combos_order_line_id_fkey" FOREIGN KEY ("order_line_id") REFERENCES "order_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prep_units" ADD CONSTRAINT "prep_units_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "order_line_combos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prep_units" ADD CONSTRAINT "prep_units_started_by_id_fkey" FOREIGN KEY ("started_by_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prep_units" ADD CONSTRAINT "prep_units_done_by_id_fkey" FOREIGN KEY ("done_by_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_kitchen_state" ADD CONSTRAINT "order_kitchen_state_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drops" ADD CONSTRAINT "drops_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drops" ADD CONSTRAINT "drops_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "company_addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drops" ADD CONSTRAINT "drops_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drops" ADD CONSTRAINT "drops_delivered_by_id_fkey" FOREIGN KEY ("delivered_by_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_dispatch_state" ADD CONSTRAINT "order_dispatch_state_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_dispatch_state" ADD CONSTRAINT "order_dispatch_state_drop_id_fkey" FOREIGN KEY ("drop_id") REFERENCES "drops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Prisma cannot describe conditional uniqueness or CHECK constraints.
CREATE UNIQUE INDEX "price_tiers_one_default_idx" ON "price_tiers" ("is_default") WHERE "is_default" = true;
CREATE UNIQUE INDEX "company_addresses_one_default_per_company_idx" ON "company_addresses" ("company_id") WHERE "is_default" = true;

ALTER TABLE "dishes" ADD CONSTRAINT "dishes_sku_lowercase" CHECK ("sku" = lower("sku"));
ALTER TABLE "company_domains" ADD CONSTRAINT "company_domains_domain_lowercase" CHECK ("domain" = lower("domain"));
ALTER TABLE "employees" ADD CONSTRAINT "employees_email_lowercase" CHECK ("email" = lower("email"));
ALTER TABLE "companies" ADD CONSTRAINT "companies_billing_email_lowercase" CHECK ("billing_email" = lower("billing_email"));

ALTER TABLE "dishes" ADD CONSTRAINT "dishes_cost_cents_nonnegative" CHECK ("cost_cents" >= 0);
ALTER TABLE "options" ADD CONSTRAINT "options_cost_cents_nonnegative" CHECK ("cost_cents" >= 0);
ALTER TABLE "price_entries" ADD CONSTRAINT "price_entries_price_cents_nonnegative" CHECK ("price_cents" >= 0);
ALTER TABLE "price_entries" ADD CONSTRAINT "price_entries_dish_price_positive" CHECK ("subject_type" <> 'DISH' OR "price_cents" > 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_cents_nonnegative" CHECK ("total_cents" >= 0);
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_line_total_cents_nonnegative" CHECK ("line_total_cents" >= 0);
ALTER TABLE "order_line_combos" ADD CONSTRAINT "order_line_combos_dish_price_cents_nonnegative" CHECK ("dish_price_cents" >= 0);
ALTER TABLE "order_line_combos" ADD CONSTRAINT "order_line_combos_unit_price_cents_nonnegative" CHECK ("unit_price_cents" >= 0);
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_total_cents_nonnegative" CHECK ("total_cents" >= 0);

ALTER TABLE "dishes" ADD CONSTRAINT "dishes_min_order_qty_positive" CHECK ("min_order_qty" > 0);
ALTER TABLE "order_lines" ADD CONSTRAINT "order_lines_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "order_line_combos" ADD CONSTRAINT "order_line_combos_quantity_positive" CHECK ("quantity" > 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_version_positive" CHECK ("version" > 0);
ALTER TABLE "companies" ADD CONSTRAINT "companies_delivery_lead_minutes_nonnegative" CHECK ("delivery_lead_minutes" >= 0);
ALTER TABLE "cutoff_runs" ADD CONSTRAINT "cutoff_runs_counts_nonnegative" CHECK ("drafts_cancelled" >= 0 AND "orders_confirmed" >= 0);
ALTER TABLE "companies" ADD CONSTRAINT "companies_working_days_valid" CHECK (cardinality("working_days") > 0 AND "working_days" <@ ARRAY[1, 2, 3, 4, 5, 6, 7]);
