CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role ENUM('user','admin') NOT NULL,
  status ENUM('active','suspended') NOT NULL DEFAULT 'active',
  wallet_balance BIGINT NOT NULL DEFAULT 0,
  gold_sot_balance BIGINT NOT NULL DEFAULT 0,
  chances INT NOT NULL DEFAULT 0,
  vip_level_id INT NULL,
  vip_level_name VARCHAR(64) NULL,
  vip_cashback_percent DECIMAL(8,4) NULL,
  vip_until DATETIME(3) NULL,
  total_tickets_bought INT NOT NULL DEFAULT 0,
  total_spend_irr BIGINT NOT NULL DEFAULT 0,
  active_referrals INT NOT NULL DEFAULT 0,
  loan_locked_balance BIGINT NOT NULL DEFAULT 0,
  profile_json JSON NULL,
  notification_prefs_json JSON NULL,
  referral_code VARCHAR(64) NOT NULL UNIQUE,
  referred_by VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE users ADD COLUMN IF NOT EXISTS status ENUM('active','suspended') NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS gold_sot_balance BIGINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_level_id INT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_level_name VARCHAR(64) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_cashback_percent DECIMAL(8,4) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_until DATETIME(3) NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_tickets_bought INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spend_irr BIGINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_referrals INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS loan_locked_balance BIGINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_json JSON NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs_json JSON NULL;

CREATE TABLE IF NOT EXISTS refresh_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  token_hash VARCHAR(128) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  revoked_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pricing_policies (
  id VARCHAR(64) PRIMARY KEY,
  version VARCHAR(64) NOT NULL,
  status ENUM('draft','published') NOT NULL,
  tiers_json JSON NOT NULL,
  config_json JSON NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS raffles (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  max_tickets INT NOT NULL,
  tickets_sold INT NOT NULL DEFAULT 0,
  status ENUM('draft','open','closed','drawn') NOT NULL,
  tiers_json JSON NOT NULL,
  config_json JSON NOT NULL,
  seed_commit_hash VARCHAR(128) NOT NULL,
  encrypted_server_seed TEXT NOT NULL,
  proof_json JSON NULL,
  created_by VARCHAR(64) NOT NULL,
  opened_at DATETIME(3) NULL,
  closed_at DATETIME(3) NULL,
  drawn_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(64) PRIMARY KEY,
  raffle_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  ticket_index INT NOT NULL,
  price_paid BIGINT NOT NULL,
  client_seed VARCHAR(255) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_raffle_index (raffle_id, ticket_index),
  CONSTRAINT fk_tickets_raffle FOREIGN KEY (raffle_id) REFERENCES raffles(id),
  CONSTRAINT fk_tickets_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  tx_type ENUM(
    'deposit',
    'withdraw_request',
    'ticket_purchase',
    'cashback',
    'admin_adjustment',
    'asset_convert',
    'referral_commission',
    'loan_credit',
    'loan_repay',
    'battle_entry',
    'battle_win',
    'wheel_purchase'
  ) NOT NULL,
  amount BIGINT NOT NULL,
  status ENUM('pending','completed','rejected') NOT NULL,
  idempotency_key VARCHAR(128) NULL,
  meta_json JSON NULL,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_wallet_user_created (user_id, created_at),
  CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE wallet_transactions
  MODIFY COLUMN tx_type ENUM(
    'deposit',
    'withdraw_request',
    'ticket_purchase',
    'cashback',
    'admin_adjustment',
    'asset_convert',
    'referral_commission',
    'loan_credit',
    'loan_repay',
    'battle_entry',
    'battle_win',
    'wheel_purchase'
  ) NOT NULL;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  actor_user_id VARCHAR(64) NULL,
  actor_email VARCHAR(255) NULL,
  ip VARCHAR(64) NULL,
  action_name VARCHAR(128) NOT NULL,
  target VARCHAR(255) NOT NULL,
  success TINYINT(1) NOT NULL,
  message TEXT NULL,
  payload_json JSON NULL,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Enterprise Extensions
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS asset_accounts (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  asset_code ENUM('IRR','GOLD_SOT','CHANCE') NOT NULL,
  balance DECIMAL(24,6) NOT NULL DEFAULT 0,
  hold_balance DECIMAL(24,6) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_asset_account (user_id, asset_code),
  CONSTRAINT fk_asset_account_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asset_ledger_entries (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  asset_code ENUM('IRR','GOLD_SOT','CHANCE') NOT NULL,
  amount DECIMAL(24,6) NOT NULL,
  direction ENUM('credit','debit') NOT NULL,
  reason_code VARCHAR(64) NOT NULL,
  reference_type VARCHAR(64) NULL,
  reference_id VARCHAR(128) NULL,
  idempotency_key VARCHAR(128) NULL,
  metadata_json JSON NULL,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_ledger_user_asset_created (user_id, asset_code, created_at),
  INDEX idx_ledger_reference (reference_type, reference_id),
  UNIQUE KEY uq_ledger_idempotency (idempotency_key),
  CONSTRAINT fk_ledger_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS market_rates (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  base_asset ENUM('GOLD_SOT') NOT NULL,
  quote_asset ENUM('IRR') NOT NULL,
  bid_price DECIMAL(24,6) NOT NULL,
  ask_price DECIMAL(24,6) NOT NULL,
  source VARCHAR(64) NOT NULL,
  fetched_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_rates_pair_time (base_asset, quote_asset, fetched_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lottery_dynamic_rules (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  raffle_id VARCHAR(64) NOT NULL,
  base_price BIGINT NOT NULL,
  decay_factor DECIMAL(8,6) NOT NULL DEFAULT 0.800000,
  min_price BIGINT NOT NULL,
  pity_enabled TINYINT(1) NOT NULL DEFAULT 1,
  pity_increment DECIMAL(8,6) NOT NULL DEFAULT 0.010000,
  pity_cap DECIMAL(8,6) NOT NULL DEFAULT 0.500000,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_lottery_rule_raffle (raffle_id),
  CONSTRAINT fk_lottery_rule_raffle FOREIGN KEY (raffle_id) REFERENCES raffles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lottery_user_memory (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  raffle_id VARCHAR(64) NOT NULL,
  miss_streak INT NOT NULL DEFAULT 0,
  pity_multiplier DECIMAL(8,6) NOT NULL DEFAULT 1.000000,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_lottery_memory (user_id, raffle_id),
  CONSTRAINT fk_lottery_memory_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_lottery_memory_raffle FOREIGN KEY (raffle_id) REFERENCES raffles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lottery_ticket_packages (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  paid_tickets INT NOT NULL,
  bonus_tickets INT NOT NULL DEFAULT 0,
  bonus_chances INT NOT NULL DEFAULT 0,
  vip_days INT NOT NULL DEFAULT 0,
  price_irr BIGINT NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wheel_tiers (
  id VARCHAR(64) PRIMARY KEY,
  tier_code ENUM('normal','gold','jackpot') NOT NULL UNIQUE,
  title VARCHAR(120) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  cost_asset ENUM('CHANCE','IRR') NOT NULL,
  cost_amount DECIMAL(24,6) NOT NULL,
  config_json JSON NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wheel_spins_v2 (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  tier_id VARCHAR(64) NOT NULL,
  prize_code VARCHAR(64) NOT NULL,
  prize_json JSON NOT NULL,
  rng_seed_hash VARCHAR(128) NULL,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_wheel_v2_user_created (user_id, created_at),
  CONSTRAINT fk_wheel_v2_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_wheel_v2_tier FOREIGN KEY (tier_id) REFERENCES wheel_tiers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS slide_single_daily_target (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  target_date DATE NOT NULL UNIQUE,
  winning_number INT NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS slide_single_attempts (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  target_date DATE NOT NULL,
  rolled_number INT NOT NULL,
  win TINYINT(1) NOT NULL DEFAULT 0,
  reward_json JSON NULL,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_slide_single_user_day (user_id, target_date),
  CONSTRAINT fk_slide_single_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS slide_battle_rooms (
  id VARCHAR(64) PRIMARY KEY,
  status ENUM('waiting','running','finished','cancelled') NOT NULL,
  entry_asset ENUM('CHANCE','IRR') NOT NULL,
  entry_amount DECIMAL(24,6) NOT NULL,
  max_players INT NOT NULL DEFAULT 10,
  site_fee_percent DECIMAL(8,4) NOT NULL DEFAULT 10.0000,
  winner_user_id VARCHAR(64) NULL,
  pot_amount DECIMAL(24,6) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  started_at DATETIME(3) NULL,
  finished_at DATETIME(3) NULL,
  CONSTRAINT fk_slide_battle_winner FOREIGN KEY (winner_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS slide_battle_room_players (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  room_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  rolled_number INT NULL,
  is_winner TINYINT(1) NOT NULL DEFAULT 0,
  joined_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_slide_room_player (room_id, user_id),
  CONSTRAINT fk_slide_room_player_room FOREIGN KEY (room_id) REFERENCES slide_battle_rooms(id),
  CONSTRAINT fk_slide_room_player_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vip_levels (
  id INT NOT NULL PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(64) NOT NULL,
  min_ticket_count INT NOT NULL DEFAULT 0,
  min_total_buy_irr BIGINT NOT NULL DEFAULT 0,
  min_active_referrals INT NOT NULL DEFAULT 0,
  cashback_percent DECIMAL(8,4) NOT NULL,
  perks_json JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_vip_status (
  user_id VARCHAR(64) PRIMARY KEY,
  level_id INT NOT NULL,
  upgraded_at DATETIME(3) NOT NULL,
  expires_at DATETIME(3) NULL,
  progress_json JSON NULL,
  CONSTRAINT fk_user_vip_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_vip_level FOREIGN KEY (level_id) REFERENCES vip_levels(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS referral_tree (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ancestor_user_id VARCHAR(64) NOT NULL,
  descendant_user_id VARCHAR(64) NOT NULL,
  depth INT NOT NULL,
  created_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_ref_tree (ancestor_user_id, descendant_user_id, depth),
  INDEX idx_ref_desc (descendant_user_id),
  CONSTRAINT fk_ref_tree_ancestor FOREIGN KEY (ancestor_user_id) REFERENCES users(id),
  CONSTRAINT fk_ref_tree_descendant FOREIGN KEY (descendant_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS referral_commissions (
  id VARCHAR(64) PRIMARY KEY,
  buyer_user_id VARCHAR(64) NOT NULL,
  beneficiary_user_id VARCHAR(64) NOT NULL,
  depth INT NOT NULL,
  percent DECIMAL(8,4) NOT NULL,
  amount_irr BIGINT NOT NULL,
  source_type VARCHAR(64) NOT NULL,
  source_id VARCHAR(128) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_ref_comm_beneficiary (beneficiary_user_id, created_at),
  CONSTRAINT fk_ref_comm_buyer FOREIGN KEY (buyer_user_id) REFERENCES users(id),
  CONSTRAINT fk_ref_comm_beneficiary FOREIGN KEY (beneficiary_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auction_events (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  mode ENUM('visible','blind') NOT NULL DEFAULT 'blind',
  status ENUM('draft','open','closed','settled','cancelled') NOT NULL,
  start_price BIGINT NOT NULL,
  min_step BIGINT NOT NULL DEFAULT 1000000,
  winner_user_id VARCHAR(64) NULL,
  winning_bid BIGINT NULL,
  starts_at DATETIME(3) NOT NULL,
  ends_at DATETIME(3) NOT NULL,
  created_by VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_auction_event_winner FOREIGN KEY (winner_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auction_bids_v2 (
  id VARCHAR(64) PRIMARY KEY,
  event_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  bid_amount BIGINT NOT NULL,
  blind_hash VARCHAR(128) NULL,
  visible_to_others TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_auction_bid_event (event_id, created_at),
  CONSTRAINT fk_auction_bid_event FOREIGN KEY (event_id) REFERENCES auction_events(id),
  CONSTRAINT fk_auction_bid_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS showroom_vehicles (
  id VARCHAR(64) PRIMARY KEY,
  source_type ENUM('lottery_winback','external_purchase') NOT NULL,
  status ENUM('available','reserved','sold','archived') NOT NULL,
  vehicle_json JSON NOT NULL,
  acquisition_cost_irr BIGINT NULL,
  listed_price_irr BIGINT NULL,
  listed_price_gold_sot DECIMAL(24,6) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS showroom_orders (
  id VARCHAR(64) PRIMARY KEY,
  vehicle_id VARCHAR(64) NOT NULL,
  buyer_user_id VARCHAR(64) NOT NULL,
  payment_asset ENUM('IRR','GOLD_SOT') NOT NULL,
  payment_amount DECIMAL(24,6) NOT NULL,
  status ENUM('pending','paid','cancelled','completed') NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_showroom_order_vehicle FOREIGN KEY (vehicle_id) REFERENCES showroom_vehicles(id),
  CONSTRAINT fk_showroom_order_buyer FOREIGN KEY (buyer_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auto_loans (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  principal_irr BIGINT NOT NULL,
  outstanding_irr BIGINT NOT NULL,
  status ENUM('pending','approved','active','repaid','rejected','defaulted') NOT NULL,
  restricted_usage TINYINT(1) NOT NULL DEFAULT 1,
  approved_by VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  due_at DATETIME(3) NULL,
  CONSTRAINT fk_auto_loan_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_tickets (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  category ENUM('finance','security','account','lottery','other') NOT NULL,
  priority ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  status ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  subject VARCHAR(255) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_support_ticket_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_messages (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ticket_id VARCHAR(64) NOT NULL,
  sender_user_id VARCHAR(64) NULL,
  sender_role ENUM('user','admin','system') NOT NULL,
  body TEXT NOT NULL,
  attachments_json JSON NULL,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_support_messages_ticket (ticket_id, created_at),
  CONSTRAINT fk_support_messages_ticket FOREIGN KEY (ticket_id) REFERENCES support_tickets(id),
  CONSTRAINT fk_support_messages_sender FOREIGN KEY (sender_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS risk_signals (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(64) NULL,
  signal_type VARCHAR(64) NOT NULL,
  severity ENUM('low','medium','high','critical') NOT NULL,
  score DECIMAL(8,4) NOT NULL DEFAULT 0,
  details_json JSON NULL,
  created_at DATETIME(3) NOT NULL,
  resolved_at DATETIME(3) NULL,
  INDEX idx_risk_signal_user (user_id, created_at),
  INDEX idx_risk_signal_severity (severity, created_at),
  CONSTRAINT fk_risk_signal_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_devices (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  device_fingerprint VARCHAR(255) NOT NULL,
  first_ip VARCHAR(64) NULL,
  last_ip VARCHAR(64) NULL,
  user_agent TEXT NULL,
  first_seen_at DATETIME(3) NOT NULL,
  last_seen_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_user_device (user_id, device_fingerprint),
  CONSTRAINT fk_user_devices_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NULL,
  user_id VARCHAR(64) NULL,
  ip VARCHAR(64) NULL,
  success TINYINT(1) NOT NULL,
  reason VARCHAR(128) NULL,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_login_attempt_email (email, created_at),
  INDEX idx_login_attempt_ip (ip, created_at),
  CONSTRAINT fk_login_attempt_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_2fa_challenges (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  channel ENUM('sms','email','totp') NOT NULL,
  code_hash VARCHAR(128) NOT NULL,
  status ENUM('pending','verified','expired','failed') NOT NULL DEFAULT 'pending',
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  verified_at DATETIME(3) NULL,
  INDEX idx_2fa_user_created (user_id, created_at),
  CONSTRAINT fk_2fa_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS backup_jobs (
  id VARCHAR(64) PRIMARY KEY,
  started_at DATETIME(3) NOT NULL,
  finished_at DATETIME(3) NULL,
  status ENUM('running','success','failed') NOT NULL,
  storage_uri VARCHAR(512) NULL,
  checksum_sha256 VARCHAR(128) NULL,
  error_message TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
