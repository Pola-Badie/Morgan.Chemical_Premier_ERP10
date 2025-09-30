--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (63f4182)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    balance numeric DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    subtype text DEFAULT ''::text,
    description text DEFAULT ''::text,
    parent_id integer,
    is_active boolean DEFAULT true NOT NULL,
    status text DEFAULT 'active'::text NOT NULL
);


ALTER TABLE public.accounts OWNER TO neondb_owner;

--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accounts_id_seq OWNER TO neondb_owner;

--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: authorization_config_assignments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.authorization_config_assignments (
    id integer NOT NULL,
    scope text NOT NULL,
    target_id integer,
    target_role text,
    config_id integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.authorization_config_assignments OWNER TO neondb_owner;

--
-- Name: authorization_config_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.authorization_config_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.authorization_config_assignments_id_seq OWNER TO neondb_owner;

--
-- Name: authorization_config_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.authorization_config_assignments_id_seq OWNED BY public.authorization_config_assignments.id;


--
-- Name: authorization_configs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.authorization_configs (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    rules jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.authorization_configs OWNER TO neondb_owner;

--
-- Name: authorization_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.authorization_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.authorization_configs_id_seq OWNER TO neondb_owner;

--
-- Name: authorization_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.authorization_configs_id_seq OWNED BY public.authorization_configs.id;


--
-- Name: authorization_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.authorization_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    module text,
    feature text,
    field_name text,
    action text NOT NULL,
    granted boolean NOT NULL,
    reason text,
    matched_rule_id integer,
    config_id integer,
    ip_address text,
    user_agent text,
    response_time integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.authorization_logs OWNER TO neondb_owner;

--
-- Name: authorization_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.authorization_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.authorization_logs_id_seq OWNER TO neondb_owner;

--
-- Name: authorization_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.authorization_logs_id_seq OWNED BY public.authorization_logs.id;


--
-- Name: customer_payments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.customer_payments (
    id integer NOT NULL,
    payment_number text NOT NULL,
    customer_id integer NOT NULL,
    invoice_id integer,
    amount numeric NOT NULL,
    payment_method text NOT NULL,
    payment_date date NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.customer_payments OWNER TO neondb_owner;

--
-- Name: customer_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.customer_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_payments_id_seq OWNER TO neondb_owner;

--
-- Name: customer_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.customer_payments_id_seq OWNED BY public.customer_payments.id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    address text,
    city text,
    state text,
    zip_code text,
    company text,
    "position" text,
    sector text,
    tax_number text DEFAULT ''::text,
    total_purchases numeric DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.customers OWNER TO neondb_owner;

--
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO neondb_owner;

--
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.expense_categories (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.expense_categories OWNER TO neondb_owner;

--
-- Name: expense_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.expense_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expense_categories_id_seq OWNER TO neondb_owner;

--
-- Name: expense_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.expense_categories_id_seq OWNED BY public.expense_categories.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    category_id integer,
    description text NOT NULL,
    amount numeric NOT NULL,
    date date NOT NULL,
    payment_method text NOT NULL,
    vendor text,
    receipt_path text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    category character varying(255),
    cost_center text,
    status text DEFAULT 'pending'::text,
    user_id integer
);


ALTER TABLE public.expenses OWNER TO neondb_owner;

--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expenses_id_seq OWNER TO neondb_owner;

--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: feature_permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.feature_permissions (
    id integer NOT NULL,
    scope text NOT NULL,
    target_id integer,
    target_role text,
    module text NOT NULL,
    feature text NOT NULL,
    effect text DEFAULT 'allow'::text NOT NULL,
    priority integer DEFAULT 100 NOT NULL,
    conditions jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.feature_permissions OWNER TO neondb_owner;

--
-- Name: feature_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.feature_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feature_permissions_id_seq OWNER TO neondb_owner;

--
-- Name: feature_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.feature_permissions_id_seq OWNED BY public.feature_permissions.id;


--
-- Name: field_permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.field_permissions (
    id integer NOT NULL,
    scope text NOT NULL,
    target_id integer,
    target_role text,
    module text NOT NULL,
    entity_type text NOT NULL,
    field_name text NOT NULL,
    can_view boolean DEFAULT true NOT NULL,
    can_edit boolean DEFAULT false NOT NULL,
    is_required boolean DEFAULT false NOT NULL,
    effect text DEFAULT 'allow'::text NOT NULL,
    priority integer DEFAULT 100 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.field_permissions OWNER TO neondb_owner;

--
-- Name: field_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.field_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.field_permissions_id_seq OWNER TO neondb_owner;

--
-- Name: field_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.field_permissions_id_seq OWNED BY public.field_permissions.id;


--
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.inventory_transactions (
    id integer NOT NULL,
    product_id integer NOT NULL,
    transaction_type text NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric,
    reference_type text,
    reference_id integer,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.inventory_transactions OWNER TO neondb_owner;

--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.inventory_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.inventory_transactions_id_seq OWNER TO neondb_owner;

--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.inventory_transactions_id_seq OWNED BY public.inventory_transactions.id;


--
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.journal_entries (
    id integer NOT NULL,
    entry_number text NOT NULL,
    date date NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    reference text DEFAULT ''::text,
    memo text DEFAULT ''::text,
    status text DEFAULT 'posted'::text NOT NULL,
    type text,
    created_by integer,
    total_debit numeric DEFAULT 0 NOT NULL,
    total_credit numeric DEFAULT 0 NOT NULL,
    source_type text,
    source_id integer,
    user_id integer,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.journal_entries OWNER TO neondb_owner;

--
-- Name: journal_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.journal_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.journal_entries_id_seq OWNER TO neondb_owner;

--
-- Name: journal_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.journal_entries_id_seq OWNED BY public.journal_entries.id;


--
-- Name: journal_entry_lines; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.journal_entry_lines (
    id integer NOT NULL,
    journal_entry_id integer NOT NULL,
    account_id integer NOT NULL,
    debit numeric DEFAULT 0,
    credit numeric DEFAULT 0,
    description text
);


ALTER TABLE public.journal_entry_lines OWNER TO neondb_owner;

--
-- Name: journal_entry_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.journal_entry_lines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.journal_entry_lines_id_seq OWNER TO neondb_owner;

--
-- Name: journal_entry_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.journal_entry_lines_id_seq OWNED BY public.journal_entry_lines.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    read boolean DEFAULT false,
    action_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    order_number character varying(255) NOT NULL,
    order_type character varying(50) NOT NULL,
    customer_id integer,
    user_id integer DEFAULT 1 NOT NULL,
    description text,
    total_material_cost numeric(12,2) DEFAULT 0,
    total_additional_fees numeric(12,2) DEFAULT 0,
    total_cost numeric(12,2) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    expected_output_quantity character varying(255),
    refining_steps text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    target_product_id integer,
    profit_margin_percentage numeric DEFAULT 20 NOT NULL,
    raw_materials jsonb,
    packaging_materials jsonb
);


ALTER TABLE public.orders OWNER TO neondb_owner;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO neondb_owner;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.product_categories (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.product_categories OWNER TO neondb_owner;

--
-- Name: product_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.product_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_categories_id_seq OWNER TO neondb_owner;

--
-- Name: product_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.product_categories_id_seq OWNED BY public.product_categories.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name text NOT NULL,
    drug_name text NOT NULL,
    category_id integer,
    description text,
    sku text NOT NULL,
    barcode text,
    cost_price numeric NOT NULL,
    selling_price numeric NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    unit_of_measure text DEFAULT 'PCS'::text NOT NULL,
    low_stock_threshold integer DEFAULT 10,
    expiry_date date,
    status text DEFAULT 'active'::text NOT NULL,
    product_type text DEFAULT 'finished'::text NOT NULL,
    manufacturer text,
    location text,
    shelf text,
    image_path text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    warehouse_id integer,
    grade text DEFAULT 'P'::text NOT NULL,
    CONSTRAINT check_quantity_non_negative CHECK ((quantity >= 0))
);


ALTER TABLE public.products OWNER TO neondb_owner;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO neondb_owner;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: purchase_order_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.purchase_order_items (
    id integer NOT NULL,
    purchase_order_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric NOT NULL,
    total numeric NOT NULL,
    received_quantity integer DEFAULT 0
);


ALTER TABLE public.purchase_order_items OWNER TO neondb_owner;

--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.purchase_order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_order_items_id_seq OWNER TO neondb_owner;

--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.purchase_order_items_id_seq OWNED BY public.purchase_order_items.id;


--
-- Name: purchase_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.purchase_orders (
    id integer NOT NULL,
    po_number text NOT NULL,
    supplier_id integer NOT NULL,
    user_id integer NOT NULL,
    order_date timestamp without time zone DEFAULT now() NOT NULL,
    expected_delivery_date date,
    status text DEFAULT 'pending'::text NOT NULL,
    total_amount numeric NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    transportation_type text DEFAULT 'standard'::text,
    transportation_cost numeric DEFAULT 0,
    transportation_notes text
);


ALTER TABLE public.purchase_orders OWNER TO neondb_owner;

--
-- Name: purchase_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.purchase_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_orders_id_seq OWNER TO neondb_owner;

--
-- Name: purchase_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.purchase_orders_id_seq OWNED BY public.purchase_orders.id;


--
-- Name: quotation_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.quotation_items (
    id integer NOT NULL,
    quotation_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric NOT NULL,
    discount numeric DEFAULT 0,
    total numeric NOT NULL
);


ALTER TABLE public.quotation_items OWNER TO neondb_owner;

--
-- Name: quotation_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.quotation_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quotation_items_id_seq OWNER TO neondb_owner;

--
-- Name: quotation_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.quotation_items_id_seq OWNED BY public.quotation_items.id;


--
-- Name: quotation_packaging_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.quotation_packaging_items (
    id integer NOT NULL,
    quotation_id integer,
    type text NOT NULL,
    description text,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.quotation_packaging_items OWNER TO neondb_owner;

--
-- Name: quotation_packaging_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.quotation_packaging_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quotation_packaging_items_id_seq OWNER TO neondb_owner;

--
-- Name: quotation_packaging_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.quotation_packaging_items_id_seq OWNED BY public.quotation_packaging_items.id;


--
-- Name: quotations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.quotations (
    id integer NOT NULL,
    quotation_number text NOT NULL,
    customer_id integer,
    user_id integer NOT NULL,
    date timestamp without time zone DEFAULT now() NOT NULL,
    valid_until date,
    total_amount numeric NOT NULL,
    discount numeric DEFAULT 0,
    tax numeric DEFAULT 0,
    grand_total numeric NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    issue_date timestamp without time zone DEFAULT now(),
    subtotal numeric DEFAULT 0,
    tax_rate numeric DEFAULT 0,
    tax_amount numeric DEFAULT 0,
    terms_and_conditions text
);


ALTER TABLE public.quotations OWNER TO neondb_owner;

--
-- Name: quotations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.quotations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quotations_id_seq OWNER TO neondb_owner;

--
-- Name: quotations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.quotations_id_seq OWNED BY public.quotations.id;


--
-- Name: refunds; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.refunds (
    id integer NOT NULL,
    invoice_id integer NOT NULL,
    invoice_number text NOT NULL,
    customer_id integer NOT NULL,
    customer_name text NOT NULL,
    original_amount numeric NOT NULL,
    refund_amount numeric NOT NULL,
    reason text NOT NULL,
    date date NOT NULL,
    status text DEFAULT 'processed'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.refunds OWNER TO neondb_owner;

--
-- Name: refunds_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.refunds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.refunds_id_seq OWNER TO neondb_owner;

--
-- Name: refunds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.refunds_id_seq OWNED BY public.refunds.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role character varying(50) NOT NULL,
    resource character varying(100) NOT NULL,
    action character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.role_permissions OWNER TO neondb_owner;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_permissions_id_seq OWNER TO neondb_owner;

--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: sale_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_items (
    id integer NOT NULL,
    sale_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric NOT NULL,
    discount numeric DEFAULT 0,
    total numeric NOT NULL,
    unit_of_measure text DEFAULT 'PCS'::text NOT NULL
);


ALTER TABLE public.sale_items OWNER TO neondb_owner;

--
-- Name: sale_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_items_id_seq OWNER TO neondb_owner;

--
-- Name: sale_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_items_id_seq OWNED BY public.sale_items.id;


--
-- Name: sales; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sales (
    id integer NOT NULL,
    invoice_number text NOT NULL,
    customer_id integer,
    user_id integer NOT NULL,
    date timestamp without time zone DEFAULT now() NOT NULL,
    total_amount numeric NOT NULL,
    discount numeric DEFAULT 0,
    tax numeric DEFAULT 0,
    grand_total numeric NOT NULL,
    payment_method text NOT NULL,
    payment_status text DEFAULT 'completed'::text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    eta_status text DEFAULT 'not_sent'::text,
    eta_reference text,
    eta_uuid text,
    eta_submission_date timestamp without time zone,
    eta_response jsonb,
    eta_error_message text,
    subtotal numeric DEFAULT '0'::numeric,
    discount_amount numeric DEFAULT '0'::numeric,
    tax_rate numeric DEFAULT '14'::numeric,
    tax_amount numeric DEFAULT '0'::numeric,
    vat_rate numeric DEFAULT '14'::numeric,
    vat_amount numeric DEFAULT '0'::numeric,
    amount_paid numeric DEFAULT '0'::numeric,
    payment_terms text DEFAULT '0'::text
);


ALTER TABLE public.sales OWNER TO neondb_owner;

--
-- Name: sales_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sales_id_seq OWNER TO neondb_owner;

--
-- Name: sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sales_id_seq OWNED BY public.sales.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    name text NOT NULL,
    contact_person text,
    email text,
    phone text,
    address text,
    city text,
    state text,
    zip_code text,
    materials text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    supplier_type text,
    eta_number text
);


ALTER TABLE public.suppliers OWNER TO neondb_owner;

--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suppliers_id_seq OWNER TO neondb_owner;

--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: system_preferences; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.system_preferences (
    id integer NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    category text,
    label text,
    description text,
    data_type text,
    options jsonb
);


ALTER TABLE public.system_preferences OWNER TO neondb_owner;

--
-- Name: system_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.system_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_preferences_id_seq OWNER TO neondb_owner;

--
-- Name: system_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.system_preferences_id_seq OWNED BY public.system_preferences.id;


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_permissions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    module_name text NOT NULL,
    access_granted boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_permissions OWNER TO neondb_owner;

--
-- Name: user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_permissions_id_seq OWNER TO neondb_owner;

--
-- Name: user_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_permissions_id_seq OWNED BY public.user_permissions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    name text,
    email text,
    role text DEFAULT 'staff'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    avatar text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: warehouse_inventory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.warehouse_inventory (
    id integer NOT NULL,
    product_id integer NOT NULL,
    warehouse_id integer NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    reserved_quantity integer DEFAULT 0 NOT NULL,
    last_updated timestamp without time zone DEFAULT now() NOT NULL,
    updated_by integer NOT NULL
);


ALTER TABLE public.warehouse_inventory OWNER TO neondb_owner;

--
-- Name: warehouse_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.warehouse_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warehouse_inventory_id_seq OWNER TO neondb_owner;

--
-- Name: warehouse_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.warehouse_inventory_id_seq OWNED BY public.warehouse_inventory.id;


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.warehouses (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    address text,
    manager_id integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.warehouses OWNER TO neondb_owner;

--
-- Name: warehouses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.warehouses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warehouses_id_seq OWNER TO neondb_owner;

--
-- Name: warehouses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.warehouses_id_seq OWNED BY public.warehouses.id;


--
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: authorization_config_assignments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.authorization_config_assignments ALTER COLUMN id SET DEFAULT nextval('public.authorization_config_assignments_id_seq'::regclass);


--
-- Name: authorization_configs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.authorization_configs ALTER COLUMN id SET DEFAULT nextval('public.authorization_configs_id_seq'::regclass);


--
-- Name: authorization_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.authorization_logs ALTER COLUMN id SET DEFAULT nextval('public.authorization_logs_id_seq'::regclass);


--
-- Name: customer_payments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_payments ALTER COLUMN id SET DEFAULT nextval('public.customer_payments_id_seq'::regclass);


--
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- Name: expense_categories id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.expense_categories ALTER COLUMN id SET DEFAULT nextval('public.expense_categories_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: feature_permissions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feature_permissions ALTER COLUMN id SET DEFAULT nextval('public.feature_permissions_id_seq'::regclass);


--
-- Name: field_permissions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.field_permissions ALTER COLUMN id SET DEFAULT nextval('public.field_permissions_id_seq'::regclass);


--
-- Name: inventory_transactions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_transactions ALTER COLUMN id SET DEFAULT nextval('public.inventory_transactions_id_seq'::regclass);


--
-- Name: journal_entries id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.journal_entries ALTER COLUMN id SET DEFAULT nextval('public.journal_entries_id_seq'::regclass);


--
-- Name: journal_entry_lines id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.journal_entry_lines ALTER COLUMN id SET DEFAULT nextval('public.journal_entry_lines_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: product_categories id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_categories ALTER COLUMN id SET DEFAULT nextval('public.product_categories_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: purchase_order_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_order_items ALTER COLUMN id SET DEFAULT nextval('public.purchase_order_items_id_seq'::regclass);


--
-- Name: purchase_orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_orders ALTER COLUMN id SET DEFAULT nextval('public.purchase_orders_id_seq'::regclass);


--
-- Name: quotation_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quotation_items ALTER COLUMN id SET DEFAULT nextval('public.quotation_items_id_seq'::regclass);


--
-- Name: quotation_packaging_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quotation_packaging_items ALTER COLUMN id SET DEFAULT nextval('public.quotation_packaging_items_id_seq'::regclass);


--
-- Name: quotations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quotations ALTER COLUMN id SET DEFAULT nextval('public.quotations_id_seq'::regclass);


--
-- Name: refunds id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.refunds ALTER COLUMN id SET DEFAULT nextval('public.refunds_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: sale_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_items ALTER COLUMN id SET DEFAULT nextval('public.sale_items_id_seq'::regclass);


--
-- Name: sales id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales ALTER COLUMN id SET DEFAULT nextval('public.sales_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Name: system_preferences id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_preferences ALTER COLUMN id SET DEFAULT nextval('public.system_preferences_id_seq'::regclass);


--
-- Name: user_permissions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_permissions ALTER COLUMN id SET DEFAULT nextval('public.user_permissions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: warehouse_inventory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.warehouse_inventory ALTER COLUMN id SET DEFAULT nextval('public.warehouse_inventory_id_seq'::regclass);


--
-- Name: warehouses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.warehouses ALTER COLUMN id SET DEFAULT nextval('public.warehouses_id_seq'::regclass);


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.accounts (id, code, name, type, balance, created_at, updated_at, subtype, description, parent_id, is_active, status) FROM stdin;
1	1000	Cash	asset	50000	2025-07-09 23:54:20.658325	2025-07-09 23:54:20.658325			\N	t	active
2	1100	Bank Account	asset	100000	2025-07-09 23:54:20.658325	2025-07-09 23:54:20.658325			\N	t	active
3	2000	Accounts Payable	liability	0	2025-07-09 23:54:20.658325	2025-07-09 23:54:20.658325			\N	t	active
4	3000	Owner Equity	equity	150000	2025-07-09 23:54:20.658325	2025-07-09 23:54:20.658325			\N	t	active
5	4000	Sales Revenue	revenue	0	2025-07-09 23:54:20.658325	2025-07-09 23:54:20.658325			\N	t	active
6	5000	Cost of Goods Sold	expense	0	2025-07-09 23:54:20.658325	2025-07-09 23:54:20.658325			\N	t	active
12	1200	Accounts Receivable	asset	0	2025-07-10 10:21:07.546646	2025-07-10 10:21:07.546646			\N	t	active
18	2300	VAT Payable	liability	0	2025-07-10 10:21:07.546646	2025-07-10 10:21:07.546646			\N	t	active
21	4100	Sales Revenue	revenue	0	2025-07-10 10:21:07.546646	2025-07-10 10:21:07.546646			\N	t	active
8	6100	Office Expenses	expense	0	2025-07-13 21:35:45.948919	2025-07-13 21:35:45.948919	operating	General office and administrative expenses	\N	t	active
\.


--
-- Data for Name: authorization_config_assignments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.authorization_config_assignments (id, scope, target_id, target_role, config_id, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: authorization_configs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.authorization_configs (id, name, description, type, rules, is_active, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: authorization_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.authorization_logs (id, user_id, module, feature, field_name, action, granted, reason, matched_rule_id, config_id, ip_address, user_agent, response_time, created_at) FROM stdin;
\.


--
-- Data for Name: customer_payments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.customer_payments (id, payment_number, customer_id, invoice_id, amount, payment_method, payment_date, notes, created_at) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.customers (id, name, email, phone, address, city, state, zip_code, company, "position", sector, tax_number, total_purchases, created_at, updated_at) FROM stdin;
4	Dr. Ahmed Hassan	ahmed.hassan@biotech-innovations.com	+20 2 5555 6666	45 Technology Street	New Cairo	Cairo	11835	\N	\N	\N		0	2025-07-14 08:59:59.953323	2025-07-14 08:59:59.953323
5	Sara Mohamed	sara.mohamed@pharma-excellence.com	+20 3 7777 8888	123 Industrial Zone	Alexandria	Alexandria	21500	\N	\N	\N		0	2025-07-14 09:00:01.926052	2025-07-14 09:00:01.926052
6	Dr. Mahmoud Ali	mahmoud.ali@clinical-research.org	+20 2 9999 1111	78 Research Park	6th October City	Giza	12566	\N	\N	\N		0	2025-07-14 09:00:03.944455	2025-07-14 09:00:03.944455
7	Fatma Khalil	fatma.khalil@med-devices.com	+20 2 3333 2222	56 Innovation Hub	Smart Village	Giza	12577	\N	\N	\N		0	2025-07-14 09:00:06.085543	2025-07-14 09:00:06.085543
8	Hassan Abdel Rahman	hassan.rahman@lab-services.net	+20 2 4444 5555	12 Laboratory Complex	Maadi	Cairo	11431	\N	\N	\N		0	2025-07-14 09:00:08.211158	2025-07-14 09:00:08.211158
9	Dr. Nadia Farouk	nadia.farouk@pharma-solutions.eg	+20 2 6666 7777	34 Science Park	New Administrative Capital	Cairo	12345	\N	\N	\N		0	2025-07-14 09:01:27.03398	2025-07-14 09:01:27.03398
10	Dr. Omar Mansour	omar.mansour@biotech-research.com	+20 2 8888 9999	67 Innovation District	New Administrative Capital	Cairo	12589	BioTech Research Institute	Research Director	Biotechnology	ETA-111222333	0	2025-07-14 09:01:51.672569	2025-07-14 09:01:51.672569
11	Dr. Layla Ibrahim	layla.ibrahim@medical-devices.co	+20 3 5555 6666	89 Technology Hub	Alexandria	Alexandria	21600	Advanced Medical Devices Co.	Clinical Engineering Manager	Medical Devices	ETA-444555666	0	2025-07-14 09:02:01.333691	2025-07-14 09:02:01.333691
12	Ahmed Khairy	ahmed.khairy@lab-excellence.net	+20 2 7777 8888	23 Research Complex	Heliopolis	Cairo	11757	Laboratory Excellence Network	Laboratory Operations Director	Laboratory Services	ETA-777888999	0	2025-07-14 09:02:02.335859	2025-07-14 09:02:02.335859
13	Dr. Mariam Saeed	mariam.saeed@clinical-trials.org	+20 2 3333 4444	45 Clinical Research Center	Nasr City	Cairo	11371	Clinical Trials Organization	Principal Investigator	Clinical Research	ETA-999000111	0	2025-07-14 09:02:05.054697	2025-07-14 09:02:05.054697
14	Youssef Abdel Aziz	youssef.aziz@hospital-networks.com	+20 2 1111 2222	12 Healthcare District	New Cairo	Cairo	11835	National Hospital Networks	Network Administrator	Hospital Networks	ETA-222333444	0	2025-07-14 09:02:06.742004	2025-07-14 09:02:06.742004
1	Cairo Medical Center	contact@cairomedical.com	+20 2 2222 3333	\N	\N	\N	\N	Cairo Medical Center	\N	Healthcare		206079.61	2025-07-09 23:54:20.726285	2025-07-09 23:54:20.726285
2	Alexandria Pharmacy	info@alexpharmacy.com	+20 3 4444 5555	\N	\N	\N	\N	Alexandria Pharmacy	\N	Retail		205847.50	2025-07-09 23:54:20.726285	2025-07-09 23:54:20.726285
3	Giza Hospital	admin@gizahospital.com	+20 2 3333 4444	\N	\N	\N	\N	Giza Hospital	\N	Healthcare		368037.15	2025-07-09 23:54:20.726285	2025-07-09 23:54:20.726285
\.


--
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.expense_categories (id, name, description, created_at) FROM stdin;
1	Office & Rent	Office rent and related expenses	2025-07-11 11:35:01.325469
2	Inventory	Chemical inventory and supplies	2025-07-11 11:35:01.325469
3	Utilities	Electricity, water, internet	2025-07-11 11:35:01.325469
4	Marketing	Advertising and promotional expenses	2025-07-11 11:35:01.325469
5	Equipment	Laboratory and office equipment	2025-07-11 11:35:01.325469
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.expenses (id, category_id, description, amount, date, payment_method, vendor, receipt_path, notes, created_at, updated_at, category, cost_center, status, user_id) FROM stdin;
6	1	Office rent - January	2500.00	2025-01-01	bank_transfer	Property Management Co	\N	Monthly office rent	2025-01-01 09:00:00	2025-07-11 11:35:01.325469	Office Supplies	\N	pending	\N
7	2	Chemical inventory purchase	8500.00	2025-01-10	bank_transfer	ChemSupply Ltd	\N	Bulk chemical order	2025-01-10 11:30:00	2025-07-11 11:35:01.325469	Office Supplies	\N	pending	\N
8	3	Utility bills - January	850.00	2025-01-15	bank_transfer	City Utilities	\N	Electricity and water	2025-01-15 14:00:00	2025-07-11 11:35:01.325469	Office Supplies	\N	pending	\N
9	1	Office rent - February	2500.00	2025-02-01	bank_transfer	Property Management Co	\N	Monthly office rent	2025-02-01 09:00:00	2025-07-11 11:35:01.325469	Office Supplies	\N	pending	\N
10	4	Marketing expenses	1200.00	2025-02-10	credit_card	Digital Marketing Co	\N	Online advertising	2025-02-10 10:15:00	2025-07-11 11:35:01.325469	Office Supplies	\N	pending	\N
11	\N	Purchase of laboratory chemicals and testing equipment	3500	2025-07-13	Bank Transfer	Scientific Equipment Co.	RCP-2025-001	\N	2025-07-13 21:54:55.004328	2025-07-13 21:54:55.004328	Office Supplies	\N	pending	\N
12	\N	Monthly electricity bill for factory operations	1200	2025-07-13	Cash	Cairo Electricity Company	ELEC-2025-07-001	\N	2025-07-13 21:54:55.078186	2025-07-13 21:54:55.078186	Utilities	\N	pending	\N
13	\N	Fuel costs for delivery trucks and company vehicles	2800	2025-07-13	Credit Card	Misr Petroleum	FUEL-2025-07-001	\N	2025-07-13 21:54:55.143513	2025-07-13 21:54:55.143513	Transportation	\N	pending	\N
14	\N	Chemical raw materials for pharmaceutical production	4500	2025-07-13	Bank Transfer	ChemCorp Industries	RAW-2025-07-001	\N	2025-07-13 21:54:55.212438	2025-07-13 21:54:55.212438	Raw Materials	\N	pending	\N
15	\N	Equipment maintenance and repair services	950	2025-07-13	Cash	Tech Maintenance Services	MAINT-2025-07-001	\N	2025-07-13 21:54:55.278296	2025-07-13 21:54:55.278296	Maintenance	\N	pending	\N
16	\N	Premier	950	2025-07-13	Credit Card	\N	\N		2025-07-13 22:12:09.169338	2025-07-13 22:12:09.169338	Marketing & Advertising	Human Resources	pending	1
17	\N	Premier	59.88	2025-07-13	Bank Transfer	\N	\N		2025-07-13 22:16:53.682221	2025-07-13 22:16:53.682221	Transportation	Legal & Compliance	pending	1
18	\N	Premier	950	2025-07-13	Cash	\N	\N		2025-07-13 22:20:35.748547	2025-07-13 22:20:35.748547	Transportation	Legal & Compliance	pending	1
19	\N	Premier 2	1500	2025-07-13	Bank Transfer	\N	\N		2025-07-13 22:25:50.777548	2025-07-13 22:25:50.777548	Marketing & Advertising	Environmental	pending	1
\.


--
-- Data for Name: feature_permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.feature_permissions (id, scope, target_id, target_role, module, feature, effect, priority, conditions, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: field_permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.field_permissions (id, scope, target_id, target_role, module, entity_type, field_name, can_view, can_edit, is_required, effect, priority, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.inventory_transactions (id, product_id, transaction_type, quantity, unit_price, reference_type, reference_id, notes, created_at) FROM stdin;
2	2	adjustment	20	\N	system_correction	2	EMERGENCY CORRECTION: Fixed negative inventory (-20 to 0) - System integrity issue resolved	2025-07-11 15:51:10.536037
6	2	purchase	500	8.00	purchase_order	1002	Bulk order from Beta Pharmaceuticals	2025-08-14 11:45:00
7	2	sale	-100	18.00	invoice	2002	Prescription order for pharmacy chain	2025-08-15 16:30:00
8	2	adjustment	-15	\N	damage_report	3002	Damaged capsules removed from inventory	2025-08-16 08:30:00
9	3	purchase	1000	3.25	purchase_order	1003	Regular stock replenishment	2025-08-13 09:20:00
10	3	sale	-200	7.50	invoice	2003	Hospital bulk order	2025-08-14 13:45:00
11	3	sale	-150	7.50	invoice	2004	Retail pharmacy order	2025-08-15 10:15:00
12	4	purchase	300	6.75	purchase_order	1004	Anti-inflammatory stock update	2025-08-12 14:30:00
13	4	adjustment	20	\N	inventory_recount	3003	Stock adjustment after recount	2025-08-15 17:00:00
14	5	purchase	400	15.25	purchase_order	1005	PPI medication restocking	2025-08-16 07:45:00
\.


--
-- Data for Name: journal_entries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.journal_entries (id, entry_number, date, description, created_at, reference, memo, status, type, created_by, total_debit, total_credit, source_type, source_id, user_id, updated_at) FROM stdin;
4	JE-000001	2025-07-10	\N	2025-07-10 00:46:08.774181	INV-000009		posted	\N	\N	136.80	136.80	invoice	11	\N	2025-07-10 00:46:08.774181
5	JE-000002	2025-07-10	\N	2025-07-10 10:20:12.861562	INV-000010		posted	\N	\N	136.80	136.80	invoice	12	\N	2025-07-10 10:20:12.861562
6	JE-000003	2025-07-10	\N	2025-07-10 10:20:50.479607	INV-000011		posted	\N	\N	136.80	136.80	invoice	13	\N	2025-07-10 10:20:50.479607
7	JE-000004	2025-07-10	\N	2025-07-10 10:21:15.678971	INV-000012		posted	\N	\N	136.80	136.80	invoice	14	\N	2025-07-10 10:21:15.678971
8	JE-000005	2025-07-10	\N	2025-07-10 15:27:39.736825	INV-000013		posted	\N	\N	NaN	NaN	invoice	15	\N	2025-07-10 15:27:39.736825
9	JE-000006	2025-07-11	\N	2025-07-11 16:38:52.832349	INV-000008		posted	\N	\N	105020.00	105020.00	invoice	13	\N	2025-07-11 16:38:52.832349
10	JE-000007	2025-07-11	\N	2025-07-11 16:50:01.228718	INV-000009		posted	\N	\N	12646.80	12646.80	invoice	14	\N	2025-07-11 16:50:01.228718
11	JE-000008	2025-07-11	\N	2025-07-11 16:58:14.220818	INV-000010		posted	\N	\N	6674.70	6674.70	invoice	15	\N	2025-07-11 16:58:14.220818
12	JE-000009	2025-07-11	\N	2025-07-11 17:12:07.562644	INV-000028		posted	\N	\N	1053.90	1053.90	invoice	33	\N	2025-07-11 17:12:07.562644
13	JE-000010	2025-07-11	\N	2025-07-11 17:14:07.706858	INV-000030		posted	\N	\N	34.20	34.20	invoice	35	\N	2025-07-11 17:14:07.706858
14	JE-000011	2025-07-11	\N	2025-07-11 17:14:47.044346	INV-000031		posted	\N	\N	11.40	11.40	invoice	36	\N	2025-07-11 17:14:47.044346
15	JE-000012	2025-07-11	\N	2025-07-11 17:18:30.78993	INV-000036		posted	\N	\N	45.60	45.60	invoice	41	\N	2025-07-11 17:18:30.78993
16	JE-000013	2025-07-11	\N	2025-07-11 17:19:13.095487	INV-000037		posted	\N	\N	136.80	136.80	invoice	42	\N	2025-07-11 17:19:13.095487
17	JE-000014	2025-07-11	\N	2025-07-11 17:19:58.532857	INV-000038		posted	\N	\N	57.00	57.00	invoice	43	\N	2025-07-11 17:19:58.532857
18	JE-000015	2025-07-11	\N	2025-07-11 17:21:02.858786	INV-000039		posted	\N	\N	45600.00	45600.00	invoice	44	\N	2025-07-11 17:21:02.858786
19	JE-202501-0001	2025-01-01	\N	2025-07-13 21:35:48.178192	Expense Entry		posted	\N	\N	2500.00	2500.00	expense	6	\N	2025-07-13 21:35:48.178192
20	JE-202501-0002	2025-01-10	\N	2025-07-13 21:35:48.387743	Expense Entry		posted	\N	\N	8500.00	8500.00	expense	7	\N	2025-07-13 21:35:48.387743
21	JE-202501-0003	2025-01-15	\N	2025-07-13 21:35:48.583454	Expense Entry		posted	\N	\N	850.00	850.00	expense	8	\N	2025-07-13 21:35:48.583454
22	JE-202502-0004	2025-02-01	\N	2025-07-13 21:35:48.777485	Expense Entry		posted	\N	\N	2500.00	2500.00	expense	9	\N	2025-07-13 21:35:48.777485
23	JE-202502-0005	2025-02-10	\N	2025-07-13 21:35:48.972047	Expense Entry		posted	\N	\N	1200.00	1200.00	expense	10	\N	2025-07-13 21:35:48.972047
24	JE-000021	2025-07-13	\N	2025-07-13 21:56:14.355175	Expense Entry	Purchase of laboratory chemicals and testing equipment	posted	\N	\N	3500	3500	expense	11	\N	2025-07-13 21:56:14.355175
25	JE-000022	2025-07-13	\N	2025-07-13 21:56:36.123285	Expense Entry	Monthly electricity bill for factory operations	posted	\N	\N	1200	1200	expense	12	\N	2025-07-13 21:56:36.123285
26	JE-000023	2025-07-13	\N	2025-07-13 21:56:36.259951	Expense Entry	Fuel costs for delivery trucks and company vehicles	posted	\N	\N	2800	2800	expense	13	\N	2025-07-13 21:56:36.259951
27	JE-000024	2025-07-13	\N	2025-07-13 21:56:36.389704	Expense Entry	Chemical raw materials for pharmaceutical production	posted	\N	\N	4500	4500	expense	14	\N	2025-07-13 21:56:36.389704
28	JE-000025	2025-07-13	\N	2025-07-13 21:56:36.519177	Expense Entry	Equipment maintenance and repair services	posted	\N	\N	950	950	expense	15	\N	2025-07-13 21:56:36.519177
29	JE-202507-0001	2025-07-13	\N	2025-07-13 22:12:09.445266	General Vendor	Premier	posted	\N	\N	950	950	expense	16	1	2025-07-13 22:12:09.445266
31	JE-202507-5855	2025-07-13	\N	2025-07-13 22:20:36.402103	General Vendor	Premier	posted	\N	\N	950	950	expense	18	1	2025-07-13 22:20:36.402103
32	JE-000028	2025-07-14	\N	2025-07-14 09:13:20.116922	INV-000042		posted	\N	\N	136.80	136.80	invoice	47	\N	2025-07-14 09:13:20.116922
33	JE-000029	2025-07-14	\N	2025-07-14 09:28:49.108266	INV-000045		posted	\N	\N	6156.00	6156.00	invoice	50	\N	2025-07-14 09:28:49.108266
34	JE-000030	2025-07-14	\N	2025-07-14 09:29:53.303407	INV-000047		posted	\N	\N	68.40	68.40	invoice	52	\N	2025-07-14 09:29:53.303407
35	JE-000031	2025-07-14	\N	2025-07-14 09:31:51.610033	INV-000048		posted	\N	\N	6156.00	6156.00	invoice	53	\N	2025-07-14 09:31:51.610033
36	JE-000032	2025-07-14	\N	2025-07-14 09:31:53.536963	INV-000049		posted	\N	\N	6156.00	6156.00	invoice	54	\N	2025-07-14 09:31:53.536963
37	JE-000033	2025-07-14	\N	2025-07-14 09:33:44.518249	INV-000050		posted	\N	\N	68.40	68.40	invoice	55	\N	2025-07-14 09:33:44.518249
38	JE-000034	2025-07-14	\N	2025-07-14 09:34:11.54628	INV-000051		posted	\N	\N	57.00	57.00	invoice	56	\N	2025-07-14 09:34:11.54628
39	JE-000035	2025-07-14	\N	2025-07-14 09:36:42.968753	INV-000052		posted	\N	\N	6156.00	6156.00	invoice	57	\N	2025-07-14 09:36:42.968753
40	JE-000036	2025-07-14	\N	2025-07-14 09:36:44.783697	INV-000053		posted	\N	\N	6156.00	6156.00	invoice	58	\N	2025-07-14 09:36:44.783697
41	JE-000037	2025-07-14	\N	2025-07-14 09:44:02.758233	INV-000054		posted	\N	\N	6156.00	6156.00	invoice	59	\N	2025-07-14 09:44:02.758233
42	JE-000038	2025-07-14	\N	2025-07-14 09:44:04.708263	INV-000055		posted	\N	\N	6156.00	6156.00	invoice	60	\N	2025-07-14 09:44:04.708263
43	JE-000039	2025-07-14	\N	2025-07-14 21:37:18.903854	INV-000056		posted	\N	\N	10259.30	10259.30	invoice	61	\N	2025-07-14 21:37:18.903854
44	JE-000040	2025-08-23	\N	2025-08-23 16:31:34.493435	INV-000058		posted	\N	\N	2549.25	2549.25	invoice	63	\N	2025-08-23 16:31:34.493435
45	JE-000041	2025-08-24	\N	2025-08-24 06:28:07.093418	INV-000059		posted	\N	\N	2046.96	2046.96	invoice	64	\N	2025-08-24 06:28:07.093418
46	JE-000042	2025-08-24	\N	2025-08-24 06:54:42.141519	INV-000060		posted	\N	\N	5098.50	5098.50	invoice	65	\N	2025-08-24 06:54:42.141519
47	JE-000043	2025-08-31	\N	2025-08-31 06:20:35.346746	INV-000064		posted	\N	\N	7.30	7.30	invoice	69	\N	2025-08-31 06:20:35.346746
48	JE-000044	2025-09-16	\N	2025-09-16 09:18:55.474556	INV-000065		posted	\N	\N	973.56	973.56	invoice	70	\N	2025-09-16 09:18:55.474556
49	JE-000045	2025-09-16	\N	2025-09-16 22:57:48.153061	INV-000066		posted	\N	\N	49.02	49.02	invoice	71	\N	2025-09-16 22:57:48.153061
\.


--
-- Data for Name: journal_entry_lines; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.journal_entry_lines (id, journal_entry_id, account_id, debit, credit, description) FROM stdin;
3	7	12	136.80	0	Invoice INV-000012
4	7	21	0	120.00	Sales - Invoice INV-000012
5	7	18	0	16.80	VAT - Invoice INV-000012
6	8	2	NaN	0	Invoice INV-000013
7	8	5	0	NaN	Sales - Invoice INV-000013
8	9	2	105020.00	0	Invoice INV-000008
9	9	5	0	105020.00	Sales - Invoice INV-000008
10	10	2	12646.80	0	Invoice INV-000009
11	10	5	0	12646.80	Sales - Invoice INV-000009
12	11	2	6674.70	0	Invoice INV-000010
13	11	5	0	6674.70	Sales - Invoice INV-000010
14	12	2	1053.90	0	Invoice INV-000028
15	12	5	0	1053.90	Sales - Invoice INV-000028
16	13	2	34.20	0	Invoice INV-000030
17	13	5	0	34.20	Sales - Invoice INV-000030
18	14	2	11.40	0	Invoice INV-000031
19	14	5	0	11.40	Sales - Invoice INV-000031
20	15	2	45.60	0	Invoice INV-000036
21	15	5	0	45.60	Sales - Invoice INV-000036
22	16	2	136.80	0	Invoice INV-000037
23	16	5	0	136.80	Sales - Invoice INV-000037
24	17	2	57.00	0	Invoice INV-000038
25	17	5	0	57.00	Sales - Invoice INV-000038
26	18	2	45600.00	0	Invoice INV-000039
27	18	5	0	45600.00	Sales - Invoice INV-000039
28	19	8	2500.00	0	Office & Rent - Office rent - January
29	19	2	0	2500.00	Payment for Office rent - January
30	20	8	8500.00	0	Inventory - Chemical inventory purchase
31	20	2	0	8500.00	Payment for Chemical inventory purchase
32	21	8	850.00	0	Utilities - Utility bills - January
33	21	2	0	850.00	Payment for Utility bills - January
34	22	8	2500.00	0	Office & Rent - Office rent - February
35	22	2	0	2500.00	Payment for Office rent - February
36	23	8	1200.00	0	Marketing - Marketing expenses
37	23	2	0	1200.00	Payment for Marketing expenses
40	25	8	1200	0	Utilities - Monthly electricity bill for factory operations
41	25	2	0	1200	Payment for Utilities
42	26	8	2800	0	Transportation - Fuel costs for delivery trucks and company vehicles
43	26	2	0	2800	Payment for Transportation
44	27	8	4500	0	Raw Materials - Chemical raw materials for pharmaceutical production
45	27	2	0	4500	Payment for Raw Materials
46	28	8	950	0	Maintenance - Equipment maintenance and repair services
47	28	2	0	950	Payment for Maintenance
48	32	2	136.80	0	Invoice INV-000042
49	32	5	0	136.80	Sales - Invoice INV-000042
50	33	2	6156.00	0	Invoice INV-000045
51	33	5	0	6156.00	Sales - Invoice INV-000045
52	34	2	68.40	0	Invoice INV-000047
53	34	5	0	68.40	Sales - Invoice INV-000047
54	35	2	6156.00	0	Invoice INV-000048
55	35	5	0	6156.00	Sales - Invoice INV-000048
56	36	2	6156.00	0	Invoice INV-000049
57	36	5	0	6156.00	Sales - Invoice INV-000049
58	37	2	68.40	0	Invoice INV-000050
59	37	5	0	68.40	Sales - Invoice INV-000050
60	38	2	57.00	0	Invoice INV-000051
61	38	5	0	57.00	Sales - Invoice INV-000051
62	39	2	6156.00	0	Invoice INV-000052
63	39	5	0	6156.00	Sales - Invoice INV-000052
64	40	2	6156.00	0	Invoice INV-000053
65	40	5	0	6156.00	Sales - Invoice INV-000053
66	41	2	6156.00	0	Invoice INV-000054
67	41	5	0	6156.00	Sales - Invoice INV-000054
68	42	2	6156.00	0	Invoice INV-000055
69	42	5	0	6156.00	Sales - Invoice INV-000055
70	43	2	10259.30	0	Invoice INV-000056
71	43	5	0	10259.30	Sales - Invoice INV-000056
72	44	2	2549.25	0	Invoice INV-000058
73	44	5	0	2549.25	Sales - Invoice INV-000058
74	45	2	2046.96	0	Invoice INV-000059
75	45	5	0	2046.96	Sales - Invoice INV-000059
76	46	2	5098.50	0	Invoice INV-000060
77	46	5	0	5098.50	Sales - Invoice INV-000060
78	47	2	7.30	0	Invoice INV-000064
79	47	5	0	7.30	Sales - Invoice INV-000064
80	48	2	973.56	0	Invoice INV-000065
81	48	5	0	973.56	Sales - Invoice INV-000065
82	49	2	49.02	0	Invoice INV-000066
83	49	5	0	49.02	Sales - Invoice INV-000066
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, user_id, title, message, type, read, action_url, created_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.orders (id, order_number, order_type, customer_id, user_id, description, total_material_cost, total_additional_fees, total_cost, status, expected_output_quantity, refining_steps, created_at, updated_at, target_product_id, profit_margin_percentage, raw_materials, packaging_materials) FROM stdin;
3	ORD-REFINING-2025-003	refining	4	1	\N	100.00	0.00	114.00	pending	1	\N	2025-09-03 22:11:33.7099	2025-09-03 22:11:33.7099	\N	20	\N	\N
4	ORD-REFINING-2025-004	refining	1	1	\N	111.00	0.00	126.54	pending	1	\N	2025-09-03 22:27:48.838389	2025-09-03 22:27:48.838389	\N	20	\N	\N
18	ORD-PRODUCTION-2025-017	production	1	1	REAL MATERIALS TEST ORDER	18400.00	150.00	20976.00	pending	1	\N	2025-09-09 09:51:05.067348	2025-09-09 09:51:05.067348	\N	20	\N	\N
19	ORD-PRODUCTION-2025-018	production	1	1	MATERIALS WILL SHOW TEST	2050.00	50.00	2337.00	pending	1	\N	2025-09-09 09:58:13.866583	2025-09-09 09:58:13.866583	\N	20	[{"id": 100, "name": "Material A", "quantity": 10, "unitPrice": 50, "unitOfMeasure": "KG"}, {"id": 101, "name": "Material B", "quantity": 20, "unitPrice": 75, "unitOfMeasure": "KG"}]	[{"id": 200, "name": "Box A", "quantity": 100, "unitPrice": 1, "unitOfMeasure": "Units"}, {"id": 201, "name": "Label B", "quantity": 100, "unitPrice": 0.5, "unitOfMeasure": "Units"}]
20	ORD-PRODUCTION-2025-019	production	1	1	MODULAR MATERIALS TEST	600.00	25.00	684.00	pending	1	\N	2025-09-09 10:01:19.768788	2025-09-09 10:01:19.768788	\N	20	[{"id": 300, "name": "Clean Material", "quantity": 5, "unitPrice": 100, "unitOfMeasure": "KG"}]	[{"id": 400, "name": "Clean Box", "quantity": 50, "unitPrice": 2, "unitOfMeasure": "Units"}]
21	ORD-PRODUCTION-2025-020	production	2	1	PANADOL	12800.00	10000.00	14592.00	pending	1	\N	2025-09-09 10:47:45.144841	2025-09-11 08:54:48.503	\N	30	"[{\\"id\\":57,\\"name\\":\\"Aspirin 500mg Tablets\\",\\"quantity\\":100,\\"unitOfMeasure\\":\\"Tablets\\",\\"unitPrice\\":25}]"	"[{\\"id\\":48,\\"name\\":\\"CSV Test Packaging Product\\",\\"quantity\\":10,\\"unitOfMeasure\\":\\"KG\\",\\"unitPrice\\":30}]"
22	ORD-PRODUCTION-2025-021	production	3	1	MORGAN NO1	12069.00	1000.00	13758.66	completed	1	\N	2025-09-16 09:33:53.304775	2025-09-16 09:35:17.537	\N	100	"[{\\"id\\":58,\\"name\\":\\"Test Product Fixed\\",\\"quantity\\":20,\\"unitOfMeasure\\":\\"Capsules\\",\\"unitPrice\\":20},{\\"id\\":58,\\"name\\":\\"Test Product Fixed\\",\\"quantity\\":100,\\"unitOfMeasure\\":\\"Capsules\\",\\"unitPrice\\":100}]"	"[{\\"id\\":49,\\"name\\":\\"CSV Test Raw Material\\",\\"quantity\\":10,\\"unitOfMeasure\\":\\"L\\",\\"unitPrice\\":2.5}]"
10	ORD-SHOW-MATERIALS-NOW	production	\N	1	MATERIALS WILL SHOW HERE	0.00	0.00	1000.00	pending	\N	\N	2025-09-06 09:16:32.088855	2025-09-06 09:16:32.088855	\N	20	[{"id": 99, "name": "VISIBLE Raw Material", "quantity": "15", "unitPrice": "30", "unitOfMeasure": "KG"}]	[{"id": 88, "name": "VISIBLE Packaging Box", "quantity": "25", "unitPrice": "8", "unitOfMeasure": "PCS"}]
12	ORD-PRODUCTION-2025-999	production	1	1	Test Product with Materials	1150.00	0.00	1150.00	pending	1 unit	["Production","Quality control","Packaging","Testing"]	2025-09-06 08:15:30	2025-09-06 10:32:52.541589	\N	20	[{"id": 59, "name": "Raw Material Alpha", "quantity": "5", "unitPrice": "200", "unitOfMeasure": "KG"}]	[{"id": 11, "name": "Box Carton", "quantity": "100", "unitPrice": "1.5", "unitOfMeasure": "PCS"}]
11	ORD-PRODUCTION-2025-011	production	2	1	Final test	7000.00	1000.00	7980.00	pending	1	\N	2025-09-06 09:20:22.5561	2025-09-06 09:20:22.5561	\N	20	[{"id": 58, "name": "Chemical Base Alpha", "quantity": "10", "unitPrice": "50", "unitOfMeasure": "KG"}]	[{"id": 12, "name": "Standard Box", "quantity": "50", "unitPrice": "2", "unitOfMeasure": "PCS"}]
9	ORD-PRODUCTION-2025-009	production	2	1	TEST WITH REAL MATERIALS v2	3900.00	150.00	4446.00	pending	1	\N	2025-09-04 11:33:31.093575	2025-09-04 11:33:31.093575	\N	20	[{"id": 57, "name": "Chemical Compound Beta", "quantity": "8", "unitPrice": "75", "unitOfMeasure": "KG"}]	[{"id": 13, "name": "Safety Container", "quantity": "25", "unitPrice": "3", "unitOfMeasure": "PCS"}]
8	ORD-PRODUCTION-2025-008	production	2	1	TEST PRODUCT WITH REAL MATERIALS	2000.00	100.00	2280.00	pending	1	\N	2025-09-04 11:33:12.173359	2025-09-04 11:33:12.173359	\N	20	[{"id": 56, "name": "Base Material Gamma", "quantity": "12", "unitPrice": "40", "unitOfMeasure": "KG"}]	[{"id": 14, "name": "Industrial Box", "quantity": "30", "unitPrice": "2.5", "unitOfMeasure": "PCS"}]
7	ORD-PRODUCTION-2025-007	production	4	1	Profit 2	5500.00	1000.00	6270.00	pending	1	\N	2025-09-04 11:31:02.576258	2025-09-04 11:31:02.576258	\N	20	[{"id": 55, "name": "Active Ingredient Delta", "quantity": "6", "unitPrice": "120", "unitOfMeasure": "KG"}]	[{"id": 15, "name": "Pharmaceutical Vial", "quantity": "100", "unitPrice": "1.2", "unitOfMeasure": "PCS"}]
5	ORD-PRODUCTION-2025-005	production	2	1	PROFIT MAX	2750.00	1000.00	3135.00	pending	1	\N	2025-09-04 11:21:04.633676	2025-09-04 11:21:04.633676	\N	20	[{"id": 54, "name": "Catalyst Material", "quantity": "15", "unitPrice": "35", "unitOfMeasure": "KG"}]	[{"id": 16, "name": "Protective Wrap", "quantity": "80", "unitPrice": "1.8", "unitOfMeasure": "PCS"}]
2	ORD-PRODUCTION-2025-002	production	3	1	opol	7000.00	0.00	7980.00	completed	1	\N	2025-09-02 11:58:49.670525	2025-09-04 10:24:14.973	\N	16	[{"id": 53, "name": "Solvent Mix", "quantity": "20", "unitPrice": "25", "unitOfMeasure": "L"}]	[{"id": 17, "name": "Glass Bottle", "quantity": "60", "unitPrice": "2.2", "unitOfMeasure": "PCS"}]
1	ORD-PRODUCTION-2025-001	production	2	1	panadol	21400.00	1000.00	24396.00	pending	1	\N	2025-09-02 11:44:22.092565	2025-09-02 11:44:22.092565	\N	20	[{"id": 52, "name": "Primary Chemical", "quantity": "18", "unitPrice": "60", "unitOfMeasure": "KG"}]	[{"id": 18, "name": "Sealed Container", "quantity": "40", "unitPrice": "3.5", "unitOfMeasure": "PCS"}]
13	ORD-PRODUCTION-2025-012	production	2	1	Showing Product	12500.00	1500.00	14250.00	pending	1	\N	2025-09-06 10:40:19.73645	2025-09-06 10:40:19.73645	\N	20	\N	\N
14	ORD-PRODUCTION-2025-013	production	2	1	\N	15200.00	0.00	17328.00	pending	1	\N	2025-09-08 06:50:52.410352	2025-09-08 06:50:52.410352	\N	20	\N	\N
15	ORD-PRODUCTION-2025-014	production	1	1	LIght	200000.00	0.00	228000.00	pending	1	\N	2025-09-08 08:29:24.743955	2025-09-08 08:29:24.743955	\N	20	\N	\N
16	ORD-PRODUCTION-2025-015	production	1	1	Test Product with Materials	9700.00	200.00	11058.00	pending	1	\N	2025-09-09 09:50:02.008215	2025-09-09 09:50:02.008215	\N	20	\N	\N
17	ORD-PRODUCTION-2025-016	production	2	1	Test Product with Materials V2	13875.00	100.00	15817.50	pending	1	\N	2025-09-09 09:50:27.219228	2025-09-09 09:50:27.219228	\N	20	\N	\N
\.


--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.product_categories (id, name, description, created_at) FROM stdin;
1	Packaging		2025-08-16 11:00:46.626716
2	Chemical	Adjust	2025-09-08 06:43:55.445707
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.products (id, name, drug_name, category_id, description, sku, barcode, cost_price, selling_price, quantity, unit_of_measure, low_stock_threshold, expiry_date, status, product_type, manufacturer, location, shelf, image_path, created_at, updated_at, warehouse_id, grade) FROM stdin;
48	CSV Test Packaging Product	Test Chemical	1	\N	PKG-CSV-001	\N	10	25	300	KG	10	\N	active	finished	\N	Raw Materials Section	\N	\N	2025-08-19 18:26:44.272	2025-08-19 18:26:44.272	\N	P
49	CSV Test Raw Material	Test Raw	1	\N	PKG-CSV-002	\N	5	15	500	L	10	\N	active	finished	\N	Raw Materials Section	\N	\N	2025-08-19 18:26:44.403	2025-08-19 18:26:44.403	\N	P
50	JSON Test Final	Test Drug JSON	\N	\N	JSON-WAREHOUSE-001	\N	3	8	150	KG	10	\N	active	finished	\N	Finished Goods Area	\N	\N	2025-08-19 18:26:58.95107	2025-08-19 18:26:58.95107	\N	P
10	Antiseptic Solution 500ml	Chlorhexidine	\N	\N	ANTI-500	1234567890127	8	18	653	Bottles	30	2026-03-31	active	finished	\N	Finished Products Warehouse	Top	\N	2025-07-10 00:34:58.462609	2025-08-19 18:21:50.823	5	P
57	Aspirin 500mg Tablets	Acetylsalicylic Acid	\N	Pain relief medication for headaches and fever	ASP-500-001	\N	15.5	35	999	Tablets	50	2025-12-31	active	finished	\N	Main Warehouse	\N	\N	2025-08-19 19:03:33.001397	2025-08-19 19:03:33.001397	\N	P
12	Test Product	Test Drug	\N	\N	TEST-003	\N	10	20	100	Tablets	10	\N	active	finished	\N	Main Warehouse	\N	\N	2025-08-19 18:18:32.857275	2025-08-19 18:18:32.857275	\N	P
33	Packaging Box Large	Non-drug	\N	\N	PKG-LARGE-001	\N	2	5	1000	PCS	10	\N	active	finished	\N	Packaging	\N	\N	2025-08-19 18:20:51.988666	2025-08-19 18:20:51.988666	\N	P
34	Packaging Tape Roll	Non-drug	\N	\N	PKG-TAPE-001	\N	3	7	500	Rolls	10	\N	active	finished	\N	Packaging	\N	\N	2025-08-19 18:20:52.058065	2025-08-19 18:20:52.058065	\N	P
3	Aspirin 100mg	Aspirin	\N	\N	ASP-100	\N	3	8	4993	Tablets	10	2026-03-20	active	finished	\N	Main Warehouse	\N	\N	2025-07-09 23:54:20.590664	2025-08-19 18:21:50.892	1	P
7	Cough Syrup 100ml	Dextromethorphan	\N	\N	COUGH-100	1234567890124	12	25	2000	Bottles	20	2025-09-30	active	finished	\N	Raw Materials Warehouse	Middle	\N	2025-07-10 00:34:58.266548	2025-08-19 18:21:51.024	3	P
4	Ibuprofen 400mg	Ibuprofen	\N	\N	IBU-400	\N	6	15	500	Tablets	10	2025-02-10	active	finished	\N	Main Warehouse	\N	\N	2025-07-09 23:54:20.590664	2025-08-19 18:21:51.09	1	P
8	Insulin Pen 3ml	Insulin Glargine	\N	\N	INS-PEN-3	1234567890125	45	95	2000	Pens	15	2025-06-30	active	finished	\N	Temperature-Controlled Storage	Refrigerated	\N	2025-07-10 00:34:58.335898	2025-08-19 18:21:51.155	2	P
9	Surgical Mask Pack (50pcs)	N/A	\N	\N	MASK-50	1234567890126	5	12	2000	Packs	100	2027-12-31	active	finished	\N	Medical Supplies Warehouse	Bottom	\N	2025-07-10 00:34:58.399366	2025-08-19 18:21:51.285	4	P
5	Vitamin C 1000mg	Ascorbic Acid	\N	\N	VITC-1000	\N	4	10	1998	Tablets	10	2025-01-15	active	finished	\N	Main Warehouse	\N	\N	2025-07-09 23:54:20.590664	2025-08-19 18:21:51.351	1	P
45	Test Import to Packaging	Test Drug	\N	\N	PKG-TEST-NEW	\N	1	3	200	PCS	10	\N	active	finished	\N	Main Warehouse	\N	\N	2025-08-19 18:23:10.052155	2025-08-19 18:23:10.052155	\N	P
46	Fixed Warehouse Test	Test Drug	\N	\N	PKG-WAREHOUSE-FIX	\N	1	3	100	PCS	10	\N	active	finished	\N	Main Warehouse	\N	\N	2025-08-19 18:23:38.448312	2025-08-19 18:23:38.448312	\N	P
47	Test Packaging Warehouse	Test Drug	\N	\N	PKG-FINAL-TEST	\N	2	4	50	PCS	10	\N	active	finished	\N	Packaging	\N	\N	2025-08-19 18:23:55.392959	2025-08-19 18:23:55.392959	\N	P
59	Raw Material Alpha	Chemical Alpha	\N	Raw chemical for pharmaceutical manufacturing	RAW-ALPHA-003	\N	45	0	2000	KG	100	\N	active	finished	\N	Main Warehouse	\N	\N	2025-08-19 19:03:33.705863	2025-08-19 19:03:33.705863	\N	P
2	Amoxicillin 250mg	Amoxicillin	\N	\N	AMOX-250	\N	8	18	1500	Capsules	10	2025-08-15	active	finished	\N	Main Warehouse	\N	\N	2025-07-09 23:54:20.590664	2025-08-19 18:21:50.737	1	P,F,T
58	Test Product Fixed	Amoxicillin Trihydrate	1	Updated successfully	AMOX-250-002	\N	8.75	22.5	200	Capsules	25	2025-10-15	active	finished	\N	Main Warehouse	Shelf 19	\N	2025-08-19 19:03:33.170935	2025-09-01 08:59:16.545	\N	P,F
11	Blue Boxes	Non-drug	1	Packaging material	non	\N	5	8	5000	PCS	10	\N	active	raw	\N	Packaging	shelf 6	\N	2025-08-16 11:18:24.976083	2025-09-17 00:26:23.903	\N	P,F,T
61	Bottels of one	Non-drug	\N	Packaging material	PKG-LARGE-00133	\N	2	5	1000	PCS	10	\N	active	finished	\N	Packaging	\N	\N	2025-09-17 00:13:40.17202	2025-09-17 00:26:24.034	\N	P
62	Extra Carton	Non-drug	\N	Packaging material	PKG-L-TEST43	\N	3	7	500	PCS	10	\N	active	finished	\N	Packaging	\N	\N	2025-09-17 00:13:40.726722	2025-09-17 00:26:24.166	\N	P,F,T
63	Barrels	Non-drug	\N	Packaging material	PKG-L-TEST44	\N	2	4	50	PCS	10	\N	active	finished	\N	Packaging	\N	\N	2025-09-17 00:13:41.244331	2025-09-17 00:26:24.294	\N	P
\.


--
-- Data for Name: purchase_order_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.purchase_order_items (id, purchase_order_id, product_id, quantity, unit_price, total, received_quantity) FROM stdin;
8	4	2	300	18.75	5625.00	0
9	4	3	250	15.50	3875.00	0
10	5	4	800	22.00	17600.00	0
11	5	5	400	12.00	4800.00	0
13	6	7	150	21.67	3250.00	150
14	7	5	600	31.00	18600.00	0
15	8	8	150	45.00	6750.00	0
16	8	9	200	28.00	5600.00	0
38	10	2	500	25.00	12500.00	0
39	11	8	300	45.00	13500.00	0
40	11	9	220	28.00	6160.00	0
41	11	10	200	22.00	4400.00	0
42	12	3	100	35.00	3500.00	0
43	12	4	50	180.00	9000.00	0
44	12	5	25	120.00	3000.00	0
46	13	8	150	45.00	6750.00	0
\.


--
-- Data for Name: purchase_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.purchase_orders (id, po_number, supplier_id, user_id, order_date, expected_delivery_date, status, total_amount, notes, created_at, updated_at, transportation_type, transportation_cost, transportation_notes) FROM stdin;
5	PO-2025-002	1	1	2025-01-18 00:00:00	2025-02-02	sent	22400.00	Bulk order for antibiotics production line	2025-07-12 09:56:52.260076	2025-07-12 09:56:52.260076	standard	0	\N
6	PO-2025-003	1	1	2025-01-20 00:00:00	2025-02-05	received	8950.00	Emergency restocking of pain relief medications	2025-07-12 09:56:52.260076	2025-07-12 09:56:52.260076	standard	0	\N
8	PO-2025-005	3	1	2025-01-25 00:00:00	2025-02-12	sent	12350.00	Surgical supplies restocking	2025-07-12 09:56:52.260076	2025-07-12 09:56:52.260076	standard	0	\N
11	PO-2025-013	2	1	2025-07-08 00:00:00	2025-07-25	sent	24500.00	Emergency antibiotics procurement	2025-07-12 14:23:34.853921	2025-07-12 14:23:34.853921	standard	0	\N
4	PO-2025-001	1	1	2025-01-15 00:00:00	2025-01-25	sent	15750.00	Urgent order for Q1 production requirements	2025-07-12 09:56:52.260076	2025-07-12 09:56:52.260076	standard	0	\N
7	PO-2025-004	2	1	2025-01-22 00:00:00	2025-02-08	sent	18600.00	Monthly vitamin supplement order	2025-07-12 09:56:52.260076	2025-07-12 09:56:52.260076	standard	0	\N
10	PO-2025-012	1	1	2025-07-05 00:00:00	2025-07-20	sent	18750.00	Monthly pharmaceutical supplies restock	2025-07-12 14:23:34.853921	2025-07-12 14:23:34.853921	standard	0	\N
13	PO-2025-015	1	1	2025-07-12 00:00:00	2025-07-30	sent	32100.00	High-priority insulin and diabetes medication	2025-07-12 14:23:34.853921	2025-07-12 14:23:34.853921	standard	0	\N
14	PO-2025-016	9	1	2025-07-13 00:16:18.014	\N	sent	25500		2025-07-13 00:16:18.049467	2025-07-13 00:16:18.049467	standard	0	\N
15	PO-2025-017	9	1	2025-07-13 00:16:20.002	\N	sent	25500		2025-07-13 00:16:20.037392	2025-07-13 00:16:20.037392	standard	0	\N
16	PO-2025-018	8	1	2025-07-13 00:17:29.627	\N	sent	2550000		2025-07-13 00:17:29.662923	2025-07-13 00:17:29.662923	standard	0	\N
17	PO-2025-019	8	1	2025-07-13 00:17:30.888	\N	sent	2550000		2025-07-13 00:17:30.92263	2025-07-13 00:17:30.92263	standard	0	\N
18	PO-2025-020	5	1	2025-07-13 00:18:51.463	\N	sent	1997300		2025-07-13 00:18:51.499984	2025-07-13 00:18:51.499984	standard	0	\N
12	PO-2025-014	3	1	2025-07-10 00:00:00	2025-07-28	sent	15200.00	Surgical equipment order	2025-07-12 14:23:34.853921	2025-07-12 14:23:34.853921	standard	0	\N
21	PO-2025-023	9	1	2025-07-13 00:22:55.641	\N	received	13808.25		2025-07-13 00:22:55.67711	2025-07-13 15:07:37.771	standard	0	\N
20	PO-2025-022	5	1	2025-07-13 00:18:52.81	\N	received	1997300		2025-07-13 00:18:52.84522	2025-07-13 15:15:34.504	standard	0	\N
22	PO-2025-024	8	1	2025-07-16 18:34:58.849	2025-07-28	sent	27616.5		2025-07-16 18:34:58.886312	2025-07-16 18:34:58.886312	standard	0	
23	PO-2025-025	8	1	2025-07-16 18:35:00.771	2025-07-28	received	27616.5		2025-07-16 18:35:00.805874	2025-07-16 18:35:19.218	standard	0	
19	PO-2025-021	5	1	2025-07-13 00:18:51.886	\N	received	1997300		2025-07-13 00:18:51.985425	2025-07-16 23:48:46.911	standard	0	\N
24	PO-2025-026	7	1	2025-07-17 10:13:32.519	2025-07-25	received	19331.55		2025-07-17 10:13:32.555858	2025-07-17 10:14:08.615	express	0	
25	PO-2025-027	6	1	2025-07-18 08:11:40.546	\N	sent	13808.25		2025-07-18 08:11:40.581606	2025-07-18 08:11:40.581606	standard	0	
26	PO-2025-028	6	1	2025-07-18 08:11:41.049	\N	received	13808.25		2025-07-18 08:11:41.083942	2025-07-23 11:35:46.127	standard	0	
27	PO-2025-029	8	1	2025-08-12 11:23:49.455	\N	sent	555308.25		2025-08-12 11:23:49.490696	2025-08-12 11:23:49.490696	hazmat	0	
28	PO-2025-030	8	1	2025-08-12 11:23:50.627	\N	received	555308.25		2025-08-12 11:23:50.662579	2025-08-12 11:24:11.011	hazmat	0	
29	PO-2025-031	9	1	2025-08-16 22:54:06.345	\N	received	441200		2025-08-16 22:54:06.380885	2025-09-08 08:32:33.117	standard	8000	
30	PO-2025-032	7	1	2025-09-16 09:39:15.384	\N	received	23808.25		2025-09-16 09:39:15.418277	2025-09-16 09:39:37.444	standard	10000	
\.


--
-- Data for Name: quotation_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.quotation_items (id, quotation_id, product_id, quantity, unit_price, discount, total) FROM stdin;
13	27	2	1	18	0	18
14	32	10	1	18	0	18
\.


--
-- Data for Name: quotation_packaging_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.quotation_packaging_items (id, quotation_id, type, description, quantity, unit_price, total, notes, created_at) FROM stdin;
1	20	container	Test packaging container	1	50.00	50.00	Test packaging note	2025-09-14 12:35:37.450531
\.


--
-- Data for Name: quotations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.quotations (id, quotation_number, customer_id, user_id, date, valid_until, total_amount, discount, tax, grand_total, status, notes, created_at, updated_at, issue_date, subtotal, tax_rate, tax_amount, terms_and_conditions) FROM stdin;
10	TEST-QUOTE-RESTART-001	1	1	2025-09-13 12:30:27.743041	2025-10-13	165	0	0	165	draft	Test after restart	2025-09-13 12:30:27.743041	2025-09-13 12:30:27.743041	2025-09-13 12:30:27.743041	100	15	15	1. Validity: This quotation is valid for 30 days from the date of issue.\n\n2. Payment Terms: 50% advance payment required upon order confirmation. Balance due upon completion/delivery.\n\n3. Quality Assurance: All pharmaceutical services comply with GMP standards and regulatory requirements as per Egyptian Drug Authority guidelines.\n\n4. Delivery: Delivery times are estimates and subject to production schedules, regulatory approvals, and raw material availability.\n\n5. Changes: Any changes to specifications, quantities, or requirements after quotation acceptance may affect pricing and delivery timelines.\n\n6. Liability: Our liability is limited to the value of services provided. We maintain comprehensive insurance coverage for pharmaceutical operations.
11	QUO-FPD-202509-776	2	1	2025-09-13 12:31:29.598577	2025-10-13	1160.52	0	0	1160.52	sent	\N	2025-09-13 12:31:29.598577	2025-09-13 12:31:29.598577	2025-09-13 12:31:29.598577	18	791.7777777777778	142.52	1. Validity: This quotation is valid for 30 days from the date of issue.\n\n2. Payment Terms: 50% advance payment required upon order confirmation. Balance due upon completion/delivery.\n\n3. Quality Assurance: All pharmaceutical services comply with GMP standards and regulatory requirements as per Egyptian Drug Authority guidelines.\n\n4. Delivery: Delivery times are estimates and subject to production schedules, regulatory approvals, and raw material availability.\n\n5. Changes: Any changes to specifications, quantities, or requirements after quotation acceptance may affect pricing and delivery timelines.\n\n6. Liability: Our liability is limited to the value of services provided. We maintain comprehensive insurance coverage for pharmaceutical operations.
12	QUO-FPD-202509-529	2	1	2025-09-13 12:37:36.356484	2025-10-13	20.52	0	0	20.52	sent	\N	2025-09-13 12:37:36.356484	2025-09-13 12:37:36.356484	2025-09-13 12:37:36.356484	18	14.000000000000002	2.5200000000000005	1. Validity: This quotation is valid for 30 days from the date of issue.\n\n2. Payment Terms: 50% advance payment required upon order confirmation. Balance due upon completion/delivery.\n\n3. Quality Assurance: All pharmaceutical services comply with GMP standards and regulatory requirements as per Egyptian Drug Authority guidelines.\n\n4. Delivery: Delivery times are estimates and subject to production schedules, regulatory approvals, and raw material availability.\n\n5. Changes: Any changes to specifications, quantities, or requirements after quotation acceptance may affect pricing and delivery timelines.\n\n6. Liability: Our liability is limited to the value of services provided. We maintain comprehensive insurance coverage for pharmaceutical operations.
13	QUO-FPD-202509-988	2	1	2025-09-14 11:22:55.976668	2025-10-14	590.52	0	0	590.52	sent	\N	2025-09-14 11:22:55.976668	2025-09-14 11:22:55.976668	2025-09-14 11:22:55.976668	18	402.88888888888897	72.52000000000001	1. Validity: This quotation is valid for 30 days from the date of issue.\n\n2. Payment Terms: 50% advance payment required upon order confirmation. Balance due upon completion/delivery.\n\n3. Quality Assurance: All pharmaceutical services comply with GMP standards and regulatory requirements as per Egyptian Drug Authority guidelines.\n\n4. Delivery: Delivery times are estimates and subject to production schedules, regulatory approvals, and raw material availability.\n\n5. Changes: Any changes to specifications, quantities, or requirements after quotation acceptance may affect pricing and delivery timelines.\n\n6. Liability: Our liability is limited to the value of services provided. We maintain comprehensive insurance coverage for pharmaceutical operations.
14	QUO-FPD-202509-509	1	1	2025-09-14 11:40:28.010242	2025-10-14	35930.520000000004	0	0	35930.520000000004	sent	\N	2025-09-14 11:40:28.010242	2025-09-14 11:40:28.010242	2025-09-14 11:40:28.010242	18	24514	4412.52	1. Validity: This quotation is valid for 30 days from the date of issue.\n\n2. Payment Terms: 50% advance payment required upon order confirmation. Balance due upon completion/delivery.\n\n3. Quality Assurance: All pharmaceutical services comply with GMP standards and regulatory requirements as per Egyptian Drug Authority guidelines.\n\n4. Delivery: Delivery times are estimates and subject to production schedules, regulatory approvals, and raw material availability.\n\n5. Changes: Any changes to specifications, quantities, or requirements after quotation acceptance may affect pricing and delivery timelines.\n\n6. Liability: Our liability is limited to the value of services provided. We maintain comprehensive insurance coverage for pharmaceutical operations.
15	QUO-FPD-202509-015	2	1	2025-09-14 12:04:50.324826	2025-10-14	67949.7	0	0	67949.7	sent	\N	2025-09-14 12:04:50.324826	2025-09-14 12:04:50.324826	2025-09-14 12:04:50.324826	18	46359.44444444445	8344.7	1. Validity: This quotation is valid for 30 days from the date of issue.\n\n2. Payment Terms: 50% advance payment required upon order confirmation. Balance due upon completion/delivery.\n\n3. Quality Assurance: All pharmaceutical services comply with GMP standards and regulatory requirements as per Egyptian Drug Authority guidelines.\n\n4. Delivery: Delivery times are estimates and subject to production schedules, regulatory approvals, and raw material availability.\n\n5. Changes: Any changes to specifications, quantities, or requirements after quotation acceptance may affect pricing and delivery timelines.\n\n6. Liability: Our liability is limited to the value of services provided. We maintain comprehensive insurance coverage for pharmaceutical operations.
16	QUO-FPD-202509-349	2	1	2025-09-14 12:14:12.498374	2025-10-14	63052.26	0	0	63052.26	sent	\N	2025-09-14 12:14:12.498374	2025-09-14 12:14:12.498374	2025-09-14 12:14:12.498374	864	896.2106481481483	7743.260000000001	1. Validity: This quotation is valid for 30 days from the date of issue.\n\n2. Payment Terms: 50% advance payment required upon order confirmation. Balance due upon completion/delivery.\n\n3. Quality Assurance: All pharmaceutical services comply with GMP standards and regulatory requirements as per Egyptian Drug Authority guidelines.\n\n4. Delivery: Delivery times are estimates and subject to production schedules, regulatory approvals, and raw material availability.\n\n5. Changes: Any changes to specifications, quantities, or requirements after quotation acceptance may affect pricing and delivery timelines.\n\n6. Liability: Our liability is limited to the value of services provided. We maintain comprehensive insurance coverage for pharmaceutical operations.
17	QUO-TEST-001	1	1	2025-09-14 12:21:40.227502	2025-10-14	1140	0	0	1140	sent	\N	2025-09-14 12:21:40.227502	2025-09-14 12:21:40.227502	2025-09-14 12:21:40.227502	1000	14.000000000000002	140	1. Validity: This quotation is valid for 30 days from the date of issue.\n\n2. Payment Terms: 50% advance payment required upon order confirmation. Balance due upon completion/delivery.\n\n3. Quality Assurance: All pharmaceutical services comply with GMP standards and regulatory requirements as per Egyptian Drug Authority guidelines.\n\n4. Delivery: Delivery times are estimates and subject to production schedules, regulatory approvals, and raw material availability.\n\n5. Changes: Any changes to specifications, quantities, or requirements after quotation acceptance may affect pricing and delivery timelines.\n\n6. Liability: Our liability is limited to the value of services provided. We maintain comprehensive insurance coverage for pharmaceutical operations.
18	QUO-TEST-002	1	1	2025-09-14 12:23:33.985964	2025-10-14	570	0	0	570	sent	\N	2025-09-14 12:23:33.985964	2025-09-14 12:23:33.985964	2025-09-14 12:23:33.985964	500	14.000000000000002	70	1. Validity: This quotation is valid for 30 days from the date of issue.\n\n2. Payment Terms: 50% advance payment required upon order confirmation. Balance due upon completion/delivery.\n\n3. Quality Assurance: All pharmaceutical services comply with GMP standards and regulatory requirements as per Egyptian Drug Authority guidelines.\n\n4. Delivery: Delivery times are estimates and subject to production schedules, regulatory approvals, and raw material availability.\n\n5. Changes: Any changes to specifications, quantities, or requirements after quotation acceptance may affect pricing and delivery timelines.\n\n6. Liability: Our liability is limited to the value of services provided. We maintain comprehensive insurance coverage for pharmaceutical operations.
19	QUO-TEST-003	1	1	2025-09-14 12:28:36.146222	2025-10-14	570	0	0	570	sent	\N	2025-09-14 12:28:36.146222	2025-09-14 12:28:36.146222	2025-09-14 12:28:36.146222	500	14.000000000000002	70	1. Validity: This quotation is valid for 30 days from the date of issue.\n\n2. Payment Terms: 50% advance payment required upon order confirmation. Balance due upon completion/delivery.\n\n3. Quality Assurance: All pharmaceutical services comply with GMP standards and regulatory requirements as per Egyptian Drug Authority guidelines.\n\n4. Delivery: Delivery times are estimates and subject to production schedules, regulatory approvals, and raw material availability.\n\n5. Changes: Any changes to specifications, quantities, or requirements after quotation acceptance may affect pricing and delivery timelines.\n\n6. Liability: Our liability is limited to the value of services provided. We maintain comprehensive insurance coverage for pharmaceutical operations.
20	QUO-TEST-004	1	1	2025-09-14 12:35:37.307308	2025-10-14	570	0	0	570	sent	\N	2025-09-14 12:35:37.307308	2025-09-14 12:35:37.307308	2025-09-14 12:35:37.271	500	14.000000000000002	70	1. Validity: This quotation is valid for 30 days from the date of issue.\n\n2. Payment Terms: 50% advance payment required upon order confirmation. Balance due upon completion/delivery.\n\n3. Quality Assurance: All pharmaceutical services comply with GMP standards and regulatory requirements as per Egyptian Drug Authority guidelines.\n\n4. Delivery: Delivery times are estimates and subject to production schedules, regulatory approvals, and raw material availability.\n\n5. Changes: Any changes to specifications, quantities, or requirements after quotation acceptance may affect pricing and delivery timelines.\n\n6. Liability: Our liability is limited to the value of services provided. We maintain comprehensive insurance coverage for pharmaceutical operations.
27	QUO-FPD-202509-532	2	1	2025-09-14 22:25:30.475439	2025-10-14	20.52	0	0	20.52	sent	\N	2025-09-14 22:25:30.475439	2025-09-14 22:25:30.475439	2025-09-14 22:25:30.293	18	14.000000000000002	2.5200000000000005	1. Validity: This quotation is valid for 30 days from the date of issue.\n\n2. Payment Terms: 50% advance payment required upon order confirmation. Balance due upon completion/delivery.\n\n3. Quality Assurance: All pharmaceutical services comply with GMP standards and regulatory requirements as per Egyptian Drug Authority guidelines.\n\n4. Delivery: Delivery times are estimates and subject to production schedules, regulatory approvals, and raw material availability.\n\n5. Changes: Any changes to specifications, quantities, or requirements after quotation acceptance may affect pricing and delivery timelines.\n\n6. Liability: Our liability is limited to the value of services provided. We maintain comprehensive insurance coverage for pharmaceutical operations.
32	QUO-FPD-202509-038	1	1	2025-09-16 23:56:56.261652	2025-10-16	20.52	0	0	20.52	sent	\N	2025-09-16 23:56:56.261652	2025-09-16 23:56:56.261652	2025-09-16 23:56:56.076	18	14.000000000000002	2.5200000000000005	1. Validity: This quotation is valid for 30 days from the date of issue.\n\n2. Payment Terms: 50% advance payment required upon order confirmation. Balance due upon completion/delivery.\n\n3. Quality Assurance: All pharmaceutical services comply with GMP standards and regulatory requirements as per Egyptian Drug Authority guidelines.\n\n4. Delivery: Delivery times are estimates and subject to production schedules, regulatory approvals, and raw material availability.\n\n5. Changes: Any changes to specifications, quantities, or requirements after quotation acceptance may affect pricing and delivery timelines.\n\n6. Liability: Our liability is limited to the value of services provided. We maintain comprehensive insurance coverage for pharmaceutical operations.
\.


--
-- Data for Name: refunds; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.refunds (id, invoice_id, invoice_number, customer_id, customer_name, original_amount, refund_amount, reason, date, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.role_permissions (id, role, resource, action, created_at, updated_at) FROM stdin;
1	admin	procurement	approve	2025-09-09 12:31:42.919678	2025-09-09 12:31:42.919678
2	admin	accounting	create	2025-09-09 12:31:43.007116	2025-09-09 12:31:43.007116
3	admin	accounting	read	2025-09-09 12:31:43.072315	2025-09-09 12:31:43.072315
4	admin	accounting	update	2025-09-09 12:31:43.137537	2025-09-09 12:31:43.137537
5	admin	accounting	delete	2025-09-09 12:31:43.202767	2025-09-09 12:31:43.202767
6	admin	accounting	export	2025-09-09 12:31:43.267261	2025-09-09 12:31:43.267261
7	admin	accounting	approve	2025-09-09 12:31:43.331855	2025-09-09 12:31:43.331855
8	admin	expenses	create	2025-09-09 12:31:43.396336	2025-09-09 12:31:43.396336
9	admin	expenses	read	2025-09-09 12:31:43.460766	2025-09-09 12:31:43.460766
10	admin	expenses	update	2025-09-09 12:31:43.525665	2025-09-09 12:31:43.525665
11	admin	expenses	delete	2025-09-09 12:31:43.589999	2025-09-09 12:31:43.589999
12	admin	expenses	export	2025-09-09 12:31:43.655631	2025-09-09 12:31:43.655631
13	admin	expenses	approve	2025-09-09 12:31:43.719988	2025-09-09 12:31:43.719988
14	admin	invoices	create	2025-09-09 12:31:43.784254	2025-09-09 12:31:43.784254
15	admin	invoices	read	2025-09-09 12:31:43.84891	2025-09-09 12:31:43.84891
16	admin	invoices	update	2025-09-09 12:31:43.913536	2025-09-09 12:31:43.913536
17	admin	invoices	delete	2025-09-09 12:31:43.97797	2025-09-09 12:31:43.97797
18	admin	invoices	export	2025-09-09 12:31:44.04235	2025-09-09 12:31:44.04235
19	admin	invoices	approve	2025-09-09 12:31:44.108089	2025-09-09 12:31:44.108089
20	admin	quotations	create	2025-09-09 12:31:44.176013	2025-09-09 12:31:44.176013
21	admin	quotations	read	2025-09-09 12:31:44.241059	2025-09-09 12:31:44.241059
22	admin	quotations	update	2025-09-09 12:31:44.305687	2025-09-09 12:31:44.305687
23	admin	quotations	delete	2025-09-09 12:31:44.370101	2025-09-09 12:31:44.370101
24	admin	quotations	export	2025-09-09 12:31:44.434785	2025-09-09 12:31:44.434785
25	admin	quotations	approve	2025-09-09 12:31:44.51993	2025-09-09 12:31:44.51993
26	admin	customers	create	2025-09-09 12:31:44.584501	2025-09-09 12:31:44.584501
27	admin	customers	read	2025-09-09 12:31:44.649503	2025-09-09 12:31:44.649503
28	admin	customers	update	2025-09-09 12:31:44.714022	2025-09-09 12:31:44.714022
29	admin	customers	delete	2025-09-09 12:31:44.779029	2025-09-09 12:31:44.779029
30	admin	customers	export	2025-09-09 12:31:44.843868	2025-09-09 12:31:44.843868
31	admin	customers	approve	2025-09-09 12:31:44.909221	2025-09-09 12:31:44.909221
32	admin	suppliers	create	2025-09-09 12:31:44.974078	2025-09-09 12:31:44.974078
33	admin	suppliers	read	2025-09-09 12:31:45.03881	2025-09-09 12:31:45.03881
34	admin	suppliers	update	2025-09-09 12:31:45.103471	2025-09-09 12:31:45.103471
35	admin	suppliers	delete	2025-09-09 12:31:45.168386	2025-09-09 12:31:45.168386
36	admin	suppliers	export	2025-09-09 12:31:45.235253	2025-09-09 12:31:45.235253
37	admin	suppliers	approve	2025-09-09 12:31:45.299926	2025-09-09 12:31:45.299926
38	admin	users	create	2025-09-09 12:31:45.364855	2025-09-09 12:31:45.364855
39	admin	users	read	2025-09-09 12:31:45.429213	2025-09-09 12:31:45.429213
40	admin	users	update	2025-09-09 12:31:45.493656	2025-09-09 12:31:45.493656
41	admin	users	delete	2025-09-09 12:31:45.557961	2025-09-09 12:31:45.557961
42	admin	users	export	2025-09-09 12:31:45.622657	2025-09-09 12:31:45.622657
43	admin	users	approve	2025-09-09 12:31:45.693671	2025-09-09 12:31:45.693671
44	admin	user_management	create	2025-09-09 12:31:45.760363	2025-09-09 12:31:45.760363
45	admin	user_management	read	2025-09-09 12:31:45.824918	2025-09-09 12:31:45.824918
46	admin	user_management	update	2025-09-09 12:31:45.889556	2025-09-09 12:31:45.889556
47	admin	user_management	delete	2025-09-09 12:31:45.954188	2025-09-09 12:31:45.954188
48	admin	user_management	export	2025-09-09 12:31:46.019215	2025-09-09 12:31:46.019215
49	admin	user_management	approve	2025-09-09 12:31:46.0839	2025-09-09 12:31:46.0839
50	admin	reports	create	2025-09-09 12:31:46.148445	2025-09-09 12:31:46.148445
51	admin	reports	read	2025-09-09 12:31:46.213676	2025-09-09 12:31:46.213676
52	admin	reports	update	2025-09-09 12:31:46.278399	2025-09-09 12:31:46.278399
53	admin	reports	delete	2025-09-09 12:31:46.34322	2025-09-09 12:31:46.34322
54	admin	reports	export	2025-09-09 12:31:46.408106	2025-09-09 12:31:46.408106
55	admin	reports	approve	2025-09-09 12:31:46.472456	2025-09-09 12:31:46.472456
56	admin	system_preferences	create	2025-09-09 12:31:46.537876	2025-09-09 12:31:46.537876
57	admin	system_preferences	read	2025-09-09 12:31:46.612838	2025-09-09 12:31:46.612838
58	admin	system_preferences	update	2025-09-09 12:31:46.677473	2025-09-09 12:31:46.677473
59	admin	system_preferences	delete	2025-09-09 12:31:46.742018	2025-09-09 12:31:46.742018
60	admin	system_preferences	export	2025-09-09 12:31:46.806917	2025-09-09 12:31:46.806917
61	admin	system_preferences	approve	2025-09-09 12:31:46.87164	2025-09-09 12:31:46.87164
62	admin	backups	create	2025-09-09 12:31:46.936007	2025-09-09 12:31:46.936007
63	admin	backups	read	2025-09-09 12:31:47.000675	2025-09-09 12:31:47.000675
64	admin	backups	update	2025-09-09 12:31:47.068094	2025-09-09 12:31:47.068094
65	admin	backups	delete	2025-09-09 12:31:47.18469	2025-09-09 12:31:47.18469
66	admin	backups	export	2025-09-09 12:31:47.249718	2025-09-09 12:31:47.249718
67	admin	backups	approve	2025-09-09 12:31:47.314936	2025-09-09 12:31:47.314936
68	manager	dashboard	create	2025-09-09 12:31:47.379724	2025-09-09 12:31:47.379724
69	manager	dashboard	read	2025-09-09 12:31:47.444953	2025-09-09 12:31:47.444953
70	manager	dashboard	update	2025-09-09 12:31:47.509671	2025-09-09 12:31:47.509671
71	manager	dashboard	delete	2025-09-09 12:31:47.579027	2025-09-09 12:31:47.579027
72	manager	dashboard	export	2025-09-09 12:31:47.64342	2025-09-09 12:31:47.64342
73	manager	dashboard	approve	2025-09-09 12:31:47.707948	2025-09-09 12:31:47.707948
74	manager	inventory	create	2025-09-09 12:31:47.772573	2025-09-09 12:31:47.772573
75	manager	inventory	read	2025-09-09 12:31:47.842947	2025-09-09 12:31:47.842947
76	manager	inventory	update	2025-09-09 12:31:47.913673	2025-09-09 12:31:47.913673
77	manager	inventory	delete	2025-09-09 12:31:47.98731	2025-09-09 12:31:47.98731
78	manager	inventory	export	2025-09-09 12:31:48.051809	2025-09-09 12:31:48.051809
79	manager	inventory	approve	2025-09-09 12:31:48.116255	2025-09-09 12:31:48.116255
80	manager	orders	create	2025-09-09 12:31:48.181009	2025-09-09 12:31:48.181009
81	manager	orders	read	2025-09-09 12:31:48.245573	2025-09-09 12:31:48.245573
82	manager	orders	update	2025-09-09 12:31:48.31016	2025-09-09 12:31:48.31016
83	manager	orders	delete	2025-09-09 12:31:48.374929	2025-09-09 12:31:48.374929
84	manager	orders	export	2025-09-09 12:31:48.439295	2025-09-09 12:31:48.439295
85	manager	orders	approve	2025-09-09 12:31:48.504159	2025-09-09 12:31:48.504159
86	manager	procurement	create	2025-09-09 12:31:48.568724	2025-09-09 12:31:48.568724
87	manager	procurement	read	2025-09-09 12:31:48.633258	2025-09-09 12:31:48.633258
88	manager	procurement	update	2025-09-09 12:31:48.697603	2025-09-09 12:31:48.697603
89	manager	procurement	delete	2025-09-09 12:31:48.762157	2025-09-09 12:31:48.762157
90	manager	procurement	export	2025-09-09 12:31:48.826719	2025-09-09 12:31:48.826719
91	manager	procurement	approve	2025-09-09 12:31:48.89144	2025-09-09 12:31:48.89144
92	manager	accounting	create	2025-09-09 12:31:48.956139	2025-09-09 12:31:48.956139
93	manager	accounting	read	2025-09-09 12:31:49.020671	2025-09-09 12:31:49.020671
94	manager	accounting	update	2025-09-09 12:31:49.085604	2025-09-09 12:31:49.085604
95	manager	accounting	delete	2025-09-09 12:31:49.150572	2025-09-09 12:31:49.150572
96	manager	accounting	export	2025-09-09 12:31:49.21561	2025-09-09 12:31:49.21561
97	manager	accounting	approve	2025-09-09 12:31:49.280277	2025-09-09 12:31:49.280277
98	manager	expenses	create	2025-09-09 12:31:49.344673	2025-09-09 12:31:49.344673
99	manager	expenses	read	2025-09-09 12:31:49.409597	2025-09-09 12:31:49.409597
100	manager	expenses	update	2025-09-09 12:31:49.473951	2025-09-09 12:31:49.473951
101	manager	expenses	delete	2025-09-09 12:31:49.538428	2025-09-09 12:31:49.538428
102	manager	expenses	export	2025-09-09 12:31:49.6042	2025-09-09 12:31:49.6042
103	manager	expenses	approve	2025-09-09 12:31:49.669041	2025-09-09 12:31:49.669041
104	manager	invoices	create	2025-09-09 12:31:49.735969	2025-09-09 12:31:49.735969
105	manager	invoices	read	2025-09-09 12:31:49.800655	2025-09-09 12:31:49.800655
106	manager	invoices	update	2025-09-09 12:31:49.865276	2025-09-09 12:31:49.865276
107	manager	invoices	delete	2025-09-09 12:31:49.929834	2025-09-09 12:31:49.929834
108	manager	invoices	export	2025-09-09 12:31:49.995959	2025-09-09 12:31:49.995959
109	manager	invoices	approve	2025-09-09 12:31:50.076641	2025-09-09 12:31:50.076641
110	manager	quotations	create	2025-09-09 12:31:50.141317	2025-09-09 12:31:50.141317
111	manager	quotations	read	2025-09-09 12:31:50.207843	2025-09-09 12:31:50.207843
112	manager	quotations	update	2025-09-09 12:31:50.27258	2025-09-09 12:31:50.27258
113	manager	quotations	delete	2025-09-09 12:31:50.337855	2025-09-09 12:31:50.337855
114	manager	quotations	export	2025-09-09 12:31:50.40256	2025-09-09 12:31:50.40256
115	manager	quotations	approve	2025-09-09 12:31:50.467961	2025-09-09 12:31:50.467961
116	manager	customers	create	2025-09-09 12:31:50.532327	2025-09-09 12:31:50.532327
117	manager	customers	read	2025-09-09 12:31:50.596973	2025-09-09 12:31:50.596973
118	manager	customers	update	2025-09-09 12:31:50.662076	2025-09-09 12:31:50.662076
119	manager	customers	delete	2025-09-09 12:31:50.726607	2025-09-09 12:31:50.726607
120	manager	customers	export	2025-09-09 12:31:50.79222	2025-09-09 12:31:50.79222
121	manager	customers	approve	2025-09-09 12:31:50.856744	2025-09-09 12:31:50.856744
122	manager	suppliers	create	2025-09-09 12:31:50.921322	2025-09-09 12:31:50.921322
123	manager	suppliers	read	2025-09-09 12:31:50.986016	2025-09-09 12:31:50.986016
124	manager	suppliers	update	2025-09-09 12:31:51.050738	2025-09-09 12:31:51.050738
125	manager	suppliers	delete	2025-09-09 12:31:51.116156	2025-09-09 12:31:51.116156
126	manager	suppliers	export	2025-09-09 12:31:51.180986	2025-09-09 12:31:51.180986
127	manager	suppliers	approve	2025-09-09 12:31:51.248422	2025-09-09 12:31:51.248422
128	manager	reports	create	2025-09-09 12:31:51.313246	2025-09-09 12:31:51.313246
129	manager	reports	read	2025-09-09 12:31:51.378549	2025-09-09 12:31:51.378549
130	manager	reports	update	2025-09-09 12:31:51.443252	2025-09-09 12:31:51.443252
131	manager	reports	delete	2025-09-09 12:31:51.507936	2025-09-09 12:31:51.507936
132	manager	reports	export	2025-09-09 12:31:51.578171	2025-09-09 12:31:51.578171
133	manager	reports	approve	2025-09-09 12:31:51.642759	2025-09-09 12:31:51.642759
134	sales_rep	dashboard	create	2025-09-09 12:31:51.707264	2025-09-09 12:31:51.707264
135	sales_rep	dashboard	read	2025-09-09 12:31:51.771857	2025-09-09 12:31:51.771857
136	sales_rep	dashboard	update	2025-09-09 12:31:51.836536	2025-09-09 12:31:51.836536
137	sales_rep	dashboard	export	2025-09-09 12:31:51.901435	2025-09-09 12:31:51.901435
138	sales_rep	customers	create	2025-09-09 12:31:51.966088	2025-09-09 12:31:51.966088
139	sales_rep	customers	read	2025-09-09 12:31:52.030667	2025-09-09 12:31:52.030667
140	sales_rep	customers	update	2025-09-09 12:31:52.095115	2025-09-09 12:31:52.095115
141	sales_rep	customers	export	2025-09-09 12:31:52.160164	2025-09-09 12:31:52.160164
142	sales_rep	quotations	create	2025-09-09 12:31:52.224908	2025-09-09 12:31:52.224908
143	sales_rep	quotations	read	2025-09-09 12:31:52.289958	2025-09-09 12:31:52.289958
144	sales_rep	quotations	update	2025-09-09 12:31:52.355239	2025-09-09 12:31:52.355239
145	sales_rep	quotations	export	2025-09-09 12:31:52.419676	2025-09-09 12:31:52.419676
146	sales_rep	invoices	create	2025-09-09 12:31:52.485291	2025-09-09 12:31:52.485291
147	sales_rep	invoices	read	2025-09-09 12:31:52.549769	2025-09-09 12:31:52.549769
148	sales_rep	invoices	update	2025-09-09 12:31:52.616075	2025-09-09 12:31:52.616075
149	sales_rep	invoices	export	2025-09-09 12:31:52.68103	2025-09-09 12:31:52.68103
150	sales_rep	inventory	create	2025-09-09 12:31:52.746059	2025-09-09 12:31:52.746059
151	sales_rep	inventory	read	2025-09-09 12:31:52.8108	2025-09-09 12:31:52.8108
152	sales_rep	inventory	update	2025-09-09 12:31:52.875282	2025-09-09 12:31:52.875282
153	sales_rep	inventory	export	2025-09-09 12:31:52.940352	2025-09-09 12:31:52.940352
154	inventory_manager	dashboard	create	2025-09-09 12:31:53.005	2025-09-09 12:31:53.005
155	inventory_manager	dashboard	read	2025-09-09 12:31:53.070681	2025-09-09 12:31:53.070681
156	inventory_manager	dashboard	update	2025-09-09 12:31:53.135478	2025-09-09 12:31:53.135478
157	inventory_manager	dashboard	delete	2025-09-09 12:31:53.200793	2025-09-09 12:31:53.200793
158	inventory_manager	dashboard	export	2025-09-09 12:31:53.266617	2025-09-09 12:31:53.266617
159	inventory_manager	inventory	create	2025-09-09 12:31:53.331979	2025-09-09 12:31:53.331979
160	inventory_manager	inventory	read	2025-09-09 12:31:53.396513	2025-09-09 12:31:53.396513
161	inventory_manager	inventory	update	2025-09-09 12:31:53.460797	2025-09-09 12:31:53.460797
162	inventory_manager	inventory	delete	2025-09-09 12:31:53.527186	2025-09-09 12:31:53.527186
163	inventory_manager	inventory	export	2025-09-09 12:31:53.591719	2025-09-09 12:31:53.591719
164	inventory_manager	orders	create	2025-09-09 12:31:53.656031	2025-09-09 12:31:53.656031
165	inventory_manager	orders	read	2025-09-09 12:31:53.720606	2025-09-09 12:31:53.720606
166	inventory_manager	orders	update	2025-09-09 12:31:53.785073	2025-09-09 12:31:53.785073
167	inventory_manager	orders	delete	2025-09-09 12:31:53.850937	2025-09-09 12:31:53.850937
168	inventory_manager	orders	export	2025-09-09 12:31:53.918025	2025-09-09 12:31:53.918025
169	inventory_manager	procurement	create	2025-09-09 12:31:53.983229	2025-09-09 12:31:53.983229
170	inventory_manager	procurement	read	2025-09-09 12:31:54.047719	2025-09-09 12:31:54.047719
171	inventory_manager	procurement	update	2025-09-09 12:31:54.112148	2025-09-09 12:31:54.112148
172	inventory_manager	procurement	delete	2025-09-09 12:31:54.176699	2025-09-09 12:31:54.176699
173	inventory_manager	procurement	export	2025-09-09 12:31:54.241278	2025-09-09 12:31:54.241278
174	inventory_manager	suppliers	create	2025-09-09 12:31:54.306061	2025-09-09 12:31:54.306061
175	inventory_manager	suppliers	read	2025-09-09 12:31:54.373696	2025-09-09 12:31:54.373696
176	inventory_manager	suppliers	update	2025-09-09 12:31:54.438079	2025-09-09 12:31:54.438079
177	inventory_manager	suppliers	delete	2025-09-09 12:31:54.502795	2025-09-09 12:31:54.502795
178	inventory_manager	suppliers	export	2025-09-09 12:31:54.567598	2025-09-09 12:31:54.567598
179	accountant	dashboard	create	2025-09-09 12:31:54.632418	2025-09-09 12:31:54.632418
180	accountant	dashboard	read	2025-09-09 12:31:54.698738	2025-09-09 12:31:54.698738
181	accountant	dashboard	update	2025-09-09 12:31:54.763857	2025-09-09 12:31:54.763857
182	accountant	dashboard	export	2025-09-09 12:31:54.828742	2025-09-09 12:31:54.828742
183	accountant	accounting	create	2025-09-09 12:31:54.894474	2025-09-09 12:31:54.894474
184	accountant	accounting	read	2025-09-09 12:31:54.964596	2025-09-09 12:31:54.964596
185	accountant	accounting	update	2025-09-09 12:31:55.02927	2025-09-09 12:31:55.02927
186	accountant	accounting	export	2025-09-09 12:31:55.094197	2025-09-09 12:31:55.094197
187	accountant	expenses	create	2025-09-09 12:31:55.159076	2025-09-09 12:31:55.159076
188	accountant	expenses	read	2025-09-09 12:31:55.223671	2025-09-09 12:31:55.223671
189	accountant	expenses	update	2025-09-09 12:31:55.289094	2025-09-09 12:31:55.289094
190	accountant	expenses	export	2025-09-09 12:31:55.354058	2025-09-09 12:31:55.354058
191	accountant	invoices	create	2025-09-09 12:31:55.420157	2025-09-09 12:31:55.420157
192	accountant	invoices	read	2025-09-09 12:31:55.486093	2025-09-09 12:31:55.486093
193	accountant	invoices	update	2025-09-09 12:31:55.550742	2025-09-09 12:31:55.550742
194	accountant	invoices	export	2025-09-09 12:31:55.61532	2025-09-09 12:31:55.61532
195	accountant	customers	create	2025-09-09 12:31:55.680173	2025-09-09 12:31:55.680173
196	accountant	customers	read	2025-09-09 12:31:55.745125	2025-09-09 12:31:55.745125
197	accountant	customers	update	2025-09-09 12:31:55.813642	2025-09-09 12:31:55.813642
198	accountant	customers	export	2025-09-09 12:31:55.880028	2025-09-09 12:31:55.880028
199	accountant	reports	create	2025-09-09 12:31:55.944688	2025-09-09 12:31:55.944688
200	accountant	reports	read	2025-09-09 12:31:56.013564	2025-09-09 12:31:56.013564
201	accountant	reports	update	2025-09-09 12:31:56.123049	2025-09-09 12:31:56.123049
202	accountant	reports	export	2025-09-09 12:31:56.189437	2025-09-09 12:31:56.189437
203	staff	dashboard	read	2025-09-09 12:31:56.256217	2025-09-09 12:31:56.256217
204	staff	inventory	read	2025-09-09 12:31:56.321487	2025-09-09 12:31:56.321487
205	staff	customers	read	2025-09-09 12:31:56.386295	2025-09-09 12:31:56.386295
206	admin	dashboard	create	2025-09-09 12:32:51.301814	2025-09-09 12:32:51.301814
207	admin	dashboard	read	2025-09-09 12:32:51.6475	2025-09-09 12:32:51.6475
208	admin	dashboard	update	2025-09-09 12:32:51.862173	2025-09-09 12:32:51.862173
209	admin	dashboard	delete	2025-09-09 12:32:52.62829	2025-09-09 12:32:52.62829
210	admin	dashboard	export	2025-09-09 12:32:54.116775	2025-09-09 12:32:54.116775
211	admin	dashboard	approve	2025-09-09 12:32:59.560604	2025-09-09 12:32:59.560604
212	admin	inventory	create	2025-09-09 12:32:59.785736	2025-09-09 12:32:59.785736
213	admin	inventory	read	2025-09-09 12:33:00.132496	2025-09-09 12:33:00.132496
214	admin	inventory	update	2025-09-09 12:33:00.237446	2025-09-09 12:33:00.237446
215	admin	inventory	delete	2025-09-09 12:33:00.311406	2025-09-09 12:33:00.311406
216	admin	inventory	export	2025-09-09 12:33:00.404871	2025-09-09 12:33:00.404871
217	admin	inventory	approve	2025-09-09 12:33:00.705106	2025-09-09 12:33:00.705106
218	admin	orders	create	2025-09-09 12:33:00.932443	2025-09-09 12:33:00.932443
219	admin	orders	read	2025-09-09 12:33:01.043026	2025-09-09 12:33:01.043026
220	admin	orders	update	2025-09-09 12:33:01.495332	2025-09-09 12:33:01.495332
221	admin	orders	delete	2025-09-09 12:33:01.644697	2025-09-09 12:33:01.644697
222	admin	orders	export	2025-09-09 12:33:01.828161	2025-09-09 12:33:01.828161
223	admin	orders	approve	2025-09-09 12:33:01.909813	2025-09-09 12:33:01.909813
224	admin	procurement	create	2025-09-09 12:33:02.53721	2025-09-09 12:33:02.53721
225	admin	procurement	read	2025-09-09 12:33:02.93827	2025-09-09 12:33:02.93827
226	admin	procurement	update	2025-09-09 12:33:03.013933	2025-09-09 12:33:03.013933
227	admin	procurement	delete	2025-09-09 12:33:03.107905	2025-09-09 12:33:03.107905
228	admin	procurement	export	2025-09-09 12:33:03.178483	2025-09-09 12:33:03.178483
\.


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_items (id, sale_id, product_id, quantity, unit_price, discount, total, unit_of_measure) FROM stdin;
3	13	3	1	89000.00	0	89000.00	PCS
4	14	9	900	12.00	0	10800.00	PCS
5	15	8	60	95.00	0	5700.00	PCS
6	16	2	50	18.00	0	900.00	PCS
7	17	2	50	18.00	0	900.00	PCS
8	18	2	50	18.00	0	900.00	PCS
9	19	2	50	18.00	0	900.00	PCS
10	20	2	50	18.00	0	900.00	PCS
11	21	2	50	18.00	0	900.00	PCS
12	22	2	50	18.00	0	900.00	PCS
13	23	2	50	18.00	0	900.00	PCS
14	24	2	50	18.00	0	900.00	PCS
15	25	2	50	18.00	0	900.00	PCS
16	26	2	50	18.00	0	900.00	PCS
17	27	2	50	18.00	0	900.00	PCS
18	28	2	50	18.00	0	900.00	PCS
19	29	2	50	18.00	0	900.00	PCS
20	30	2	50	18.00	0	900.00	PCS
21	31	2	50	18.00	0	900.00	PCS
23	33	2	50	18.00	0	900.00	PCS
26	36	5	1	10.00	0	10.00	PCS
27	37	3	5000	8.00	0	40000.00	PCS
28	38	3	5000	8.00	0	40000.00	PCS
29	39	3	5000	8.00	0	40000.00	PCS
30	40	3	5000	8.00	0	40000.00	PCS
31	41	3	5	8.00	0	40.00	PCS
34	44	3	5000	8.00	0	40000.00	PCS
40	50	10	300	18.00	0	5400.00	PCS
41	51	10	300	18.00	0	5400.00	PCS
43	53	10	300	18.00	0	5400.00	PCS
44	54	10	300	18.00	0	5400.00	PCS
46	56	5	2	25.00	0	50.00	PCS
47	57	10	300	18.00	0	5400.00	PCS
48	58	10	300	18.00	0	5400.00	PCS
49	59	10	300	18.00	0	5400.00	PCS
50	60	10	300	18.00	0	5400.00	PCS
51	61	2	500	18.00	0	9000.00	PCS
53	63	58	100	22.50	0	2250.00	PCS
54	64	10	100	18.00	0	1800.00	PCS
55	65	58	200	22.50	0	4500.00	PCS
60	70	10	47	18.00	0	846.00	PCS
61	70	3	1	8.00	0	8.00	PCS
62	71	57	1	35.00	0	35.00	PCS
63	71	3	1	8.00	0	8.00	PCS
\.


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sales (id, invoice_number, customer_id, user_id, date, total_amount, discount, tax, grand_total, payment_method, payment_status, notes, created_at, eta_status, eta_reference, eta_uuid, eta_submission_date, eta_response, eta_error_message, subtotal, discount_amount, tax_rate, tax_amount, vat_rate, vat_amount, amount_paid, payment_terms) FROM stdin;
6	INV-000001	1	1	2025-01-15 00:00:00	1250.00	0.00	175.00	1425.00	bank_transfer	paid	Chemical supplies order	2025-01-15 10:00:00	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
7	INV-000002	2	1	2025-01-20 00:00:00	2800.00	140.00	392.00	3052.00	credit_card	paid	Laboratory equipment	2025-01-20 14:30:00	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
8	INV-000003	3	1	2025-01-25 00:00:00	950.00	0.00	133.00	1083.00	bank_transfer	pending	Safety equipment order	2025-01-25 09:15:00	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
9	INV-000004	1	1	2025-02-01 00:00:00	3200.00	160.00	448.00	3488.00	bank_transfer	paid	Bulk chemical order	2025-02-01 11:20:00	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
10	INV-000005	2	1	2025-02-05 00:00:00	1750.00	0.00	245.00	1995.00	cash	paid	Emergency supplies	2025-02-05 16:45:00	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
11	INV-000006	\N	1	2025-07-11 16:33:53.5	36480.00	0	4480.00	36480.00	cash	pending		2025-07-11 16:33:53.535509	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
12	INV-000007	1	1	2025-07-11 16:33:55.514	36480.00	0	4480.00	36480.00	cash	pending		2025-07-11 16:33:55.549388	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
13	INV-000008	1	1	2025-07-11 16:38:52.498	105020.00	0	16020.00	105020.00	cash	pending		2025-07-11 16:38:52.533535	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
14	INV-000009	1	1	2025-07-11 16:50:00.927	12646.80	0	1846.80	12646.80	cheque	partial	please be on time******	2025-07-11 16:50:00.963161	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
15	INV-000010	2	1	2025-07-11 16:58:13.907	6674.70	0	974.70	6674.70	cash	partial		2025-07-11 16:58:13.942525	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
16	INV-000011	2	1	2025-07-11 17:05:08.634	1053.90	0	153.90	1053.90	cash	partial		2025-07-11 17:05:08.670123	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
17	INV-000012	2	1	2025-07-11 17:05:10.816	1053.90	0	153.90	1053.90	cash	partial		2025-07-11 17:05:10.850208	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
18	INV-000013	2	1	2025-07-11 17:07:04.773	1053.90	0	153.90	1053.90	cash	partial		2025-07-11 17:07:04.808648	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
19	INV-000014	2	1	2025-07-11 17:07:06.83	1053.90	0	153.90	1053.90	cash	partial		2025-07-11 17:07:06.864353	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
20	INV-000015	2	1	2025-07-11 17:07:09.355	1053.90	0	153.90	1053.90	cash	partial		2025-07-11 17:07:09.390569	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
21	INV-000016	2	1	2025-07-11 17:07:11.418	1053.90	0	153.90	1053.90	cash	partial		2025-07-11 17:07:11.453235	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
22	INV-000017	2	1	2025-07-11 17:07:35.771	1053.90	0	153.90	1053.90	cash	partial		2025-07-11 17:07:35.805327	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
23	INV-000018	2	1	2025-07-11 17:07:38.246	1053.90	0	153.90	1053.90	cash	partial		2025-07-11 17:07:38.281059	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
24	INV-000019	2	1	2025-07-11 17:07:49.624	1053.90	0	153.90	1053.90	cash	partial		2025-07-11 17:07:49.702085	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
25	INV-000020	2	1	2025-07-11 17:07:51.368	1053.90	0	153.90	1053.90	cash	partial		2025-07-11 17:07:51.403376	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
26	INV-000021	1	1	2025-07-11 17:08:06.058	1053.90	0	153.90	1053.90	cash	partial		2025-07-11 17:08:06.092716	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
27	INV-000022	1	1	2025-07-11 17:08:08.608	1053.90	0	153.90	1053.90	cash	partial		2025-07-11 17:08:08.643137	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
28	INV-000023	2	1	2025-07-11 17:09:45.611	1053.90	0	153.90	1053.90	cash	partial		2025-07-11 17:09:45.645171	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
29	INV-000024	2	1	2025-07-11 17:09:47.614	1053.90	0	153.90	1053.90	cash	partial		2025-07-11 17:09:47.648125	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
30	INV-000025	2	1	2025-07-11 17:09:55.953	1053.90	0	153.90	1053.90	cash	paid		2025-07-11 17:09:55.987296	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
31	INV-000026	2	1	2025-07-11 17:09:59.758	1053.90	0	153.90	1053.90	cash	paid		2025-07-11 17:09:59.792807	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
32	INV-000027	1	1	2025-07-11 17:11:20.791	57.00	0	7.00	57.00	cash	pending	Test invoice creation	2025-07-11 17:11:20.825909	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
33	INV-000028	2	1	2025-07-11 17:12:07.256	1053.90	0	153.90	1053.90	cash	partial		2025-07-11 17:12:07.291792	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
34	INV-000029	1	1	2025-07-11 17:13:57.683	34.20	0	4.20	34.20	cash	pending	Test with proper invoice number	2025-07-11 17:13:57.718118	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
35	INV-000030	1	1	2025-07-11 17:14:07.399	34.20	0	4.20	34.20	cash	pending	Test with fixed inventory	2025-07-11 17:14:07.434097	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
36	INV-000031	1	1	2025-07-11 17:14:46.74	11.40	0	1.40	11.40	cash	unpaid		2025-07-11 17:14:46.775114	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
37	INV-000032	3	1	2025-07-11 17:17:40.179	45600.00	0	5600.00	45600.00	cash	partial		2025-07-11 17:17:40.214715	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
38	INV-000033	3	1	2025-07-11 17:17:41.782	45600.00	0	5600.00	45600.00	cash	partial		2025-07-11 17:17:41.816841	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
39	INV-000034	3	1	2025-07-11 17:17:59.964	45600.00	0	5600.00	45600.00	cash	partial		2025-07-11 17:17:59.998372	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
40	INV-000035	3	1	2025-07-11 17:18:01.963	45600.00	0	5600.00	45600.00	cash	partial		2025-07-11 17:18:01.997796	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
41	INV-000036	3	1	2025-07-11 17:18:30.485	45.60	0	5.60	45.60	cash	pending	Test invoice after inventory fix	2025-07-11 17:18:30.520085	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
42	INV-000037	1	1	2025-07-11 17:19:12.793	136.80	0	16.80	136.80	cash	pending	Test invoice - inventory fixed	2025-07-11 17:19:12.827531	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
43	INV-000038	1	1	2025-07-11 17:19:58.221	57.00	0	7.00	57.00	cash	pending	Test - confirming system works	2025-07-11 17:19:58.258776	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
44	INV-000039	2	1	2025-07-11 17:21:02.557	45600.00	0	5600.00	45600.00	cash	partial		2025-07-11 17:21:02.591328	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
45	INV-000040	2	1	2025-07-14 09:10:56.449	36256.00	0	4256.00	36256.00	cash	partial		2025-07-14 09:10:56.485542	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
46	INV-000041	2	1	2025-07-14 09:10:58.39	36256.00	0	4256.00	36256.00	cash	partial		2025-07-14 09:10:58.427104	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
47	INV-000042	1	1	2025-07-14 09:13:19.789	136.80	0	16.80	136.80	cash	pending	Test invoice creation	2025-07-14 09:13:19.823591	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
48	INV-000043	3	1	2025-07-14 09:27:36.032	36256.00	0	4256.00	36256.00	cash	partial		2025-07-14 09:27:36.068118	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
49	INV-000044	3	1	2025-07-14 09:27:38.155	36256.00	0	4256.00	36256.00	cash	partial		2025-07-14 09:27:38.191896	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
50	INV-000045	2	1	2025-07-14 09:28:48.799	6156.00	0	756.00	6156.00	cash	partial		2025-07-14 09:28:48.835628	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
51	INV-000046	2	1	2025-07-14 09:28:50.643	6156.00	0	756.00	6156.00	cash	partial		2025-07-14 09:28:50.679235	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
52	INV-000047	2	1	2025-07-14 09:29:53.003	68.40	0	8.40	68.40	cash	pending	Test invoice after inventory fix	2025-07-14 09:29:53.038397	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
53	INV-000048	1	1	2025-07-14 09:31:51.303	6156.00	0	756.00	6156.00	cash	partial		2025-07-14 09:31:51.340721	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
54	INV-000049	1	1	2025-07-14 09:31:53.239	6156.00	0	756.00	6156.00	cash	partial		2025-07-14 09:31:53.275717	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
55	INV-000050	1	1	2025-07-14 09:33:44.188	68.40	0	8.40	68.40	cash	pending	Test invoice after all fixes	2025-07-14 09:33:44.223922	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
56	INV-000051	2	1	2025-07-14 09:34:11.245	57.00	0	7.00	57.00	cash	pending	Final test of invoice creation	2025-07-14 09:34:11.280383	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
57	INV-000052	1	1	2025-07-14 09:36:42.669	6156.00	0	756.00	6156.00	cash	unpaid		2025-07-14 09:36:42.704316	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
58	INV-000053	1	1	2025-07-14 09:36:44.492	6156.00	0	756.00	6156.00	cash	unpaid		2025-07-14 09:36:44.527294	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
59	INV-000054	1	1	2025-07-14 09:44:02.447	6156.00	0	756.00	6156.00	cash	partial		2025-07-14 09:44:02.482109	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
61	INV-000056	2	1	2025-07-14 21:37:18.566	10259.30	0	1259.30	10259.30	cash	partial		2025-07-14 21:37:18.602708	failed	\N	\N	\N	\N	ETA credentials not configured. Please authenticate with Egyptian Tax Authority first.	0	0	14	0	14	0	0	0
62	INV-000057	2	1	2025-07-26 08:51:35.535	36480.00	0	4480.00	36480.00	cash	unpaid		2025-07-26 08:51:35.570652	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
63	INV-000058	3	1	2025-08-23 16:31:34.182	2549.25	0	299.25	2549.25	cash	partial		2025-08-23 16:31:34.193193	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
65	INV-000060	1	1	2025-08-24 06:54:41.718	5098.50	0.00	598.50	5429.25	cash	partial		2025-08-24 06:54:41.755133	not_sent	\N	\N	\N	\N	\N	4500.00	0.00	14.00	598.50	14.00	0.00	429.25	0
60	INV-000055	1	1	2025-07-14 09:44:04.419	6156.00	0	756.00	6156.00	cash	partial		2025-07-14 09:44:04.4534	not_sent	\N	\N	\N	\N	\N	0	0	14	0	14	0	0	0
64	INV-000059	1	1	2025-08-24 06:28:06.741	2046.96	0	246.96	2010.96	cash	partial		2025-08-24 06:28:06.777011	not_sent	\N	\N	\N	\N	\N	1800.00	36.00	14	246.96	14	0	500.00	0
66	INV-000061	3	1	2025-08-31 06:19:44.608	36480.00	0.00	4480.00	36480.00	cash	unpaid		2025-08-31 06:19:44.643813	not_sent	\N	\N	\N	\N	\N	32000.00	0.00	14.00	4480.00	14.00	0.00	0.00	0
67	INV-000062	3	1	2025-08-31 06:19:56.853	36480.00	0.00	4480.00	36480.00	cash	unpaid		2025-08-31 06:19:56.888637	not_sent	\N	\N	\N	\N	\N	32000.00	0.00	14.00	4480.00	14.00	0.00	0.00	0
68	INV-000063	3	1	2025-08-31 06:20:18.472	36480.00	0.00	4480.00	36480.00	cash	paid		2025-08-31 06:20:18.506928	not_sent	\N	\N	\N	\N	\N	32000.00	0.00	14.00	4480.00	14.00	0.00	36480.00	0
69	INV-000064	3	1	2025-08-31 06:20:35.038	7.30	0.00	0.90	7.30	cash	paid		2025-08-31 06:20:35.073399	not_sent	\N	\N	\N	\N	\N	6.40	0.00	14.00	0.90	14.00	0.00	36480.00	0
70	INV-000065	2	1	2025-09-16 09:18:55.021	973.56	0.00	119.56	973.56	cash	partial		2025-09-16 09:18:55.056211	not_sent	\N	\N	\N	\N	\N	854.00	0.00	14.00	119.56	14.00	0.00	150.00	15
71	INV-000066	2	1	2025-09-16 22:57:47.704	49.02	0.00	6.02	55.04	cash	unpaid		2025-09-16 22:57:47.740079	not_sent	\N	\N	\N	\N	\N	43.00	0.00	14.00	6.02	14.00	0.00	0.00	0
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.suppliers (id, name, contact_person, email, phone, address, city, state, zip_code, materials, created_at, updated_at, supplier_type, eta_number) FROM stdin;
1	Alpha Chemical Industries	Dr. Sarah Ahmed	sarah.ahmed@alphachem.com	+20-100-555-0101	15 Industrial Zone, 6th of October City	Giza	Giza Governorate	12566	Raw Materials, Pharmaceutical Ingredients	2025-07-11 16:31:53.181879	2025-07-11 16:31:53.181879	\N	\N
2	Beta Pharmaceuticals	Ahmed Hassan	ahmed@betapharma.com	+20-100-555-0202	25 Industrial Road, Nasr City	Cairo	Cairo Governorate	11371	Active Pharmaceutical Ingredients	2025-07-11 21:38:23.702919	2025-07-11 21:38:23.702919	International	ETA987654321
3	Premier Intellect				31 Emad El din St. Downtown Cairo Egypt	Cairo	القاهرة	11111	\N	2025-07-11 21:39:20.822928	2025-07-11 21:39:20.822928	Local	\N
4	Premier Intellect				31 Emad El din St. Downtown Cairo Egypt	Cairo	القاهرة	11111	\N	2025-07-11 21:39:32.44353	2025-07-11 21:39:32.44353	International	\N
5	Premier Intellect pro				31 Emad El din St. Downtown Cairo Egypt	Cairo	القاهرة	11111	\N	2025-07-11 21:49:36.220978	2025-07-11 21:49:36.220978	International	\N
6	Global Pharmaceuticals Ltd	Dr. Maria Rodriguez	maria.rodriguez@globalpharma.com	+1-555-0123	123 Medical Drive	San Francisco	California	94102	Advanced Drug Delivery Systems	2025-07-12 09:15:06.62087	2025-07-12 09:15:06.62087	International	ETA123456789
7	MedTech Solutions Inc	John Smith	john.smith@medtech.com	+1-555-0234	456 Innovation Blvd	Boston	Massachusetts	02101	Medical Equipment, Laboratory Supplies	2025-07-12 09:15:06.62087	2025-07-12 09:15:06.62087	Domestic	ETA234567890
8	BioChemical Enterprises	Dr. Zhang Wei	zhang.wei@biochem.com	+86-138-0013-8000	789 Science Park Road	Shanghai	Shanghai	200120	Biochemical Reagents, Research Chemicals	2025-07-12 09:15:06.62087	2025-07-12 09:15:06.62087	International	ETA345678901
9	European Medicine Supply	Dr. Hans Mueller	hans.mueller@eumedicine.de	+49-30-12345678	321 Pharma Street	Berlin	Berlin	10115	European Pharmaceutical Standards	2025-07-12 09:15:06.62087	2025-07-12 09:15:06.62087	International	ETA456789012
10	Local Chemical Distributors	Ahmed Al-Mansouri	ahmed@localchem.ae	+971-4-1234567	654 Industrial Zone	Dubai	Dubai	12345	Local Chemical Distribution	2025-07-12 09:15:06.62087	2025-07-12 09:15:06.62087	Regional	ETA567890123
11	Advanced Materials Corp	Dr. Sarah Johnson	sarah.johnson@advmaterials.com	+1-555-0345	987 Technology Way	Austin	Texas	73301	Advanced Composite Materials	2025-07-12 09:15:06.62087	2025-07-12 09:15:06.62087	Domestic	\N
12	Precision Instruments Ltd	Michael Chen	michael.chen@precision.com	+1-555-0456	147 Precision Avenue	Seattle	Washington	98101	Precision Laboratory Instruments	2025-07-12 09:15:06.62087	2025-07-12 09:15:06.62087	Domestic	\N
\.


--
-- Data for Name: system_preferences; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.system_preferences (id, key, value, created_at, updated_at, category, label, description, data_type, options) FROM stdin;
1	company_name	"Premier ERP System"	2025-07-13 17:24:46.407421	2025-07-13 17:24:46.407421	\N	\N	\N	\N	\N
2	company_email	"support@premiererp.com"	2025-07-13 17:24:46.407421	2025-07-13 17:24:46.407421	\N	\N	\N	\N	\N
3	company_phone	"+20 123 456 7890"	2025-07-13 17:24:46.407421	2025-07-13 17:24:46.407421	\N	\N	\N	\N	\N
4	company_address	"123 Industrial Street, Cairo, Egypt"	2025-07-13 17:24:46.407421	2025-07-13 17:24:46.407421	\N	\N	\N	\N	\N
5	currency_code	"EGP"	2025-07-13 17:24:46.407421	2025-07-13 17:24:46.407421	\N	\N	\N	\N	\N
6	timezone	"Africa/Cairo"	2025-07-13 17:24:46.407421	2025-07-13 17:24:46.407421	\N	\N	\N	\N	\N
7	date_format	"DD/MM/YYYY"	2025-07-13 17:24:46.407421	2025-07-13 17:24:46.407421	\N	\N	\N	\N	\N
8	theme	"light"	2025-07-13 17:24:46.407421	2025-07-13 17:24:46.407421	\N	\N	\N	\N	\N
9	language	"en"	2025-07-13 17:24:46.407421	2025-07-13 17:24:46.407421	\N	\N	\N	\N	\N
10	backup_enabled	true	2025-07-13 17:24:46.407421	2025-07-13 17:24:46.407421	\N	\N	\N	\N	\N
11	notification_enabled	true	2025-07-13 17:24:46.407421	2025-07-13 17:24:46.407421	\N	\N	\N	\N	\N
12	debug_mode	false	2025-07-13 17:24:46.407421	2025-07-13 17:24:46.407421	\N	\N	\N	\N	\N
\.


--
-- Data for Name: user_permissions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_permissions (id, user_id, module_name, access_granted, created_at, updated_at) FROM stdin;
55	3	createQuotation	f	2025-07-13 20:26:45.059308	2025-07-13 20:26:45.059308
56	3	createInvoice	f	2025-07-13 20:26:45.059776	2025-07-13 20:26:45.059776
20	1	inventory	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
21	1	create-invoice	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
22	1	invoice-history	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
23	1	quotations	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
24	1	quotation-history	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
26	1	customer-payments	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
30	1	orders	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
31	1	orders-history	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
34	1	user-management	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
35	1	system-preferences	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
37	1	backup	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
38	1	settings	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
39	1	notifications	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
40	1	payroll	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
49	3	products	t	2025-07-13 20:26:44.66304	2025-07-13 20:26:44.66304
18	1	dashboard	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
28	1	expenses	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
50	3	expenses	f	2025-07-13 20:26:44.67544	2025-07-13 20:26:44.67544
51	3	suppliers	t	2025-07-13 20:26:44.79469	2025-07-13 20:26:44.79469
53	3	customers	t	2025-07-13 20:26:44.867284	2025-07-13 20:26:44.867284
54	3	dashboard	f	2025-07-13 20:26:44.868373	2025-07-13 20:26:44.868373
33	1	accounting	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
27	1	suppliers	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
25	1	customers	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
41	1	createInvoice	t	2025-07-13 18:45:36.464973	2025-07-13 18:45:36.464973
42	1	createQuotation	t	2025-07-13 18:45:36.646732	2025-07-13 18:45:36.646732
43	1	invoiceHistory	t	2025-07-13 18:45:36.861478	2025-07-13 18:45:36.861478
44	1	quotationHistory	t	2025-07-13 18:45:37.048768	2025-07-13 18:45:37.048768
45	1	orderManagement	t	2025-07-13 18:45:37.055282	2025-07-13 18:45:37.055282
46	1	ordersHistory	t	2025-07-13 18:45:37.245423	2025-07-13 18:45:37.245423
36	1	label	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
29	1	reports	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
32	1	procurement	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
47	1	userManagement	t	2025-07-13 18:45:37.859985	2025-07-13 18:45:37.859985
48	1	systemPreferences	t	2025-07-13 18:45:37.934888	2025-07-13 18:45:37.934888
67	2	products	t	2025-07-13 20:38:14.212544	2025-07-13 20:38:14.212544
69	2	accounting	t	2025-07-13 20:38:17.42549	2025-07-13 20:38:17.42549
70	2	systemPreferences	t	2025-07-13 20:38:19.597503	2025-07-13 20:38:19.597503
71	2	userManagement	t	2025-07-13 20:38:21.016248	2025-07-13 20:38:21.016248
72	2	procurement	t	2025-07-13 20:38:24.16404	2025-07-13 20:38:24.16404
19	1	products	t	2025-07-13 17:04:49.544723	2025-07-13 17:04:49.544723
52	3	accounting	f	2025-07-13 20:26:44.803053	2025-07-13 20:26:44.803053
73	2	reports	t	2025-07-13 20:38:25.613736	2025-07-13 20:38:25.613736
66	2	dashboard	t	2025-07-13 20:38:12.285011	2025-07-13 20:38:12.285011
64	3	userManagement	f	2025-07-13 20:26:45.960126	2025-07-13 20:26:45.960126
65	3	systemPreferences	f	2025-07-13 20:26:46.014581	2025-07-13 20:26:46.014581
63	3	procurement	f	2025-07-13 20:26:45.767921	2025-07-13 20:26:45.767921
62	3	reports	f	2025-07-13 20:26:45.696942	2025-07-13 20:26:45.696942
61	3	label	f	2025-07-13 20:26:45.633125	2025-07-13 20:26:45.633125
68	2	expenses	f	2025-07-13 20:38:16.288025	2025-07-13 20:38:16.288025
59	3	ordersHistory	f	2025-07-13 20:26:45.505719	2025-07-13 20:26:45.505719
60	3	orderManagement	f	2025-07-13 20:26:45.507835	2025-07-13 20:26:45.507835
57	3	quotationHistory	f	2025-07-13 20:26:45.378497	2025-07-13 20:26:45.378497
58	3	invoiceHistory	f	2025-07-13 20:26:45.441785	2025-07-13 20:26:45.441785
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, password, name, email, role, status, avatar, created_at, updated_at) FROM stdin;
1	admin	admin123	Maged Morgan	maged.morgan@morganerp.com	admin	active	\N	2025-07-09 23:52:57.849858	2025-07-09 23:52:57.849858
2	maged.morgan	admin123	Maged Morgan	maged.morgan@morganerp.com	admin	active	\N	2025-07-13 17:21:15.719516	2025-07-13 17:21:15.719516
3	test_user	password123	Test User	test@premiererp.com	staff	active	\N	2025-07-13 20:19:47.56301	2025-07-13 20:19:47.56301
\.


--
-- Data for Name: warehouse_inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.warehouse_inventory (id, product_id, warehouse_id, quantity, reserved_quantity, last_updated, updated_by) FROM stdin;
1	10	1	150	20	2025-09-23 21:42:34.750269	1
2	10	2	75	5	2025-09-23 21:42:34.750269	1
3	10	4	200	30	2025-09-23 21:42:34.750269	1
4	57	1	500	50	2025-09-23 21:42:34.750269	1
5	57	2	300	0	2025-09-23 21:42:34.750269	1
6	57	4	1000	100	2025-09-23 21:42:34.750269	1
7	48	3	250	25	2025-09-23 21:42:34.750269	1
8	49	3	180	15	2025-09-23 21:42:34.750269	1
9	50	5	75	10	2025-09-23 21:42:34.750269	1
\.


--
-- Data for Name: warehouses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.warehouses (id, name, code, address, manager_id, is_active, created_at) FROM stdin;
1	Main Warehouse	MW001	Main Storage Facility - Central Building	\N	t	2025-07-14 22:19:28.082117
2	Temperature-Controlled Storage	TCS001	Climate Controlled Unit - Building B	\N	t	2025-07-14 22:19:28.082117
3	Raw Materials Section	RMS001	Raw Materials Storage - Building A	\N	t	2025-07-14 22:19:28.082117
4	Medical Supplies Warehouse	MSW001	Medical Equipment Storage - Building C	\N	t	2025-07-14 22:19:28.082117
5	Finished Goods Area	FGA001	Finished Products Storage - Building D	\N	t	2025-07-14 22:19:28.082117
6	Packaging	WH1755341626652	Packaging and Quality Control Area	\N	t	2025-08-16 10:53:47.075
\.


--
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.accounts_id_seq', 8, true);


--
-- Name: authorization_config_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.authorization_config_assignments_id_seq', 1, false);


--
-- Name: authorization_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.authorization_configs_id_seq', 1, false);


--
-- Name: authorization_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.authorization_logs_id_seq', 1, false);


--
-- Name: customer_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.customer_payments_id_seq', 1, false);


--
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.customers_id_seq', 14, true);


--
-- Name: expense_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.expense_categories_id_seq', 5, true);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.expenses_id_seq', 19, true);


--
-- Name: feature_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.feature_permissions_id_seq', 1, false);


--
-- Name: field_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.field_permissions_id_seq', 1, false);


--
-- Name: inventory_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.inventory_transactions_id_seq', 14, true);


--
-- Name: journal_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.journal_entries_id_seq', 49, true);


--
-- Name: journal_entry_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.journal_entry_lines_id_seq', 83, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.orders_id_seq', 22, true);


--
-- Name: product_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.product_categories_id_seq', 2, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.products_id_seq', 71, true);


--
-- Name: purchase_order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.purchase_order_items_id_seq', 65, true);


--
-- Name: purchase_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.purchase_orders_id_seq', 30, true);


--
-- Name: quotation_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.quotation_items_id_seq', 14, true);


--
-- Name: quotation_packaging_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.quotation_packaging_items_id_seq', 1, true);


--
-- Name: quotations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.quotations_id_seq', 32, true);


--
-- Name: refunds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.refunds_id_seq', 1, false);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 31881, true);


--
-- Name: sale_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_items_id_seq', 63, true);


--
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sales_id_seq', 71, true);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 12, true);


--
-- Name: system_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.system_preferences_id_seq', 12, true);


--
-- Name: user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_permissions_id_seq', 73, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: warehouse_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.warehouse_inventory_id_seq', 9, true);


--
-- Name: warehouses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.warehouses_id_seq', 6, true);


--
-- Name: accounts accounts_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_code_key UNIQUE (code);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: authorization_config_assignments authorization_config_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.authorization_config_assignments
    ADD CONSTRAINT authorization_config_assignments_pkey PRIMARY KEY (id);


--
-- Name: authorization_configs authorization_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.authorization_configs
    ADD CONSTRAINT authorization_configs_pkey PRIMARY KEY (id);


--
-- Name: authorization_logs authorization_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.authorization_logs
    ADD CONSTRAINT authorization_logs_pkey PRIMARY KEY (id);


--
-- Name: customer_payments customer_payments_payment_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_payments
    ADD CONSTRAINT customer_payments_payment_number_key UNIQUE (payment_number);


--
-- Name: customer_payments customer_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_payments
    ADD CONSTRAINT customer_payments_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: feature_permissions feature_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feature_permissions
    ADD CONSTRAINT feature_permissions_pkey PRIMARY KEY (id);


--
-- Name: field_permissions field_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.field_permissions
    ADD CONSTRAINT field_permissions_pkey PRIMARY KEY (id);


--
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);


--
-- Name: journal_entries journal_entries_entry_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_entry_number_key UNIQUE (entry_number);


--
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);


--
-- Name: journal_entry_lines journal_entry_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.journal_entry_lines
    ADD CONSTRAINT journal_entry_lines_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- Name: purchase_order_items purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: purchase_orders purchase_orders_po_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_po_number_key UNIQUE (po_number);


--
-- Name: quotation_items quotation_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quotation_items
    ADD CONSTRAINT quotation_items_pkey PRIMARY KEY (id);


--
-- Name: quotation_packaging_items quotation_packaging_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quotation_packaging_items
    ADD CONSTRAINT quotation_packaging_items_pkey PRIMARY KEY (id);


--
-- Name: quotations quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_pkey PRIMARY KEY (id);


--
-- Name: quotations quotations_quotation_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_quotation_number_key UNIQUE (quotation_number);


--
-- Name: refunds refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_resource_action_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_resource_action_key UNIQUE (role, resource, action);


--
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- Name: sales sales_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_invoice_number_key UNIQUE (invoice_number);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: system_preferences system_preferences_key_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_preferences
    ADD CONSTRAINT system_preferences_key_key UNIQUE (key);


--
-- Name: system_preferences system_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.system_preferences
    ADD CONSTRAINT system_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: warehouse_inventory warehouse_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.warehouse_inventory
    ADD CONSTRAINT warehouse_inventory_pkey PRIMARY KEY (id);


--
-- Name: warehouse_inventory warehouse_inventory_product_id_warehouse_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.warehouse_inventory
    ADD CONSTRAINT warehouse_inventory_product_id_warehouse_id_key UNIQUE (product_id, warehouse_id);


--
-- Name: warehouses warehouses_code_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_code_key UNIQUE (code);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: idx_authorization_configs_active; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_authorization_configs_active ON public.authorization_configs USING btree (is_active);


--
-- Name: idx_authorization_configs_type; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_authorization_configs_type ON public.authorization_configs USING btree (type);


--
-- Name: idx_authorization_logs_created_at; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_authorization_logs_created_at ON public.authorization_logs USING btree (created_at);


--
-- Name: idx_authorization_logs_module_feature; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_authorization_logs_module_feature ON public.authorization_logs USING btree (module, feature);


--
-- Name: idx_authorization_logs_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_authorization_logs_user_id ON public.authorization_logs USING btree (user_id);


--
-- Name: idx_config_assignments_config_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_config_assignments_config_id ON public.authorization_config_assignments USING btree (config_id);


--
-- Name: idx_field_permissions_module_entity_field; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_field_permissions_module_entity_field ON public.field_permissions USING btree (module, entity_type, field_name);


--
-- Name: idx_field_permissions_priority; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_field_permissions_priority ON public.field_permissions USING btree (priority);


--
-- Name: idx_field_permissions_target_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_field_permissions_target_id ON public.field_permissions USING btree (target_id);


--
-- Name: idx_field_permissions_target_role; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_field_permissions_target_role ON public.field_permissions USING btree (target_role);


--
-- Name: idx_journal_entries_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_journal_entries_date ON public.journal_entries USING btree (date);


--
-- Name: idx_journal_entry_lines_account; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_journal_entry_lines_account ON public.journal_entry_lines USING btree (account_id);


--
-- Name: idx_products_expiry; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_products_expiry ON public.products USING btree (expiry_date);


--
-- Name: idx_products_quantity; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_products_quantity ON public.products USING btree (quantity);


--
-- Name: idx_sales_customer; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_sales_customer ON public.sales USING btree (customer_id);


--
-- Name: idx_sales_date; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_sales_date ON public.sales USING btree (date);


--
-- Name: authorization_config_assignments authorization_config_assignments_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.authorization_config_assignments
    ADD CONSTRAINT authorization_config_assignments_config_id_fkey FOREIGN KEY (config_id) REFERENCES public.authorization_configs(id);


--
-- Name: authorization_config_assignments authorization_config_assignments_target_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.authorization_config_assignments
    ADD CONSTRAINT authorization_config_assignments_target_id_fkey FOREIGN KEY (target_id) REFERENCES public.users(id);


--
-- Name: authorization_configs authorization_configs_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.authorization_configs
    ADD CONSTRAINT authorization_configs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: authorization_logs authorization_logs_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.authorization_logs
    ADD CONSTRAINT authorization_logs_config_id_fkey FOREIGN KEY (config_id) REFERENCES public.authorization_configs(id);


--
-- Name: authorization_logs authorization_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.authorization_logs
    ADD CONSTRAINT authorization_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: customer_payments customer_payments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_payments
    ADD CONSTRAINT customer_payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: customer_payments customer_payments_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.customer_payments
    ADD CONSTRAINT customer_payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.sales(id);


--
-- Name: expenses expenses_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id);


--
-- Name: expenses expenses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: feature_permissions feature_permissions_target_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feature_permissions
    ADD CONSTRAINT feature_permissions_target_id_fkey FOREIGN KEY (target_id) REFERENCES public.users(id);


--
-- Name: field_permissions field_permissions_target_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.field_permissions
    ADD CONSTRAINT field_permissions_target_id_fkey FOREIGN KEY (target_id) REFERENCES public.users(id);


--
-- Name: inventory_transactions inventory_transactions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: journal_entries journal_entries_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: journal_entries journal_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: journal_entry_lines journal_entry_lines_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.journal_entry_lines
    ADD CONSTRAINT journal_entry_lines_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: journal_entry_lines journal_entry_lines_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.journal_entry_lines
    ADD CONSTRAINT journal_entry_lines_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: orders orders_target_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_target_product_id_fkey FOREIGN KEY (target_product_id) REFERENCES public.products(id);


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.product_categories(id);


--
-- Name: products products_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: purchase_order_items purchase_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: purchase_order_items purchase_order_items_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_order_items
    ADD CONSTRAINT purchase_order_items_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id);


--
-- Name: purchase_orders purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: purchase_orders purchase_orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_orders
    ADD CONSTRAINT purchase_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: quotation_items quotation_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quotation_items
    ADD CONSTRAINT quotation_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: quotation_items quotation_items_quotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quotation_items
    ADD CONSTRAINT quotation_items_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id);


--
-- Name: quotation_packaging_items quotation_packaging_items_quotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quotation_packaging_items
    ADD CONSTRAINT quotation_packaging_items_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE CASCADE;


--
-- Name: quotations quotations_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: quotations quotations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: refunds refunds_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: refunds refunds_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.refunds
    ADD CONSTRAINT refunds_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.sales(id);


--
-- Name: sale_items sale_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: sale_items sale_items_sale_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id);


--
-- Name: sales sales_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: sales sales_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_permissions user_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: warehouse_inventory warehouse_inventory_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.warehouse_inventory
    ADD CONSTRAINT warehouse_inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: warehouse_inventory warehouse_inventory_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.warehouse_inventory
    ADD CONSTRAINT warehouse_inventory_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: warehouse_inventory warehouse_inventory_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.warehouse_inventory
    ADD CONSTRAINT warehouse_inventory_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

