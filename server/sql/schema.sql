CREATE TABLE transactions
(
    id bigserial NOT NULL PRIMARY KEY,
    deposit_coin_name text NOT NULL,
    receive_coin_name text NOT NULL,
    deposit_address text,
    dest_address text NOT NULL,
    refund_address text NOT NULL,
    deposit_amount float8 DEFAULT 0 NOT NULL,
    receive_amount float8 DEFAULT 0 NOT NULL,
    trading_type text NOT NULL,
    step int2 DEFAULT 0 NOT NULL,
    is_ended bool DEFAULT false NOT NULL,
    created timestamp with time zone DEFAULT now() NOT NULL,
    ended timestamp with time zone,
    send_address text NOT NULL,
    order_id text NOT NULL,
    deposit_txhash text,
    send_txhash text,
    refund_txhash text
);

CREATE TABLE accounts_btc
(
    id bigserial NOT NULL PRIMARY KEY,
    address text NOT NULL,
    txid int8 DEFAULT 0 NOT NULL,
    approx float8 DEFAULT 0 NOT NULL,
    created timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE accounts_eth
(
    id bigserial NOT NULL PRIMARY KEY,
    address text NOT NULL,
    txid int8 DEFAULT 0 NOT NULL,
    approx float8 DEFAULT 0 NOT NULL,
    created timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE coins (
    id bigserial NOT NULL PRIMARY KEY,
    full_name text NOT NULL,
    short_name text NOT NULL,
    price float8 NOT NULL,
    cap24hrchange float8 NOT NULL,
    miner_fee float8 NOT NULL,
    site_fee float8 NOT NULL
);

INSERT INTO "public"."coins" VALUES ('1', 'Bitcoin', 'BTC', '6774.48', '0.45', '0.0001', '1');
INSERT INTO "public"."coins" VALUES ('2', 'Ethereum', 'ETH', '537.352', '3.61', '0.1', '1');
INSERT INTO "public"."coins" VALUES ('3', 'Quautum Resistant Ledger', 'QRL', '0.549022', '-0.84', '0.01', '1');


CREATE TABLE btc_blocks (
    height int8 NOT NULL,
    hash text NOT NULL
);

CREATE TABLE eth_blocks (
    height int8 NOT NULL,
    hash text NOT NULL
);
