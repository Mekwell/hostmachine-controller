-- Budget Plans (Beating AU Market)
-- Assumes 'AUD' currency
INSERT INTO plan (id, name, description, priceMonthly, ramMb, cpuCores, diskGb, active) VALUES
('budget-starter', 'Iron Tier', 'Perfect for small groups. Best value in AU.', 9.00, 4096, 2, 20, true),
('budget-plus', 'Gold Tier', 'Standard performance for medium servers.', 18.00, 8192, 4, 50, true),
('budget-pro', 'Diamond Tier', 'High performance for modded servers.', 28.00, 16384, 6, 100, true),
('budget-max', 'Netherite Tier', 'Extreme power for massive communities.', 45.00, 32768, 8, 200, true)
ON CONFLICT (id) DO UPDATE SET priceMonthly = EXCLUDED.priceMonthly;
