-- Create function to calculate viral score and update trending data
CREATE OR REPLACE FUNCTION public.calculate_viral_score(p_guide_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update viral scores for guides
  UPDATE public.viral_metrics 
  SET viral_score = LEAST(100, 
    (views_count * 0.1) + 
    (shares_count * 2) + 
    (downloads_count * 1.5) + 
    (completion_rate * 20)
  )
  WHERE (p_guide_id IS NULL OR guide_id = p_guide_id);
  
  -- Update trending ranks
  WITH ranked_guides AS (
    SELECT 
      guide_id,
      ROW_NUMBER() OVER (ORDER BY viral_score DESC) as new_rank
    FROM public.viral_metrics
    WHERE date >= CURRENT_DATE - INTERVAL '7 days'
  )
  UPDATE public.viral_metrics vm
  SET trending_rank = rg.new_rank
  FROM ranked_guides rg
  WHERE vm.guide_id = rg.guide_id;
END;
$$;

-- Insert sample audio guides (simplified approach without FK constraints)
DELETE FROM public.audio_guides WHERE title LIKE '%Sample%' OR title LIKE '%Hidden Gems%';

INSERT INTO public.audio_guides (
  title, description, location, category, difficulty, duration, price_usd,
  creator_id, is_published, is_approved, languages, best_time,
  image_url, audio_url, preview_url, transcript
) VALUES
(
  'Hidden Gems of Montmartre',
  'Discover the secret corners and artistic treasures of Paris most bohemian neighborhood, away from the tourist crowds.',
  'Paris, France', 'cultural', 'easy', 45, 1299,
  '00000000-0000-0000-0000-000000000001', true, true,
  ARRAY['English', 'French'], 'Morning (9-11 AM) for best lighting',
  '/src/assets/paris-louvre.jpg', 'https://example.com/audio/montmartre.mp3',
  'https://example.com/preview/montmartre.mp3',
  'Welcome to Montmartre, where artists like Picasso and Renoir once painted...'
),
(
  'Ancient Rome: Colosseum Secrets',
  'Uncover the brutal history and architectural marvels of Rome''s most iconic amphitheater.',
  'Rome, Italy', 'historical', 'moderate', 60, 1599,
  '00000000-0000-0000-0000-000000000001', true, true,
  ARRAY['English', 'Italian'], 'Early morning (8-10 AM) to avoid crowds',
  '/src/assets/guide-colosseum.jpg', 'https://example.com/audio/colosseum.mp3',
  'https://example.com/preview/colosseum.mp3',
  'Step into the arena where gladiators fought for their lives...'
),
(
  'Zen Gardens of Kyoto',
  'Find inner peace while exploring the most serene temples and gardens in Japan''s ancient capital.',
  'Kyoto, Japan', 'cultural', 'easy', 90, 1799,
  '00000000-0000-0000-0000-000000000001', true, true,
  ARRAY['English', 'Japanese'], 'Early morning or late afternoon',
  '/src/assets/kyoto-temple.jpg', 'https://example.com/audio/kyoto-zen.mp3',
  'https://example.com/preview/kyoto-zen.mp3',
  'Welcome to the spiritual heart of Japan, where tradition meets tranquility...'
),
(
  'Santorini Sunset Magic',
  'Experience the world''s most famous sunset while learning about volcanic history and Greek mythology.',
  'Santorini, Greece', 'scenic', 'easy', 30, 999,
  '00000000-0000-0000-0000-000000000001', true, true,
  ARRAY['English', 'Greek'], 'Late afternoon (4-6 PM)',
  '/src/assets/santorini-greece.jpg', 'https://example.com/audio/santorini.mp3',
  'https://example.com/preview/santorini.mp3',
  'As the sun begins its descent over the Aegean Sea...'
);

-- Calculate viral scores for new guides
SELECT public.calculate_viral_score();