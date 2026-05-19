-- 新人券调整为满100减20
UPDATE coupon_templates
SET code = 'WELCOME_100_20',
    name = '满100减20新人券',
    discount_amount = 20.00,
    threshold_amount = 100.00
WHERE code = 'WELCOME_100_10';

INSERT INTO coupon_templates (code, name, type, discount_amount, threshold_amount, total_count, valid_from, valid_to, status)
SELECT 'WELCOME_100_20', '满100减20新人券', 'amount', 20.00, 100.00, 0,
  NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY), 'active'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM coupon_templates WHERE code = 'WELCOME_100_20' LIMIT 1);
