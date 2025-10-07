-- Fix language metadata to match actual audio sections (Chinese only)
UPDATE audio_guides
SET 
  languages = ARRAY['Chinese']::text[],
  updated_at = now()
WHERE id = '2bf92a29-8cd4-4fe5-8713-7c58f318c831';

-- Adjust price to market rate ($1.49)
UPDATE audio_guides
SET 
  price_usd = 149,
  updated_at = now()
WHERE id = '2bf92a29-8cd4-4fe5-8713-7c58f318c831';

-- Enhance description with Chinese text for better user experience
UPDATE audio_guides
SET 
  description = '探索卡帕多奇亚：阿瓦诺斯小镇与乌奇萨城堡。这个专业的中文语音导览带您深入了解土耳其卡帕多奇亚地区最迷人的两个地标。包含详细的历史解说和文化背景。',
  updated_at = now()
WHERE id = '2bf92a29-8cd4-4fe5-8713-7c58f318c831';

-- Force duration recalculation via trigger
UPDATE guide_sections
SET updated_at = now()
WHERE guide_id = '2bf92a29-8cd4-4fe5-8713-7c58f318c831';