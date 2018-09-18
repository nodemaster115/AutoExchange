/*
Navicat PGSQL Data Transfer

Source Server         : localhost
Source Server Version : 90606
Source Host           : localhost:5432
Source Database       : anonexchangedb
Source Schema         : public

Target Server Type    : PGSQL
Target Server Version : 90606
File Encoding         : 65001

Date: 2018-07-25 01:42:11
*/


-- ----------------------------
-- Table structure for coins
-- ----------------------------
DROP TABLE IF EXISTS "public"."coins";
CREATE TABLE "public"."coins" (
"id" int8 DEFAULT nextval('coins_id_seq'::regclass) NOT NULL,
"full_name" text COLLATE "default" NOT NULL,
"short_name" text COLLATE "default" NOT NULL,
"price" float8 NOT NULL,
"cap24hrchange" float8 NOT NULL,
"miner_fee" float8 NOT NULL,
"site_fee" float8 NOT NULL
)
WITH (OIDS=FALSE)

;

-- ----------------------------
-- Records of coins
-- ----------------------------
INSERT INTO "public"."coins" VALUES ('1', 'Bitcoin', 'BTC', '8228.84', '6.32', '0.0001', '1e-007');
INSERT INTO "public"."coins" VALUES ('2', 'Ethereum', 'ETH', '476.65', '4.58', '0.001', '1e-006');
INSERT INTO "public"."coins" VALUES ('3', 'Quautum Resistant Ledger', 'QRL', '0.653009', '11.93', '0.01', '1e-005');

-- ----------------------------
-- Alter Sequences Owned By 
-- ----------------------------

-- ----------------------------
-- Primary Key structure for table coins
-- ----------------------------
ALTER TABLE "public"."coins" ADD PRIMARY KEY ("id");
